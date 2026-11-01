import os
import sys
import time
import shutil
import subprocess
import urllib.request
import urllib.error
import json
from typing import List, Optional

import ajustes

OLLAMA_BASE_URL = "http://127.0.0.1:11434"

def is_ollama_running(timeout: float = 2.0) -> bool:
    """Comprueba si el servidor de Ollama responde en 127.0.0.1:11434."""
    try:
        req = urllib.request.Request(f"{OLLAMA_BASE_URL}/api/tags")
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.status == 200
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

def ensure_ollama_running() -> bool:
    """
    Verifica si Ollama está en ejecución. Si no lo está, lo arranca
    en segundo plano de forma totalmente transparente y espera a que responda.
    """
    if not ajustes.leer()["ia_activa"]:
        return False                                  # el usuario desactivó la IA local: no se arranca ni se usa Ollama
    if is_ollama_running(timeout=1.0):
        return True

    print("[Ollama Service] Servidor Ollama no detectado en 127.0.0.1:11434.")
    ollama_bin = get_ollama_path()
    
    if not ollama_bin:
        print("[Ollama Service] AVISO: No se encontró el ejecutable 'ollama.exe'. Por favor asegúrate de tenerlo instalado.")
        return False

    print(f"[Ollama Service] Arrancando automáticamente Ollama desde '{ollama_bin}'...")
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

        # Esperar hasta 8 segundos comprobando cada 0.5s
        for _ in range(16):
            time.sleep(0.5)
            if is_ollama_running(timeout=1.0):
                print("[Ollama Service] Servidor Ollama conectado y listo.")
                return True

    except Exception as e:
        print(f"[Ollama Service] Error al intentar arrancar Ollama: {e}")

    return is_ollama_running(timeout=1.0)

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

    elegido = ajustes.leer()["modelo"]                # el que el usuario eligió en Ajustes, si sigue instalado
    if elegido in models:
        return elegido

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
    return models[0]
