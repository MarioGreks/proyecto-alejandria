import functools
import os
import re
import threading
import pandas as pd
from pydantic import BaseModel
from limpieza import activas as sugerencias_activas, normalizar_lista, tipo_de
from typing import Optional

# Definimos la ruta de datos de forma absoluta, referenciada al directorio actual.
# Esto asegura que sin importar desde dónde arranque el servidor (terminal, Tauri, etc.),
# el sistema siempre apunte a la misma carpeta física.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Dejamos preparado el terreno para inyectar %APPDATA% mediante variables de entorno en la versión final
DATA_DIR = os.environ.get("ALEJANDRIA_DATA_DIR", os.path.join(BASE_DIR, "data"))
NODOS_FILE = os.path.join(DATA_DIR, "nodos.parquet")
ARISTAS_FILE = os.path.join(DATA_DIR, "aristas.parquet")

def _lista_json(valor) -> list:
    """Lista de textos guardada como JSON en una celda del parquet; [] si falta o está mal."""
    import json
    try:
        v = json.loads(valor) if isinstance(valor, str) else []
    except ValueError:
        v = []
    return v if isinstance(v, list) else []


RESUMEN_UNIVERSO = 160

def resumen_teoria(teoria, largo: int = RESUMEN_UNIVERSO) -> str:
    """El arranque de la teoría sin títulos Markdown ni marcas (#, $, *, \\) y con los espacios colapsados. Debe coincidir con `fichaVecina` (prompts.ts)."""
    sin_titulos = " ".join(l for l in str(teoria or "").split("\n") if not l.lstrip().startswith("#"))
    return " ".join(re.sub(r"[#$*\\]", "", sin_titulos).split())[:largo]


class Concepto(BaseModel):
    id: str
    nombre: str
    cluster_id: str
    descripcion: Optional[str] = None
    embedding: Optional[list[float]] = None
    origen: Optional[str] = None

class Relacion(BaseModel):
    origen_id: str
    destino_id: str
    tipo: str # [CONTIENE], [EXPLICA], [SE_BASA_EN], [REFERENCIA_A]

def _to_parquet(df, path):
    """Escribe a un temporal y lo mueve de golpe: un corte a mitad no deja el Parquet corrupto."""
    tmp = path + ".tmp"
    df.to_parquet(tmp, engine="pyarrow")
    os.replace(tmp, path)

def _locked(fn):
    """Los endpoints y las tareas de fondo corren en hilos distintos: lectura-modificación-escritura de un Parquet, de uno en uno."""
    @functools.wraps(fn)
    def wrapper(self, *args, **kwargs):
        with self._lock:
            return fn(self, *args, **kwargs)
    return wrapper

