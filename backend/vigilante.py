"""Que el backend no se quede huérfano: si la app que lo lanzó (ALEJANDRIA_PADRE = su PID) muere sin avisar, se cierra solo."""
import ctypes
import os
import sys
import threading
import time

_SYNCHRONIZE = 0x00100000
_WAIT_TIMEOUT = 0x102


def proceso_vivo(pid: int) -> bool:
    if sys.platform != "win32":
        try:
            os.kill(pid, 0)      # en Windows esto MATARÍA el proceso: por eso solo aquí
            return True
        except OSError:
            return False
    k = ctypes.windll.kernel32
    h = k.OpenProcess(_SYNCHRONIZE, False, pid)
    if not h:
        return False             # ya no existe (o no se puede consultar)
    try:
        return k.WaitForSingleObject(h, 0) == _WAIT_TIMEOUT
    finally:
        k.CloseHandle(h)


def vigilar_padre(pid: int, cada: float = 2.0, salir=lambda: os._exit(0)) -> threading.Thread:
    def bucle():
        while proceso_vivo(pid):
            time.sleep(cada)
        salir()
    hilo = threading.Thread(target=bucle, daemon=True, name="vigilante-del-padre")
    hilo.start()
    return hilo
