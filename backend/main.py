import re
import threading
from contextlib import asynccontextmanager
from typing import Literal, Optional, Union
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator, model_validator
import ajustes
import vigilante
import intercambio
import sincronizacion
import papelera
import agenda
import subredes
import sugerencias
from database import db_conn, Concepto, DATA_DIR
from ollama_service import arrancar_en_segundo_plano, get_ollama_path, is_ollama_running, get_available_models, licencia_restrictiva

APP_VERSION = "0.7.2"   # la misma que frontend/src-tauri/tauri.conf.json

@asynccontextmanager
async def lifespan(_app):
    startup_event()
    yield

app = FastAPI(title="Proyecto Alejandría Backend (Parquet + Ollama)", lifespan=lifespan)

# Solo la propia app (Vite en dev, Tauri empaquetado) puede hablar con el Backend: otras webs abiertas en el navegador no deben poder escribir en tus datos.
ALLOWED_ORIGINS = [
    "http://localhost:1420", "http://127.0.0.1:1420",
    "tauri://localhost", "http://tauri.localhost", "https://tauri.localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DNS rebinding: una web con un dominio que apunta a 127.0.0.1 sería "mismo origen" y leería los GET sin enviar Origin; el Host delata el dominio.
HOST_LOCAL = re.compile(r"(127\.0\.0\.1|localhost|\[::1\])(:\d+)?")

class BloquearOrigenesAjenos:
    """CORS solo impide LEER la respuesta; un POST "simple" (text/plain) se ejecutaría igual. Lo cortamos aquí.
    Middleware ASGI puro: el de @app.middleware("http") copia cada respuesta por streams y añadía ~20 ms con 100 KB."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            cabeceras = dict(scope["headers"])
            origin = cabeceras.get(b"origin")
            if origin is not None and origin.decode("latin-1") not in ALLOWED_ORIGINS:
                await JSONResponse({"detail": "Origen no permitido"}, status_code=403)(scope, receive, send)
                return
            if not HOST_LOCAL.fullmatch(cabeceras.get(b"host", b"").decode("latin-1").lower()):
                await JSONResponse({"detail": "Host no permitido"}, status_code=403)(scope, receive, send)
                return
        await self.app(scope, receive, send)

app.add_middleware(BloquearOrigenesAjenos)

def _tras_sincronizar(neuronas: bool, aristas: bool):
    """Lo que hay que rehacer en local cuando la sincronización cambia archivos: la base compilada y las conexiones que se quedaron sin neurona."""
    if neuronas:
        db_conn.compile_raw_jsons(force=True)
        db_conn.quitar_aristas_huerfanas()

servicio_sync = sincronizacion.Servicio(DATA_DIR, ajustes.leer, _tras_sincronizar)

def startup_event():
    """Al iniciar el backend, arranca Ollama en segundo plano automáticamente para que los LLM internos funcionen de inmediato."""
    padre = os.environ.get("ALEJANDRIA_PADRE")      # la app que me lanzó: si muere sin avisar, me cierro (no quedar huérfano)
    if padre and padre.isdigit():
        vigilante.vigilar_padre(int(padre))
    try:
        papelera.purgar_caducadas()                 # las neuronas que llevan más de 7 días en la papelera se borran de verdad
    except Exception as e:
        print(f"[Papelera] {e}")
    servicio_sync.iniciar_auto()                    # sincronización entre PCs, si hay carpeta elegida en Ajustes
    print(f"[Alejandria] Ollama: {arrancar_en_segundo_plano()}")     # sin esperar: el backend responde al momento y Ollama se levanta detrás

@app.get("/")
def read_root():
    return {"message": "Bienvenido al Backend de Proyecto Alejandría"}

@app.get("/status")
def get_db_status():
    ollama_ok = is_ollama_running()
    try:
        db_conn.test_connection()
        return {
            "status": "ok", 
            "db": "Conectado y leyendo almacenamiento Parquet local",
            "ollama": "activo" if ollama_ok else "inactivo",
            "modelos_llm": get_available_models() if ollama_ok else []
        }
    except Exception as e:
        return {
            "status": "error", 
            "db": str(e), 
            "ollama": "activo" if ollama_ok else "inactivo"
        }

@app.get("/api/universe")
def get_universe():
    """Devuelve la lista de nodos reales de la BD para que el frontend los posicione."""
    return {
        "nodes": db_conn.get_universe_metadata(),
        "links": db_conn.get_links_metadata()
    }

class _Sinapsis:
    """Estado de la búsqueda de conexiones, para que la interfaz enseñe que se está trabajando (cada neurona tarda ~1 min)."""
    def __init__(self):
        self.lock, self.trabajos = threading.Lock(), 0
        self.estado = {"activo": False, "nodo": None, "hecho": 0, "total": 0, "conexiones": 0}

    def empezar(self, nodo):
        with self.lock:
            self.trabajos += 1
            self.estado.update(activo=True, nodo=nodo, hecho=0, total=0, conexiones=0)

    def avance(self, nodo):
        def actualizar(hecho, total, conexiones):
            with self.lock:
                self.estado.update(activo=True, nodo=nodo, hecho=hecho, total=total, conexiones=conexiones)
        return actualizar

    def terminar(self, conexiones=None):
        """`conexiones`: aristas que dejó el trabajo (incluida la de afinidad), para el aviso final de la interfaz."""
        with self.lock:
            self.trabajos -= 1
            if conexiones is not None:
                self.estado["conexiones"] = conexiones
            if self.trabajos <= 0:
                self.estado["activo"] = False

    def leer(self):
        with self.lock:
            return dict(self.estado)

sinapsis = _Sinapsis()

@app.get("/api/sinapsis/estado")
def estado_sinapsis():
    return sinapsis.leer()

regeneracion_en_curso = threading.Lock()

@app.post("/api/regenerar_aristas")
def regenerar_aristas_endpoint(background_tasks: BackgroundTasks):
    """Reevalúa todos los nodos y añade las aristas nuevas. No borra ni pisa las existentes."""
    if not regeneracion_en_curso.acquire(blocking=False):
        raise HTTPException(status_code=409, detail="Ya hay una regeneración en curso.")

    sinapsis.empezar("todas las neuronas")

    def job():
        try:
            from clasificador import regenerar_aristas
            print(f"Regeneración de aristas terminada: {regenerar_aristas(db_conn)} propuestas.")
        except Exception as e:
            print("Error fatal en regeneración de aristas:", e)
        finally:
            sinapsis.terminar()
            regeneracion_en_curso.release()

    background_tasks.add_task(job)
    return {"status": "Iniciando regeneración en background"}

@app.get("/node/{node_id}")
def get_node(node_id: str):
    """Obtiene los datos de un nodo (Concepto) por su ID."""
    node_data = db_conn.get_node(node_id)
    if node_data:
        return node_data
        
    # Si no existe (es un nodo decorativo aleatorio), devolvemos un placeholder
    return {
        "id": str(node_id),
        "nombre": "Conexión Inexplorada",
        "teoria": "No hay datos persistidos para este nodo en la base de datos Parquet. \n\nUtiliza el Prompt Maestro para generar el contenido JSON y guárdalo en la carpeta `data/raw/`.",
        "glosario": [],
        "ejercicios": [],
        "referencias": [],
        "laboratorio": {
            "controles": [],
            "codigo": "print('{\"x\": [], \"y\": []}')"
        }
    }

import json
import os
import re
from limpieza import fusionar_sugerencias, limpiar_neurona, normalizar_sugerencias, tipo_de

def raw_path(node_id) -> str:
    """Ruta del JSON de un nodo dentro de DATA_DIR/raw. Rechaza ids que puedan salirse de esa carpeta."""
    node_id = str(node_id)
    if not re.fullmatch(r"[\w-]+", node_id):
        raise HTTPException(status_code=400, detail="id inválido: solo letras, números, '_' y '-'.")
    return os.path.join(DATA_DIR, "raw", f"{node_id}.json")

class NodeInjectionRequest(BaseModel):
    raw_json: str
    subred: Optional[str] = None     # la subred activa al inyectar: la neurona entra en ella además de en la red general

# Comandos LaTeX que empiezan por b, f, n, r o t: sin esta lista, \theta se leería como TAB + "heta".
_LATEX_AMBIGUO = (r"bar|beta|begin|binom|big|bigg|bigl|bigr|bigcup|bigcap|bmod|boldsymbol|bot|bullet|backslash|because|breve|"
                  r"frac|forall|flat|fbox|nu|ne|neq|nabla|not|notin|ni|newline|nolimits|nsubseteq|ngeq|nleq|nmid|"
                  r"rho|right|rangle|rightarrow|rfloor|rceil|rm|"
                  r"theta|tau|times|text|textbf|textit|tan|tanh|to|top|tilde|tfrac|therefore|triangle|tag")
_ESCAPE_JSON = re.compile(
    r'\\\\|\\["/]|\\u[0-9a-fA-F]{4}'                      # ya válidos (el par \\ se consume entero para no tocar lo que sigue)
    rf'|(?P<latex>\\(?:{_LATEX_AMBIGUO})(?![A-Za-z]))'    # LaTeX que parece un escape válido
    r'|\\[bfnrt]'                                          # saltos de línea, tabulaciones...: válidos
    r'|(?P<otro>\\.)', re.DOTALL)                          # cualquier otra barra invertida: no es JSON

def _reparar_comillas_y_comas(texto: str, maximo: int = 300):
    """Las IA escriben a veces comillas dobles sin escapar dentro de un texto (sobre todo en prosa histórica con citas textuales) o se
    dejan una coma entre dos elementos. En ambos casos json.loads falla con «Expecting ',' delimiter» justo después del punto roto: se
    corrige ese punto y se vuelve a intentar, hasta `maximo` veces.
    shortcut: solo cubre ese error; con otro (p. ej. dos comillas internas seguidas, sin letra entre ellas) sigue fallando."""
    for _ in range(maximo):
        try:
            return json.loads(texto, strict=False)
        except json.JSONDecodeError as e:
            if not e.msg.startswith("Expecting ',' delimiter"):
                raise
            antes = texto[:e.pos]
            previo = antes.rstrip()
            hueco = antes[len(previo):]
            if "\n" in hueco and texto[e.pos:e.pos + 1] in '"{[' and previo[-1:] in '"}]0123456789el':
                texto = previo + "," + hueco + texto[e.pos:]            # falta una coma entre dos elementos
            elif previo.endswith('"'):
                texto = previo[:-1] + '\\"' + hueco + texto[e.pos:]     # la comilla que cerró el texto antes de tiempo era del propio texto
            else:
                raise
    return json.loads(texto, strict=False)

def cargar_json_tolerante(raw: str):
    """json.loads, y si falla por barras invertidas (las IA escriben \\lambda o \\frac sin duplicar la barra, y eso no es JSON válido)
    duplica las que no son escapes de verdad y vuelve a intentarlo. Los saltos de línea reales dentro de textos también se admiten,
    y se reparan las comillas sin escapar dentro de un texto y las comas que faltan entre elementos."""
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        reparado = _ESCAPE_JSON.sub(lambda m: "\\" + m.group(0) if (m.group("latex") or m.group("otro")) else m.group(0), raw)
        return _reparar_comillas_y_comas(reparado)

def extraer_bloque_json(raw: str) -> str:
    """Si el texto trae un bloque ```json (o ``` a secas), solo ese contenido; si no, el texto tal cual."""
    if "```json" in raw:
        match = re.search(r"```json\s*(.*?)\s*```", raw, re.DOTALL)
        if match:
            return match.group(1)
    elif "```" in raw:
        match = re.search(r"```\s*(.*?)\s*```", raw, re.DOTALL)
        if match:
            return match.group(1)
    return raw

class InterpretarJsonRequest(BaseModel):
    texto: str = Field(max_length=3_000_000)

@app.post("/api/json/interpretar")
def interpretar_json(req: InterpretarJsonRequest):
    """Lee el JSON de una neurona que el usuario pegó (con o sin bloque ```json, con las barras de LaTeX, comillas y comas que suelen romper las IA) y lo
    devuelve ya como objeto, SIN guardar nada: el editor lo enseña y el usuario decide. Es lo que usa «Pegar JSON revisado»."""
    try:
        datos = cargar_json_tolerante(extraer_bloque_json(req.texto))
    except (ValueError, TypeError) as e:
        raise HTTPException(status_code=400, detail=f"No se pudo leer el JSON: {e}")
    if not isinstance(datos, dict):
        raise HTTPException(status_code=400, detail="El JSON no es una neurona (debe ser un objeto con campos).")
    datos.pop("embedding", None)
    return {"datos": datos}

def evaluar_conexiones_bg(nuevo_id, nombre, teoria, embedding, base_de_datos, glosario=None, cluster=None):
    guardadas = None
    try:
        import numpy as np
        from clasificador import init_clasificador
        from database import db_conn
        clasificador = init_clasificador()
        vector = np.array(embedding)
        nuevas_aristas = clasificador.evaluar_conexiones(nuevo_id, nombre, teoria, vector, base_de_datos,
                                                         nuevo_glosario=glosario, progreso=sinapsis.avance(nombre), cluster_nuevo=cluster)
        if nuevas_aristas:
            db_conn.add_links(nuevas_aristas, overwrite=False)
        guardadas = len(nuevas_aristas)
    except Exception as e:
        print(f"[Fondo] Error evaluando conexiones: {e}")
    finally:
        sinapsis.terminar(guardadas)

@app.post("/api/node")
def inject_node(req: NodeInjectionRequest, background_tasks: BackgroundTasks):
    """Recibe código JSON crudo (incluso con formato Markdown de ChatGPT) y lo inyecta como una nueva neurona."""
    raw = extraer_bloque_json(req.raw_json)

    try:
        data = cargar_json_tolerante(raw)
        node_id = data.get("id")
        if not node_id:
            raise ValueError("El JSON no contiene el campo 'id'.")
        filepath = raw_path(node_id)  # valida el id antes de gastar embeddings/LLM
        limpiar_neurona(data)         # «[reference:25]» y demás marcas de cita de la IA: ni se guardan ni llegan al clasificador
        conocidas = subredes.existentes()      # lo que traiga la IA se sanea (solo textos válidos) y usa la grafía de las subredes que ya existen
        data["subredes"] = subredes.normalizar_lista([subredes.canonico(s, conocidas) for s in subredes.normalizar_lista(data.get("subredes")) + [req.subred]])
        if not data["subredes"]:
            data.pop("subredes")
        data["sugerencias"] = normalizar_sugerencias(data.get("sugerencias"))     # temas relacionados que propone la IA: se sanean (nombre y motivo acotados, sin repetidos)
        if not data["sugerencias"]:
            data.pop("sugerencias")
        data["tipo"] = tipo_de(data)  # el que fijó la IA (formal, historico o teorico) o, si no lo puso, el que se deduce de lo que trae

        # 🧠 PASO CLAVE: CLASIFICACIÓN LOCAL
        clasificador = None
        try:
            from clasificador import init_clasificador
            clasificador = init_clasificador()
        except ImportError:
            pass # Si no hay fastembed, nos saltamos la clasificación matemática
        
        # Obtenemos las categorías existentes de la base de datos (eliminando 'Desconocido' y nulos)
        df_nodes = db_conn._get_df()
        categorias_existentes = []
        base_de_datos = []
        if not df_nodes.empty:
            cats = df_nodes['cluster_id'].dropna().unique().tolist()
            categorias_existentes = [c for c in cats if c and c != "Desconocido"]
            base_de_datos = df_nodes.to_dict(orient="records")
            
        # Si tenemos el motor, pasamos por el embudo de 4 capas
        if clasificador is not None:
            resultado_clasificacion = clasificador.clasificar_neurona(
                titulo=data.get("nombre", ""),
                teoria=data.get("teoria", ""),
                base_de_datos=base_de_datos,
                categorias_disponibles=categorias_existentes if categorias_existentes else ["Física", "Matemáticas", "Economía"],
                cluster_propuesto=data.get("cluster")
            )
            
            data["cluster"] = resultado_clasificacion["cluster"]
            data["embedding"] = resultado_clasificacion["embedding"]
            data["origen"] = "ingesta_automatica"
            data["motivo_clasificacion"] = resultado_clasificacion["motivo"]
        else:
            data["cluster"] = data.get("cluster", "Desconocido")
            data["motivo_clasificacion"] = "IA Externa (Sin motor matemático local)"
            
        # Guardar en disco
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        # Forzar recarga del parquet en la base de datos local
        db_conn.compile_raw_jsons(force=True)
        
        # Enviar la evaluación de conexiones al fondo (para no bloquear la respuesta HTTP)
        if clasificador is not None and "embedding" in data:
            sinapsis.empezar(data.get("nombre", ""))
            background_tasks.add_task(
                evaluar_conexiones_bg,
                node_id,
                data.get("nombre", ""),
                data.get("teoria", ""),
                data["embedding"],
                base_de_datos,
                data.get("glosario"),
                data.get("cluster")
            )
        
        return {
            "status": "success", 
            "message": f"Neurona '{node_id}' asimilada.",
            "clasificacion": {
                "cluster": data["cluster"],
                "motivo": data["motivo_clasificacion"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al asimilar la neurona: {str(e)}")

class OpcionLab(BaseModel):
    valor: Union[float, str]
    label: Optional[str] = Field(None, max_length=80)

class ControlLab(BaseModel):
    variable: str = Field(pattern=r"^[A-Za-z_][A-Za-z0-9_]{0,39}$")
    label: str = Field(max_length=80)
    tipo: Literal["slider", "checkbox", "select"] = "slider"
    min: Optional[float] = None
    max: Optional[float] = None
    step: Optional[float] = None
    default: Union[bool, float, str]
    opciones: Optional[list[Union[float, str, OpcionLab]]] = Field(None, max_length=50)
    grupo: Optional[str] = Field(None, max_length=40)

    @model_validator(mode="after")
    def coherente(self):
        if self.tipo == "slider":
            if self.min is None or self.max is None or self.step is None:
                raise ValueError(f"'{self.variable}': un deslizable necesita min, max y step")
            if not self.min < self.max or not self.step > 0:
                raise ValueError(f"'{self.variable}': hace falta min < max y step > 0")
            if isinstance(self.default, (bool, str)) or not self.min <= self.default <= self.max:
                raise ValueError(f"'{self.variable}': el valor por defecto debe ser un número entre min y max")
        elif self.tipo == "checkbox":
            if not isinstance(self.default, bool):
                raise ValueError(f"'{self.variable}': una casilla necesita un valor por defecto true/false")
        else:
            valores = [o.valor if isinstance(o, OpcionLab) else o for o in self.opciones or []]
            if not valores or self.default not in valores:
                raise ValueError(f"'{self.variable}': un desplegable necesita opciones y un valor por defecto que esté entre ellas")
        return self

class LaboratorioGuardar(BaseModel):
    explicacion: Optional[str] = Field(None, max_length=20000)
    controles: list[ControlLab] = Field(max_length=24)
    codigo: str = Field(min_length=1, max_length=60000)

    @field_validator("controles")
    @classmethod
    def variables_unicas(cls, controles):
        nombres = [c.variable for c in controles]
        repetidas = sorted({n for n in nombres if nombres.count(n) > 1})
        if repetidas:
            raise ValueError(f"variables repetidas: {', '.join(repetidas)}")
        return controles

@app.put("/api/node/{node_id}/laboratorio")
def guardar_laboratorio(node_id: str, req: LaboratorioGuardar):
    """Guarda el laboratorio editado en la app (código y variables) dentro del JSON del nodo."""
    filepath = raw_path(node_id)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Neurona no encontrada")
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        previo = data.get("laboratorio") if isinstance(data.get("laboratorio"), dict) else {}
        lab = {"explicacion": req.explicacion if req.explicacion is not None else previo.get("explicacion", ""),
               "controles": [c.model_dump(mode="json", exclude_none=True) for c in req.controles], "codigo": req.codigo}
        data["laboratorio"] = lab
        tmp = filepath + ".tmp"   # escritura atómica: un corte a mitad no deja el JSON del nodo a medias
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, filepath)
        db_conn.compile_raw_jsons(force=True)
        return {"status": "success", "laboratorio": lab}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo guardar el laboratorio: {e}")

def _solo_http(url: str) -> str:
    if url and not re.match(r"https?://", url, re.IGNORECASE):
        raise ValueError("el enlace debe empezar por http:// o https://")
    return url

class GlosarioItem(BaseModel):
    termino: str = Field(max_length=500)
    definicion: str = Field(max_length=30000)

class EjercicioItem(BaseModel):
    enunciado: str = Field(max_length=60000)
    solucion: str = Field("", max_length=60000)

class ReferenciaItem(BaseModel):
    titulo: str = Field(min_length=1, max_length=1000)
    autores: str = Field("", max_length=1000)
    url: str = Field("", max_length=2000)
    nota: str = Field("", max_length=30000)

    @field_validator("url")
    @classmethod
    def enlace_web(cls, v):
        return _solo_http(v.strip())

class SugerenciaItem(BaseModel):
    nombre: str = Field(max_length=300)
    motivo: str = Field("", max_length=2000)

class NeuronaEditar(BaseModel):
    """Lo que se edita desde el panel. El resto del JSON de la neurona (id, clúster, laboratorio, embedding, origen...) no se toca."""
    nombre: str = Field(min_length=1, max_length=300)
    teoria: str = Field(max_length=400000)
    glosario: list[GlosarioItem] = Field(max_length=500)
    ejercicios: list[EjercicioItem] = Field(max_length=200)
    referencias: list[ReferenciaItem] = Field(max_length=500)
    tipo: Literal["formal", "historico", "teorico"]
    sugerencias: Optional[list[SugerenciaItem]] = Field(None, max_length=100)    # None = no tocar; lo descartado antes sigue descartado

    @field_validator("nombre")
    @classmethod
    def nombre_limpio(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("el nombre no puede estar vacío")
        return v

@app.put("/api/node/{node_id}")
def editar_neurona(node_id: str, req: NeuronaEditar):
    """Guarda lo editado en el panel (nombre, teoría, glosario, ejercicios, referencias y tipo) conservando el resto del JSON, limpia las marcas de cita,
    recompila la base y, si cambió el texto del que sale el embedding (nombre o teoría), lo borra para que se recalcule. Devuelve la neurona ya guardada.
    La sincronización entre PCs lo ve como una edición más (versión nueva; si otro PC la editó a la vez, la perdedora va a datos/conflictos/)."""
    filepath = raw_path(node_id)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Neurona no encontrada")
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        if data.get("papelera"):
            raise HTTPException(status_code=409, detail="La neurona está en la papelera: restáurala para editarla.")
        antes = (data.get("nombre"), data.get("teoria"))
        data["nombre"], data["teoria"], data["tipo"] = req.nombre, req.teoria, req.tipo
        data["glosario"] = [g.model_dump() for g in req.glosario]
        data["ejercicios"] = [e.model_dump() for e in req.ejercicios]
        data["referencias"] = [{k: v for k, v in r.model_dump().items() if k == "titulo" or v} for r in req.referencias]
        if req.sugerencias is not None:
            fusion = fusionar_sugerencias(data.get("sugerencias"), [s.model_dump() for s in req.sugerencias])
            if fusion:
                data["sugerencias"] = fusion
            else:
                data.pop("sugerencias", None)
        limpiar_neurona(data)
        if (data["nombre"], data["teoria"]) != antes:
            data.pop("embedding", None)        # compile_raw_jsons lo recalcula (si no hay modelo local, queda sin él hasta que lo haya)
        tmp = filepath + ".tmp"   # escritura atómica
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, filepath)
        db_conn.compile_raw_jsons(force=True)
        return db_conn.get_node(node_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo guardar la neurona: {e}")

class DescartarSugerenciaRequest(BaseModel):
    nombre: str = Field(max_length=300)

@app.post("/api/node/{node_id}/sugerencia/descartar")
def descartar_sugerencia(node_id: str, req: DescartarSugerenciaRequest):
    """El usuario descarta un tema relacionado sugerido: queda marcado en el JSON de la neurona y no vuelve."""
    raw_path(node_id)
    try:
        if not sugerencias.descartar(node_id, req.nombre):
            raise HTTPException(status_code=404, detail="Esa neurona no tiene esa sugerencia.")
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo descartar la sugerencia: {e}")

class ClusterCorrectionRequest(BaseModel):
    nuevo_cluster: str

@app.put("/api/node/{node_id}/cluster")
def corregir_cluster(node_id: str, req: ClusterCorrectionRequest):
    """Bucle de Corrección: Modifica el clúster y anota que es una corrección manual para que las matemáticas aprendan."""
    filepath = raw_path(node_id)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Neurona no encontrada")
        
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        data["cluster"] = req.nuevo_cluster
        data["origen"] = "correccion_manual"
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        db_conn.compile_raw_jsons(force=True)
        return {"status": "success", "message": f"El motor matemático ha aprendido la corrección para '{node_id}'."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AristaStatusRequest(BaseModel):
    origen_id: str
    destino_id: str
    status: Literal["pendiente", "aceptada", "rechazada"]

@app.put("/api/arista/status")
def update_arista_status(req: AristaStatusRequest):
    """Actualiza el estado de una arista (ej: 'aceptada', 'rechazada')."""
    success = db_conn.update_link_status(req.origen_id, req.destino_id, req.status)
    if success:
        return {"status": "success", "message": "Estado de arista actualizado."}
    else:
        raise HTTPException(status_code=404, detail="Arista no encontrada o error al actualizar.")

@app.get("/api/node/{node_id}/sinapsis")
def sinapsis_de_neurona(node_id: str):
    """Todas las conexiones de una neurona, también las rechazadas (el universo no las enseña): la revisión con IA externa las necesita para juzgarlas.
    Solo cuentan las vecinas vivas (no las de la papelera). Una pareja vale igual en las dos direcciones."""
    raw_path(node_id)
    nombres = dict(zip(db_conn._get_df().get("id", []), db_conn._get_df().get("nombre", [])))
    if node_id not in nombres:
        raise HTTPException(status_code=404, detail="Neurona no encontrada")
    out = []
    for a in db_conn.listar_aristas():
        if node_id not in (a.get("origen_id"), a.get("destino_id")):
            continue
        otra = a["destino_id"] if a["origen_id"] == node_id else a["origen_id"]
        if otra in nombres and otra != node_id:
            out.append({"con": otra, "nombre": nombres[otra], "estado": a.get("estado") or "pendiente", "motivo": a.get("motivo") or ""})
    return {"sinapsis": out}

class NuevaAristaRequest(BaseModel):
    origen_id: str
    destino_id: str
    motivo: str

@app.post("/api/arista")
def create_arista_manual(req: NuevaAristaRequest):
    """Crea una arista manual entre dos nodos."""
    if req.origen_id == req.destino_id:
        raise HTTPException(status_code=400, detail="Una neurona no puede conectarse consigo misma.")
    ids = set(db_conn._get_df().get("id", []))
    desconocidos = {req.origen_id, req.destino_id} - ids
    if desconocidos:
        raise HTTPException(status_code=404, detail=f"Neurona(s) no encontrada(s): {', '.join(sorted(desconocidos))}")
    db_conn.add_links([{
        "origen_id": req.origen_id,
        "destino_id": req.destino_id,
        "motivo": req.motivo,
        "estado": "aceptada"
    }])
    return {"status": "success", "message": "Conexión manual creada."}

@app.delete("/api/node/{node_id}")
def delete_node(node_id: str):
    """Manda la neurona a la papelera (recuperable durante papelera.DIAS_RETENCION días). Sus conexiones se guardan y vuelven al restaurarla."""
    raw_path(node_id)       # valida el id
    try:
        if not papelera.mover(node_id):
            raise HTTPException(status_code=404, detail="Neurona no encontrada")
        return {"status": "success", "message": f"Neurona '{node_id}' enviada a la papelera.", "dias": papelera.DIAS_RETENCION}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al enviar la neurona a la papelera: {str(e)}")

class AsignarSubredesRequest(BaseModel):
    ids: list[str] = Field(max_length=5000)
    añadir: list[str] = Field(default=[], max_length=30)
    quitar: list[str] = Field(default=[], max_length=30)

class NombreSubredRequest(BaseModel):
    nombre: str = Field(max_length=200)

class RenombrarSubredRequest(BaseModel):
    viejo: str = Field(max_length=200)
    nuevo: str = Field(max_length=200)

@app.get("/api/subredes")
def ver_subredes():
    """Las subredes que hay (las deducen las neuronas) con cuántas neuronas vivas tiene cada una."""
    return {"subredes": subredes.listar()}

@app.post("/api/subredes/asignar")
def asignar_subredes(req: AsignarSubredesRequest):
    """Añade y/o quita subredes a esas neuronas (una o muchas a la vez). Quitar de una subred no borra la neurona: sigue en la general."""
    try:
        return {"status": "success", "cambiadas": subredes.asignar(req.ids, req.añadir, req.quitar)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudieron cambiar las subredes: {e}")

@app.post("/api/subredes/renombrar")
def renombrar_subred(req: RenombrarSubredRequest):
    try:
        return {"status": "success", "cambiadas": subredes.renombrar(req.viejo, req.nuevo)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/subredes/borrar")
def borrar_subred(req: NombreSubredRequest):
    """Borra la subred (la etiqueta): las neuronas siguen en la red general."""
    return {"status": "success", "cambiadas": subredes.borrar(req.nombre)}

@app.get("/api/papelera")
def ver_papelera():
    """Las neuronas en la papelera (antes de listar se borran las que ya caducaron)."""
    try:
        papelera.purgar_caducadas()
        return {"dias": papelera.DIAS_RETENCION, "neuronas": papelera.listar()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo leer la papelera: {e}")

@app.post("/api/papelera/{node_id}/restaurar")
def restaurar_neurona(node_id: str):
    raw_path(node_id)
    try:
        if not papelera.restaurar(node_id):
            raise HTTPException(status_code=404, detail="Esa neurona no está en la papelera.")
        return {"status": "success", "message": f"Neurona '{node_id}' restaurada."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo restaurar: {e}")

@app.delete("/api/papelera/{node_id}")
def borrar_para_siempre(node_id: str):
    """Borrar DE VERDAD una neurona (solo si ya está en la papelera). Irreversible; se propaga a los otros PCs como un borrado."""
    raw_path(node_id)
    try:
        if not papelera.borrar_definitivo(node_id):
            raise HTTPException(status_code=404, detail="Esa neurona no está en la papelera.")
        return {"status": "success", "message": f"Neurona '{node_id}' borrada para siempre."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo borrar: {e}")

@app.delete("/api/papelera")
def vaciar_papelera():
    """Vacía la papelera: borra de verdad todas las neuronas que hay en ella."""
    try:
        return {"status": "success", "borradas": papelera.vaciar()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo vaciar la papelera: {e}")

def _agenda(fn, *args):
    """Errores de la agenda: archivo ilegible o lleno (ValueError) y de disco (OSError) → 500 con el motivo; los datos no se tocan."""
    try:
        return fn(*args)
    except agenda.ArchivoInvalido as e:
        raise HTTPException(status_code=400, detail=str(e))
    except (ValueError, OSError) as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agenda")
def ver_agenda():
    return {"contactos": _agenda(agenda.listar)}

@app.get("/api/agenda/exportar")
def exportar_agenda():
    return _agenda(agenda.exportar)

class ImportarAgendaRequest(BaseModel):
    contenido: dict

@app.post("/api/agenda/importar")
def importar_agenda(req: ImportarAgendaRequest):
    return {"status": "success", **_agenda(agenda.importar, req.contenido)}

@app.post("/api/agenda")
def crear_contacto(req: agenda.Contacto):
    return _agenda(agenda.crear, req)

@app.put("/api/agenda/{contacto_id}")
def editar_contacto(contacto_id: str, req: agenda.Contacto):
    c = _agenda(agenda.editar, contacto_id, req)
    if c is None:
        raise HTTPException(status_code=404, detail="Contacto no encontrado")
    return c

@app.delete("/api/agenda/{contacto_id}")
def borrar_contacto(contacto_id: str):
    if not _agenda(agenda.borrar, contacto_id):
        raise HTTPException(status_code=404, detail="Contacto no encontrado")
    return {"status": "success"}

class AjustesRequest(BaseModel):
    ia_activa: Optional[bool] = None
    buscar_actualizaciones: Optional[bool] = None
    carpeta_sincronizacion: Optional[str] = Field(None, max_length=500)
    sincronizar_auto: Optional[bool] = None
    modelo: Optional[str] = Field(None, max_length=100)

@app.get("/api/ajustes")
def leer_ajustes():
    ollama_ok = is_ollama_running()
    modelos = get_available_models() if ollama_ok else []
    return {**ajustes.leer(), "version": APP_VERSION, "carpeta_datos": DATA_DIR, "ollama": ollama_ok, "ollama_instalado": ollama_ok or get_ollama_path() is not None,
            "modelos": modelos, "modelos_restringidos": [m for m in modelos if licencia_restrictiva(m)],
            "neuronas": db_conn.contar_neuronas()}

def _carpeta_sync_valida(carpeta: str) -> bool:
    """Una carpeta que exista, con ruta completa, y que no sea la de los datos ni esté dentro de ella (se sincronizaría consigo misma)."""
    if not carpeta:
        return True
    if not (os.path.isabs(carpeta) and os.path.isdir(carpeta)):
        return False
    datos, elegida = os.path.normcase(os.path.abspath(DATA_DIR)), os.path.normcase(os.path.abspath(carpeta))
    return elegida != datos and not elegida.startswith(datos + os.sep)

@app.put("/api/ajustes")
def guardar_ajustes(req: AjustesRequest):
    cambios = req.model_dump(exclude_none=True)
    cambio_carpeta = False
    if "carpeta_sincronizacion" in cambios:
        cambios["carpeta_sincronizacion"] = cambios["carpeta_sincronizacion"].strip()
        if not _carpeta_sync_valida(cambios["carpeta_sincronizacion"]):
            raise HTTPException(status_code=400, detail="La carpeta de sincronización debe existir (ruta completa) y no puede ser la de tus datos.")
        cambio_carpeta = cambios["carpeta_sincronizacion"] != ajustes.leer()["carpeta_sincronizacion"]
        if cambio_carpeta:
            servicio_sync.cambiar_carpeta()              # otra carpeta: se empieza de cero con ella (lo local no se toca)
    guardados = ajustes.guardar(cambios)
    if req.ia_activa:
        arrancar_en_segundo_plano()                      # al activar la IA local, Ollama se levanta solo si está instalado
    if cambio_carpeta and guardados["carpeta_sincronizacion"]:
        threading.Thread(target=servicio_sync.ahora, daemon=True).start()       # primera sincronización al elegirla
    return guardados

@app.get("/api/sync/estado")
def estado_sincronizacion():
    """Estado de la sincronización entre PCs: carpeta, última vuelta (enviadas, recibidas, conflictos, avisos), otros PCs y error si lo hay."""
    return servicio_sync.estado()

@app.post("/api/sync/ahora")
def sincronizar_ahora():
    """Una vuelta de sincronización ahora mismo (si ya hay otra en marcha no la repite). Devuelve el estado."""
    return servicio_sync.ahora()

@app.post("/api/ollama/arrancar")
def arrancar_ollama():
    """Levanta Ollama en segundo plano si está instalado y la IA local está activa. No espera: el estado real se lee en /api/ajustes."""
    return {"estado": arrancar_en_segundo_plano()}

@app.get("/api/exportar")
def exportar_neuronas(subred: str = ""):
    """Todas las neuronas y sus conexiones en un solo JSON (sin embeddings). Con `subred`, solo las de esa subred."""
    return intercambio.exportar(subred)

class ImportarRequest(BaseModel):
    contenido: dict
    subred: Optional[str] = None     # la subred activa: todo lo importado entra también en ella

@app.post("/api/importar")
def importar_neuronas(req: ImportarRequest):
    """Añade las neuronas de un archivo exportado que aún no existan; nunca pisa las que ya tienes."""
    try:
        return {"status": "success", **intercambio.importar(req.contenido, req.subred or "")}
    except intercambio.ArchivoInvalido as e:
        raise HTTPException(status_code=400, detail=str(e))
