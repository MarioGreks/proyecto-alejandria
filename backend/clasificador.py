import json
import re
import unicodedata
import numpy as np
from typing import List, Dict, Optional, Tuple
from fastembed import TextEmbedding
import urllib.request
from idioma import instruccion
import recursos
try:
    from ollama_service import ensure_ollama_running, get_best_llm_model
except ImportError:
    def ensure_ollama_running(): return False
    def get_best_llm_model(pref="phi3:mini"): return pref

MAX_CONEXIONES = 3  # aristas que se guardan como máximo por neurona nueva: más es ruido que revisar
MAX_CANDIDATOS = 8  # parejas que se le preguntan al LLM local (~4 s cada una)
EMPUJON_MENCION = 0.2  # lo que sube la puntuación de un candidato por cada palabra distintiva suya que aparece en el otro texto
MAX_EMPUJON = 0.6
MIN_MOTIVO = 25  # un motivo más corto que esto (en caracteres) no explica ningún vínculo
MAX_LEN_CLUSTER = 40  # un nombre de rama, no una frase: evita que se cuele texto del prompt como clúster

def _normalizar(texto: str) -> str:
    sin_tildes = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return " ".join(sin_tildes.casefold().split())

def resolver_cluster_propuesto(propuesto, existentes: List[str]) -> Tuple[Optional[str], bool]:
    """Devuelve (clúster, es_nuevo). Si la propuesta coincide con uno existente (sin tildes ni mayúsculas) usa el nombre existente.
    Propuestas vacías, no textuales, demasiado largas o 'Desconocido' devuelven (None, False)."""
    if not isinstance(propuesto, str):
        return None, False
    propuesto = " ".join(propuesto.split())
    if not propuesto or len(propuesto) > MAX_LEN_CLUSTER or _normalizar(propuesto) == "desconocido":
        return None, False
    for nombre in existentes:
        if _normalizar(nombre) == _normalizar(propuesto):
            return nombre, False
    return propuesto, True

def _son_clusters_distintos(a, b) -> bool:
    """Dos clústeres conocidos y distintos ('Desconocido' o vacío no cuentan: sin dato no se exige más)."""
    conocidos = [_normalizar(c) for c in (a, b) if isinstance(c, str) and c.strip() and _normalizar(c) != "desconocido"]
    return len(conocidos) == 2 and conocidos[0] != conocidos[1]

def _palabras(texto) -> set:
    """Conjunto de palabras (minúsculas, sin tildes) de un texto."""
    return set(re.findall(r"[a-z0-9]+", _normalizar(str(texto or ""))))


def _motivo_flojo(motivo: str, pistas) -> bool:
    """El modelo pequeño a veces responde con la frase que se le dio como pista, o con una frase vacía, en vez de explicar el vínculo:
    eso no es un motivo, y suele indicar que no entendió la relación."""
    m = _normalizar(motivo)
    if len(m) < MIN_MOTIVO:
        return True
    for pista in pistas:
        for frase in re.findall(r"«(.*?)»", pista):
            f = _normalizar(frase)
            if len(f) >= 30 and f[:30] in m:
                return True
    return False


def _pistas(texto, claves: set, n: int = 2, largo: int = 240) -> str:
    """Hasta `n` frases del texto que contienen alguna de las palabras clave: la evidencia más directa de que dos conceptos se relacionan
    (el resumen del juez solo cubre la introducción, y los usos y aplicaciones suelen estar al final)."""
    frases = re.split(r"(?<=[.!?])\s+|\n+", re.sub(r"[#$*\\]", "", str(texto or "")))
    elegidas = [f"«{' '.join(f.split())[:largo]}»" for f in frases if claves & _palabras(f)][:n]
    return " ".join(elegidas)


def _claves(nodo: Dict) -> set:
    """Palabras que identifican a un nodo: las de su nombre (3+ letras) y las de los términos de su glosario (6+ letras)."""
    glosario = nodo.get('glosario') or []
    if isinstance(glosario, str):
        try:
            glosario = json.loads(glosario)
        except ValueError:
            glosario = []
    terminos = " ".join(str(g.get('termino', '')) for g in glosario if isinstance(g, dict)) if isinstance(glosario, list) else ""
    return {w for w in _palabras(nodo.get('nombre')) if len(w) >= 3} | {w for w in _palabras(terminos) if len(w) >= 6}


