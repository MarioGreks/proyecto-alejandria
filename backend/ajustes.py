"""Ajustes del usuario (data/ajustes.json): si se usa la IA local, con qué modelo de Ollama y si la app busca versiones nuevas al abrirse."""
import json
import os
import threading

from database import DATA_DIR

RUTA = os.path.join(DATA_DIR, "ajustes.json")
DEFECTO = {"ia_activa": True, "modelo": "", "buscar_actualizaciones": True}   # modelo "" = elegir automáticamente el mejor instalado
_lock = threading.Lock()


def leer() -> dict:
    """Ajustes guardados con los que falten rellenados; un archivo ausente o ilegible vale lo mismo que no tener ajustes."""
    try:
        with open(RUTA, encoding="utf-8") as f:
            guardados = json.load(f)
    except (OSError, ValueError):
        guardados = {}
    return {k: guardados[k] if isinstance(guardados.get(k), type(v)) else v for k, v in DEFECTO.items()}


def guardar(cambios: dict) -> dict:
    """Aplica solo las claves conocidas (con su tipo correcto) y escribe el archivo de golpe."""
    with _lock:
        nuevos = {**leer(), **{k: v for k, v in cambios.items() if k in DEFECTO and isinstance(v, type(DEFECTO[k]))}}
        tmp = RUTA + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(nuevos, f, ensure_ascii=False, indent=2)
        os.replace(tmp, RUTA)
        return nuevos
