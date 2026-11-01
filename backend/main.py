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
from database import db_conn, Concepto, DATA_DIR
from ollama_service import ensure_ollama_running, is_ollama_running, get_available_models, licencia_restrictiva

APP_VERSION = "0.1.3"   # la misma que frontend/src-tauri/tauri.conf.json

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

class BloquearOrigenesAjenos:
    """CORS solo impide LEER la respuesta; un POST "simple" (text/plain) se ejecutaría igual. Lo cortamos aquí.
    Middleware ASGI puro: el de @app.middleware("http") copia cada respuesta por streams y añadía ~20 ms con 100 KB."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            origin = dict(scope["headers"]).get(b"origin")
            if origin is not None and origin.decode("latin-1") not in ALLOWED_ORIGINS:
                await JSONResponse({"detail": "Origen no permitido"}, status_code=403)(scope, receive, send)
                return
        await self.app(scope, receive, send)

app.add_middleware(BloquearOrigenesAjenos)

def startup_event():
    """Al iniciar el backend, arranca Ollama en segundo plano automáticamente para que los LLM internos funcionen de inmediato."""
    padre = os.environ.get("ALEJANDRIA_PADRE")      # la app que me lanzó: si muere sin avisar, me cierro (no quedar huérfano)
    if padre and padre.isdigit():
        vigilante.vigilar_padre(int(padre))
    print("[Alejandria] Comprobando motor LLM interno (Ollama)...")
    if ensure_ollama_running():
        modelos = get_available_models()
        print(f"[Alejandria] Motor LLM local listo. Modelos detectados: {modelos}")
    else:
        print("[Alejandria] AVISO: Ollama no se pudo arrancar automáticamente. Comprueba que 'ollama' esté instalado.")

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

def raw_path(node_id) -> str:
    """Ruta del JSON de un nodo dentro de DATA_DIR/raw. Rechaza ids que puedan salirse de esa carpeta."""
    node_id = str(node_id)
    if not re.fullmatch(r"[\w-]+", node_id):
        raise HTTPException(status_code=400, detail="id inválido: solo letras, números, '_' y '-'.")
    return os.path.join(DATA_DIR, "raw", f"{node_id}.json")

class NodeInjectionRequest(BaseModel):
    raw_json: str

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

def cargar_json_tolerante(raw: str):
    """json.loads, y si falla por barras invertidas (las IA escriben \\lambda o \\frac sin duplicar la barra, y eso no es JSON válido)
    duplica las que no son escapes de verdad y vuelve a intentarlo. Los saltos de línea reales dentro de textos también se admiten."""
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        reparado = _ESCAPE_JSON.sub(lambda m: "\\" + m.group(0) if (m.group("latex") or m.group("otro")) else m.group(0), raw)
        return json.loads(reparado, strict=False)

def evaluar_conexiones_bg(nuevo_id, nombre, teoria, embedding, base_de_datos, glosario=None):
    guardadas = None
    try:
        import numpy as np
        from clasificador import init_clasificador
        from database import db_conn
        clasificador = init_clasificador()
        vector = np.array(embedding)
        nuevas_aristas = clasificador.evaluar_conexiones(nuevo_id, nombre, teoria, vector, base_de_datos,
                                                         nuevo_glosario=glosario, progreso=sinapsis.avance(nombre))
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
    raw = req.raw_json
    # Limpiar bloques de markdown
    if "```json" in raw:
        match = re.search(r"```json\s*(.*?)\s*```", raw, re.DOTALL)
        if match:
            raw = match.group(1)
    elif "```" in raw:
        match = re.search(r"```\s*(.*?)\s*```", raw, re.DOTALL)
        if match:
            raw = match.group(1)
            
    try:
        data = cargar_json_tolerante(raw)
        node_id = data.get("id")
        if not node_id:
            raise ValueError("El JSON no contiene el campo 'id'.")
        filepath = raw_path(node_id)  # valida el id antes de gastar embeddings/LLM

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
                data.get("glosario")
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
    """Elimina permanentemente una neurona de la base de datos."""
    filepath = raw_path(node_id)
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            
        # Forzar recarga del parquet sin el nodo borrado (o para limpiar fantasmas)
        db_conn.compile_raw_jsons(force=True)
        quitadas = db_conn.quitar_aristas_huerfanas()
        return {"status": "success", "message": f"Neurona '{node_id}' destruida correctamente.", "aristas_quitadas": quitadas}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al destruir la neurona: {str(e)}")

class AjustesRequest(BaseModel):
    ia_activa: Optional[bool] = None
    modelo: Optional[str] = Field(None, max_length=100)

@app.get("/api/ajustes")
def leer_ajustes():
    ollama_ok = is_ollama_running()
    modelos = get_available_models() if ollama_ok else []
    return {**ajustes.leer(), "version": APP_VERSION, "carpeta_datos": DATA_DIR, "ollama": ollama_ok,
            "modelos": modelos, "modelos_restringidos": [m for m in modelos if licencia_restrictiva(m)],
            "neuronas": len(db_conn.get_universe_metadata())}

@app.put("/api/ajustes")
def guardar_ajustes(req: AjustesRequest):
    return ajustes.guardar(req.model_dump(exclude_none=True))

@app.get("/api/exportar")
def exportar_neuronas():
    """Todas las neuronas y sus conexiones en un solo JSON (sin embeddings)."""
    return intercambio.exportar()

class ImportarRequest(BaseModel):
    contenido: dict

@app.post("/api/importar")
def importar_neuronas(req: ImportarRequest):
    """Añade las neuronas de un archivo exportado que aún no existan; nunca pisa las que ya tienes."""
    try:
        return {"status": "success", **intercambio.importar(req.contenido)}
    except intercambio.ArchivoInvalido as e:
        raise HTTPException(status_code=400, detail=str(e))