class ClasificadorLocal:
    def __init__(self, model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"):
        """
        Inicializa el clasificador local de 4 capas.
        La primera vez que se ejecute, descargará el modelo de embeddings (~240MB) en caché.
        """
        print(f"[Capa 2] Cargando modelo de embeddings locales ({model_name})...")
        self.embedding_model = TextEmbedding(model_name=model_name, threads=recursos.hilos_embedding())   # None = los que decida onnxruntime
        
        # Stopwords para la Capa 1 (Reglas base)
        self.stopwords = set(["el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "en", "con", "por", "para", "como", "sobre", "entre"])
        print("[Clasificador] Motor matemático inicializado.")

    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calcula la similitud del coseno entre dos vectores (rango -1 a 1)."""
        dot_product = np.dot(vec1, vec2)
        norm_a = np.linalg.norm(vec1)
        norm_b = np.linalg.norm(vec2)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(dot_product / (norm_a * norm_b))

    def get_embedding(self, text: str) -> np.ndarray:
        """Convierte texto en un vector matemático."""
        # TextEmbedding.embed devuelve un generador, extraemos el primer (y único) resultado
        embeddings = list(self.embedding_model.embed([text]))
        return embeddings[0]

    def _capa_1_reglas(self, texto: str, clusters_conocidos: List[str]) -> Optional[str]:
        """
        CAPA 1: Búsqueda rápida por palabras clave exactas.
        Si el texto menciona directamente el nombre de un clúster de forma muy obvia, le damos puntos.
        """
        texto_lower = texto.lower()
        for cluster in clusters_conocidos:
            if cluster.lower() in texto_lower:
                return cluster
        return None

    def _capa_2_embeddings(self, vector_texto: np.ndarray, base_de_datos: List[Dict]) -> Tuple[Optional[str], float]:
        """
        CAPA 2: Motor Vectorial (El corazón del sistema).
        Calcula la distancia entre el nuevo texto y todos los nodos existentes.
        Devuelve el cluster ganador y la confianza (similitud).
        """
        mejor_cluster = None
        mejor_similitud = -1.0
        
        # Agrupar embeddings por cluster para hacer promedio o buscar el vecino más cercano
        for nodo in base_de_datos:
            emb = nodo.get('embedding')
            if emb is None or len(emb) == 0:
                continue
                
            # Convertimos a numpy array
            emb_np = np.array(emb)
            if emb_np.shape != vector_texto.shape:
                continue
                
            similitud = self._cosine_similarity(vector_texto, emb_np)
            
            # Si es una "Corrección Manual" del usuario, pesa un 15% más
            if nodo.get('origen') == 'correccion_manual':
                similitud *= 1.15
                
            if similitud > mejor_similitud:
                mejor_similitud = similitud
                mejor_cluster = nodo.get('cluster_id')
                
        return mejor_cluster, mejor_similitud

    def _capa_4_llm_ollama(self, texto: str, categorias_disponibles: List[str]) -> str:
        """
        CAPA 4: El Juez Final (Ollama). 
        Solo se ejecuta si las matemáticas de la Capa 2 fracasan o dudan.
        """
        prompt = f"""Clasifica el siguiente texto académico en UNA de estas categorías exactas: {json.dumps(categorias_disponibles)}.
        Devuelve ÚNICAMENTE un objeto JSON válido con la clave 'categoria'. No añadas explicaciones.
        
        Texto: {texto[:1000]}
        """
        
        if recursos.ia_pausada() or not ensure_ollama_running():   # sin memoria libre, IA local desactivada en Ajustes, o Ollama no instalado
            return "Desconocido"
        modelo = get_best_llm_model("phi3:mini")

        data = {
            "model": modelo,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            **recursos.opciones_ollama(),
            "keep_alive": 0 # FUNDAMENTAL: Matar el modelo inmediatamente después para liberar RAM
        }
        
        try:
            print(f"[Capa 4] Despertando LLM local (Ollama: {modelo}) por baja confianza matemática...")
            req = urllib.request.Request("http://127.0.0.1:11434/api/generate", data=json.dumps(data).encode('utf-8'))
            req.add_header('Content-Type', 'application/json')
            
            with urllib.request.urlopen(req, timeout=15) as response:
                result = json.loads(response.read().decode('utf-8'))
                respuesta_llm = json.loads(result.get("response", "{}"))
                cat = respuesta_llm.get("categoria")
                if cat in categorias_disponibles:
                    return cat
        except Exception as e:
            print(f"[Capa 4] Error o servidor Ollama apagado: {e}")
            
        return "Desconocido"

    def clasificar_neurona(self, titulo: str, teoria: str, base_de_datos: List[Dict], categorias_disponibles: List[str], cluster_propuesto: Optional[str] = None) -> Dict:
        """
        Orquesta el embudo de clasificación.
        Un vecino muy parecido (Capa 2) manda; si no, se usa el clúster que propone la IA en el JSON
        (normalizado a uno existente si coincide); sin propuesta válida, siguen las reglas y el LLM local.
        """
        texto_completo = f"{titulo}. {teoria}"
        motivo = ""
        
        print(f"\n[Clasificador] Analizando nueva neurona: '{titulo}'")
        
        # 1. Generamos el embedding (Se usa en Capa 2 y se guarda en la base de datos)
        vector_nuevo = self.get_embedding(texto_completo)
        
        # 2. CAPA 2: Matemáticas (Embeddings)
        # Asumimos que un > 0.82 de similitud del coseno es una coincidencia fuerte
        cluster_c2, similitud_c2 = self._capa_2_embeddings(vector_nuevo, base_de_datos)
        
        if similitud_c2 > 0.82:
            print(f" -> [ÉXITO] Capa 2 (Vectores) asume: {cluster_c2} con {similitud_c2:.2f} de confianza.")
            return {
                "cluster": cluster_c2,
                "motivo": f"Capa 2: Similitud matemática alta ({similitud_c2:.2f})",
                "embedding": vector_nuevo.tolist()
            }
            
        # 2b. Propuesta de la IA que generó la neurona (puede ser un clúster nuevo)
        propuesto, es_nuevo = resolver_cluster_propuesto(cluster_propuesto, categorias_disponibles)
        if propuesto:
            print(f" -> [ÉXITO] La IA propone: {propuesto} ({'nuevo' if es_nuevo else 'existente'}).")
            return {
                "cluster": propuesto,
                "motivo": f"Propuesto por la IA ({'clúster nuevo' if es_nuevo else 'clúster existente'}); mejor vecino {similitud_c2:.2f}",
                "embedding": vector_nuevo.tolist()
            }

        # 3. CAPA 1: Reglas como red de seguridad barata
        cluster_c1 =self._capa_1_reglas(texto_completo, categorias_disponibles)
        if cluster_c1:
            print(f" -> [ÉXITO] Capa 1 (Reglas) atrapa: {cluster_c1}.")
            return {
                "cluster": cluster_c1,
                "motivo": "Capa 1: Regla heurística de texto",
                "embedding": vector_nuevo.tolist()
            }
            
        # 4. CAPA 4: Desempate LLM
        print(f" -> [AVISO] Baja confianza matemática ({similitud_c2:.2f}). Se requiere LLM.")
        cluster_c4 = self._capa_4_llm_ollama(texto_completo, categorias_disponibles)
        
        return {
            "cluster": cluster_c4,
            "motivo": "Capa 4: Ollama JSON Fallback",
            "embedding": vector_nuevo.tolist()
        }

    @staticmethod
    def _ficha(nodo: Dict, teoria: Optional[str] = None, glosario=None, n: int = 350) -> Tuple[str, str]:
        """(términos clave, resumen) de un nodo para el juez: el glosario dice de qué trata mucho mejor que la introducción histórica."""
        glosario = nodo.get('glosario') if glosario is None else glosario
        if isinstance(glosario, str):
            try:
                glosario = json.loads(glosario)
            except ValueError:
                glosario = []
        terminos = ", ".join(str(g.get('termino', '')) for g in (glosario if isinstance(glosario, list) else [])[:8] if isinstance(g, dict))
        texto = " ".join(re.sub(r"[#$*\\]", "", str(nodo.get('teoria') if teoria is None else teoria or '')).split())
        return terminos, texto[:n]

    def _juzgar_par(self, modelo: str, a: Tuple[str, str, str], b: Tuple[str, str, str], pistas: Tuple[str, str] = ("", "")) -> Optional[Tuple[str, str]]:
        """Pregunta al LLM local si A y B están relacionados. Devuelve (sentido, motivo) con sentido 'ab' (A se basa en B),
        'ba' (B se basa en A) o 'rel' (relacionados sin requisito claro), o None si no hay relación. Lanza si falla la consulta."""
        def bloque(letra, ficha):
            nombre, terminos, resumen = ficha
            return f"Concepto {letra}: {nombre}\nTérminos clave {letra}: {terminos or '(sin glosario)'}\nResumen {letra}: {resumen}"

        evidencia = ""
        if pistas[0] or pistas[1]:
            partes = ([f"Frases del texto de A que nombran algo de B: {pistas[0]}"] if pistas[0] else []) \
                   + ([f"Frases del texto de B que nombran algo de A: {pistas[1]}"] if pistas[1] else [])
            evidencia = "\n" + "\n".join(partes) + "\n"

        prompt = f"""Eres un juez lógico estrictamente académico. Decide si estos dos conceptos están DIRECTAMENTE relacionados: que uno use, derive, generalice o aplique al otro, o que ambos compartan el mismo modelo o herramienta matemática concreta, o que tengan un vínculo histórico o conceptual directo (misma persona o escuela, una influencia clara del uno en el otro).

{bloque('A', a)}

{bloque('B', b)}
{evidencia}
REGLAS:
- "A_se_basa_en_B": A necesita, usa o deriva de B.
- "B_se_basa_en_A": B necesita, usa o deriva de A.
- "relacionados": comparten una herramienta, un modelo o un caso particular concreto, o tienen un vínculo histórico o conceptual directo (la misma persona o escuela, una influencia clara, una controversia común), sin que uno sea requisito claro del otro. Un vínculo histórico es «relacionados»: nunca «se basa en» salvo que uno use de verdad el resultado del otro.
- "ninguna": solo pertenecen al mismo campo general (p. ej. los dos son de estadística) o a la misma época sin más, o se parecen de forma lejana.
- Si un texto nombra al otro concepto para usarlo, aplicarlo o suponerlo, eso SÍ es una relación (no respondas "ninguna").

{instruccion()} Eso incluye el campo "motivo".
Responde ÚNICAMENTE en formato JSON con esta estructura exacta:
{{"relacion": "A_se_basa_en_B" o "B_se_basa_en_A" o "relacionados" o "ninguna", "motivo": "una frase concreta sobre el vínculo"}}"""
        resp = self._consultar(modelo, prompt)
        if resp is None:
            return None
        clave = _normalizar(str(resp.get("relacion", ""))).replace(" ", "_")
        sentido = {"a_se_basa_en_b": "ab", "b_se_basa_en_a": "ba", "relacionados": "rel"}.get(clave)
        if sentido is None and str(resp.get("depende", "")).lower() == "true":  # respuesta al estilo antiguo
            sentido = "ab"
        if not sentido:
            return None
        motivo = str(resp.get("motivo", ""))
        if not self._confirmar(modelo, bloque('A', a), bloque('B', b), sentido, motivo, evidencia):
            # La revisión solo puede QUITAR la dirección, nunca el vínculo: lo que suele fallar es el sentido (binomial ~ Poisson salía «A se basa en B») y
            # un modelo pequeño rechazaba parejas evidentes. «Relacionados» ya exige, en evaluar_conexiones, que cada texto nombre al otro concepto,
            # así que un vínculo inventado sigue sin pasar.
            if sentido != "rel":
                print(f" -> [Revisada] {a[0]} ~ {b[0]}: la segunda revisión duda de la dirección; se propone solo como relacionados")
            sentido = "rel"
        return sentido, motivo

    @staticmethod
    def _consultar(modelo: str, prompt: str) -> Optional[Dict]:
        """Una consulta JSON al LLM local. None si su respuesta no es JSON; lanza si falla la conexión."""
        data = {"model": modelo, "prompt": prompt, "stream": False, "format": "json", "keep_alive": "5m", **recursos.opciones_ollama()}   # con límites: hilos, contexto, GPU y tiempo en memoria del perfil
        req = urllib.request.Request("http://127.0.0.1:11434/api/generate", data=json.dumps(data).encode('utf-8'))
        req.add_header('Content-Type', 'application/json')
        with urllib.request.urlopen(req, timeout=120) as response:   # la primera consulta incluye cargar el modelo en memoria (en una CPU lenta, decenas de segundos)
            resultado = json.loads(response.read().decode('utf-8'))
        try:
            resp = json.loads(resultado.get("response", "{}"))
        except json.JSONDecodeError:
            return None
        return resp if isinstance(resp, dict) else None

    def _confirmar(self, modelo: str, bloque_a: str, bloque_b: str, sentido: str, motivo: str, evidencia: str = "") -> bool:
        """Segunda pasada, invisible para el usuario: el modelo revisa su propio veredicto con otra pregunta. Solo un "correcto": false lo descarta; si no
        contesta con claridad o falla la consulta se da por bueno, para no perder una conexión por un fallo de formato.
        La pregunta es deliberadamente permisiva (false solo si es claramente erróneo) y lleva las mismas frases-pista que el juez: con una versión más
        severa y sin pistas, phi3:mini rechazaba el 100 % de una pareja evidente (binomial ~ Poisson) en las pruebas."""
        veredicto = {"ab": "A se basa en B", "ba": "B se basa en A", "rel": "A y B están relacionados"}[sentido]
        prompt = f"""Otro juez ha concluido esto sobre dos conceptos académicos. Dime si su conclusión es razonable a la vista de los textos.

{bloque_a}

{bloque_b}
{evidencia}
Conclusión del juez: {veredicto}. Motivo: "{motivo}"

Responde false SOLO si la conclusión es claramente errónea (los conceptos no tienen nada que ver, o el motivo es inventado o vacío). Si es razonable o discutible, responde true.
Responde ÚNICAMENTE en formato JSON: {{"correcto": true o false}}"""
        try:
            resp = self._consultar(modelo, prompt)
        except Exception as e:
            print(f"[Conexiones] No se pudo hacer la segunda revisión ({e}); se da por buena.")
            return True
        correcto = (resp or {}).get("correcto", True)
        return str(correcto).strip().lower() != "false"

    def evaluar_conexiones(self, nuevo_id: str, nuevo_nombre: str, nuevo_resumen: str, vector_nuevo: np.ndarray, base_de_datos: List[Dict],
                           omitir: Optional[set] = None, nuevo_glosario=None, progreso=None, cluster_nuevo: Optional[str] = None) -> List[Dict]:
        """
        Filtro Híbrido RAG:
        1. Busca los 10 nodos más cercanos matemáticamente (similitud > 0.4).
        2. Para cada uno, Ollama decide si hay relación EN CUALQUIER SENTIDO (el nuevo se basa en el viejo, el viejo en el nuevo,
           o están relacionados) viendo el glosario y un resumen de los dos. Se descartan los motivos que copian la pista y 'relacionados'
           si cada texto no nombra al otro. Se guardan como mucho MAX_CONEXIONES.
        3. Si no sale ninguna y la neurona no tiene aristas, se propone la más afín por similitud (estado 'pendiente'),
           para que no quede flotando sola: tú decides si procede.
        `omitir`: parejas (origen, destino) ya decididas; se saltan sin gastar una llamada al LLM.
        `progreso(hecho, total, conexiones)`: se llama tras cada pareja, para poder enseñar el avance.
        `cluster_nuevo`: su clúster. Entre clústeres distintos se exige más: la conexión necesita que al menos un texto nombre al otro concepto
        y no se propone ninguna «Afinidad» (en los datos reales, todas las conexiones rechazadas eran entre clústeres y sin esa mención).
        """
        # El embedding solo ve las primeras ~128 palabras (la introducción histórica) y puntúa bajo a una neurona corta:
        # por eso no se usa un umbral fijo (el LLM es el filtro) y se suma un empujón cuando un texto nombra al otro concepto.
        otros = [n for n in base_de_datos if str(n.get('id')) != str(nuevo_id)]
        claves_de = {str(n.get('id')): _claves(n) for n in otros}
        palabras_de = {str(n.get('id')): _palabras(n.get('teoria')) for n in otros}
        frecuencia = {}   # en cuántos textos aparece cada palabra: "distribución" o "modelo" no distinguen a ninguno, "wiener" sí
        for ps in palabras_de.values():
            for w in ps:
                frecuencia[w] = frecuencia.get(w, 0) + 1
        # Peso de una palabra como pista: 1 si aparece en pocos textos, bajando hasta 0 cuando está en la mitad o más. Una palabra que
        # nombra a un concepto muy usado ("browniano") sigue valiendo algo; una genérica ("distribución", "modelo") no vale nada.
        # shortcut: se recalcula en cada llamada; con cientos de nodos habría que cachearlo.
        tope = max(3.0, len(otros) / 2)   # con pocos nodos, aparecer en uno o dos textos sigue siendo distintivo
        peso = lambda t: min(1.0, max(0.0, (tope - frecuencia.get(t, 0)) / (tope / 2)))
        distintivas = lambda ks: {t for t in ks if peso(t) >= 0.5}
        coincidencias = lambda ks, palabras: sum(peso(t) for t in ks & palabras)
        palabras_nuevo = _palabras(nuevo_resumen)
        claves_nuevo = _claves({"nombre": nuevo_nombre, "glosario": nuevo_glosario})

        candidatos = []
        for nodo in otros:
            emb = nodo.get('embedding')
            if emb is None or len(emb) == 0:
                continue
            emb_np = np.array(emb)
            if emb_np.shape != vector_nuevo.shape:
                continue

            similitud = self._cosine_similarity(vector_nuevo, emb_np)
            menciones = coincidencias(claves_de[str(nodo.get('id'))], palabras_nuevo) + coincidencias(claves_nuevo, palabras_de[str(nodo.get('id'))])
            if similitud > 0.15 or menciones >= 0.5:
                candidatos.append({"id": str(nodo.get('id')), "nombre": nodo.get('nombre', ''), "similitud": similitud, "nodo": nodo, "menciones": menciones,
                                   "entre_clusters": _son_clusters_distintos(cluster_nuevo, nodo.get('cluster_id')),
                                   "puntuacion": similitud + min(MAX_EMPUJON, EMPUJON_MENCION * menciones)})

        candidatos.sort(key=lambda x: x['puntuacion'], reverse=True)
        top_k = candidatos[:MAX_CANDIDATOS]
        if not top_k:
            return []

        print(f"[Conexiones] Analizando {len(top_k)} pares posibles para '{nuevo_nombre}'...")
        llm_ok = ensure_ollama_running()
        modelo = get_best_llm_model("phi3:mini")

        terminos_n, resumen_n = self._ficha({}, teoria=nuevo_resumen, glosario=nuevo_glosario if nuevo_glosario is not None else [])
        ficha_nuevo = (nuevo_nombre, terminos_n, resumen_n)
        aceptadas, fallos, consultados = [], 0, 0   # aceptadas: (puntuación, arista); al final se quedan las MEJORES, no las primeras
        total = len(top_k)
        if progreso:
            progreso(0, total, 0)
        for i, c in enumerate(top_k, 1):
            if omitir and (str(nuevo_id), c['id']) in omitir:
                consultados += 1
            else:
                try:
                    if not llm_ok:
                        raise RuntimeError("IA local desactivada o Ollama no disponible")
                    if not recursos.esperar_recursos():       # poca RAM libre: se espera a que vuelva (hasta unos minutos) en vez de empujar al PC al límite
                        raise RuntimeError("IA en pausa por falta de memoria libre")
                    terminos_c, resumen_c = self._ficha(c['nodo'])
                    pistas = (_pistas(nuevo_resumen, distintivas(claves_de[c['id']])), _pistas(c['nodo'].get('teoria'), distintivas(claves_nuevo)))
                    juicio = self._juzgar_par(modelo, ficha_nuevo, (c['nombre'], terminos_c, resumen_c), pistas)
                    consultados += 1
                    if juicio:
                        sentido, motivo = juicio
                        if _motivo_flojo(motivo, pistas):
                            print(f" -> [Descartada] {nuevo_nombre} ~ {c['nombre']}: el motivo es demasiado corto o copia la pista del prompt")
                        elif sentido == "rel" and not (pistas[0] and pistas[1]):
                            print(f" -> [Descartada] {nuevo_nombre} ~ {c['nombre']}: 'relacionados' sin que cada texto nombre al otro")
                        elif c['entre_clusters'] and not (pistas[0] or pistas[1]):
                            print(f" -> [Descartada] {nuevo_nombre} ~ {c['nombre']}: entre clústeres distintos y ningún texto nombra al otro concepto")
                        else:
                            origen, destino = (str(nuevo_id), c['id']) if sentido in ("ab", "rel") else (c['id'], str(nuevo_id))
                            aceptadas.append((c['puntuacion'], {"origen_id": origen, "destino_id": destino, "motivo": motivo}))
                            print(f" -> [Arista] {nuevo_nombre} {'->' if origen == str(nuevo_id) else '<-'} {c['nombre']} ({motivo[:40]}...)")
                except Exception as e:
                    fallos += 1
                    print(f"[Conexiones] Error evaluando par {nuevo_nombre}-{c['nombre']}: {e}")
            if progreso:
                progreso(i, total, min(len(aceptadas), MAX_CONEXIONES))
        conexiones = [arista for _, arista in sorted(aceptadas, key=lambda x: x[0], reverse=True)[:MAX_CONEXIONES]]

        ya_conectado = bool(omitir) and any(o == str(nuevo_id) for o, _ in omitir)
        if not conexiones and not ya_conectado:
            mejor = next((c for c in top_k if not c['entre_clusters'] and not (omitir and (str(nuevo_id), c['id']) in omitir)), None)
            if mejor:
                por_que = ("No se pudo consultar al modelo local" if consultados == 0 and fallos
                           else "El modelo local no vio una dependencia clara")
                detalle = (f"Los textos comparten {max(1, round(mejor['menciones']))} término(s) distintivo(s) y la afinidad semántica es {mejor['similitud']:.2f}"
                           if mejor['menciones'] >= 0.5 else f"Afinidad semántica ({mejor['similitud']:.2f})")
                conexiones.append({"origen_id": str(nuevo_id), "destino_id": mejor['id'], "motivo": f"{detalle}. {por_que}: revisa si procede."})
                print(f" -> [Afinidad] {nuevo_nombre} - {mejor['nombre']} ({mejor['similitud']:.2f}), propuesta como pendiente")
        return conexiones

# Instancia global para usar en main.py
clasificador_ia = None

def init_clasificador():
    global clasificador_ia
    if clasificador_ia is None:
        clasificador_ia = ClasificadorLocal()
    return clasificador_ia

def regenerar_aristas(db) -> int:
    """Reevalúa todos los nodos y añade las aristas NUEVAS. Nunca borra ni pisa las existentes
    (aceptadas, rechazadas o manuales); guarda cada nodo según se evalúa, así un fallo no pierde el progreso."""
    clasificador = init_clasificador()
    df = db._get_df()
    if df.empty:
        return 0
    nodos = df.to_dict(orient="records")
    total = 0
    for nodo in nodos:
        emb = nodo.get('embedding')
        if emb is None or len(emb) == 0:
            continue
        try:
            aristas = clasificador.evaluar_conexiones(nodo['id'], nodo['nombre'], nodo.get('teoria', ''), np.array(emb), nodos, omitir=db.get_known_pairs(), nuevo_glosario=nodo.get('glosario'), cluster_nuevo=nodo.get('cluster_id'))
            if aristas:
                db.add_links(aristas, overwrite=False)
                total += len(aristas)
        except Exception as e:
            print(f"Error evaluando conexiones para {nodo['nombre']}: {e}")
    return total
