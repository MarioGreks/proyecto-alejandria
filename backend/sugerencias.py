"""Temas relacionados sugeridos: cada neurona puede traer en su JSON `"sugerencias": [{"nombre": ..., "motivo": ...}]` (las escribe la IA externa al crearla o al
revisarla). Qué sugerencia se enseña depende de qué neuronas existen, y eso se decide en la interfaz al pintar el panel (utils/sugerencias.ts), no aquí: así una
sugerencia desaparece sola en cuanto creas la neurona. Aquí solo vive lo que se guarda: descartar una sugerencia, que queda marcada en el JSON (viaja con la
sincronización y evita que una revisión posterior de la IA la vuelva a traer).
"""
from database import db_conn
from limpieza import clave_tema, normalizar_sugerencias
from papelera import ID_VALIDO, _guardar, _leer


def descartar(node_id: str, nombre: str) -> bool:
    """Marca como descartada esa sugerencia de una neurona viva. False si la neurona no existe (o está en la papelera) o no tiene esa sugerencia sin descartar."""
    if not ID_VALIDO.fullmatch(str(node_id)):
        return False
    datos = _leer(node_id)
    if datos is None or datos.get("papelera"):
        return False
    clave, hallada = clave_tema(nombre), False
    lista = normalizar_sugerencias(datos.get("sugerencias"))
    for s in lista:
        if clave_tema(s["nombre"]) == clave and not s.get("descartada"):
            s["descartada"] = True
            hallada = True
    if not hallada:
        return False
    datos["sugerencias"] = normalizar_sugerencias(lista)
    _guardar(node_id, datos)
    db_conn.compile_raw_jsons(force=True)
    return True
