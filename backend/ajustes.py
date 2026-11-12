"""Ajustes del usuario (data/ajustes.json): IA local y modelo de Ollama, búsqueda de versiones nuevas, carpeta compartida para sincronizar entre PCs
y límites de rendimiento (CPU, RAM, GPU)."""
import json
import os
import threading

from database import DATA_DIR

RUTA = os.path.join(DATA_DIR, "ajustes.json")
DEFECTO = {"ia_activa": True, "modelo": "", "buscar_actualizaciones": True, "carpeta_sincronizacion": "", "sincronizar_auto": True,   # modelo "" = elegir automáticamente el mejor instalado
           # Rendimiento (ver recursos.py). perfil "" = el usuario aún no ha elegido: sin topes, como antes de existir el limitador.
           "perfil": "",                    # "", "ligero", "equilibrado", "maximo" o "personalizado" (si tocó un deslizable)
           "limite_cpu": 100,               # % del total de la CPU para el backend y Ollama juntos; 100 = sin tope
           "limite_ram_mb": 0,              # MB de RAM para el backend y Ollama juntos; 0 = sin tope
           "fps_max": 0,                    # tope de fotogramas por segundo del universo 3D; 0 = sin tope
           "calidad_3d": "alta",            # "alta", "media" o "baja"
           "ia_en_gpu": True,               # False: Ollama calcula solo con la CPU
           "sinapsis_auto": True}           # False: las conexiones de una neurona nueva se calculan cuando el usuario lo pide

CALIDADES_3D = ("alta", "media", "baja")
PERFILES = ("", "ligero", "equilibrado", "maximo", "personalizado")
_lock = threading.Lock()


def leer() -> dict:
    """Ajustes guardados con los que falten rellenados; un archivo ausente o ilegible vale lo mismo que no tener ajustes."""
    try:
        with open(RUTA, encoding="utf-8") as f:
            guardados = json.load(f)
    except (OSError, ValueError):
        guardados = {}
    a = {k: guardados[k] if isinstance(guardados.get(k), type(v)) else v for k, v in DEFECTO.items()}
    if a["perfil"] not in PERFILES:
        a["perfil"] = DEFECTO["perfil"]
    if a["calidad_3d"] not in CALIDADES_3D:
        a["calidad_3d"] = DEFECTO["calidad_3d"]
    a["limite_cpu"] = max(1, min(100, a["limite_cpu"]))      # un archivo editado a mano no debe dejar la app sin CPU ni con valores absurdos
    a["limite_ram_mb"] = max(0, a["limite_ram_mb"])
    a["fps_max"] = max(0, min(240, a["fps_max"]))
    return a


def guardar(cambios: dict) -> dict:
    """Aplica solo las claves conocidas (con su tipo correcto) y escribe el archivo de golpe."""
    with _lock:
        nuevos = {**leer(), **{k: v for k, v in cambios.items() if k in DEFECTO and isinstance(v, type(DEFECTO[k]))}}
        tmp = RUTA + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(nuevos, f, ensure_ascii=False, indent=2)
        os.replace(tmp, RUTA)
        return nuevos
