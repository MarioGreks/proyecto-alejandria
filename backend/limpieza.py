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


# Temas relacionados sugeridos: `"sugerencias": [{"nombre": "Modelo de Gompertz", "motivo": "...", "descartada": true?}]`. Las que el usuario descarta se quedan con
# `descartada` para que una revisión posterior de la IA no las vuelva a traer; solo las no descartadas llegan al panel.
MAX_SUGERENCIAS = 5          # sin descartar, por neurona
MAX_DESCARTADAS = 30
MAX_TEMA = 80
MAX_MOTIVO = 160


def clave_tema(nombre) -> str:
    """Nombre comparable: sin tildes, mayúsculas ni espacios de más."""
    s = unicodedata.normalize("NFKD", str(nombre)).encode("ascii", "ignore").decode()
    return " ".join(s.split()).casefold()


def normalizar_sugerencias(valor) -> List[dict]:
    """Lo que trae un JSON (de la IA, de un archivo) en `sugerencias`, saneado: solo objetos con nombre (o textos sueltos), sin repetidos, con nombre y motivo
    acotados y un máximo de MAX_SUGERENCIAS activas. Si un tema aparece repetido y una de las copias está descartada, queda descartado."""
    if not isinstance(valor, list):
        return []
    vistos = {}
    for v in valor:
        if isinstance(v, str):
            v = {"nombre": v}
        if not isinstance(v, dict) or not isinstance(v.get("nombre"), str):
            continue
        nombre = " ".join(v["nombre"].split())[:MAX_TEMA].strip()
        if not nombre:
            continue
        motivo = " ".join(v["motivo"].split())[:MAX_MOTIVO].strip() if isinstance(v.get("motivo"), str) else ""
        k = clave_tema(nombre)
        previa = vistos.get(k)
        descartada = v.get("descartada") is True or bool(previa and previa.get("descartada"))
        item = {"nombre": previa["nombre"] if previa else nombre, "motivo": (previa or {}).get("motivo") or motivo}
        if descartada:
            item["descartada"] = True
        vistos[k] = item
    out, activas, descartadas = [], 0, 0
    for item in vistos.values():
        if item.get("descartada"):
            descartadas += 1
            if descartadas > MAX_DESCARTADAS:
                continue
        else:
            activas += 1
            if activas > MAX_SUGERENCIAS:
                continue
        out.append(item)
    return out


def activas(sugerencias) -> List[dict]:
    """Las sugerencias que se enseñan: las no descartadas."""
    return [s for s in normalizar_sugerencias(sugerencias) if not s.get("descartada")]


def fusionar_sugerencias(previas, nuevas) -> List[dict]:
    """Las `nuevas` (de un JSON revisado) mandan, pero lo que el usuario descartó antes sigue descartado y no se pierde."""
    descartadas = {clave_tema(s["nombre"]): s for s in normalizar_sugerencias(previas) if s.get("descartada")}
    fusion = [dict(descartadas[clave_tema(s["nombre"])]) if clave_tema(s["nombre"]) in descartadas else s for s in normalizar_sugerencias(nuevas)]
    return normalizar_sugerencias(fusion + list(descartadas.values()))


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
