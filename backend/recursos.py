"""Limitador de recursos: perfiles de rendimiento (Ligero / Equilibrado / Máximo), topes duros de CPU y RAM con un Job Object de Windows sobre el backend
y Ollama, opciones de Ollama (hilos, contexto, GPU) y vigilancia de la RAM libre. Solo Windows para los topes duros; en otros sistemas el resto funciona
y los topes se ignoran. Sin dependencias: todo con ctypes."""
import ctypes
import os
import subprocess
import sys
import threading
import time
import urllib.request
import json
from ctypes import wintypes
from typing import Dict, List, Optional

import ajustes

WINDOWS = sys.platform == "win32"
PERFILES_VALIDOS = ("ligero", "equilibrado", "maximo")
MIN_RAM_MB = 2048            # por debajo el backend (embeddings, ~0,6-1 GB) y un modelo pequeño ya no caben: no se deja bajar más
MIN_CPU = 10

# ───────────────────────── Hardware ─────────────────────────

class _MEMORYSTATUSEX(ctypes.Structure):
    _fields_ = [("dwLength", wintypes.DWORD), ("dwMemoryLoad", wintypes.DWORD), ("ullTotalPhys", ctypes.c_ulonglong), ("ullAvailPhys", ctypes.c_ulonglong),
                ("ullTotalPageFile", ctypes.c_ulonglong), ("ullAvailPageFile", ctypes.c_ulonglong), ("ullTotalVirtual", ctypes.c_ulonglong),
                ("ullAvailVirtual", ctypes.c_ulonglong), ("sullAvailExtendedVirtual", ctypes.c_ulonglong)]


