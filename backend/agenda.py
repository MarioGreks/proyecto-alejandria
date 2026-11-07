"""Agenda de contactos: quién es cada uno, cómo localizarlo y, sobre todo, para qué lo apuntaste («qué necesito de este contacto en el futuro»).

PRIVADA y solo local: vive en <carpeta de datos>/agenda.json. No entra en la sincronización entre PCs (sincronizacion.py solo mira raw/ y las
conexiones), ni en el archivo de neuronas que se exporta, ni en el repositorio (backend/data/ está en .gitignore). Para pasarla a otro equipo hay un
exportar / importar propio (importar añade los contactos con un id nuevo y no pisa los que ya tienes).
"""
import json
import os
import re
import threading
import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from database import DATA_DIR

FORMATO = "alejandria-agenda"
VERSION = 1
MAX_CONTACTOS = 10000
TIPOS = ("Académico", "Corporativo", "Otro")
ID_VALIDO = re.compile(r"[\w-]+")
_CORREO = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")
_cerrojo = threading.RLock()


class ArchivoInvalido(ValueError):
    pass


class Contacto(BaseModel):
    """Lo que escribe el usuario. Los espacios de los extremos se quitan."""
    model_config = ConfigDict(str_strip_whitespace=True)
    quien: str = Field(min_length=1, max_length=200)                  # quién es / de quién es
    telefono: str = Field("", max_length=60)
    correo: str = Field("", max_length=200)
    tipo: Literal["Académico", "Corporativo", "Otro"]
    tipo_otro: str = Field("", max_length=60)                         # solo con tipo «Otro»
    necesito: str = Field(min_length=1, max_length=2000)             # qué necesito de este contacto en el futuro

    @model_validator(mode="after")
    def coherente(self):
        if not self.telefono and not self.correo:
            raise ValueError("Pon al menos un teléfono o un correo.")
        if self.correo and not _CORREO.fullmatch(self.correo):
            raise ValueError("El correo no parece válido.")
        if self.tipo == "Otro" and not self.tipo_otro:
            raise ValueError("En «Otro», escribe qué tipo de contacto es.")
        if self.tipo != "Otro":
            self.tipo_otro = ""
        return self


def _ruta() -> str:
    return os.path.join(DATA_DIR, "agenda.json")


def _ahora() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _leer() -> list:
    """Los contactos guardados. Un archivo ausente es una agenda vacía; uno ilegible lanza ValueError (y NO se sobrescribe: sería perder los contactos)."""
    try:
        with open(_ruta(), encoding="utf-8") as f:
            c = json.load(f)
    except FileNotFoundError:
        return []
    except (OSError, ValueError) as e:
        raise ValueError(f"No se pudo leer agenda.json ({e}). No se ha tocado: arréglalo o muévelo antes de seguir.")
    if not isinstance(c, dict) or c.get("formato") != FORMATO or not isinstance(c.get("contactos"), list):
        raise ValueError("agenda.json no tiene el formato esperado. No se ha tocado.")
    return c["contactos"]


def _guardar(contactos: list) -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    tmp = _ruta() + ".tmp"      # atómico: un corte a mitad no deja la agenda a medias
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump({"formato": FORMATO, "version": VERSION, "contactos": contactos}, f, ensure_ascii=False, indent=1)
    os.replace(tmp, _ruta())


def listar() -> list:
    with _cerrojo:
        return sorted(_leer(), key=lambda c: str(c.get("quien", "")).lower())


def crear(entrada: Contacto) -> dict:
    with _cerrojo:
        contactos = _leer()
        if len(contactos) >= MAX_CONTACTOS:
            raise ValueError(f"La agenda está llena (máximo {MAX_CONTACTOS} contactos).")
        c = {"id": uuid.uuid4().hex, **entrada.model_dump(), "creado": _ahora(), "modificado": _ahora()}
        contactos.append(c)
        _guardar(contactos)
        return c


def editar(contacto_id: str, entrada: Contacto) -> Optional[dict]:
    with _cerrojo:
        contactos = _leer()
        for i, c in enumerate(contactos):
            if c.get("id") == contacto_id:
                contactos[i] = {**entrada.model_dump(), "id": contacto_id, "creado": c.get("creado", _ahora()), "modificado": _ahora()}
                _guardar(contactos)
                return contactos[i]
        return None


def borrar(contacto_id: str) -> bool:
    with _cerrojo:
        contactos = _leer()
        resto = [c for c in contactos if c.get("id") != contacto_id]
        if len(resto) == len(contactos):
            return False
        _guardar(resto)
        return True


def exportar() -> dict:
    with _cerrojo:
        return {"formato": FORMATO, "version": VERSION, "contactos": _leer()}


def importar(contenido) -> dict:
    """Añade los contactos del archivo cuyo id aún no tengas (los que ya tienes no se pisan). Los que no pasan la validación se cuentan aparte.
    Lanza ArchivoInvalido, sin haber escrito nada, si el archivo no es una agenda de Alejandría."""
    if not isinstance(contenido, dict) or contenido.get("formato") != FORMATO:
        raise ArchivoInvalido("No es un archivo de agenda de Alejandría.")
    if contenido.get("version") != VERSION:
        raise ArchivoInvalido(f"Versión de archivo no soportada: {contenido.get('version')!r}.")
    entrantes = contenido.get("contactos")
    if not isinstance(entrantes, list):
        raise ArchivoInvalido("El archivo está incompleto.")
    if len(entrantes) > MAX_CONTACTOS:
        raise ArchivoInvalido(f"Demasiados contactos (máximo {MAX_CONTACTOS}).")
    with _cerrojo:
        contactos = _leer()
        ids = {c.get("id") for c in contactos}
        añadidos = omitidos = invalidos = 0
        for e in entrantes:
            try:
                if not isinstance(e, dict):
                    raise ValueError("no es un contacto")
                datos = Contacto(**{k: e.get(k, "") for k in ("quien", "telefono", "correo", "tipo", "tipo_otro", "necesito")})
            except ValueError:      # incluye ValidationError de pydantic
                invalidos += 1
                continue
            cid = e.get("id") if isinstance(e.get("id"), str) and ID_VALIDO.fullmatch(e["id"]) else uuid.uuid4().hex
            if cid in ids or len(contactos) >= MAX_CONTACTOS:
                omitidos += 1
                continue
            contactos.append({"id": cid, **datos.model_dump(), "creado": e.get("creado") if isinstance(e.get("creado"), str) else _ahora(), "modificado": _ahora()})
            ids.add(cid)
            añadidos += 1
        if añadidos:
            _guardar(contactos)
        return {"añadidos": añadidos, "omitidos": omitidos, "invalidos": invalidos}