class LocalGraphDB:
    def __init__(self):
        """Inicializa el almacenamiento simulando una base de datos de grafos local."""
        self._df_cache = None
        self._universo_cache = None   # (DataFrame del que salió, lista para el universo)
        self._last_parquet_mtime = 0
        self._n_fallidos = 0  # JSON de raw/ que no se pudieron leer en la última compilación
        self._n_papelera = 0  # JSON de raw/ que están en la papelera (no entran en la base) en la última compilación
        self._lock = threading.RLock()

        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR)
        
        # Inicializar la tabla de Nodos (Conceptos)
        if not os.path.exists(NODOS_FILE):
            df_nodos = pd.DataFrame(columns=["id", "nombre", "cluster_id", "descripcion"])
            df_nodos.to_parquet(NODOS_FILE, engine="pyarrow")
            
        # Inicializar la tabla de Aristas (Sinapsis/Relaciones)
        if not os.path.exists(ARISTAS_FILE):
            df_aristas = pd.DataFrame(columns=["origen_id", "destino_id", "tipo"])
            df_aristas.to_parquet(ARISTAS_FILE, engine="pyarrow")
    
    @_locked
    def test_connection(self):
        try:
            pd.read_parquet(NODOS_FILE, engine="pyarrow")
            pd.read_parquet(ARISTAS_FILE, engine="pyarrow")
            return True
        except Exception as e:
            raise Exception(f"Error de integridad en los archivos Parquet: {e}")

    @_locked
    def compile_raw_jsons(self, force=False):
        """Lee todos los .json de data/raw y los integra en nodos.parquet solo si hay cambios o si se fuerza."""
        raw_dir = os.path.join(DATA_DIR, "raw")
        if not os.path.exists(raw_dir):
            os.makedirs(raw_dir)
            
        # scandir da el mtime con la propia lectura de la carpeta (en Windows, sin una llamada por archivo): con 2000 neuronas, 93 ms → unos pocos
        entradas = [e for e in os.scandir(raw_dir) if e.name.endswith('.json')]
        json_files = [e.name for e in entradas]
        if not json_files:
            # Si no hay archivos pero el parquet existe, significa que se borró el último nodo.
            if os.path.exists(NODOS_FILE):
                df = pd.DataFrame(columns=["id", "nombre", "cluster_id", "descripcion", "teoria", "glosario", "ejercicios", "laboratorio"])
                _to_parquet(df, NODOS_FILE)
                self._df_cache = df
                self._last_parquet_mtime = os.path.getmtime(NODOS_FILE)
            return 0
            
        # Comprobar si hay cambios analizando el mtime de los archivos
        max_mtime = max(e.stat().st_mtime for e in entradas)
        if not force and os.path.exists(NODOS_FILE):
            # Comprobamos también si la cantidad de archivos coincide con el parquet
            parquet_mtime = os.path.getmtime(NODOS_FILE)
            if parquet_mtime >= max_mtime:
                # Cache: podríamos tener archivos borrados, así que comprobamos longitud
                # (los JSON ilegibles no están en la caché; sin descontarlos se recompilaría en cada petición)
                if self._df_cache is not None and len(self._df_cache) == len(json_files) - self._n_fallidos - self._n_papelera:
                    return 0 # Ya está actualizado
                
        import json
        # El modelo de embeddings (1,5–2 s y cientos de MB) solo se carga si alguna neurona aún no tiene embedding
        modelo = {"cargado": False, "clasificador": None}

        def clasificador_si_hace_falta():
            if not modelo["cargado"]:
                modelo["cargado"] = True
                try:
                    from clasificador import init_clasificador
                    modelo["clasificador"] = init_clasificador()
                except ImportError:
                    print("[Alejandria] Aviso: fastembed no está instalado. Ejecuta 'pip install fastembed' en tu terminal.")
            return modelo["clasificador"]

        nodos_nuevos = []
        self._n_fallidos = 0
        self._n_papelera = 0
        for file in json_files:
            try:
                filepath = os.path.join(raw_dir, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                if data.get("papelera"):      # en la papelera: el archivo se queda en raw/ (así viaja con la sincronización) pero no es una neurona viva
                    self._n_papelera += 1
                    continue
                    
                # Si falta el embedding, lo generamos y lo escribimos en el JSON
                if "embedding" not in data or not data["embedding"]:
                    clasificador = clasificador_si_hace_falta()
                    if clasificador is not None:
                        texto = f"{data.get('nombre', '')}. {data.get('teoria', '')}"
                        data["embedding"] = clasificador.get_embedding(texto).tolist()
                        with open(filepath, 'w', encoding='utf-8') as f:
                            json.dump(data, f, ensure_ascii=False, indent=2)
                        
                nodos_nuevos.append({
                    "id": file.replace('.json', ''),
                    "nombre": data.get("nombre", "Sin nombre"),
                    "cluster_id": data.get("cluster", "Desconocido"),
                    "descripcion": data.get("teoria", ""),
                    "teoria": data.get("teoria", ""),
                    "glosario": json.dumps(data.get("glosario", [])),
                    "ejercicios": json.dumps(data.get("ejercicios", [])),
                    "laboratorio": json.dumps(data.get("laboratorio", {})),
                    "referencias": json.dumps(data.get("referencias", [])),
                    "embedding": data.get("embedding", []),
                    "origen": data.get("origen", ""),
                    "tipo": tipo_de(data),
                    "subredes": json.dumps(normalizar_lista(data.get("subredes")), ensure_ascii=False),
                    "sugerencias": json.dumps(sugerencias_activas(data.get("sugerencias")), ensure_ascii=False)
                })
            except Exception as e:
                self._n_fallidos += 1
                print(f"Error procesando {file}: {e}")

        if nodos_nuevos or (self._n_papelera and not self._n_fallidos):      # todo en la papelera: la base queda vacía
            df = pd.DataFrame(nodos_nuevos) if nodos_nuevos else pd.DataFrame(
                columns=["id", "nombre", "cluster_id", "descripcion", "teoria", "glosario", "ejercicios", "laboratorio", "referencias", "tipo"])
            _to_parquet(df, NODOS_FILE)
            self._df_cache = df
            self._last_parquet_mtime = os.path.getmtime(NODOS_FILE)
            print(f"[Alejandria] Base de datos recompilada: {len(nodos_nuevos)} nodos reales.")
            return len(nodos_nuevos)
        return 0

    @_locked
    def _get_df(self):
        self.compile_raw_jsons()
        current_mtime = os.path.getmtime(NODOS_FILE) if os.path.exists(NODOS_FILE) else 0
        if self._df_cache is None or current_mtime > self._last_parquet_mtime:
            try:
                self._df_cache = pd.read_parquet(NODOS_FILE, engine="pyarrow")
                self._last_parquet_mtime = current_mtime
            except Exception as e:
                print(f"[Alejandria] No se pudo leer {NODOS_FILE}: {e}")
                self._df_cache = pd.DataFrame()
        return self._df_cache

    def contar_neuronas(self) -> int:
        """Cuántas neuronas hay, sin construir la lista con todos sus textos (get_universe_metadata): lo consulta Ajustes cada pocos segundos."""
        df = self._get_df()
        return 0 if df.empty else len(df)

    def get_universe_metadata(self):
        """Lo que el universo necesita de cada neurona: id, nombre, clúster, subredes, los términos del glosario (para buscar) y un resumen de la teoría
        (para las fichas de los prompts). El texto completo, los ejercicios y las referencias se piden de una en una con get_node: el universo se sondea
        cada 5 s y con 2000 neuronas eran 40 MB por sondeo. La lista se rehace solo cuando cambia la base (el DataFrame es otro objeto)."""
        df = self._get_df()
        if df.empty: return []
        if self._universo_cache is not None and self._universo_cache[0] is df:
            return self._universo_cache[1]

        out = []
        if "id" in df.columns:
            n = len(df)
            col = lambda nombre: df[nombre].tolist() if nombre in df.columns else [None] * n     # una base compilada con una versión anterior no tiene todas las columnas
            for id_, nombre, cluster, glosario, teoria, subredes in zip(df["id"].tolist(), col("nombre"), col("cluster_id"), col("glosario"), col("teoria"), col("subredes")):
                out.append({"id": id_, "nombre": nombre, "cluster_id": cluster, "subredes": _lista_json(subredes),
                            "glosario": [{"termino": g.get("termino", "")} for g in _lista_json(glosario) if isinstance(g, dict)],
                            "resumen": resumen_teoria(teoria)})
        self._universo_cache = (df, out)
        return out

    @_locked
    def get_links_metadata(self):
        """Devuelve las conexiones entre nodos (aristas)."""
        if not os.path.exists(ARISTAS_FILE):
            return []
        try:
            df_aristas = pd.read_parquet(ARISTAS_FILE, engine="pyarrow")
            if df_aristas.empty:
                return []
            ids = set(self._get_df().get("id", []))      # las conexiones de una neurona en la papelera siguen guardadas pero no se ven (vuelven al restaurarla)
            df_aristas = df_aristas[df_aristas['origen_id'].isin(ids) & df_aristas['destino_id'].isin(ids)]
            if 'estado' in df_aristas.columns:
                df_aristas = df_aristas[df_aristas['estado'] != 'rechazada']
                df_aristas['estado'] = df_aristas['estado'].fillna('pendiente')
            df_aristas = df_aristas.fillna("")
            return df_aristas.to_dict(orient="records")
        except Exception as e:
            print(f"Error leyendo aristas: {e}")
            return []
            
    @_locked
    def quitar_aristas_huerfanas(self):
        """Quita las aristas cuyo origen o destino ya no existe (un nodo existe si hay un data/raw/<id>.json). Devuelve cuántas quitó.
        Sin esto, borrar una neurona deja sus aristas (cuentan en el contador) y al crear otra con el mismo id reviven, incluidas las rechazadas."""
        raw_dir = os.path.join(DATA_DIR, "raw")
        if not os.path.exists(ARISTAS_FILE) or not os.path.isdir(raw_dir):   # sin carpeta de nodos no se puede saber qué existe: no se toca nada
            return 0
        ids = {f[:-5] for f in os.listdir(raw_dir) if f.endswith('.json')}
        df = pd.read_parquet(ARISTAS_FILE, engine="pyarrow")
        if df.empty:
            return 0
        vivas = df[df['origen_id'].isin(ids) & df['destino_id'].isin(ids)]
        quitadas = len(df) - len(vivas)
        if quitadas:
            _to_parquet(vivas.reset_index(drop=True), ARISTAS_FILE)
        return quitadas

    @_locked
    def listar_aristas(self):
        """TODAS las aristas tal como están guardadas (también las rechazadas, que se recuerdan para no volver a proponerlas): lo que se sincroniza entre PCs."""
        if not os.path.exists(ARISTAS_FILE):
            return []
        try:
            df = pd.read_parquet(ARISTAS_FILE, engine="pyarrow")
            if df.empty:
                return []
            return df.where(df.notna(), "").to_dict(orient="records")
        except Exception as e:
            print(f"Error leyendo aristas: {e}")
            raise

    @_locked
    def quitar_arista(self, origen_id: str, destino_id: str):
        """Quita la arista exacta (origen, destino). Devuelve si existía."""
        if not os.path.exists(ARISTAS_FILE):
            return False
        df = pd.read_parquet(ARISTAS_FILE, engine="pyarrow")
        if df.empty:
            return False
        resto = df[~((df['origen_id'] == origen_id) & (df['destino_id'] == destino_id))]
        if len(resto) == len(df):
            return False
        _to_parquet(resto.reset_index(drop=True), ARISTAS_FILE)
        return True

    @_locked
    def get_known_pairs(self):
        """Parejas (origen, destino) que ya tienen arista en cualquier estado (también rechazada), en ambas direcciones."""
        if not os.path.exists(ARISTAS_FILE):
            return set()
        df = pd.read_parquet(ARISTAS_FILE, engine="pyarrow")
        if df.empty:
            return set()
        pares = set(zip(df['origen_id'], df['destino_id']))
        return pares | {(d, o) for o, d in pares}

    @_locked
    def add_links(self, links_list, overwrite=True):
        """Añade una lista de diccionarios con formato {'origen_id': '...', 'destino_id': '...', 'motivo': '...'} a aristas.parquet.
        Con overwrite=False ignora las parejas que ya existan (en cualquier dirección), para no pisar aristas aceptadas o rechazadas."""
        if not links_list:
            return

        try:
            df_nuevas = pd.DataFrame(links_list)
            if 'estado' not in df_nuevas.columns:
                df_nuevas['estado'] = 'pendiente'

            if os.path.exists(ARISTAS_FILE):
                df_existentes = pd.read_parquet(ARISTAS_FILE, engine="pyarrow")
                if not overwrite and not df_existentes.empty:
                    conocidas = set(zip(df_existentes['origen_id'], df_existentes['destino_id']))
                    conocidas |= {(d, o) for o, d in conocidas}
                    df_nuevas = df_nuevas[[par not in conocidas for par in zip(df_nuevas['origen_id'], df_nuevas['destino_id'])]]
                    if df_nuevas.empty:
                        return
                df_final = pd.concat([df_existentes, df_nuevas], ignore_index=True)
                # Opcional: Eliminar duplicados (si las evaluamos dos veces)
                if 'origen_id' in df_final.columns and 'destino_id' in df_final.columns:
                    df_final = df_final.drop_duplicates(subset=['origen_id', 'destino_id'], keep='last')
            else:
                df_final = df_nuevas
                
            _to_parquet(df_final, ARISTAS_FILE)
            print(f"[Alejandria] {len(links_list)} nuevas aristas guardadas en {ARISTAS_FILE}.")
        except Exception as e:
            print(f"Error guardando aristas: {e}")

    @_locked
    def update_link_status(self, origen_id: str, destino_id: str, status: str):
        if not os.path.exists(ARISTAS_FILE):
            return False
            
        try:
            df_aristas = pd.read_parquet(ARISTAS_FILE, engine="pyarrow")
            
            if 'estado' not in df_aristas.columns:
                df_aristas['estado'] = 'pendiente'
                
            mask = (df_aristas['origen_id'] == origen_id) & (df_aristas['destino_id'] == destino_id)
            if not mask.any():
                mask = (df_aristas['origen_id'] == destino_id) & (df_aristas['destino_id'] == origen_id)
                
            if mask.any():
                df_aristas.loc[mask, 'estado'] = status
                _to_parquet(df_aristas, ARISTAS_FILE)
                return True
            return False
        except Exception as e:
            print(f"Error actualizando estado de arista: {e}")
            return False

    def get_node(self, node_id: str):
        """Devuelve todos los detalles de un nodo específico reconstruyendo el JSON."""
        df = self._get_df()
        if df.empty: return None
        
        try:
            fila = df[df["id"] == node_id]
            if fila.empty:
                return None
                
            row = fila.iloc[0]
            import json
            ejercicios = json.loads(row.get("ejercicios", "[]"))
            laboratorio = json.loads(row.get("laboratorio", "{}"))
            tipo = row.get("tipo")
            return {
                "id": row["id"],
                "nombre": row["nombre"],
                "cluster": row["cluster_id"],
                "tipo": tipo if isinstance(tipo, str) and tipo else tipo_de({"ejercicios": ejercicios, "laboratorio": laboratorio}),
                "teoria": row.get("teoria", ""),
                "glosario": json.loads(row.get("glosario", "[]")),
                "ejercicios": ejercicios,
                "laboratorio": laboratorio,
                "subredes": _lista_json(row.get("subredes")),
                "sugerencias": _lista_json(row.get("sugerencias")),
                "referencias": json.loads(row.get("referencias", "[]")) if isinstance(row.get("referencias"), str) else (row.get("referencias") if isinstance(row.get("referencias"), list) else [])
            }
        except Exception as e:
            print(f"Error obteniendo nodo {node_id}: {e}")
            return None

# Instancia de conexión global a nuestros archivos locales
db_conn = LocalGraphDB()