def memoria_mb() -> Dict[str, int]:
    """RAM física del equipo en MB: total y libre. (0, 0) si no se puede leer."""
    if WINDOWS:
        m = _MEMORYSTATUSEX()
        m.dwLength = ctypes.sizeof(m)
        if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(m)):
            return {"total": int(m.ullTotalPhys // 2**20), "libre": int(m.ullAvailPhys // 2**20)}
    return {"total": 0, "libre": 0}


class _DISPLAY_DEVICEW(ctypes.Structure):
    _fields_ = [("cb", wintypes.DWORD), ("DeviceName", wintypes.WCHAR * 32), ("DeviceString", wintypes.WCHAR * 128), ("StateFlags", wintypes.DWORD),
                ("DeviceID", wintypes.WCHAR * 128), ("DeviceKey", wintypes.WCHAR * 128)]


_DEDICADAS = ("geforce", "rtx", "gtx", "quadro", "radeon rx", "radeon pro", "arc a", "arc b", "arc(tm) a", "arc(tm) b", "titan")


def es_gpu_dedicada(nombre: str) -> bool:
    """Heurística por el nombre: una tarjeta GeForce/RTX/Radeon RX/Arc es dedicada; Intel UHD/Iris o «Radeon Graphics» (integrada en el procesador), no."""
    n = (nombre or "").lower()
    return any(p in n for p in _DEDICADAS)


def gpus() -> List[str]:
    """Nombres de las tarjetas gráficas que Windows ve (sin lanzar ningún programa)."""
    if not WINDOWS:
        return []
    nombres, i = [], 0
    while i < 16:
        d = _DISPLAY_DEVICEW()
        d.cb = ctypes.sizeof(d)
        if not ctypes.windll.user32.EnumDisplayDevicesW(None, i, ctypes.byref(d), 0):
            break
        if d.DeviceString and d.DeviceString not in nombres and not any(v in d.DeviceString.lower() for v in ("basic", "remote", "virtual", "indirect")):
            nombres.append(d.DeviceString)
        i += 1
    return nombres


_hardware_cache: Optional[dict] = None


def detectar_hardware(recargar: bool = False) -> dict:
    """RAM total (MB), núcleos lógicos, GPUs y si hay alguna dedicada. Se calcula una vez."""
    global _hardware_cache
    if _hardware_cache is None or recargar:
        tarjetas = gpus()
        _hardware_cache = {"ram_total_mb": memoria_mb()["total"], "nucleos": os.cpu_count() or 2, "gpus": tarjetas, "gpu_dedicada": any(es_gpu_dedicada(g) for g in tarjetas)}
    return _hardware_cache


# ───────────────────────── Perfiles ─────────────────────────

def perfil_sugerido(hw: Optional[dict] = None) -> str:
    """Perfil que se propone según el equipo: poca RAM o pocos núcleos → ligero; término medio → equilibrado; el resto → máximo."""
    hw = hw or detectar_hardware()
    ram_gb = hw["ram_total_mb"] / 1024
    if ram_gb <= 8.5 or hw["nucleos"] <= 4:
        return "ligero"
    if ram_gb <= 16.5 or hw["nucleos"] <= 8:
        return "equilibrado"
    return "maximo"


def valores_perfil(perfil: str, hw: Optional[dict] = None) -> dict:
    """Los ajustes concretos de un perfil para este equipo (los mismos nombres que en ajustes.json)."""
    hw = hw or detectar_hardware()
    total = hw["ram_total_mb"] or 8192
    if perfil == "ligero":
        return {"limite_cpu": 40, "limite_ram_mb": max(MIN_RAM_MB, min(4096, int(total * 0.35))), "fps_max": 30, "calidad_3d": "baja",
                "ia_en_gpu": hw["gpu_dedicada"], "sinapsis_auto": False}
    if perfil == "equilibrado":
        return {"limite_cpu": 70, "limite_ram_mb": max(MIN_RAM_MB, min(8192, int(total * 0.5))), "fps_max": 60, "calidad_3d": "media",
                "ia_en_gpu": True, "sinapsis_auto": True}
    return {"limite_cpu": 100, "limite_ram_mb": 0, "fps_max": 0, "calidad_3d": "alta", "ia_en_gpu": True, "sinapsis_auto": True}


# Lo que el perfil activo cambia en Ollama que no se guarda como ajuste suelto: contexto, hilos y cuánto tiempo se queda el modelo cargado.
_IA_POR_PERFIL = {"ligero": {"num_ctx": 2048, "hilos": 0.25, "keep_alive": "30s"}, "equilibrado": {"num_ctx": 4096, "hilos": 0.5, "keep_alive": "2m"}}
MODELOS_LIGEROS = ("qwen2.5:1.5b", "qwen2.5:0.5b")    # Apache-2.0; el automático los prefiere en el perfil Ligero si están instalados


def _ajustes(a: Optional[dict] = None) -> dict:
    """Los ajustes pasados (o los guardados) con lo que falte rellenado con los valores por defecto: así un diccionario parcial no rompe nada."""
    return {**ajustes.DEFECTO, **(ajustes.leer() if a is None else a)}


def limitando(a: Optional[dict] = None) -> bool:
    """¿Hay algún tope activo? (perfil distinto de máximo, o valores propios por debajo del máximo)."""
    a = _ajustes(a)
    return a["perfil"] in ("ligero", "equilibrado") or a["limite_cpu"] < 100 or a["limite_ram_mb"] > 0


def _perfil_ia(a: dict) -> dict:
    """Parámetros de Ollama del perfil guardado; un perfil «personalizado» o sin elegir sale por la CPU que se le dejó: ≤50 % ligero, ≤80 % equilibrado."""
    p = a["perfil"]
    if p in _IA_POR_PERFIL:
        return _IA_POR_PERFIL[p]
    if p == "personalizado":
        return _IA_POR_PERFIL["ligero"] if a["limite_cpu"] <= 50 else _IA_POR_PERFIL["equilibrado"] if a["limite_cpu"] <= 80 else {}
    return {}


def opciones_ollama(a: Optional[dict] = None, hw: Optional[dict] = None) -> dict:
    """Cuerpo extra para /api/generate: `options` (hilos, contexto, capas en GPU) y `keep_alive`. Vacío si no se limita nada (Ollama decide)."""
    a = _ajustes(a)
    if not limitando(a):
        return {}
    hw = hw or detectar_hardware()
    ia = _perfil_ia(a)
    opciones = {}
    if ia.get("num_ctx"):
        opciones["num_ctx"] = ia["num_ctx"]
    if ia.get("hilos"):
        opciones["num_thread"] = max(1, int(hw["nucleos"] * ia["hilos"]))
    if not a["ia_en_gpu"]:
        opciones["num_gpu"] = 0
    extra = {"options": opciones} if opciones else {}
    if ia.get("keep_alive"):
        extra["keep_alive"] = ia["keep_alive"]
    return extra


def hilos_embedding(a: Optional[dict] = None, hw: Optional[dict] = None) -> Optional[int]:
    """Hilos para el modelo de embeddings (fastembed) al crearlo: pocos con límites activos, None (los decide la biblioteca) sin límites.
    Solo vale al arrancar el backend: cambiar de perfil después afecta a Ollama y a los topes, pero no a este modelo hasta reabrir la app."""
    a = _ajustes(a)
    if not limitando(a):
        return None
    hw = hw or detectar_hardware()
    return max(1, int(hw["nucleos"] * (_perfil_ia(a).get("hilos") or 0.5)))


def entorno_ollama(base: Optional[dict] = None, a: Optional[dict] = None) -> dict:
    """Variables de entorno con las que se lanza `ollama serve`: un solo modelo cargado y una sola petición a la vez cuando se limita."""
    env = dict(os.environ if base is None else base)
    if limitando(a):
        env["OLLAMA_NUM_PARALLEL"] = "1"
        env["OLLAMA_MAX_LOADED_MODELS"] = "1"
    return env


def modelo_ligero_instalado(modelos: List[str]) -> Optional[str]:
    return next((m for pref in MODELOS_LIGEROS for m in modelos if m.lower().startswith(pref)), None)


# ───────────────────────── Job Object (topes duros) ─────────────────────────

JOB_OBJECT_LIMIT_PRIORITY_CLASS = 0x20
JOB_OBJECT_LIMIT_JOB_MEMORY = 0x200
JOB_OBJECT_CPU_RATE_CONTROL_ENABLE = 0x1
JOB_OBJECT_CPU_RATE_CONTROL_HARD_CAP = 0x4
BELOW_NORMAL_PRIORITY_CLASS = 0x4000
NORMAL_PRIORITY_CLASS = 0x20
_CLASE_LIMITE_EXTENDIDO = 9
_CLASE_TASA_CPU = 15
PROCESS_SET_QUOTA, PROCESS_TERMINATE, PROCESS_QUERY_LIMITED, PROCESS_SET_INFORMATION = 0x0100, 0x0001, 0x1000, 0x0200


class _BASIC_LIMIT(ctypes.Structure):
    _fields_ = [("PerProcessUserTimeLimit", ctypes.c_longlong), ("PerJobUserTimeLimit", ctypes.c_longlong), ("LimitFlags", wintypes.DWORD),
                ("MinimumWorkingSetSize", ctypes.c_size_t), ("MaximumWorkingSetSize", ctypes.c_size_t), ("ActiveProcessLimit", wintypes.DWORD),
                ("Affinity", ctypes.c_size_t), ("PriorityClass", wintypes.DWORD), ("SchedulingClass", wintypes.DWORD)]


class _IO_COUNTERS(ctypes.Structure):
    _fields_ = [(n, ctypes.c_ulonglong) for n in ("ReadOperationCount", "WriteOperationCount", "OtherOperationCount", "ReadTransferCount", "WriteTransferCount", "OtherTransferCount")]


class _EXTENDED_LIMIT(ctypes.Structure):
    _fields_ = [("BasicLimitInformation", _BASIC_LIMIT), ("IoInfo", _IO_COUNTERS), ("ProcessMemoryLimit", ctypes.c_size_t), ("JobMemoryLimit", ctypes.c_size_t),
                ("PeakProcessMemoryUsed", ctypes.c_size_t), ("PeakJobMemoryUsed", ctypes.c_size_t)]


class _CPU_RATE_INFO(ctypes.Structure):
    _fields_ = [("ControlFlags", wintypes.DWORD), ("CpuRate", wintypes.DWORD)]


_job = None
_job_lock = threading.Lock()
_firmas_listas = False


def _firmas() -> None:
    """Tipos de los argumentos de las funciones de Windows que se usan: sin ellos ctypes pasa los HANDLE como enteros de 32 bits."""
    global _firmas_listas
    if _firmas_listas or not WINDOWS:
        return
    k, H, D = ctypes.windll.kernel32, wintypes.HANDLE, wintypes.DWORD
    k.OpenProcess.argtypes, k.OpenProcess.restype = [D, wintypes.BOOL, D], H
    k.CloseHandle.argtypes = [H]
    k.CreateJobObjectW.argtypes, k.CreateJobObjectW.restype = [ctypes.c_void_p, wintypes.LPCWSTR], H
    k.AssignProcessToJobObject.argtypes = [H, H]
    k.IsProcessInJob.argtypes = [H, H, ctypes.POINTER(wintypes.BOOL)]
    k.SetInformationJobObject.argtypes = [H, ctypes.c_int, ctypes.c_void_p, D]
    k.GetProcessTimes.argtypes = [H, ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p]
    k.CreateToolhelp32Snapshot.argtypes, k.CreateToolhelp32Snapshot.restype = [D, D], H
    k.Process32FirstW.argtypes = k.Process32NextW.argtypes = [H, ctypes.c_void_p]
    ctypes.windll.psapi.GetProcessMemoryInfo.argtypes = [H, ctypes.c_void_p, D]
    _firmas_listas = True


def _crear_job():
    _firmas()
    return ctypes.windll.kernel32.CreateJobObjectW(None, None) or None


def _fijar_limites(job, cpu_pct: int, ram_mb: int, baja_prioridad: bool) -> bool:
    """Escribe en el job el tope de CPU (porcentaje del total, duro), el de RAM (0 = sin tope) y la prioridad. Devuelve False si Windows lo rechaza."""
    _firmas()
    k = ctypes.windll.kernel32
    ext = _EXTENDED_LIMIT()
    flags = JOB_OBJECT_LIMIT_PRIORITY_CLASS      # siempre fijada: al quitar los topes los procesos vuelven a prioridad normal, no se quedan en baja
    ext.BasicLimitInformation.PriorityClass = BELOW_NORMAL_PRIORITY_CLASS if baja_prioridad else NORMAL_PRIORITY_CLASS
    if ram_mb > 0:
        flags |= JOB_OBJECT_LIMIT_JOB_MEMORY
        ext.JobMemoryLimit = ram_mb * 2**20
    ext.BasicLimitInformation.LimitFlags = flags
    ok = bool(k.SetInformationJobObject(job, _CLASE_LIMITE_EXTENDIDO, ctypes.byref(ext), ctypes.sizeof(ext)))
    cpu = _CPU_RATE_INFO()
    cpu.ControlFlags = JOB_OBJECT_CPU_RATE_CONTROL_ENABLE | JOB_OBJECT_CPU_RATE_CONTROL_HARD_CAP
    cpu.CpuRate = max(1, min(100, cpu_pct)) * 100        # en centésimas de por ciento del TOTAL de la CPU (todos los núcleos); 10000 = 100 %, o sea, sin tope
    return ok and bool(k.SetInformationJobObject(job, _CLASE_TASA_CPU, ctypes.byref(cpu), ctypes.sizeof(cpu)))


def _meter_pid(job, pid: int) -> bool:
    """Mete un proceso en el job. Falla (False) si ya no existe, no es nuestro o está en otro job incompatible."""
    _firmas()
    k = ctypes.windll.kernel32
    p = k.OpenProcess(PROCESS_SET_QUOTA | PROCESS_TERMINATE, False, pid)
    if not p:
        return False
    try:
        ya = wintypes.BOOL()
        if k.IsProcessInJob(p, job, ctypes.byref(ya)) and ya.value:
            return True                               # ya estaba en este job (de una aplicación anterior): Windows rechazaría asignarlo otra vez
        return bool(k.AssignProcessToJobObject(job, p))
    finally:
        k.CloseHandle(p)


def pids_ollama() -> List[int]:
    """PIDs de los procesos de Ollama (servidor y sus «runner» de modelos), por nombre de ejecutable, con una foto de los procesos de Windows."""
    if not WINDOWS:
        return []

    class _PE(ctypes.Structure):
        _fields_ = [("dwSize", wintypes.DWORD), ("cntUsage", wintypes.DWORD), ("th32ProcessID", wintypes.DWORD), ("th32DefaultHeapID", ctypes.c_size_t),
                    ("th32ModuleID", wintypes.DWORD), ("cntThreads", wintypes.DWORD), ("th32ParentProcessID", wintypes.DWORD), ("pcPriClassBase", wintypes.LONG),
                    ("dwFlags", wintypes.DWORD), ("szExeFile", wintypes.WCHAR * 260)]

    _firmas()
    k = ctypes.windll.kernel32
    snap = k.CreateToolhelp32Snapshot(0x2, 0)
    if snap is None or snap == ctypes.c_void_p(-1).value:
        return []
    pids = []
    try:
        e = _PE()
        e.dwSize = ctypes.sizeof(e)
        ok = k.Process32FirstW(snap, ctypes.byref(e))
        while ok:
            nombre = e.szExeFile.lower()
            if nombre.startswith("ollama") and nombre.endswith(".exe") and nombre != "ollama app.exe":
                pids.append(int(e.th32ProcessID))
            ok = k.Process32NextW(snap, ctypes.byref(e))
    finally:
        k.CloseHandle(snap)
    return pids


def aplicar(a: Optional[dict] = None) -> dict:
    """Aplica los topes guardados: crea (una vez) el job, mete en él este backend y los procesos de Ollama que ya corran, y escribe los límites.
    Con el perfil máximo o sin elegir el job queda sin límites (un proceso no puede salir de un job, pero un job sin límites no hace nada).
    Devuelve {"activo", "ollama_adoptado", "error"}."""
    global _job
    a = _ajustes(a)
    resultado = {"activo": False, "ollama_adoptado": 0, "error": ""}
    if not WINDOWS:
        return resultado
    activo = limitando(a)
    with _job_lock:
        if _job is None:
            if not activo:
                return resultado                      # nada que limitar y aún no hay job: no se crea
            _job = _crear_job()
            if _job is None:
                resultado["error"] = "Windows no permitió crear el límite de recursos."
                return resultado
            if not _meter_pid(_job, os.getpid()):
                resultado["error"] = "No se pudo aplicar el límite a este proceso (ya está dentro de otro límite de Windows)."
        ram = max(MIN_RAM_MB, a["limite_ram_mb"]) if activo and a["limite_ram_mb"] > 0 else 0
        cpu = max(MIN_CPU, min(100, a["limite_cpu"])) if activo else 100
        if not _fijar_limites(_job, cpu, ram, baja_prioridad=activo):
            resultado["error"] = resultado["error"] or "Windows rechazó los límites."
        if activo:
            resultado["ollama_adoptado"] = sum(1 for pid in pids_ollama() if _meter_pid(_job, pid))
        resultado["activo"] = activo and not resultado["error"]
    return resultado


def adoptar_proceso(pid: int) -> bool:
    """Mete en el job un proceso recién lanzado (p. ej. el Ollama que arranca el backend si no heredó el job)."""
    with _job_lock:
        return bool(WINDOWS and _job and _meter_pid(_job, pid))


_ollama_propio = False      # ¿lo lanzó este backend (con nuestro entorno)? Si no, sus variables de entorno no son las nuestras


def marcar_ollama_propio(valor: bool = True) -> None:
    global _ollama_propio
    _ollama_propio = valor


def ollama_ajeno() -> bool:
    """¿Corre un Ollama que no lanzó este backend? Los topes de CPU/RAM sí se le aplican (se adopta en el job), pero no nuestras variables de entorno:
    para eso hay que reiniciarlo con `reiniciar_ollama`."""
    return bool(pids_ollama()) and not _ollama_propio


def reiniciar_ollama() -> bool:
    """Cierra Ollama (la app de bandeja incluida, que si no lo relanzaría sin límites) y lo lanza el backend con los topes y variables. True si responde."""
    if not WINDOWS:
        return False
    import ollama_service
    for exe in ("ollama app.exe", "ollama.exe", "ollama_llama_server.exe"):
        subprocess.run(["taskkill", "/F", "/IM", exe], capture_output=True, creationflags=0x08000000)
    limite = time.monotonic() + 10
    while time.monotonic() < limite and ollama_service.is_ollama_running(timeout=0.5):
        time.sleep(0.4)
    return ollama_service.ensure_ollama_running()


# ───────────────────────── Medidor ─────────────────────────

class _FILETIME(ctypes.Structure):
    _fields_ = [("lo", wintypes.DWORD), ("hi", wintypes.DWORD)]


class _PMC(ctypes.Structure):
    _fields_ = [("cb", wintypes.DWORD), ("PageFaultCount", wintypes.DWORD), ("PeakWorkingSetSize", ctypes.c_size_t), ("WorkingSetSize", ctypes.c_size_t),
                ("QuotaPeakPagedPoolUsage", ctypes.c_size_t), ("QuotaPagedPoolUsage", ctypes.c_size_t), ("QuotaPeakNonPagedPoolUsage", ctypes.c_size_t),
                ("QuotaNonPagedPoolUsage", ctypes.c_size_t), ("PagefileUsage", ctypes.c_size_t), ("PeakPagefileUsage", ctypes.c_size_t)]


def _ft(f: _FILETIME) -> int:
    return (f.hi << 32) | f.lo


def _info_proceso(pid: int):
    """(tiempo de CPU en 100 ns, memoria de trabajo en bytes) de un proceso, o None."""
    _firmas()
    k = ctypes.windll.kernel32
    p = k.OpenProcess(PROCESS_QUERY_LIMITED, False, pid)
    if not p:
        return None
    try:
        c, e, ker, usr = _FILETIME(), _FILETIME(), _FILETIME(), _FILETIME()
        if not k.GetProcessTimes(p, ctypes.byref(c), ctypes.byref(e), ctypes.byref(ker), ctypes.byref(usr)):
            return None
        m = _PMC()
        m.cb = ctypes.sizeof(m)
        mem = m.WorkingSetSize if ctypes.windll.psapi.GetProcessMemoryInfo(p, ctypes.byref(m), m.cb) else 0
        return _ft(ker) + _ft(usr), mem
    finally:
        k.CloseHandle(p)


_ult_medida = {"t": 0.0, "cpu": 0, "sis": None}


def medir() -> dict:
    """Uso actual de la app (backend + Ollama) y del equipo. El % de CPU es el del TOTAL del equipo desde la última medición (la primera vale 0).
    Solo se llama mientras Ajustes está abierto: no hay un hilo midiendo siempre."""
    hw = detectar_hardware()
    mem = memoria_mb()
    yo = [os.getpid()]
    ollama = pids_ollama()
    cpu_total = 0
    ram_app = ram_ollama = 0
    for pid in yo + ollama:
        info = _info_proceso(pid)
        if info:
            cpu_total += info[0]
            if pid in ollama:
                ram_ollama += info[1]
            else:
                ram_app += info[1]
    ahora = time.monotonic()
    pct = 0.0
    if _ult_medida["t"]:
        dt = ahora - _ult_medida["t"]
        if dt > 0:
            pct = max(0.0, min(100.0, (cpu_total - _ult_medida["cpu"]) / 1e7 / dt / hw["nucleos"] * 100))
    _ult_medida.update(t=ahora, cpu=cpu_total)
    return {"cpu_app_pct": round(pct, 1), "ram_backend_mb": ram_app // 2**20, "ram_ollama_mb": ram_ollama // 2**20,
            "ram_libre_mb": mem["libre"], "ram_total_mb": mem["total"]}


# ───────────────────────── Vigilancia de la RAM ─────────────────────────

_estado_pausa = {"pausada": False, "motivo": "", "desde": 0.0}
_pausa_lock = threading.Lock()
UMBRAL_PAUSA_MB = {"ligero": 700, "equilibrado": 450}     # RAM libre por debajo de la que se descarga el modelo y se pausa la IA; se reanuda al doble
ESPERA_MAX_PAUSA = 180.0                                  # segundos que una tarea de IA espera a que haya recursos antes de seguir sin el modelo


def ia_pausada() -> bool:
    return _estado_pausa["pausada"]


def estado_pausa() -> dict:
    with _pausa_lock:
        return dict(_estado_pausa)


def _descargar_modelo() -> None:
    """Pide a Ollama que suelte el modelo ya (keep_alive 0) para devolver la RAM."""
    try:
        import ollama_service
        modelo = ollama_service.get_best_llm_model()
        req = urllib.request.Request("http://127.0.0.1:11434/api/generate", data=json.dumps({"model": modelo, "keep_alive": 0}).encode("utf-8"),
                                     headers={"Content-Type": "application/json"})
        ollama_service._SIN_PROXY.open(req, timeout=5).read()
    except Exception:
        pass


def revisar_ram(a: Optional[dict] = None, libre_mb: Optional[int] = None, descargar=_descargar_modelo) -> dict:
    """Una vuelta de la vigilancia (separada del hilo para poder probarla). Pausa la IA si la RAM libre cae por debajo del umbral del perfil
    y la reanuda cuando recupera el doble. Sin límites activos no hace nada y quita cualquier pausa."""
    a = _ajustes(a)
    umbral = UMBRAL_PAUSA_MB["ligero" if a["perfil"] == "ligero" or (a["perfil"] != "equilibrado" and a["limite_cpu"] <= 50) else "equilibrado"]
    libre = memoria_mb()["libre"] if libre_mb is None else libre_mb
    pausar = False
    with _pausa_lock:
        if not limitando(a) or not libre:
            _estado_pausa.update(pausada=False, motivo="", desde=0.0)
        elif not _estado_pausa["pausada"] and libre < umbral:
            _estado_pausa.update(pausada=True, desde=time.time(), motivo=f"Queda poca memoria libre ({libre} MB): la IA se ha pausado y se retoma sola.")
            pausar = True
        elif _estado_pausa["pausada"] and libre >= umbral * 2:
            _estado_pausa.update(pausada=False, motivo="", desde=0.0)
        resultado = dict(_estado_pausa)
    if pausar:
        descargar()
    return resultado


def esperar_recursos(maximo: float = ESPERA_MAX_PAUSA, dormir=time.sleep) -> bool:
    """Bloquea mientras la IA esté pausada por falta de RAM, hasta `maximo` s. True si se puede seguir; False si se agotó la espera."""
    limite = time.monotonic() + maximo
    while ia_pausada():
        if time.monotonic() >= limite:
            return False
        dormir(2.0)
    return True


def vigilar(cada: float = 10.0) -> threading.Thread:
    """Hilo demonio que revisa la RAM libre cada `cada` s. Barato: una llamada a GlobalMemoryStatusEx; solo actúa si hay límites activos."""
    def bucle():
        while True:
            try:
                revisar_ram()
            except Exception as e:
                print(f"[Recursos] {e}")
            time.sleep(cada)
    hilo = threading.Thread(target=bucle, daemon=True, name="vigilante-de-ram")
    hilo.start()
    return hilo


def estado() -> dict:
    """Todo lo que la interfaz necesita para la sección de rendimiento (sin la medición en vivo)."""
    hw = detectar_hardware()
    a = ajustes.leer()
    return {"hardware": hw, "perfil_sugerido": perfil_sugerido(hw), "perfiles": {p: valores_perfil(p, hw) for p in PERFILES_VALIDOS},
            "min_ram_mb": MIN_RAM_MB, "min_cpu": MIN_CPU, "pausa": estado_pausa(), "limitando": limitando(a), "soporta_topes": WINDOWS}
