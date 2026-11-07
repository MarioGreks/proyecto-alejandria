"""Papelera de neuronas.

Borrar una neurona no destruye su archivo: lo marca con `"papelera": {"fecha": <ISO UTC>}` y se queda en data/raw/. Eso tiene tres efectos buscados:
  - la base compilada (database.py) la ignora, así que desaparece del universo, de la búsqueda y de las propuestas de conexión;
  - sus conexiones siguen guardadas en aristas.parquet pero no se ven (get_links_metadata solo devuelve las de neuronas vivas), así que al restaurarla vuelven;
  - viaja con la sincronización entre PCs como una edición cualquiera de la neurona (el otro PC también la ve en su papelera, y restaurar la revive en todos).
Pasados DIAS_RETENCION días (o con «vaciar») el archivo se borra de verdad; ese borrado sí se propaga como una tumba. Borrar de verdad solo se puede
con neuronas que ya están en la papelera.
"""
import json
import os
import re
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from database import DATA_DIR, db_conn

DIAS_RETENCION = 7
ID_VALIDO = re.compile(r"[\w-]+")


def _raw_dir() -> str:
    return os.path.join(DATA_DIR, "raw")


def _ruta(node_id: str) -> str:
    if not ID_VALIDO.fullmatch(str(node_id)):
        raise ValueError("id inválido")
    return os.path.join(_raw_dir(), f"{node_id}.json")


def _leer(node_id: str) -> Optional[dict]:
    try:
        with open(_ruta(node_id), encoding="utf-8") as f:
            d = json.load(f)
        return d if isinstance(d, dict) else None
    except (OSError, ValueError):
        return None


def _guardar(node_id: str, data: dict) -> None:
    ruta = _ruta(node_id)
    tmp = ruta + ".tmp"      # atómico: un corte a mitad no deja el JSON de la neurona a medias
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, ruta)


def _ahora() -> datetime:
    return datetime.now(timezone.utc)


def _fecha(data: dict) -> Optional[datetime]:
    marca = data.get("papelera")
    try:
        return datetime.fromisoformat(str(marca["fecha"]).replace("Z", "+00:00")) if isinstance(marca, dict) else None
    except (KeyError, ValueError):
        return None


def _en_papelera() -> List[str]:
    ids = []
    for f in sorted(os.listdir(_raw_dir())) if os.path.isdir(_raw_dir()) else []:
        if f.endswith(".json") and ID_VALIDO.fullmatch(f[:-5]):
            d = _leer(f[:-5])
            if d is not None and d.get("papelera"):
                ids.append(f[:-5])
    return ids


def mover(node_id: str) -> bool:
    """Manda la neurona a la papelera. False si no existe. Si ya estaba, no cambia su fecha."""
    d = _leer(node_id)
    if d is None:
        return False
    if not d.get("papelera"):
        d["papelera"] = {"fecha": _ahora().isoformat(timespec="seconds")}
        _guardar(node_id, d)
        db_conn.compile_raw_jsons(force=True)
    return True


def restaurar(node_id: str) -> bool:
    """Saca la neurona de la papelera (con sus conexiones). False si no estaba en ella."""
    d = _leer(node_id)
    if d is None or not d.get("papelera"):
        return False
    d.pop("papelera")
    _guardar(node_id, d)
    db_conn.compile_raw_jsons(force=True)
    return True


def _borrar(ids: List[str]) -> int:
    for i in ids:
        os.remove(_ruta(i))
    if ids:
        db_conn.compile_raw_jsons(force=True)
        db_conn.quitar_aristas_huerfanas()      # sus conexiones se pierden con ella; las de otras neuronas en la papelera siguen mientras exista el otro extremo
    return len(ids)


def borrar_definitivo(node_id: str) -> bool:
    """Borra el archivo de una neurona que YA está en la papelera. False si no existe o no está en ella."""
    d = _leer(node_id)
    if d is None or not d.get("papelera"):
        return False
    return _borrar([node_id]) == 1


def vaciar() -> int:
    """Borra de verdad todo lo que hay en la papelera. Devuelve cuántas neuronas."""
    return _borrar(_en_papelera())


def purgar_caducadas() -> int:
    """Borra las que llevan más de DIAS_RETENCION días. Una marca sin fecha legible se fecha ahora (no se borra a ciegas)."""
    limite = _ahora() - timedelta(days=DIAS_RETENCION)
    caducadas = []
    for i in _en_papelera():
        d = _leer(i)
        f = _fecha(d) if d else None
        if f is None:
            if d is not None:
                d["papelera"] = {"fecha": _ahora().isoformat(timespec="seconds")}
                _guardar(i, d)
        elif f < limite:
            caducadas.append(i)
    return _borrar(caducadas)


def listar() -> List[dict]:
    """Lo que hay en la papelera, lo último borrado primero: id, nombre, clúster, tipo, fecha, días que le quedan y cuántas conexiones guardadas tiene."""
    from limpieza import tipo_de
    aristas = [a for a in db_conn.listar_aristas() if a.get("estado") != "rechazada"]
    out = []
    for i in _en_papelera():
        d = _leer(i)
        f = _fecha(d)
        quedan = max(0, DIAS_RETENCION - (_ahora() - f).days) if f else DIAS_RETENCION
        out.append({"id": i, "nombre": d.get("nombre", i), "cluster": d.get("cluster", ""), "tipo": tipo_de(d),
                    "fecha": f.isoformat(timespec="seconds") if f else "", "dias_restantes": quedan,
                    "conexiones": sum(1 for a in aristas if i in (a.get("origen_id"), a.get("destino_id")))})
    return sorted(out, key=lambda x: x["fecha"], reverse=True)
