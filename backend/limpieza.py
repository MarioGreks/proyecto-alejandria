"""Limpieza de las marcas de cita que dejan las IA con búsqueda web dentro de los textos de una neurona.

DeepSeek escribe «...fórmula de Stirling[reference:25].», ChatGPT «:contentReference[oaicite:0]{index=0}» o «【4†fuente】», Gemini
«[cite_start]... [cite: 1, 2]». Fuera de su chat no apuntan a nada: las fuentes de verdad van en el array `referencias`.
La misma lista está en frontend/src/utils/markdown.tsx (`limpiarCitas`), que limpia también al pintar las neuronas antiguas.
"""
import re
import unicodedata
from typing import List

TIPOS = ("formal", "historico", "teorico")

_MARCAS = [
    r":?contentReference\[oaicite:\d+\]\{index=\d+\}",
    r"\[oaicite:\d+\]",
    r"\[cite_start\]",
    r"\[(?:ref|refs|reference|references|cite|citation)(?:[:_\s-][^\]\n]{0,40})?\](?!\()",   # (?!\() respeta un enlace [ref](url)
    r"【[^】\n]{0,80}】",
    r"[^]{0,200}",
]
_PATRON = re.compile(r"[ \t]*(?:" + "|".join(_MARCAS) + r")", re.IGNORECASE)

# Campos de texto que se leen en el panel. No se tocan id, nombre, cluster, url ni el código del laboratorio
# (en Python, `x[ref]` o `d["cite"]` son código válido).
_CAMPOS_TEXTO = ("teoria", "explicacion", "enunciado", "solucion", "definicion", "termino", "nota", "titulo", "autores")


def tipo_de(datos: dict) -> str:
    """Tipo de una neurona: formal, historico o teorico. Si el JSON lo trae (con o sin tildes) se respeta; si no (neuronas anteriores al campo, o del prompt
    formal clásico) se infiere: con laboratorio ⇒ formal; sin laboratorio pero con ejercicios (casos de análisis) ⇒ teórico; sin ninguno ⇒ histórico."""
    t = datos.get("tipo")
    if isinstance(t, str):
        t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().strip().lower()
        if t in TIPOS:
            return t
    lab = datos.get("laboratorio")
    if isinstance(lab, dict) and str(lab.get("codigo") or "").strip():
        return "formal"
    return "teorico" if datos.get("ejercicios") else "historico"


def limpiar_texto(texto: str) -> str:
    return _PATRON.sub("", texto) if isinstance(texto, str) else texto


def limpiar_neurona(datos: dict) -> int:
    """Quita las marcas de cita de los textos de una neurona (en el sitio). Devuelve cuántos campos cambió."""
    cambios = 0

    def limpiar(obj):
        nonlocal cambios
        if isinstance(obj, dict):
            for k, v in obj.items():
                if k in _CAMPOS_TEXTO and isinstance(v, str):
                    nuevo = limpiar_texto(v)
                    if nuevo != v:
                        obj[k] = nuevo
                        cambios += 1
                elif isinstance(v, (dict, list)) and k != "controles":
                    limpiar(v)
        elif isinstance(obj, list):
            for v in obj:
                limpiar(v)

    limpiar(datos)
    return cambios


# Subredes: su nombre y la lista que lleva cada neurona. Viven aquí (y no en subredes.py) porque database.py también las necesita y subredes.py importa database.
MAX_NOMBRE = 60
MAX_POR_NEURONA = 30


def normalizar(nombre) -> str:
    """Nombre limpio: sin espacios de más y con un máximo de longitud. Vacío si no es un texto usable."""
    return " ".join(nombre.split())[:MAX_NOMBRE].strip() if isinstance(nombre, str) else ""


def normalizar_lista(valor) -> List[str]:
    """Lo que trae un JSON (de la IA, de un archivo importado) en `subredes`, saneado: solo textos, sin repetidos (mayúsculas aparte), ordenado."""
    if not isinstance(valor, list):
        return []
    vistos = {}
    for v in valor:
        n = normalizar(v)
        if n:
            vistos.setdefault(n.casefold(), n)
    return sorted(vistos.values(), key=str.casefold)[:MAX_POR_NEURONA]
