"""Exportar e importar neuronas (y sus conexiones) en un único archivo JSON, para compartirlas o pasarlas a otro equipo."""
import json
import os
import re

from database import DATA_DIR, db_conn

FORMATO = "alejandria-neuronas"
VERSION = 1
MAX_NEURONAS = 5000           # un archivo con más que esto no es una colección personal: se rechaza antes de escribir nada
ID_VALIDO = re.compile(r"[\w-]+")


class ArchivoInvalido(ValueError):
    pass


def _raw_dir() -> str:
    return os.path.join(DATA_DIR, "raw")


def exportar() -> dict:
    """Todas las neuronas (sin embedding: se regenera al importar, y pesa mucho) y las conexiones que no se hayan rechazado."""
    neuronas = []
    if os.path.isdir(_raw_dir()):
        for f in sorted(os.listdir(_raw_dir())):
            if not f.endswith(".json"):
                continue
            try:
                with open(os.path.join(_raw_dir(), f), encoding="utf-8") as fh:
                    n = json.load(fh)
            except (OSError, ValueError):
                continue
            n.pop("embedding", None)
            n["id"] = f[:-5]
            neuronas.append(n)
    aristas = [{k: a.get(k, "") for k in ("origen_id", "destino_id", "motivo", "estado")} for a in db_conn.get_links_metadata()]
    return {"formato": FORMATO, "version": VERSION, "neuronas": neuronas, "aristas": aristas}


def importar(contenido) -> dict:
    """Añade las neuronas del archivo que aún no existan (nunca pisa las tuyas) y las conexiones entre neuronas que existan.
    Devuelve cuántas añadió y cuántas omitió. Lanza ArchivoInvalido, sin haber escrito nada, si el archivo no es válido."""
    if not isinstance(contenido, dict) or contenido.get("formato") != FORMATO:
        raise ArchivoInvalido("No es un archivo de neuronas de Alejandría.")
    if contenido.get("version") != VERSION:
        raise ArchivoInvalido(f"Versión de archivo no soportada: {contenido.get('version')!r}.")
    neuronas, aristas = contenido.get("neuronas"), contenido.get("aristas", [])
    if not isinstance(neuronas, list) or not isinstance(aristas, list):
        raise ArchivoInvalido("El archivo está incompleto.")
    if len(neuronas) > MAX_NEURONAS:
        raise ArchivoInvalido(f"Demasiadas neuronas (máximo {MAX_NEURONAS}).")
    for n in neuronas:
        if not isinstance(n, dict) or not isinstance(n.get("id"), str) or not ID_VALIDO.fullmatch(n["id"]) or not isinstance(n.get("nombre"), str):
            raise ArchivoInvalido("Hay una neurona sin 'id' válido o sin 'nombre'.")

    os.makedirs(_raw_dir(), exist_ok=True)
    nuevas, omitidas = [], 0
    for n in neuronas:
        ruta = os.path.join(_raw_dir(), n["id"] + ".json")
        if os.path.exists(ruta) or n["id"] in nuevas:
            omitidas += 1
            continue
        with open(ruta, "w", encoding="utf-8") as f:
            json.dump({k: v for k, v in n.items() if k != "embedding"}, f, ensure_ascii=False, indent=2)
        nuevas.append(n["id"])
    if nuevas:
        db_conn.compile_raw_jsons(force=True)

    ids = {f[:-5] for f in os.listdir(_raw_dir()) if f.endswith(".json")}
    validas = [{k: a.get(k, "") for k in ("origen_id", "destino_id", "motivo", "estado")} for a in aristas
               if isinstance(a, dict) and a.get("origen_id") in ids and a.get("destino_id") in ids
               and (a.get("origen_id") in nuevas or a.get("destino_id") in nuevas)]   # solo las que tocan alguna neurona recién añadida
    for a in validas:
        if a["estado"] not in ("pendiente", "aceptada"):
            a["estado"] = "pendiente"
    db_conn.add_links(validas, overwrite=False)
    return {"añadidas": len(nuevas), "omitidas": omitidas, "conexiones": len(validas)}
