"""Sincronización entre PCs por carpeta compartida (la que ya sincronice OneDrive, Dropbox, Google Drive, Syncthing...).

Cada PC escribe SOLO en su propia subcarpeta y lee las de los demás, así el servicio de nube nunca ve a dos PCs escribiendo el mismo archivo (adiós a las
«copias en conflicto») y no hace falta ningún servidor:

    <carpeta elegida>/Alejandria-sync/<id del PC>/neuronas/<id>.json            la neurona (sin embedding) + su versión
                                                  conexiones/<origen>@<destino>.json   motivo y estado (aceptada / rechazada / pendiente) + su versión
                                                  pc.json                              nombre del PC y última sincronización

Un borrado es el mismo archivo con `borrada: true` (una «tumba»), para que se propague. Lo que se sincroniza: neuronas y conexiones con su estado.
No se sincronizan los ajustes, los embeddings (cada PC los calcula) ni las rutas.

Versiones: cada elemento lleva (t, rev, pc) = (instante en µs, número de edición, PC autor). El orden es (t, rev, pc). `t` nunca retrocede a lo largo de una
cadena de ediciones (máximo entre el reloj y la versión anterior + 1), así que un reloj algo atrasado no pierde ediciones posteriores. Gana siempre la versión
mayor, también en un conflicto (editada en dos PCs desde la última sincronización); la perdedora se guarda en datos/conflictos/. Todos los PCs acaban igual.

Salvaguardas: una carpeta ilegible o ausente no cambia nada; un JSON a medias (la nube puede entregarlo así) se ignora y se reintenta; si de golpe «desaparecen»
muchas neuronas locales no se tratan como borrados (se restauran desde los demás PCs); una conexión cuyas neuronas aún no han llegado espera a la siguiente vuelta.
"""
import hashlib
import json
import os
import re
import socket
import threading
import time
import uuid
from datetime import datetime, timezone
from typing import Callable, Dict, List, Optional, Tuple

RAIZ = "Alejandria-sync"
ESQUEMA = 1
ID_VALIDO = re.compile(r"[\w-]+")
ESTADOS = ("pendiente", "aceptada", "rechazada")
MIN_BORRADOS_SOSPECHOSOS = 5            # desde cuántos borrados «a la vez» se desconfía...
FRACCION_BORRADOS_SOSPECHOSOS = 0.5     # ...si además son más de esta fracción de lo que había


def _escribir(ruta: str, contenido: dict) -> None:
    """Atómico: temporal en la misma carpeta y renombrado (los lectores solo miran *.json)."""
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    tmp = ruta + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(contenido, f, ensure_ascii=False, indent=1, sort_keys=True)
    os.replace(tmp, ruta)


def _leer(ruta: str):
    with open(ruta, encoding="utf-8") as f:
        return json.load(f)


