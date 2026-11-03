import os
import sys
import time
import shutil
import subprocess
import urllib.request
import urllib.error
import json
import re
import threading
from typing import List, Optional

import ajustes

OLLAMA_BASE_URL = "http://127.0.0.1:11434"

# Pesos con licencia no comercial o con condiciones propias: Qwen 2.5 de 3B (Qwen Research) y de 72B (Qwen License); el resto de tamaños es Apache-2.0.
# Cubre variantes como qwen2.5-coder:3b o qwen2.5:3b-instruct-q4_K_M. Ver el README («Modelos de IA y software de terceros»).
_LICENCIA_RESTRINGIDA = re.compile(r"(?:^|/)qwen2\.5[^:/]*:(?:3b|72b)(?![0-9a-z.])", re.IGNORECASE)

def licencia_restrictiva(nombre: str) -> bool:
    """¿Es un modelo con licencia no comercial o con restricciones? El modo automático no los elige; solo se usan si el usuario los elige en Ajustes."""
    return bool(_LICENCIA_RESTRINGIDA.search(nombre or ""))

# Sin proxy del sistema: es una dirección local, y un proxy podría contestar por Ollama aunque esté apagado.
_SIN_PROXY = urllib.request.build_opener(urllib.request.ProxyHandler({}))

def is_ollama_running(timeout: float = 2.0) -> bool:
    """Comprueba si el servidor de Ollama responde en 127.0.0.1:11434. Exige la respuesta propia de Ollama (lista de modelos), no solo un 200 de cualquiera."""
    try:
        with _SIN_PROXY.open(f"{OLLAMA_BASE_URL}/api/tags", timeout=timeout) as response:
            return response.status == 200 and isinstance(json.loads(response.read().decode("utf-8")).get("models"), list)
    except Exception:
        return False

def get_ollama_path() -> Optional[str]:
    """Encuentra la ruta al ejecutable de Ollama en Windows u otros sistemas."""
    # 1. Comprobar si 'ollama' ya está en PATH
    path = shutil.which("ollama")
    if path and os.path.exists(path):
        return path

    # 2. Rutas estándar habituales en Windows
    if os.name == "nt":
        local_appdata = os.environ.get("LOCALAPPDATA", "")
        userprofile = os.environ.get("USERPROFILE", "")
        program_files = os.environ.get("ProgramFiles", "C:\\Program Files")
        
        candidatas = [
            os.path.join(local_appdata, "Programs", "Ollama", "ollama.exe"),
            os.path.join(userprofile, "AppData", "Local", "Programs", "Ollama", "ollama.exe"),
            os.path.join(program_files, "Ollama", "ollama.exe"),
        ]
        
        for cand in candidatas:
            if cand and os.path.exists(cand):
                return cand

    return None

ESPERA_ARRANQUE = 60.0   # segundos; en un portátil lento Ollama tarda más de 10 s en responder la primera vez (con 8 s, las sinapsis salían «sin modelo local»)

# Quien arranca Ollama lo hace con el cerrojo: otro hilo que lo necesite a la vez espera a que responda, en vez de lanzar un segundo `ollama serve`.
_arrancando = threading.Lock()

def ensure_ollama_running(espera: float = ESPERA_ARRANQUE) -> bool:
    """
    Verifica si Ollama está en ejecución. Si no lo está, lo arranca
    en segundo plano de forma totalmente transparente y espera (hasta `espera` s) a que responda.
    """
    if not ajustes.leer()["ia_activa"]:
        return False                                  # el usuario desactivó la IA local: no se arranca ni se usa Ollama
    if is_ollama_running(timeout=1.0):
        return True

    ollama_bin = get_ollama_path()
    if not ollama_bin:
        print("[Ollama Service] AVISO: No se encontró el ejecutable 'ollama.exe'. Por favor asegúrate de tenerlo instalado.")
        return False

    with _arrancando:
        if is_ollama_running(timeout=1.0):
            return True                               # lo levantó otro hilo mientras esperábamos el cerrojo
        print(f"[Ollama Service] Servidor Ollama no detectado en 127.0.0.1:11434. Arrancándolo desde '{ollama_bin}'...")
        try:
            creationflags = 0
            if os.name == "nt":
                # CREATE_NO_WINDOW (0x08000000) evita que se abra una ventana negra de consola
                creationflags = 0x08000000
                if hasattr(subprocess, "DETACHED_PROCESS"):
                    creationflags |= subprocess.DETACHED_PROCESS

            subprocess.Popen(
                [ollama_bin, "serve"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                stdin=subprocess.DEVNULL,
                creationflags=creationflags
            )

            limite = time.monotonic() + espera
            while time.monotonic() < limite:
                time.sleep(0.5)
                if is_ollama_running(timeout=1.0):
                    print("[Ollama Service] Servidor Ollama conectado y listo.")
                    return True
        except Exception as e:
            print(f"[Ollama Service] Error al intentar arrancar Ollama: {e}")
        return is_ollama_running(timeout=1.0)

def arrancar_en_segundo_plano() -> str:
    """Arranca Ollama sin bloquear a quien llama (esperar a que responda tarda varios segundos). Devuelve el estado:
    'ia_apagada' (el usuario la desactivó), 'activo' (ya responde), 'no_instalado', o 'arrancando' (se está arrancando; consulta is_ollama_running en unos segundos)."""
    if not ajustes.leer()["ia_activa"]:
        return "ia_apagada"
    if is_ollama_running(timeout=0.5):
        return "activo"
    if not get_ollama_path():
        return "no_instalado"
    if not _arrancando.locked():                         # si ya hay un arranque en curso no hace falta otro hilo
        threading.Thread(target=ensure_ollama_running, daemon=True).start()
    return "arrancando"

def get_available_models() -> List[str]:
    """Devuelve la lista de nombres de modelos descargados localmente en Ollama."""
    try:
        req = urllib.request.Request(f"{OLLAMA_BASE_URL}/api/tags")
        with urllib.request.urlopen(req, timeout=2.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return [m.get("name", "") for m in data.get("models", [])]
    except Exception:
        return []

def get_best_llm_model(preferencia: str = "phi3:mini") -> str:
    """
    Devuelve el mejor modelo disponible para inferencia.
    Si el preferido está instalado lo usa, si no, busca alternativas comunes.
    """
    models = get_available_models()
    if not models:
        return preferencia

    elegido = ajustes.leer()["modelo"]                # el que el usuario eligió en Ajustes, si sigue instalado (aunque tenga licencia restringida)
    if elegido in models:
        return elegido

    # En automático nunca se elige un modelo de licencia restringida; si solo hay de esos, se devuelve la preferencia (la IA queda sin modelo hasta que se elija uno)
    models = [m for m in models if not licencia_restrictiva(m)]

    # 1. Coincidencia exacta o parcial con la preferencia
    for m in models:
        if preferencia in m:
            return m

    # 2. Preferir phi3
    for m in models:
        if "phi3" in m:
            return m

    # 3. Preferir qwen2.5
    for m in models:
        if "qwen2.5" in m or "qwen" in m:
            return m

    # 4. Fallback al primer modelo disponible
    return models[0] if models else preferencia
