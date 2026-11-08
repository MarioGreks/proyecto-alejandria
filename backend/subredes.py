"""Subredes: grupos de neuronas (TFM, Tesis...) dentro de la red general.

Una subred no es una copia: es una etiqueta. Cada neurona guarda en su JSON `"subredes": ["TFM", ...]` y todas siguen en la red general, así que
subred ⊆ general siempre. Como la pertenencia vive en el JSON de la neurona:
  - viaja con la sincronización entre PCs como una edición cualquiera, y con exportar/importar;
  - la lista de subredes no se guarda en ningún sitio: se deduce de las neuronas (una subred sin neuronas no existe en el disco; la interfaz recuerda
    en este PC las que acabas de crear y aún están vacías);
  - renombrar o borrar una subred reescribe las neuronas que la llevan (también las de la papelera, para que al restaurarlas no reaparezca el nombre viejo).
"""
import os
from collections import Counter
from typing import Iterable, List, Optional

from database import db_conn
from limpieza import normalizar, normalizar_lista
from papelera import ID_VALIDO, _guardar, _leer, _raw_dir

def _clave(nombre: str) -> str:
    return nombre.casefold()


def _todas() -> Iterable[tuple]:
    """(id, datos) de todos los JSON legibles de raw/, vivos o en la papelera."""
    d = _raw_dir()
    for f in sorted(os.listdir(d)) if os.path.isdir(d) else []:
        if f.endswith(".json") and ID_VALIDO.fullmatch(f[:-5]):
            datos = _leer(f[:-5])
            if datos is not None:
                yield f[:-5], datos


def existentes() -> List[str]:
    """Nombres de subred que hay en alguna neurona (incluidas las de la papelera), en su grafía más usada."""
    grafias = {}
    for _, datos in _todas():
        for n in normalizar_lista(datos.get("subredes")):
            grafias.setdefault(_clave(n), Counter())[n] += 1
    return sorted((g.most_common(1)[0][0] for g in grafias.values()), key=_clave)


def canonico(nombre: str, conocidas: Optional[List[str]] = None) -> str:
    """Si ya existe una subred con ese nombre (sin distinguir mayúsculas) devuelve su grafía; si no, el nombre limpio. Vacío si no es válido."""
    n = normalizar(nombre)
    for c in (existentes() if conocidas is None else conocidas):
        if _clave(c) == _clave(n):
            return c
    return n


def listar() -> List[dict]:
    """Las subredes con cuántas neuronas vivas tiene cada una."""
    cuenta = {}
    for _, datos in _todas():
        if datos.get("papelera"):
            continue
        for n in normalizar_lista(datos.get("subredes")):
            c = cuenta.setdefault(_clave(n), [n, 0])
            c[1] += 1
    return [{"nombre": n, "neuronas": k} for n, k in sorted(cuenta.values(), key=lambda x: _clave(x[0]))]


def _fijar(datos: dict, nombres: List[str]) -> bool:
    """Deja `subredes` en esa lista (o sin el campo si está vacía). True si cambió algo."""
    antes = normalizar_lista(datos.get("subredes")) if "subredes" in datos else []
    nuevas = normalizar_lista(nombres)
    if antes == nuevas and ("subredes" in datos) == bool(nuevas):
        return False
    if nuevas:
        datos["subredes"] = nuevas
    else:
        datos.pop("subredes", None)
    return True


def asignar(ids: List[str], añadir: List[str] = (), quitar: List[str] = ()) -> int:
    """Añade y/o quita subredes a las neuronas vivas indicadas (las que no existan o estén en la papelera se saltan). Devuelve cuántas neuronas cambiaron."""
    conocidas = existentes()
    sumar = [canonico(n, conocidas) for n in añadir]
    sumar = [n for n in sumar if n]
    quitar_k = {_clave(normalizar(n)) for n in quitar}
    cambiadas = 0
    for i in dict.fromkeys(ids):
        if not ID_VALIDO.fullmatch(str(i)):
            continue
        datos = _leer(i)
        if datos is None or datos.get("papelera"):
            continue
        actuales = [n for n in normalizar_lista(datos.get("subredes")) if _clave(n) not in quitar_k]
        if _fijar(datos, actuales + [n for n in sumar if _clave(n) not in quitar_k]):
            _guardar(i, datos)
            cambiadas += 1
    if cambiadas:
        db_conn.compile_raw_jsons(force=True)
    return cambiadas


def _reescribir(viejo: str, nuevo: str) -> int:
    """Cambia `viejo` por `nuevo` (o lo quita si `nuevo` está vacío) en todas las neuronas que lo llevan."""
    k, cambiadas = _clave(viejo), 0
    for i, datos in _todas():
        actuales = normalizar_lista(datos.get("subredes"))
        if not any(_clave(n) == k for n in actuales):
            continue
        resto = [n for n in actuales if _clave(n) != k]
        if _fijar(datos, resto + ([nuevo] if nuevo else [])):
            _guardar(i, datos)
            cambiadas += 1
    if cambiadas:
        db_conn.compile_raw_jsons(force=True)
    return cambiadas


def renombrar(viejo: str, nuevo: str) -> int:
    """Renombra una subred. Si `nuevo` ya existe, las dos se fusionan. Devuelve cuántas neuronas se reescribieron. ValueError si el nombre nuevo no vale."""
    nuevo = canonico(nuevo)
    if not nuevo:
        raise ValueError("El nombre de la subred no puede estar vacío.")
    return _reescribir(normalizar(viejo), nuevo)


def borrar(nombre: str) -> int:
    """Borra la subred: la quita de todas sus neuronas, que siguen en la red general. Devuelve cuántas neuronas se reescribieron."""
    return _reescribir(normalizar(nombre), "")


def fusionar(node_id: str, nombres: List[str]) -> bool:
    """Suma esas subredes a las que ya tenga una neurona viva (nunca quita). No recompila la base: lo hace quien llama. True si cambió algo."""
    datos = _leer(node_id)
    if datos is None or datos.get("papelera"):
        return False
    if _fijar(datos, normalizar_lista(datos.get("subredes")) + normalizar_lista(nombres)):
        _guardar(node_id, datos)
        return True
    return False