def _hash(contenido: dict) -> str:
    return hashlib.sha256(json.dumps(contenido, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()


def _texto(v) -> str:
    return v if isinstance(v, str) else ""


def clave_arista(origen: str, destino: str) -> str:
    return f"c/{origen}@{destino}"


def _normalizar_arista(a: dict) -> dict:
    estado = _texto(a.get("estado"))
    return {"origen_id": _texto(a.get("origen_id")), "destino_id": _texto(a.get("destino_id")), "tipo": _texto(a.get("tipo")),
            "motivo": _texto(a.get("motivo")), "estado": estado if estado in ESTADOS else "pendiente"}


class AristasDB:
    """Las conexiones de este PC (aristas.parquet, a través de database.db_conn)."""
    def listar(self) -> List[dict]:
        from database import db_conn
        return db_conn.listar_aristas()

    def guardar(self, arista: dict) -> None:
        from database import db_conn
        db_conn.add_links([arista], overwrite=True)

    def borrar(self, origen: str, destino: str) -> None:
        from database import db_conn
        db_conn.quitar_arista(origen, destino)


class Sincronizador:
    def __init__(self, datos_dir: str, carpeta: str, aristas, al_cambiar: Optional[Callable[[bool, bool], None]] = None,
                 ahora_us: Optional[Callable[[], int]] = None, host: Optional[str] = None):
        """`datos_dir`: carpeta de datos de este PC (raw/ y sync_estado.json). `carpeta`: la compartida. `aristas`: listar() / guardar(dict) / borrar(o, d).
        `al_cambiar(neuronas, aristas)`: se llama tras cambiar algo en local (recompilar, quitar huérfanas...). `ahora_us`: reloj (µs), inyectable para pruebas."""
        self.datos = datos_dir
        self.carpeta = carpeta
        self.aristas = aristas
        self.al_cambiar = al_cambiar or (lambda n, a: None)
        self.ahora_us = ahora_us or (lambda: int(time.time() * 1_000_000))
        self.host = host or socket.gethostname()
        self.raw = os.path.join(datos_dir, "raw")
        self.ruta_estado = os.path.join(datos_dir, "sync_estado.json")
        self.cerrojo = threading.Lock()
        self.estado = self._cargar_estado()

    # ---------------------------------------------------------------- estado local
    def _cargar_estado(self) -> dict:
        try:
            e = _leer(self.ruta_estado)
            if not isinstance(e, dict) or not isinstance(e.get("items"), dict):
                raise ValueError
        except (OSError, ValueError):
            e = {"esquema": ESQUEMA, "items": {}, "ultima": None, "generacion": 0}
        if e.get("host") != self.host or not e.get("pc"):
            e["pc"] = uuid.uuid4().hex[:12]        # un PC nuevo (o la carpeta de datos copiada a otro equipo): no puede compartir id con el original
            e["host"] = self.host
        return e

    def _guardar_estado(self) -> None:
        _escribir(self.ruta_estado, self.estado)

    @property
    def pc(self) -> str:
        return self.estado["pc"]

    @property
    def dir_propia(self) -> str:
        return os.path.join(self.carpeta, RAIZ, self.pc)

    # ---------------------------------------------------------------- lectura de lo local
    def _neuronas_locales(self) -> Tuple[Dict[str, dict], set, Dict[str, int]]:
        """({clave: contenido sin embedding}, claves ilegibles ahora mismo, {clave: instante de la última modificación del archivo en µs})."""
        vivas, ilegibles, mtimes = {}, set(), {}
        if os.path.isdir(self.raw):
            for f in os.listdir(self.raw):
                if not f.endswith(".json") or not ID_VALIDO.fullmatch(f[:-5]):
                    continue
                ruta = os.path.join(self.raw, f)
                try:
                    c = _leer(ruta)
                    mtimes["n/" + f[:-5]] = int(os.path.getmtime(ruta) * 1_000_000)
                except (OSError, ValueError):
                    ilegibles.add("n/" + f[:-5])
                    continue
                if isinstance(c, dict):
                    c.pop("embedding", None)
                    vivas["n/" + f[:-5]] = c
                else:
                    ilegibles.add("n/" + f[:-5])
        return vivas, ilegibles, mtimes

    def _aristas_locales(self) -> Dict[str, dict]:
        out = {}
        for a in self.aristas.listar():
            n = _normalizar_arista(a)
            if ID_VALIDO.fullmatch(n["origen_id"]) and ID_VALIDO.fullmatch(n["destino_id"]):
                out[clave_arista(n["origen_id"], n["destino_id"])] = n
        return out

    # ---------------------------------------------------------------- lectura de lo ajeno
    def _leer_pc(self, pc: str, avisos: List[str]) -> Dict[str, dict]:
        """Todo lo que publicó un PC: {clave: {"v": (t, rev, pc), "borrada", "datos"}}."""
        out: Dict[str, dict] = {}
        base = os.path.join(self.carpeta, RAIZ, pc)
        for sub, prefijo in (("neuronas", "n"), ("conexiones", "c")):
            carpeta = os.path.join(base, sub)
            for f in sorted(os.listdir(carpeta)) if os.path.isdir(carpeta) else []:
                if not f.endswith(".json"):
                    continue
                nombre = f[:-5]
                ok = ID_VALIDO.fullmatch(nombre) if prefijo == "n" else (nombre.count("@") == 1 and all(ID_VALIDO.fullmatch(x) for x in nombre.split("@")))
                if not ok:
                    continue
                try:
                    w = _leer(os.path.join(carpeta, f))
                    s = w["_sync"]
                    v = (int(s["t"]), int(s["rev"]), str(s["pc"]))
                    borrada = bool(s.get("borrada"))
                    datos = None if borrada else w["datos"]
                    if not borrada and not isinstance(datos, dict):
                        raise ValueError("datos")
                    if prefijo == "c" and not borrada:
                        datos = _normalizar_arista(datos)
                except (OSError, ValueError, KeyError, TypeError) as e:
                    avisos.append(f"{pc}/{sub}/{f}: ilegible por ahora ({type(e).__name__})")     # lo normal: la nube aún lo está subiendo o bajando
                    continue
                out[f"{prefijo}/{nombre}"] = {"v": v, "borrada": borrada, "datos": datos}
        return out

    def _remotos(self, avisos: List[str]) -> Dict[str, dict]:
        """La mejor versión de cada elemento entre las subcarpetas de los demás PCs."""
        mejores: Dict[str, dict] = {}
        base = os.path.join(self.carpeta, RAIZ)
        for pc in sorted(os.listdir(base)) if os.path.isdir(base) else []:
            if pc == self.pc or not ID_VALIDO.fullmatch(pc) or not os.path.isdir(os.path.join(base, pc)):
                continue
            for clave, r in self._leer_pc(pc, avisos).items():
                if clave not in mejores or r["v"] > mejores[clave]["v"]:
                    mejores[clave] = r
        return mejores

    # ---------------------------------------------------------------- una vuelta
    def sincronizar(self) -> dict:
        """Publica lo que cambió aquí, recibe lo que cambió en otros PCs y resuelve conflictos. Idempotente. Devuelve el resumen."""
        with self.cerrojo:
            if not os.path.isdir(self.carpeta):
                raise FileNotFoundError(f"La carpeta de sincronización no existe o no está disponible: {self.carpeta}")
            avisos: List[str] = []
            resumen = {"enviadas": 0, "recibidas": 0, "borradas": 0, "conflictos": [], "avisos": avisos}
            items = self.estado["items"]

            n_loc, ilegibles, mtimes = self._neuronas_locales()
            c_loc = self._aristas_locales()
            locales = {**n_loc, **c_loc}
            remotos = self._remotos(avisos)

            # ---- ¿qué se «borró» aquí? Una neurona sin archivo que estaba en el estado; con salvaguarda ante desapariciones masivas
            vivos_antes = [k for k, it in items.items() if not it.get("borrada")]
            ausentes = [k for k in vivos_antes if k not in locales and k not in ilegibles]
            sospechoso = False
            for prefijo in ("n", "c"):
                previos = [k for k in vivos_antes if k.startswith(prefijo + "/")]
                perdidos = [k for k in ausentes if k.startswith(prefijo + "/")]
                if len(perdidos) >= MIN_BORRADOS_SOSPECHOSOS and len(perdidos) > FRACCION_BORRADOS_SOSPECHOSOS * len(previos):
                    sospechoso = True
                    avisos.append(f"Han desaparecido de golpe {len(perdidos)} de {len(previos)} elementos de este PC: no se tratan como borrados "
                                  f"(se restauran desde los demás PCs si están allí).")
                    ausentes = [k for k in ausentes if k not in perdidos]
                    for k in perdidos:
                        items[k]["sin_archivo"] = True           # para que la recepción los trate como «no tocados aquí» y los restaure
            borrados_locales = set(ausentes)
            propios = self._leer_pc(self.pc, []) if sospechoso else {}          # lo que este PC publicó: de ahí también se puede restaurar

            # ---- aplicar y publicar, elemento a elemento
            a_publicar: Dict[str, dict] = {}                     # clave -> {"v","borrada","datos"}
            a_aplicar: List[Tuple[str, dict]] = []               # (clave, remoto ganador)
            claves = set(locales) | set(items) | set(remotos)
            for k in sorted(claves):
                it = items.get(k)
                v_estado = tuple(it["v"]) if it and it.get("v") else None
                loc = locales.get(k)
                hay_borrado_local = k in borrados_locales
                restaurar = bool(it and it.get("sin_archivo"))
                cambio_local = (loc is not None and (it is None or it.get("borrada") or _hash(loc) != it.get("hash"))) or hay_borrado_local
                rem = remotos.get(k)
                rem_nuevo = rem is not None and (v_estado is None or rem["v"] > v_estado)

                if cambio_local and rem_nuevo and not hay_borrado_local and not rem["borrada"] and loc is not None \
                        and _hash({x: y for x, y in rem["datos"].items() if x != "embedding"} if k.startswith("n/") else rem["datos"]) == _hash(loc):
                    items[k] = {"v": list(rem["v"]), "hash": _hash(loc), "borrada": False}     # lo mismo en los dos PCs (p. ej. importado a mano en ambos): sin conflicto
                    continue
                if cambio_local:
                    prev_t, prev_rev = (v_estado[0], v_estado[1]) if v_estado else (0, 0)
                    ahora = self.ahora_us()
                    # Instante de la edición: el de modificación del archivo (si no, el PC que sincronice el último ganaría siempre los conflictos), sin pasar
                    # del reloj actual y sin retroceder respecto a la versión anterior. Un borrado o una conexión no tienen archivo: cuenta el momento en que se detecta.
                    t_edicion = min(mtimes[k], ahora) if (k in mtimes and not hay_borrado_local) else ahora
                    v_loc = (max(t_edicion, prev_t + 1), prev_rev + 1, self.pc)
                    mio = {"v": v_loc, "borrada": hay_borrado_local, "datos": None if hay_borrado_local else loc}
                    if rem_nuevo:
                        if rem["v"] > v_loc:                      # conflicto, y gana el otro PC: lo mío se guarda aparte
                            resumen["conflictos"].append(k)
                            self._guardar_conflicto(k, loc)
                            a_aplicar.append((k, rem))
                        else:                                     # conflicto, y gano yo: se publica lo mío
                            resumen["conflictos"].append(k)
                            a_publicar[k] = mio
                    else:
                        a_publicar[k] = mio
                elif rem_nuevo:
                    a_aplicar.append((k, rem))
                elif restaurar:
                    candidatas = [x for x in (rem, propios.get(k)) if x is not None and not x["borrada"]]
                    if candidatas:
                        a_aplicar.append((k, max(candidatas, key=lambda x: x["v"])))

            # ---- recepción: neuronas primero, luego conexiones (que necesitan sus dos extremos)
            cambios_n = cambios_a = False
            for k, rem in [x for x in a_aplicar if x[0].startswith("n/")]:
                nid = k[2:]
                ruta = os.path.join(self.raw, nid + ".json")
                if rem["borrada"]:
                    if os.path.exists(ruta):
                        os.remove(ruta)
                        resumen["borradas"] += 1
                        cambios_n = True
                    items[k] = {"v": list(rem["v"]), "hash": None, "borrada": True}
                else:
                    os.makedirs(self.raw, exist_ok=True)
                    contenido = {x: y for x, y in rem["datos"].items() if x != "embedding"}
                    previo = None
                    if os.path.exists(ruta):
                        try:
                            previo = _leer(ruta)
                            if isinstance(previo, dict) and previo.get("embedding") and previo.get("teoria") == contenido.get("teoria") \
                               and previo.get("nombre") == contenido.get("nombre"):
                                contenido["embedding"] = previo["embedding"]         # mismo texto: se conserva el embedding ya calculado
                        except (OSError, ValueError):
                            pass
                    _escribir(ruta, contenido)
                    resumen["recibidas"] += 1
                    cambios_n = True
                    items[k] = {"v": list(rem["v"]), "hash": _hash({x: y for x, y in contenido.items() if x != "embedding"}), "borrada": False}
            if cambios_n:
                self.al_cambiar(True, False)                     # recompilar: así las conexiones ven ya las neuronas nuevas
            existentes = {f[:-5] for f in os.listdir(self.raw) if f.endswith(".json")} if os.path.isdir(self.raw) else set()
            for k, rem in [x for x in a_aplicar if x[0].startswith("c/")]:
                origen, destino = k[2:].split("@")
                if rem["borrada"]:
                    if k in c_loc:
                        self.aristas.borrar(origen, destino)
                        cambios_a = True
                    items[k] = {"v": list(rem["v"]), "hash": None, "borrada": True}
                    continue
                if origen not in existentes or destino not in existentes:
                    avisos.append(f"La conexión {origen} → {destino} espera a que lleguen sus neuronas.")
                    continue
                self.aristas.guardar(rem["datos"])
                resumen["recibidas"] += 1
                cambios_a = True
                items[k] = {"v": list(rem["v"]), "hash": _hash(rem["datos"]), "borrada": False}
            if cambios_a:
                self.al_cambiar(False, True)

            # ---- publicación
            for k, mio in a_publicar.items():
                tipo, resto = k.split("/", 1)
                w = {"_sync": {"t": mio["v"][0], "rev": mio["v"][1], "pc": mio["v"][2], "borrada": mio["borrada"], "esquema": ESQUEMA}}
                if not mio["borrada"]:
                    w["datos"] = mio["datos"]
                _escribir(os.path.join(self.dir_propia, "neuronas" if tipo == "n" else "conexiones", resto + ".json"), w)
                items[k] = {"v": list(mio["v"]), "hash": None if mio["borrada"] else _hash(mio["datos"]), "borrada": mio["borrada"]}
                resumen["enviadas"] += 1
            _escribir(os.path.join(self.dir_propia, "pc.json"), {"id": self.pc, "nombre": self.host, "esquema": ESQUEMA, "ultima": self._iso()})

            # ---- estado
            for k in list(items):
                items[k].pop("sin_archivo", None)
            if resumen["recibidas"] or resumen["borradas"]:
                self.estado["generacion"] = int(self.estado.get("generacion", 0)) + 1
            resumen["cuando"] = self._iso()
            resumen["pcs"] = self.otros_pcs()
            self.estado["ultima"] = resumen
            self._guardar_estado()
            return resumen

    # ---------------------------------------------------------------- utilidades
    def _iso(self) -> str:
        return datetime.fromtimestamp(self.ahora_us() / 1_000_000, tz=timezone.utc).isoformat(timespec="seconds")

    def _guardar_conflicto(self, clave: str, contenido) -> None:
        """La versión local que pierde un conflicto no se tira: queda en datos/conflictos/."""
        if contenido is None:
            return
        nombre = clave.replace("/", "-").replace("@", "_a_") + time.strftime("-%Y%m%d-%H%M%S", time.gmtime(self.ahora_us() / 1_000_000)) + ".json"
        _escribir(os.path.join(self.datos, "conflictos", nombre), contenido)

    def otros_pcs(self) -> List[dict]:
        out = []
        base = os.path.join(self.carpeta, RAIZ)
        for pc in sorted(os.listdir(base)) if os.path.isdir(base) else []:
            if pc == self.pc:
                continue
            try:
                info = _leer(os.path.join(base, pc, "pc.json"))
                out.append({"id": pc, "nombre": _texto(info.get("nombre")), "ultima": _texto(info.get("ultima"))})
            except (OSError, ValueError, AttributeError):
                continue
        return out

    def leer_estado(self) -> dict:
        return {"pc": self.pc, "nombre": self.host, "generacion": self.estado.get("generacion", 0), "ultima": self.estado.get("ultima")}


def olvidar(datos_dir: str) -> None:
    """Quita el estado de sincronización de este PC. Al cambiar de carpeta compartida se empieza de cero: si no, todo parecería «ya sincronizado» y la carpeta
    nueva se quedaría vacía. Las neuronas y conexiones locales no se tocan."""
    try:
        os.remove(os.path.join(datos_dir, "sync_estado.json"))
    except OSError:
        pass


class Servicio:
    """Lo que usa la app: una sincronización configurable desde Ajustes (al abrir la app y cuando el usuario la pide) y un estado para enseñar en pantalla."""
    def __init__(self, datos_dir: str, leer_ajustes: Callable[[], dict], al_cambiar: Callable[[bool, bool], None]):
        self.datos = datos_dir
        self.leer_ajustes = leer_ajustes
        self.al_cambiar = al_cambiar
        self.sincronizador: Optional[Sincronizador] = None
        self.carpeta_actual = ""
        self.error: Optional[str] = None
        self.ejecutando = threading.Lock()
        self.hilo: Optional[threading.Thread] = None

    def _preparar(self) -> Optional[Sincronizador]:
        """El sincronizador de la carpeta que haya ahora en Ajustes (None si no hay ninguna); se rehace si cambió."""
        carpeta = _texto(self.leer_ajustes().get("carpeta_sincronizacion")).strip()
        if not carpeta:
            self.sincronizador, self.carpeta_actual = None, ""
        elif self.sincronizador is None or carpeta != self.carpeta_actual:
            self.sincronizador = Sincronizador(self.datos, carpeta, AristasDB(), self.al_cambiar)
            self.carpeta_actual = carpeta
        return self.sincronizador

    def cambiar_carpeta(self) -> None:
        """Al elegir otra carpeta (o quitarla) se empieza de cero con ella; lo que hay en local no se toca."""
        olvidar(self.datos)
        self.sincronizador, self.carpeta_actual, self.error = None, "", None

    def ahora(self) -> dict:
        """Una vuelta de sincronización (si no hay otra en marcha) y el estado resultante."""
        if self.ejecutando.acquire(blocking=False):
            try:
                s = self._preparar()
                if s is not None:
                    try:
                        s.sincronizar()
                        self.error = None
                    except Exception as e:          # carpeta sin conexión, permisos, disco lleno...: se cuenta, no se rompe la app
                        self.error = f"{type(e).__name__}: {e}"
                        print(f"[Sincronización] {self.error}")
            finally:
                self.ejecutando.release()
        return self.estado()

    def estado(self) -> dict:
        ajustes = self.leer_ajustes()
        try:
            s = self._preparar()
        except Exception:
            s = self.sincronizador
        base = {"configurada": bool(_texto(ajustes.get("carpeta_sincronizacion")).strip()), "carpeta": _texto(ajustes.get("carpeta_sincronizacion")),
                "auto": bool(ajustes.get("sincronizar_auto")), "sincronizando": self.ejecutando.locked(), "error": self.error,
                "pc": None, "ultima": None, "generacion": 0, "pcs": []}
        if s is not None:
            e = s.leer_estado()
            base.update(pc=e["nombre"], ultima=e["ultima"], generacion=e["generacion"], pcs=(e["ultima"] or {}).get("pcs", []))
        return base

    def iniciar_auto(self) -> None:
        """Una vuelta al abrir la app, en un hilo de fondo (si hay carpeta y la opción de sincronizar al abrir está activa). Después, solo cuando el usuario la pide
        en Ajustes: sin repasos periódicos que gasten disco y procesador."""
        if self.hilo is not None:
            return

        def vuelta():
            try:
                a = self.leer_ajustes()
                if _texto(a.get("carpeta_sincronizacion")).strip() and a.get("sincronizar_auto"):
                    self.ahora()
            except Exception as e:
                print(f"[Sincronización] {e}")
        self.hilo = threading.Thread(target=vuelta, daemon=True, name="sincronizacion")
        self.hilo.start()
