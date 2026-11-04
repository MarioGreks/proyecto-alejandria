"""Limpieza de las marcas de cita que dejan las IA con búsqueda web dentro de los textos de una neurona.

DeepSeek escribe «...fórmula de Stirling[reference:25].», ChatGPT «:contentReference[oaicite:0]{index=0}» o «【4†fuente】», Gemini
«[cite_start]... [cite: 1, 2]». Fuera de su chat no apuntan a nada: las fuentes de verdad van en el array `referencias`.
La misma lista está en frontend/src/utils/markdown.tsx (`limpiarCitas`), que limpia también al pintar las neuronas antiguas.
"""
import re

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
