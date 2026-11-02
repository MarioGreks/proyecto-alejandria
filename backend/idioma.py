"""Idioma en el que escribe la IA local (Ollama). Hoy solo castellano; para añadir otro, una entrada aquí y su equivalente en frontend/src/utils/prompts.ts."""

IDIOMA = "es"

INSTRUCCION = {
    "es": "Escribe en castellano de España: ortografía y vocabulario de España, sin voseo ni giros latinoamericanos.",
}


def instruccion() -> str:
    return INSTRUCCION[IDIOMA]
