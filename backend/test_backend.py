r"""Tests del backend. Ejecutar desde backend/:  .venv\Scripts\python.exe -m unittest test_backend -v
No usan Ollama ni el modelo de embeddings, y trabajan en una carpeta de datos temporal."""
import json
import os
import sys
import shutil
import tempfile
import threading
import time
import unittest
from unittest.mock import MagicMock, patch

import numpy as np

DATA_DIR = tempfile.mkdtemp()
os.environ["ALEJANDRIA_DATA_DIR"] = DATA_DIR  # antes de importar database: nunca tocar los datos reales

import ajustes
import clasificador
import intercambio
import ollama_service
import vigilante
from clasificador import ClasificadorLocal
from database import db_conn

clasificador.init_clasificador = lambda: None  # compile_raw_jsons no carga el modelo

import main
from fastapi import HTTPException
from fastapi.testclient import TestClient


def _modelo():
    return object.__new__(ClasificadorLocal)  # sin __init__: no descarga ni carga fastembed


class TestClasificador(unittest.TestCase):
    def test_similitud_coseno(self):
        c = _modelo()
        self.assertAlmostEqual(c._cosine_similarity(np.array([1., 2.]), np.array([2., 4.])), 1.0)
        self.assertAlmostEqual(c._cosine_similarity(np.array([1., 0.]), np.array([0., 1.])), 0.0)
        self.assertEqual(c._cosine_similarity(np.array([0., 0.]), np.array([1., 1.])), 0.0)

    def test_capa_2_elige_el_cluster_mas_cercano_y_salta_embeddings_invalidos(self):
        base = [
            {"cluster_id": "Estadística", "embedding": [1., 0.]},
            {"cluster_id": "Finanzas", "embedding": [0., 1.]},
            {"cluster_id": "Roto", "embedding": []},
            {"cluster_id": "OtraDimension", "embedding": [1., 0., 0.]},
        ]
        cluster, sim = _modelo()._capa_2_embeddings(np.array([0.9, 0.1]), base)
        self.assertEqual(cluster, "Estadística")
        self.assertGreater(sim, 0.9)

    def test_capa_2_pesa_mas_las_correcciones_manuales(self):
        base = [
            {"cluster_id": "Automático", "embedding": [1., 0.]},
            {"cluster_id": "Corregido", "embedding": [1., 0.3], "origen": "correccion_manual"},
        ]
        # Sin el 15% extra ganaría "Automático" (coseno 1.00 vs 0.96): con él gana la corrección del usuario.
        cluster, _ = _modelo()._capa_2_embeddings(np.array([1., 0.]), base)
        self.assertEqual(cluster, "Corregido")


class TestClusterPropuesto(unittest.TestCase):
    EXISTENTES = ["Estadística", "Finanzas"]

    def test_normaliza_tildes_y_mayusculas_al_nombre_existente(self):
        self.assertEqual(clasificador.resolver_cluster_propuesto("  estadistica ", self.EXISTENTES), ("Estadística", False))

    def test_un_nombre_desconocido_es_un_cluster_nuevo(self):
        self.assertEqual(clasificador.resolver_cluster_propuesto("Biometría y Demografía", self.EXISTENTES), ("Biometría y Demografía", True))

    def test_propuestas_invalidas_se_ignoran(self):
        for malo in [None, 12, "", "   ", "x" * 41, "Desconocido", " desconocido "]:
            self.assertEqual(clasificador.resolver_cluster_propuesto(malo, self.EXISTENTES), (None, False), repr(malo))

    def _clasificar(self, base, propuesto):
        with patch.object(ClasificadorLocal, "get_embedding", return_value=np.array([1., 0.])), \
             patch.object(ClasificadorLocal, "_capa_4_llm_ollama", return_value="Desconocido"):
            return _modelo().clasificar_neurona("T", "texto sin nombres de clúster", base, self.EXISTENTES, cluster_propuesto=propuesto)["cluster"]

    def test_un_vecino_casi_identico_gana_a_la_propuesta(self):
        base = [{"cluster_id": "Finanzas", "embedding": [1., 0.05]}]
        self.assertEqual(self._clasificar(base, "Estadística"), "Finanzas")

    def test_sin_vecino_cercano_se_usa_la_propuesta_aunque_sea_nueva(self):
        base = [{"cluster_id": "Finanzas", "embedding": [0., 1.]}]
        self.assertEqual(self._clasificar(base, "Biometría y Demografía"), "Biometría y Demografía")

    def test_sin_propuesta_ni_vecino_sigue_el_embudo_anterior(self):
        base = [{"cluster_id": "Finanzas", "embedding": [0., 1.]}]
        self.assertEqual(self._clasificar(base, None), "Desconocido")


class TestSinapsis(unittest.TestCase):
    """Juez bidireccional de conexiones con Ollama simulado: el veredicto sale del nombre del Concepto B del prompt."""
    MOTIVO = "Vínculo concreto y específico entre ambos conceptos"   # un motivo corto o copiado de la pista se descarta
    BASE = [{"id": i, "nombre": i.upper(), "embedding": [1., 0.1 * n], "teoria": f"## Teoría de {i}", "glosario": json.dumps([{"termino": f"término-{i}"}])}
            for n, i in enumerate(["a", "b", "c", "d", "e", "f", "g"])]

    def evaluar(self, veredictos, omitir=None, progreso=None, base=None, error=False):
        prompts = []

        def urlopen(req, timeout=None):
            if error:
                raise OSError("Ollama apagado")
            prompt = json.loads(req.data.decode())["prompt"]
            prompts.append(prompt)
            nombre = prompt.split("Concepto B: ")[1].split("\n")[0]
            resp = MagicMock()
            resp.__enter__.return_value = resp
            resp.read.return_value = json.dumps({"response": json.dumps(veredictos.get(nombre, {"relacion": "ninguna", "motivo": "x"}))}).encode()
            return resp

        with patch.object(clasificador, "ensure_ollama_running"), patch.object(clasificador, "get_best_llm_model", return_value="m"), \
             patch.object(clasificador.urllib.request, "urlopen", side_effect=urlopen):
            res = _modelo().evaluar_conexiones("a", "A", "texto de A", np.array([1., 0.]), base or self.BASE,
                                               omitir=omitir, nuevo_glosario=[{"termino": "término-a"}], progreso=progreso)
        return res, prompts

    def test_el_sentido_decide_origen_y_destino(self):
        m = self.MOTIVO
        res, _ = self.evaluar({"B": {"relacion": "A_se_basa_en_B", "motivo": m}, "C": {"relacion": "B_se_basa_en_A", "motivo": m},
                               "D": {"relacion": "relacionados", "motivo": m}, "E": {"relacion": "ninguna", "motivo": m}})
        # 'relacionados' sin que cada texto nombre al otro (aquí no se nombran) se descarta
        self.assertEqual([(r["origen_id"], r["destino_id"]) for r in res], [("a", "b"), ("c", "a")])

    def test_el_juez_ve_glosario_y_resumen_de_los_dos_conceptos(self):
        _, prompts = self.evaluar({})
        self.assertIn("Términos clave A: término-a", prompts[0])
        self.assertIn("Términos clave B: término-b", prompts[0])
        self.assertIn("Resumen B: Teoría de b", prompts[0])  # sin el '##' del Markdown

    def test_guarda_como_mucho_max_conexiones(self):
        res, prompts = self.evaluar({n: {"relacion": "A_se_basa_en_B", "motivo": self.MOTIVO} for n in "BCDEFG"})
        self.assertEqual(len(res), clasificador.MAX_CONEXIONES)
        self.assertEqual(clasificador.MAX_CONEXIONES, 3)
        self.assertEqual(len([p for p in prompts if p.startswith("Eres un juez")]), 6)  # se juzgan todos los candidatos y se quedan los MEJORES, no los primeros que salgan

    def _juzgar(self, correcto, relacion="A_se_basa_en_B"):
        """_juzgar_par con un modelo que responde `relacion` al juez y `correcto` a la segunda revisión; devuelve (resultado, prompts)."""
        prompts = []

        def urlopen(req, timeout=None):
            prompt = json.loads(req.data.decode())["prompt"]
            prompts.append(prompt)
            if prompt.startswith("Otro juez ha concluido"):
                if isinstance(correcto, Exception):
                    raise correcto
                cuerpo = {} if correcto is None else {"correcto": correcto}
            else:
                cuerpo = {"relacion": relacion, "motivo": self.MOTIVO}
            resp = MagicMock(); resp.__enter__.return_value = resp
            resp.read.return_value = json.dumps({"response": json.dumps(cuerpo)}).encode()
            return resp

        with patch.object(clasificador.urllib.request, "urlopen", side_effect=urlopen):
            return _modelo()._juzgar_par("m", ("A", "ta", "ra"), ("B", "tb", "rb")), prompts

    def test_el_juez_escribe_en_castellano(self):
        _, prompts = self._juzgar(True)
        self.assertIn("castellano de España", prompts[0])

    def test_el_juez_admite_vinculos_historicos_solo_como_relacionados(self):
        juicio, prompts = self._juzgar(True, relacion="relacionados")
        self.assertEqual(juicio, ("rel", self.MOTIVO))
        self.assertIn("vínculo histórico o conceptual directo", prompts[0])
        self.assertIn("Un vínculo histórico es «relacionados»", prompts[0])    # nunca una flecha de dependencia por ser de la misma época o autor

    def test_segunda_revision_que_duda_de_la_direccion_baja_el_veredicto_a_relacionados(self):
        for no_confirma in (False, "false"):
            with self.subTest(respuesta=no_confirma):
                juicio, prompts = self._juzgar(no_confirma)
                self.assertEqual(juicio, ("rel", self.MOTIVO))          # no se pierde el vínculo (binomial ~ Poisson), solo se le quita la dirección
                self.assertEqual(len(prompts), 2)                       # juicio + revisión
                self.assertIn(self.MOTIVO, prompts[1])                  # la revisión ve el veredicto y el motivo
                self.assertIn("A se basa en B", prompts[1])

    def test_la_segunda_revision_nunca_quita_el_vinculo_solo_la_direccion(self):
        juicio, _ = self._juzgar(False, relacion="relacionados")
        self.assertEqual(juicio, ("rel", self.MOTIVO))                  # ya era «relacionados» (exige pistas en ambos textos): se conserva

    def test_una_direccion_dudosa_sin_pistas_en_ambos_textos_no_se_guarda(self):
        base = [{"id": "w", "nombre": "Proceso de Wiener", "embedding": [1., 0.], "glosario": [], "teoria": "Intro histórica sin nada más."}]
        def urlopen(req, timeout=None):
            prompt = json.loads(req.data.decode())["prompt"]
            cuerpo = {"correcto": False} if prompt.startswith("Otro juez ha concluido") else {"relacion": "A_se_basa_en_B", "motivo": self.MOTIVO}
            resp = MagicMock(); resp.__enter__.return_value = resp
            resp.read.return_value = json.dumps({"response": json.dumps(cuerpo)}).encode()
            return resp
        with patch.object(clasificador, "ensure_ollama_running"), patch.object(clasificador, "get_best_llm_model", return_value="m"),              patch.object(clasificador.urllib.request, "urlopen", side_effect=urlopen):
            res = _modelo().evaluar_conexiones("n", "Opciones", "Aquí se usa el proceso de Wiener como base.", np.array([1., 0.]), base, nuevo_glosario=[])
        self.assertIn("no vio una dependencia clara", res[0]["motivo"])    # bajó a «relacionados», y B no nombra a A: solo queda la propuesta de afinidad

    def test_la_segunda_revision_ve_las_mismas_pistas_y_solo_rechaza_lo_claramente_erroneo(self):
        prompts = []

        def urlopen(req, timeout=None):
            prompts.append(json.loads(req.data.decode())["prompt"])
            resp = MagicMock(); resp.__enter__.return_value = resp
            resp.read.return_value = json.dumps({"response": json.dumps({"relacion": "A_se_basa_en_B", "motivo": self.MOTIVO} if len(prompts) == 1 else {"correcto": True})}).encode()
            return resp
        with patch.object(clasificador.urllib.request, "urlopen", side_effect=urlopen):
            _modelo()._juzgar_par("m", ("A", "ta", "ra"), ("B", "tb", "rb"), ("frase de A que nombra a B", ""))
        self.assertIn("frase de A que nombra a B", prompts[1])           # la revisión no juzga a ciegas
        self.assertIn("SOLO si la conclusión es claramente errónea", prompts[1])

    def test_segunda_revision_confirmada_o_sin_respuesta_clara_conserva_el_veredicto(self):
        for respuesta in (True, None, OSError("sin red")):            # solo un "correcto": false lo descarta
            with self.subTest(respuesta=repr(respuesta)):
                juicio, _ = self._juzgar(respuesta)
                self.assertEqual(juicio, ("ab", self.MOTIVO))

    def test_relacionados_solo_vale_si_cada_texto_nombra_al_otro_pero_una_dependencia_clara_no_lo_necesita(self):
        # solo el texto de A nombra a "Wiener" (B no nombra nada de A): 'relacionados' se descarta y queda la propuesta de afinidad
        base = [{"id": "w", "nombre": "Proceso de Wiener", "embedding": [1., 0.], "glosario": [], "teoria": "Intro histórica sin nada más."}]
        def evaluar(veredicto, teoria_b):
            base[0]["teoria"] = teoria_b
            prompts = []
            resp = MagicMock(); resp.__enter__.return_value = resp
            resp.read.return_value = json.dumps({"response": json.dumps(veredicto)}).encode()
            with patch.object(clasificador, "ensure_ollama_running"), patch.object(clasificador, "get_best_llm_model", return_value="m"),                  patch.object(clasificador.urllib.request, "urlopen", return_value=resp):
                return _modelo().evaluar_conexiones("n", "Opciones", "Aquí se usa el proceso de Wiener como base.", np.array([1., 0.]), base, nuevo_glosario=[])
        rel = {"relacion": "relacionados", "motivo": self.MOTIVO}
        res = evaluar(rel, "Intro histórica sin nada más.")
        self.assertIn("no vio una dependencia clara", res[0]["motivo"])
        res = evaluar(rel, "Intro. Sirve para valorar las opciones financieras. Fin.")       # ahora B también nombra a A ("opciones")
        self.assertEqual(res[0]["motivo"], self.MOTIVO)
        res = evaluar({"relacion": "A_se_basa_en_B", "motivo": self.MOTIVO}, "Intro histórica sin nada más.")
        self.assertEqual(res[0]["motivo"], self.MOTIVO)

    def test_descarta_motivos_cortos_o_copiados_de_la_pista(self):
        base = [{"id": "w", "nombre": "Proceso de Wiener", "embedding": [1., 0.], "glosario": [], "teoria": "Intro. Sirve para valorar las opciones financieras. Fin."}]
        copia = "La frase 'El precio usa el proceso de Wiener como base de todo el modelo.' indica una práctica"
        for motivo in ("corto", copia, "Frase del texto de A que nombra algo de B: El precio usa el proceso de Wiener como base de todo el modelo."):
            with self.subTest(motivo=motivo[:30]):
                resp = MagicMock(); resp.__enter__.return_value = resp
                resp.read.return_value = json.dumps({"response": json.dumps({"relacion": "A_se_basa_en_B", "motivo": motivo})}).encode()
                with patch.object(clasificador, "ensure_ollama_running"), patch.object(clasificador, "get_best_llm_model", return_value="m"),                      patch.object(clasificador.urllib.request, "urlopen", return_value=resp):
                    res = _modelo().evaluar_conexiones("n", "Opciones", "Intro. El precio usa el proceso de Wiener como base de todo el modelo. Fin.",
                                                       np.array([1., 0.]), base, nuevo_glosario=[])
                self.assertEqual(len(res), 1)
                self.assertIn("no vio una dependencia clara", res[0]["motivo"])    # el veredicto no cuenta: solo queda la propuesta de afinidad

    def test_el_juez_recibe_las_frases_que_nombran_al_otro_concepto(self):
        base = [{"id": "w", "nombre": "Proceso de Wiener", "embedding": [1., 0.], "glosario": [],
                 "teoria": "Intro histórica. Es la base del precio de las opciones. Final."}]
        prompts = []
        modelo = _modelo()
        resp = MagicMock(); resp.__enter__.return_value = resp
        resp.read.return_value = json.dumps({"response": json.dumps({"relacion": "ninguna", "motivo": "x"})}).encode()
        with patch.object(clasificador, "ensure_ollama_running"), patch.object(clasificador, "get_best_llm_model", return_value="m"),              patch.object(clasificador.urllib.request, "urlopen", side_effect=lambda req, timeout=None: prompts.append(json.loads(req.data.decode())["prompt"]) or resp):
            modelo.evaluar_conexiones("n", "Opciones", "Intro. El precio usa el proceso de Wiener como base. Fin.", np.array([1., 0.]), base, nuevo_glosario=[])
        self.assertIn("Frases del texto de A que nombran algo de B: «El precio usa el proceso de Wiener como base.»", prompts[0])
        self.assertIn("Frases del texto de B que nombran algo de A: «Es la base del precio de las opciones.»", prompts[0])

    def test_si_el_modelo_dice_ninguna_a_todo_propone_la_mas_afin_como_pendiente(self):
        res, _ = self.evaluar({})
        self.assertEqual(len(res), 1)
        self.assertEqual((res[0]["origen_id"], res[0]["destino_id"]), ("a", "b"))
        self.assertIn("Afinidad semántica", res[0]["motivo"])
        self.assertIn("no vio una dependencia clara", res[0]["motivo"])

    def test_sin_ollama_tambien_propone_la_afin_y_lo_dice(self):
        res, _ = self.evaluar({}, error=True)
        self.assertEqual(len(res), 1)
        self.assertIn("No se pudo consultar al modelo local", res[0]["motivo"])

    def test_si_ya_tiene_aristas_no_inventa_afinidad(self):
        res, _ = self.evaluar({}, omitir={("a", "z"), ("z", "a")})
        self.assertEqual(res, [])

    def test_un_texto_que_nombra_a_otro_concepto_lo_sube_aunque_el_embedding_lo_vea_lejos(self):
        base = [{"id": f"n{i}", "nombre": nombre, "embedding": [1., 0.2 * i], "teoria": "texto", "glosario": []}
                for i, nombre in enumerate(["Distribución Poisson", "Cuerpo Aritmética", "Proceso de Wiener"], 1)]
        orden = []
        modelo = _modelo()
        with patch.object(clasificador, "ensure_ollama_running"), patch.object(clasificador, "get_best_llm_model", return_value="m"),              patch.object(modelo, "_juzgar_par", side_effect=lambda m, a, b, pistas=("", ""): orden.append(b[0])):
            # "Proceso de Wiener" es el MÁS lejano por embedding, pero el texto nuevo habla del incremento de Wiener
            modelo.evaluar_conexiones("nuevo", "Distribución Normal", "el incremento de Wiener es normal", np.array([1., 0.]), base, nuevo_glosario=[])
        self.assertEqual(orden[0], "Proceso de Wiener")
        self.assertEqual(sorted(orden), sorted(n["nombre"] for n in base))   # sin umbral fijo: se juzgan todos

    def test_informa_del_progreso(self):
        pasos = []
        self.evaluar({"B": {"relacion": "A_se_basa_en_B", "motivo": self.MOTIVO}}, progreso=lambda h, t, c: pasos.append((h, t, c)))
        self.assertEqual(pasos[0], (0, 6, 0))
        self.assertEqual(pasos[-1], (6, 6, 1))

    def test_estado_de_la_busqueda_cuenta_trabajos_en_paralelo(self):
        s = main._Sinapsis()
        s.empezar("X"); s.empezar("Y")
        s.avance("Y")(3, 10, 1)
        self.assertEqual(s.leer(), {"activo": True, "nodo": "Y", "hecho": 3, "total": 10, "conexiones": 1})
        s.terminar()
        self.assertTrue(s.leer()["activo"])    # queda un trabajo
        s.terminar()
        self.assertFalse(s.leer()["activo"])
        self.assertEqual(TestClient(main.app, base_url="http://127.0.0.1").get("/api/sinapsis/estado").json()["activo"], False)


class TestEvaluarConexiones(unittest.TestCase):
    def test_no_llama_al_llm_para_parejas_ya_decididas(self):
        base = [{"id": i, "nombre": i.upper(), "embedding": [1., 0.1 * n]} for n, i in enumerate(["a", "b", "c"])]
        respuesta = MagicMock()
        respuesta.__enter__.return_value = respuesta  # urlopen se usa con "with"
        respuesta.read.return_value = json.dumps({"response": '{"depende": true, "motivo": "Vínculo concreto y específico entre ambos"}'}).encode()
        with patch.object(clasificador, "ensure_ollama_running"), \
             patch.object(clasificador, "get_best_llm_model", return_value="x"), \
             patch.object(clasificador.urllib.request, "urlopen", return_value=respuesta) as llm:
            todas = _modelo().evaluar_conexiones("a", "A", "t", np.array([1., 0.]), base)
            self.assertEqual({a["destino_id"] for a in todas}, {"b", "c"})
            self.assertEqual(llm.call_count, 4)      # 2 parejas aceptadas: cada una se juzga y se revisa una segunda vez

            llm.reset_mock()
            nuevas = _modelo().evaluar_conexiones("a", "A", "t", np.array([1., 0.]), base, omitir={("a", "b")})
            self.assertEqual({a["destino_id"] for a in nuevas}, {"c"})
            self.assertEqual(llm.call_count, 2)      # la pareja ya decidida no gasta ninguna llamada

    def test_db_devuelve_las_parejas_conocidas_en_ambas_direcciones(self):
        db_conn.add_links([{"origen_id": "u", "destino_id": "v", "motivo": "m", "estado": "rechazada"}])
        pares = db_conn.get_known_pairs()
        self.assertIn(("u", "v"), pares)
        self.assertIn(("v", "u"), pares)


class TestGuardarLaboratorio(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.makedirs(os.path.join(DATA_DIR, "raw"), exist_ok=True)
        cls.ruta = os.path.join(DATA_DIR, "raw", "lab1.json")
        cls.client = TestClient(main.app, base_url="http://127.0.0.1")

    def setUp(self):
        with open(self.ruta, "w", encoding="utf-8") as f:
            json.dump({"nombre": "L", "teoria": "t", "extra": {"se": "conserva"}, "laboratorio": {"explicacion": "vieja", "controles": [], "codigo": "print(0)"}}, f)

    def put(self, controles, codigo="print({a})", node="lab1", **extra):
        return self.client.put(f"/api/node/{node}/laboratorio", json={"controles": controles, "codigo": codigo, **extra})

    SLIDER = {"variable": "a", "label": "A", "tipo": "slider", "min": 0, "max": 10, "step": 0.5, "default": 2}

    def test_guarda_el_laboratorio_conservando_el_resto_del_nodo(self):
        r = self.put([self.SLIDER, {"variable": "ver", "label": "Ver", "tipo": "checkbox", "default": True, "grupo": "Opciones"},
                      {"variable": "modo", "label": "Modo", "tipo": "select", "opciones": ["x", {"valor": "y", "label": "Y"}], "default": "y"}])
        self.assertEqual(r.status_code, 200, r.text)
        with open(self.ruta, encoding="utf-8") as f:
            nodo = json.load(f)
        self.assertEqual(nodo["extra"], {"se": "conserva"})
        self.assertEqual(nodo["laboratorio"]["explicacion"], "vieja")            # no se pierde si no se envía
        self.assertEqual(nodo["laboratorio"]["codigo"], "print({a})")
        self.assertEqual([c["variable"] for c in nodo["laboratorio"]["controles"]], ["a", "ver", "modo"])
        self.assertEqual(nodo["laboratorio"]["controles"][1]["grupo"], "Opciones")
        self.assertFalse(os.path.exists(self.ruta + ".tmp"))

    def test_una_explicacion_nueva_reemplaza_a_la_vieja_y_se_permiten_cero_controles(self):
        self.assertEqual(self.put([], explicacion="nueva").status_code, 200)
        with open(self.ruta, encoding="utf-8") as f:
            self.assertEqual(json.load(f)["laboratorio"], {"explicacion": "nueva", "controles": [], "codigo": "print({a})"})

    def test_admite_muchas_variables(self):
        muchos = [{**self.SLIDER, "variable": f"v{i}"} for i in range(24)]
        self.assertEqual(self.put(muchos).status_code, 200)
        self.assertEqual(self.put(muchos + [{**self.SLIDER, "variable": "v24"}]).status_code, 422)

    def test_rechaza_controles_incoherentes(self):
        malos = {
            "variable con nombre inválido": {**self.SLIDER, "variable": "1x"},
            "min mayor que max": {**self.SLIDER, "min": 5, "max": 1},
            "step cero": {**self.SLIDER, "step": 0},
            "defecto fuera de rango": {**self.SLIDER, "default": 99},
            "deslizable sin step": {k: v for k, v in self.SLIDER.items() if k != "step"},
            "casilla con número": {"variable": "c", "label": "C", "tipo": "checkbox", "default": 1},
            "select sin opciones": {"variable": "s", "label": "S", "tipo": "select", "default": "x"},
            "select con defecto ausente": {"variable": "s", "label": "S", "tipo": "select", "opciones": ["x"], "default": "z"},
            "tipo desconocido": {**self.SLIDER, "tipo": "rueda"},
        }
        for nombre, control in malos.items():
            with self.subTest(nombre):
                self.assertEqual(self.put([control]).status_code, 422)
        self.assertEqual(self.put([self.SLIDER, self.SLIDER]).status_code, 422)      # variable repetida

    def test_rechaza_codigo_vacio_o_gigante_nodo_inexistente_e_id_peligroso(self):
        self.assertEqual(self.put([], codigo="").status_code, 422)
        self.assertEqual(self.put([], codigo="x" * 60001).status_code, 422)
        self.assertEqual(self.put([], node="no_existe").status_code, 404)
        self.assertEqual(self.put([], node="..%5Cx").status_code, 400)


class TestBorrarNeurona(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.makedirs(os.path.join(DATA_DIR, "raw"), exist_ok=True)
        cls.client = TestClient(main.app, base_url="http://127.0.0.1")

    def nodo(self, nid):
        with open(os.path.join(DATA_DIR, "raw", f"{nid}.json"), "w", encoding="utf-8") as f:
            json.dump({"nombre": nid, "teoria": "t"}, f)

    def test_borrar_una_neurona_quita_sus_aristas_y_no_reviven_al_recrearla(self):
        for n in ("del_x", "del_y", "del_z"):
            self.nodo(n)
        db_conn.add_links([{"origen_id": "del_x", "destino_id": "del_y", "motivo": "m", "estado": "rechazada"},
                           {"origen_id": "del_z", "destino_id": "del_x", "motivo": "m", "estado": "aceptada"},
                           {"origen_id": "del_y", "destino_id": "del_z", "motivo": "m", "estado": "aceptada"}])
        r = self.client.delete("/api/node/del_x")
        self.assertEqual(r.status_code, 200)
        self.assertGreaterEqual(r.json()["aristas_quitadas"], 2)               # las dos suyas (y las huérfanas de otros tests, si las hay)
        self.assertEqual({(p[0], p[1]) for p in db_conn.get_known_pairs()} & {("del_x", "del_y"), ("del_z", "del_x")}, set())
        self.assertIn(("del_y", "del_z"), db_conn.get_known_pairs())            # las de otras neuronas se conservan
        self.nodo("del_x")                                                     # se vuelve a crear con el mismo id
        self.assertEqual([l for l in db_conn.get_links_metadata() if "del_x" in (l["origen_id"], l["destino_id"])], [])

    def test_tambien_limpia_las_huerfanas_que_ya_hubiera_y_borrar_todas_deja_cero_aristas(self):
        self.nodo("del_p")
        db_conn.add_links([{"origen_id": "del_p", "destino_id": "fantasma", "motivo": "m"}])   # "fantasma" no existe: huérfana de antes
        self.assertEqual(self.client.delete("/api/node/del_p").json()["aristas_quitadas"] >= 1, True)
        for f in os.listdir(os.path.join(DATA_DIR, "raw")):
            if f.endswith(".json"):
                self.client.delete(f"/api/node/{f[:-5]}")
        self.assertEqual(db_conn.get_links_metadata(), [])
        self.assertEqual(self.client.get("/api/universe").json(), {"nodes": [], "links": []})

    def test_sin_carpeta_de_nodos_no_borra_ninguna_arista(self):
        db_conn.add_links([{"origen_id": "keep_a", "destino_id": "keep_b", "motivo": "m"}])
        with patch.object(os.path, "isdir", return_value=False):
            self.assertEqual(db_conn.quitar_aristas_huerfanas(), 0)
        self.assertIn(("keep_a", "keep_b"), db_conn.get_known_pairs())


class TestRawPath(unittest.TestCase):
    def test_acepta_ids_normales_dentro_de_raw(self):
        self.assertEqual(main.raw_path("lema_de_ito"), os.path.join(DATA_DIR, "raw", "lema_de_ito.json"))

    def test_rechaza_ids_que_se_salen_de_raw(self):
        for malo in ["../x", "a/b", "..\\x", "", "a.b", "x\n"]:
            with self.assertRaises(HTTPException, msg=malo):
                main.raw_path(malo)


class TestAristas(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.makedirs(os.path.join(DATA_DIR, "raw"), exist_ok=True)
        for nid in ("a", "b"):
            with open(os.path.join(DATA_DIR, "raw", f"{nid}.json"), "w", encoding="utf-8") as f:
                json.dump({"nombre": nid.upper(), "teoria": "t"}, f)
        cls.client = TestClient(main.app, base_url="http://127.0.0.1")

    def test_no_pisa_aristas_existentes_en_ninguna_direccion(self):
        db_conn.add_links([{"origen_id": "p", "destino_id": "q", "motivo": "m", "estado": "rechazada"}])
        db_conn.add_links([{"origen_id": "q", "destino_id": "p", "motivo": "m"}], overwrite=False)
        db_conn.add_links([{"origen_id": "p", "destino_id": "q", "motivo": "m"}], overwrite=False)
        pares = [(l["origen_id"], l["destino_id"], l["estado"]) for l in db_conn.get_links_metadata()]
        self.assertNotIn(("p", "q", "pendiente"), pares)
        self.assertNotIn(("q", "p", "pendiente"), pares)

    def test_estado_invalido_se_rechaza(self):
        r = self.client.put("/api/arista/status", json={"origen_id": "a", "destino_id": "b", "status": "talvez"})
        self.assertEqual(r.status_code, 422)

    def test_arista_manual_valida_los_nodos(self):
        post = lambda o, d: self.client.post("/api/arista", json={"origen_id": o, "destino_id": d, "motivo": "m"})
        self.assertEqual(post("a", "a").status_code, 400)
        self.assertEqual(post("a", "no_existe").status_code, 404)
        self.assertEqual(post("a", "b").status_code, 200)

    def test_arranque_ejecuta_el_hook_del_lifespan(self):
        with patch.object(main, "startup_event") as arranque:
            with TestClient(main.app, base_url="http://127.0.0.1"):
                arranque.assert_called_once()

    def test_origen_ajeno_recibe_403_aunque_sea_text_plain(self):
        r = self.client.post("/api/arista", content='{"origen_id": "a", "destino_id": "b", "motivo": "m"}',
                             headers={"Origin": "https://evil.example", "Content-Type": "text/plain"})
        self.assertEqual(r.status_code, 403)

    def test_host_ajeno_recibe_403_aunque_no_haya_origin(self):    # DNS rebinding: GET "mismo origen" desde un dominio que apunta a 127.0.0.1
        for host in ("evil.example", "evil.example:8000", "127.0.0.1.evil.example", "localhost.evil.example:8000", ""):
            r = self.client.get("/api/exportar", headers={"Host": host})
            self.assertEqual(r.status_code, 403, host)

    def test_hosts_locales_pasan(self):
        for host in ("127.0.0.1:8000", "localhost:8000", "LOCALHOST:51234", "[::1]:8000", "127.0.0.1"):
            self.assertEqual(self.client.get("/", headers={"Host": host}).status_code, 200, host)


class TestJsonTolerante(unittest.TestCase):
    def test_un_json_valido_no_se_toca(self):
        self.assertEqual(main.cargar_json_tolerante(r'{"a": "x\ny \\theta \u00e9 \"q\""}'), {"a": 'x\ny \\theta é "q"'})

    def test_latex_sin_duplicar_la_barra_se_repara(self):
        d = main.cargar_json_tolerante(r'{"t": "Sea $\lambda > 0$ y \(\alpha\) con \[x\]"}')
        self.assertEqual(d["t"], r"Sea $\lambda > 0$ y \(\alpha\) con \[x\]")

    def test_comandos_que_parecen_escapes_validos_tambien_se_reparan_si_el_json_ya_fallaba(self):
        # \lambda lo rompe; \theta, \frac, \nu, \rho y \times parecerían TAB, salto de página, salto de línea, retorno y TAB si se dejaran
        d = main.cargar_json_tolerante(r'{"t": "\lambda \theta \frac{1}{2} \nu \rho \times \to \beta"}')
        self.assertEqual(d["t"], r"\lambda \theta \frac{1}{2} \nu \rho \times \to \beta")

    def test_los_saltos_de_linea_reales_se_conservan_aunque_empiecen_como_un_comando(self):
        d = main.cargar_json_tolerante(r'{"t": "\lambda\nuevo texto\ttabulado\n\nFin \\ ya doble"}')
        self.assertEqual(d["t"], "\\lambda\nuevo texto\ttabulado\n\nFin \\ ya doble")

    def test_admite_saltos_de_linea_literales_dentro_de_un_texto(self):
        self.assertEqual(main.cargar_json_tolerante('{"t": "linea1\nlinea2 \\lambda"}')["t"], "linea1\nlinea2 \\lambda")

    def test_lo_que_no_es_json_sigue_fallando(self):
        with self.assertRaises(ValueError):
            main.cargar_json_tolerante('{"t": ')

    def test_comillas_sin_escapar_dentro_de_un_texto_se_conservan(self):
        # prosa histórica con citas textuales: la IA no escapa las comillas dobles
        d = main.cargar_json_tolerante('{"t": "Escribió: "incluso el más necio lo sabe" y lo llamó "teorema de oro". Fin.", "u": 1}')
        self.assertEqual(d, {"t": 'Escribió: "incluso el más necio lo sabe" y lo llamó "teorema de oro". Fin.', "u": 1})
        d = main.cargar_json_tolerante('{"a": [{"x": "dijo "hola"", "y": "ok"}], "b": "con \\\\lambda y "citas""}')
        self.assertEqual(d["a"][0], {"x": 'dijo "hola"', "y": "ok"})
        self.assertEqual(d["b"], 'con \\lambda y "citas"')

    def test_una_coma_que_falta_entre_elementos_se_repone(self):
        d = main.cargar_json_tolerante('{\n "r": [\n  {"a": 1}\n  {"a": 2}\n ],\n "s": "x"\n "t": true\n "n": 3\n "z": null\n}')
        self.assertEqual(d, {"r": [{"a": 1}, {"a": 2}], "s": "x", "t": True, "n": 3, "z": None})

    def test_la_reparacion_no_inventa_json_valido_de_la_nada(self):
        # (dos textos seguidos, como "a" "b", se leen como un solo texto con comillas dentro: es justo lo que se repara)
        for roto in ('{"t": [1 2]}', '{"t" "x"}', '{"t": "x"', '{"t": tru}'):
            with self.subTest(roto=roto), self.assertRaises(ValueError):
                main.cargar_json_tolerante(roto)

    def test_la_ruta_de_inyeccion_acepta_una_neurona_historica_con_json_imperfecto(self):
        """Neurona histórica como la pide el prompt nuevo (sin ejercicios ni laboratorio), con comillas sin escapar y una coma que falta."""
        client = TestClient(main.app, base_url="http://127.0.0.1")
        raw = '''```json
{
    "id": "hist_bernoulli_x",
    "cluster": "Estadística",
    "nombre": "Bernoulli y el origen de la probabilidad",
    "teoria": "## Contexto\\n\\nBernoulli escribió: "cuantas más observaciones, menor el riesgo" en 1713.\\n\\n## Legado\\n\\nSu "teorema de oro" abrió la inferencia.",
    "glosario": [
        {"termino": "Ars Conjectandi", "definicion": "Obra póstuma de Jacob Bernoulli (1713)."}
    ],
    "ejercicios": [],
    "referencias": [
        {"titulo": "Ars Conjectandi", "autores": "Bernoulli, J. (1713)", "url": "https://scholar.google.com/scholar?q=Ars+Conjectandi", "nota": "Origen."}
        {"titulo": "A History of Probability and Statistics", "autores": "Hald, A. (1990)", "url": "https://scholar.google.com/scholar?q=Hald", "nota": "Contexto[reference:3]."}
    ],
    "laboratorio": {"explicacion": "", "controles": [], "codigo": ""}
}
```'''
        try:
            r = client.post("/api/node", json={"raw_json": raw})
            self.assertEqual(r.status_code, 200, r.text)
            n = client.get("/node/hist_bernoulli_x").json()
            self.assertIn('Bernoulli escribió: "cuantas más observaciones, menor el riesgo" en 1713.', n["teoria"])
            self.assertIn('Su "teorema de oro" abrió la inferencia.', n["teoria"])
            self.assertEqual(n["ejercicios"], [])
            self.assertEqual(n["laboratorio"].get("codigo", ""), "")        # sin laboratorio: el panel ofrece crearlo
            self.assertEqual([x["autores"] for x in n["referencias"]], ["Bernoulli, J. (1713)", "Hald, A. (1990)"])
            self.assertEqual(n["referencias"][1]["nota"], "Contexto.")      # y la marca de cita se limpia igualmente
        finally:
            client.delete("/api/node/hist_bernoulli_x")

    def test_la_ruta_de_inyeccion_acepta_latex_sin_duplicar(self):
        client = TestClient(main.app, base_url="http://127.0.0.1")
        raw = r'{"id": "json_tol_x", "nombre": "N", "teoria": "Sea $\lambda$ y $\frac{1}{2}$", "cluster": "X"}'
        try:
            self.assertEqual(client.post("/api/node", json={"raw_json": raw}).status_code, 200)
            self.assertEqual(client.get("/node/json_tol_x").json()["teoria"], r"Sea $\lambda$ y $\frac{1}{2}$")
        finally:
            client.delete("/api/node/json_tol_x")


class TestVigilante(unittest.TestCase):
    def test_un_proceso_vivo_y_uno_terminado(self):
        import subprocess
        self.assertTrue(vigilante.proceso_vivo(os.getpid()))
        p = subprocess.Popen([sys.executable, "-c", "pass"])
        p.wait()
        self.assertFalse(vigilante.proceso_vivo(p.pid))

    def test_el_backend_se_cierra_cuando_muere_el_padre(self):
        import subprocess, threading
        p = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(60)"])
        cerrado = threading.Event()
        vigilante.vigilar_padre(p.pid, cada=0.1, salir=cerrado.set)
        self.assertFalse(cerrado.wait(0.5))       # mientras el padre vive, no se cierra
        p.kill(); p.wait()
        self.assertTrue(cerrado.wait(3))


class TestAjustes(unittest.TestCase):
    def setUp(self):
        self.ruta = os.path.join(tempfile.mkdtemp(), "ajustes.json")
        p = patch.object(ajustes, "RUTA", self.ruta)
        p.start()
        self.addCleanup(p.stop)

    def test_sin_archivo_o_con_basura_valen_los_valores_por_defecto(self):
        self.assertEqual(ajustes.leer(), {"ia_activa": True, "modelo": "", "buscar_actualizaciones": True, "carpeta_sincronizacion": "", "sincronizar_auto": True})
        with open(self.ruta, "w") as f:
            f.write("{no es json")
        self.assertEqual(ajustes.leer(), {"ia_activa": True, "modelo": "", "buscar_actualizaciones": True, "carpeta_sincronizacion": "", "sincronizar_auto": True})

    def test_guardar_ignora_claves_desconocidas_y_tipos_incorrectos(self):
        ajustes.guardar({"ia_activa": False, "modelo": "qwen2.5:3b", "otra": 1})
        ajustes.guardar({"ia_activa": "no", "modelo": 5})
        self.assertEqual(ajustes.leer(), {"ia_activa": False, "modelo": "qwen2.5:3b", "buscar_actualizaciones": True, "carpeta_sincronizacion": "", "sincronizar_auto": True})

    def test_la_busqueda_de_actualizaciones_se_puede_apagar_y_se_guarda(self):
        self.assertTrue(ajustes.leer()["buscar_actualizaciones"])             # por defecto avisa de versiones nuevas
        ajustes.guardar({"buscar_actualizaciones": False})
        self.assertFalse(ajustes.leer()["buscar_actualizaciones"])
        ajustes.guardar({"buscar_actualizaciones": "no"})                     # un tipo incorrecto no cambia nada
        self.assertFalse(ajustes.leer()["buscar_actualizaciones"])
        client = TestClient(main.app, base_url="http://127.0.0.1")
        self.assertTrue(client.put("/api/ajustes", json={"buscar_actualizaciones": True}).json()["buscar_actualizaciones"])

    def test_con_la_ia_desactivada_no_se_arranca_ni_se_usa_ollama(self):
        ajustes.guardar({"ia_activa": False})
        with patch.object(ollama_service, "is_ollama_running", return_value=True):
            self.assertFalse(ollama_service.ensure_ollama_running())

    def test_se_usa_el_modelo_elegido_si_esta_instalado_y_si_no_el_de_siempre(self):
        with patch.object(ollama_service, "get_available_models", return_value=["phi3:mini", "qwen2.5:3b"]):
            ajustes.guardar({"modelo": "qwen2.5:3b"})
            self.assertEqual(ollama_service.get_best_llm_model(), "qwen2.5:3b")
            ajustes.guardar({"modelo": "desinstalado:1b"})
            self.assertEqual(ollama_service.get_best_llm_model(), "phi3:mini")

    def test_licencia_restrictiva_solo_en_qwen25_de_3b_y_72b(self):
        for m in ["qwen2.5:3b", "qwen2.5:72b", "qwen2.5:3b-instruct-q4_K_M", "qwen2.5-coder:3b", "qwen2.5vl:72b", "library/qwen2.5:3b", "QWEN2.5:3B"]:
            self.assertTrue(ollama_service.licencia_restrictiva(m), m)
        for m in ["qwen2.5:0.5b", "qwen2.5:1.5b", "qwen2.5:7b", "qwen2.5:14b", "qwen2.5:32b", "qwen2.5-coder:32b", "qwen2.5:latest", "phi3:mini", "qwen3:30b", "llama3.2:3b", ""]:
            self.assertFalse(ollama_service.licencia_restrictiva(m), m)

    def test_el_modo_automatico_no_elige_modelos_de_licencia_restringida(self):
        def elegido(instalados):
            with patch.object(ollama_service, "get_available_models", return_value=instalados):
                return ollama_service.get_best_llm_model()
        self.assertEqual(elegido(["qwen2.5:3b", "qwen2.5:72b", "qwen2.5:1.5b"]), "qwen2.5:1.5b")
        self.assertEqual(elegido(["qwen2.5:72b", "phi3:mini"]), "phi3:mini")
        self.assertEqual(elegido(["qwen2.5:3b", "llama3.2:1b"]), "llama3.2:1b")          # el resto de modelos se sigue admitiendo como antes
        self.assertEqual(elegido(["qwen2.5:3b", "qwen2.5-coder:3b"]), "phi3:mini")       # solo restringidos: no se usa ninguno, queda la preferencia
        ajustes.guardar({"modelo": "qwen2.5:3b"})                                        # elegido a mano en Ajustes: sí se usa
        self.assertEqual(elegido(["qwen2.5:3b", "phi3:mini"]), "qwen2.5:3b")

    def test_ajustes_avisa_de_los_modelos_restringidos_instalados(self):
        client = TestClient(main.app, base_url="http://127.0.0.1")
        with patch.object(main, "is_ollama_running", return_value=True), \
             patch.object(main, "get_available_models", return_value=["phi3:mini", "qwen2.5:3b", "qwen2.5:7b", "qwen2.5:72b"]):
            r = client.get("/api/ajustes").json()
        self.assertEqual(r["modelos_restringidos"], ["qwen2.5:3b", "qwen2.5:72b"])

    def _responde(self, cuerpo=None, error=None):
        resp = MagicMock(); resp.__enter__.return_value = resp
        resp.status = 200
        resp.read.return_value = json.dumps(cuerpo).encode()
        return patch.object(ollama_service._SIN_PROXY, "open", side_effect=error, return_value=resp)

    def test_ollama_solo_cuenta_como_activo_si_contesta_como_ollama(self):
        with self._responde({"models": []}):
            self.assertTrue(ollama_service.is_ollama_running())              # sin modelos descargados también está activo
        with self._responde({"otra": "cosa"}):
            self.assertFalse(ollama_service.is_ollama_running())             # un 200 de otro programa (o de un proxy) no basta
        with self._responde({"models": "no es lista"}):
            self.assertFalse(ollama_service.is_ollama_running())
        with self._responde(error=OSError("apagado")):
            self.assertFalse(ollama_service.is_ollama_running())

    def test_la_consulta_a_ollama_ignora_el_proxy_del_sistema(self):
        manejadores = [h for h in ollama_service._SIN_PROXY.handlers if isinstance(h, ollama_service.urllib.request.ProxyHandler)]
        self.assertEqual(manejadores, [])      # el ProxyHandler vacío sustituye al de por defecto (que leería HTTP_PROXY y el registro de Windows)

    def test_arrancar_en_segundo_plano_segun_el_estado(self):
        os_ = ollama_service
        ajustes.guardar({"ia_activa": False})
        self.assertEqual(os_.arrancar_en_segundo_plano(), "ia_apagada")
        ajustes.guardar({"ia_activa": True})
        with patch.object(os_, "is_ollama_running", return_value=True):
            self.assertEqual(os_.arrancar_en_segundo_plano(), "activo")
        with patch.object(os_, "is_ollama_running", return_value=False), patch.object(os_, "get_ollama_path", return_value=None):
            self.assertEqual(os_.arrancar_en_segundo_plano(), "no_instalado")
        arrancado = threading.Event()
        with patch.object(os_, "is_ollama_running", return_value=False), patch.object(os_, "get_ollama_path", return_value="ollama.exe"), \
             patch.object(os_, "ensure_ollama_running", side_effect=lambda: arrancado.set()):
            self.assertEqual(os_.arrancar_en_segundo_plano(), "arrancando")
            self.assertTrue(arrancado.wait(3))                                # se arrancó de verdad, en otro hilo
        self.assertTrue(os_._arrancando.acquire(timeout=3))                 # y el cerrojo se liberó
        os_._arrancando.release()

    def test_quien_necesita_ollama_mientras_otro_lo_arranca_espera_en_vez_de_lanzar_otro(self):
        os_ = ollama_service
        listo = threading.Event()
        lanzado = []
        sostiene = threading.Event()

        def otro_hilo():                                    # simula el arranque en segundo plano: tiene el cerrojo y Ollama aparece a los 0,4 s
            with os_._arrancando:
                sostiene.set()
                time.sleep(0.4)
                listo.set()
        threading.Thread(target=otro_hilo).start()
        sostiene.wait(2)
        with patch.object(os_, "is_ollama_running", side_effect=lambda timeout=1.0: listo.is_set()), patch.object(os_, "get_ollama_path", return_value="ollama.exe"), \
             patch.object(os_.subprocess, "Popen", side_effect=lambda *a, **k: lanzado.append(1)):
            self.assertTrue(os_.ensure_ollama_running(espera=3))
        self.assertEqual(lanzado, [])                       # no se lanzó un segundo `ollama serve`

    def test_espera_el_tiempo_que_se_le_da_para_que_ollama_responda(self):
        os_ = ollama_service
        arranque = time.monotonic()
        with patch.object(os_, "is_ollama_running", side_effect=lambda timeout=1.0: time.monotonic() - arranque > 1.2), \
             patch.object(os_, "get_ollama_path", return_value="ollama.exe"), patch.object(os_.subprocess, "Popen"):
            self.assertTrue(os_.ensure_ollama_running(espera=5))      # tarda 1,2 s en responder: con los 8 s de antes ya valía, con 0,5 s no
        self.assertGreaterEqual(os_.ESPERA_ARRANQUE, 30)               # y por defecto espera lo bastante para un portátil lento

    def test_no_arranca_dos_veces_a_la_vez(self):
        os_ = ollama_service
        llamadas = []
        with os_._arrancando, patch.object(os_, "is_ollama_running", return_value=False), patch.object(os_, "get_ollama_path", return_value="ollama.exe"), \
             patch.object(os_, "ensure_ollama_running", side_effect=lambda: llamadas.append(1)):
            self.assertEqual(os_.arrancar_en_segundo_plano(), "arrancando")   # ya había un arranque en curso
        self.assertEqual(llamadas, [])

    def test_endpoint_arrancar_y_ajustes_informan_de_si_ollama_esta_instalado(self):
        client = TestClient(main.app, base_url="http://127.0.0.1")
        with patch.object(main, "arrancar_en_segundo_plano", return_value="arrancando") as arrancar:
            self.assertEqual(client.post("/api/ollama/arrancar").json(), {"estado": "arrancando"})
            client.put("/api/ajustes", json={"ia_activa": True})              # al activar la IA local se levanta Ollama
            self.assertEqual(arrancar.call_count, 2)
            client.put("/api/ajustes", json={"ia_activa": False})
            self.assertEqual(arrancar.call_count, 2)                          # al desactivarla, no
        with patch.object(main, "is_ollama_running", return_value=False), patch.object(main, "get_ollama_path", return_value=None):
            self.assertFalse(client.get("/api/ajustes").json()["ollama_instalado"])
        with patch.object(main, "is_ollama_running", return_value=False), patch.object(main, "get_ollama_path", return_value="x"):
            self.assertTrue(client.get("/api/ajustes").json()["ollama_instalado"])

    def test_ajustes_cuenta_las_neuronas_sin_construir_la_lista_entera_con_todos_sus_textos(self):
        """Ajustes se consulta cada pocos segundos: antes serializaba teoría, glosario y ejercicios de TODAS las neuronas solo para contarlas."""
        client = TestClient(main.app, base_url="http://127.0.0.1")
        with patch.object(main, "is_ollama_running", return_value=False), \
             patch.object(main.db_conn, "get_universe_metadata", side_effect=AssertionError("no debe pedir todos los textos")):
            r = client.get("/api/ajustes").json()
        self.assertEqual(r["neuronas"], main.db_conn.contar_neuronas())
        self.assertIsInstance(r["neuronas"], int)

    def test_endpoints_leen_y_guardan(self):
        client = TestClient(main.app, base_url="http://127.0.0.1")
        with patch.object(main, "is_ollama_running", return_value=False):
            self.assertEqual(client.put("/api/ajustes", json={"ia_activa": False}).json()["ia_activa"], False)
            r = client.get("/api/ajustes").json()
        self.assertEqual((r["ia_activa"], r["ollama"], r["modelos"], r["version"]), (False, False, [], main.APP_VERSION))
        self.assertEqual(client.put("/api/ajustes", json={"modelo": "x" * 101}).status_code, 422)


class TestIntercambio(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.makedirs(os.path.join(DATA_DIR, "raw"), exist_ok=True)
        cls.client = TestClient(main.app, base_url="http://127.0.0.1")

    def tearDown(self):
        for n in ("ix_a", "ix_b", "ix_c"):
            self.client.delete(f"/api/node/{n}")

    def crear(self, nid, teoria="t"):
        with open(os.path.join(DATA_DIR, "raw", f"{nid}.json"), "w", encoding="utf-8") as f:
            json.dump({"nombre": nid.upper(), "cluster": "X", "teoria": teoria, "embedding": [0.1, 0.2]}, f)

    def test_exportar_y_volver_a_importar_recupera_neuronas_y_conexion_sin_embedding(self):
        self.crear("ix_a"); self.crear("ix_b")
        db_conn.add_links([{"origen_id": "ix_a", "destino_id": "ix_b", "motivo": "porque sí", "estado": "aceptada"}])
        archivo = self.client.get("/api/exportar").json()
        mias = [n for n in archivo["neuronas"] if n["id"].startswith("ix_")]
        self.assertEqual(sorted(n["id"] for n in mias), ["ix_a", "ix_b"])
        self.assertTrue(all("embedding" not in n for n in mias))
        self.client.delete("/api/node/ix_a"); self.client.delete("/api/node/ix_b")
        r = self.client.post("/api/importar", json={"contenido": archivo}).json()
        self.assertGreaterEqual(r["añadidas"], 2)
        self.assertEqual([(l["origen_id"], l["destino_id"], l["estado"]) for l in db_conn.get_links_metadata() if l["origen_id"] == "ix_a"],
                         [("ix_a", "ix_b", "aceptada")])
        self.assertEqual(self.client.post("/api/importar", json={"contenido": archivo}).json()["añadidas"], 0)   # ya existen: no se duplica

    def test_importar_nunca_pisa_una_neurona_que_ya_tienes(self):
        self.crear("ix_c", teoria="la mía")
        archivo = {"formato": intercambio.FORMATO, "version": 1, "aristas": [],
                   "neuronas": [{"id": "ix_c", "nombre": "OTRA", "teoria": "la de fuera"}]}
        r = self.client.post("/api/importar", json={"contenido": archivo}).json()
        self.assertEqual((r["añadidas"], r["omitidas"]), (0, 1))
        with open(os.path.join(DATA_DIR, "raw", "ix_c.json"), encoding="utf-8") as f:
            self.assertEqual(json.load(f)["teoria"], "la mía")

    def test_un_archivo_invalido_se_rechaza_sin_escribir_nada(self):
        antes = set(os.listdir(os.path.join(DATA_DIR, "raw")))
        malos = [{}, {"formato": "otro", "version": 1}, {"formato": intercambio.FORMATO, "version": 99, "neuronas": []},
                 {"formato": intercambio.FORMATO, "version": 1, "neuronas": [{"id": "ix_a", "nombre": "A"}, {"id": "../fuera", "nombre": "B"}]},
                 {"formato": intercambio.FORMATO, "version": 1, "neuronas": [{"id": "ix_a"}]}]
        for malo in malos:
            with self.subTest(malo=malo):
                self.assertEqual(self.client.post("/api/importar", json={"contenido": malo}).status_code, 400)
        self.assertEqual(set(os.listdir(os.path.join(DATA_DIR, "raw"))), antes)

    def test_las_conexiones_de_fuera_solo_entran_si_tocan_una_neurona_nueva_y_con_extremos_existentes(self):
        self.crear("ix_a")
        archivo = {"formato": intercambio.FORMATO, "version": 1,
                   "neuronas": [{"id": "ix_b", "nombre": "B"}],
                   "aristas": [{"origen_id": "ix_b", "destino_id": "ix_a", "motivo": "m", "estado": "rechazada"},
                               {"origen_id": "ix_b", "destino_id": "no_existe", "motivo": "m", "estado": "aceptada"}]}
        self.assertEqual(self.client.post("/api/importar", json={"contenido": archivo}).json()["conexiones"], 1)
        estados = [l["estado"] for l in db_conn.get_links_metadata() if l["origen_id"] == "ix_b"]
        self.assertEqual(estados, ["pendiente"])   # una conexión rechazada de otra persona entra como pendiente para que la revises

    def test_importar_quita_las_marcas_de_cita_de_los_textos(self):
        archivo = {"formato": intercambio.FORMATO, "version": 1, "aristas": [],
                   "neuronas": [{"id": "ix_a", "nombre": "A", "teoria": "Stirling[reference:25]. Fin",
                                 "glosario": [{"termino": "t", "definicion": "d [ref 2]"}]}]}
        self.client.post("/api/importar", json={"contenido": archivo})
        with open(os.path.join(DATA_DIR, "raw", "ix_a.json"), encoding="utf-8") as f:
            n = json.load(f)
        self.assertEqual((n["teoria"], n["glosario"][0]["definicion"]), ("Stirling. Fin", "d"))


class TestLimpiezaCitas(unittest.TestCase):
    def test_quita_las_marcas_de_deepseek_chatgpt_y_gemini(self):
        from limpieza import limpiar_texto
        casos = {
            "fórmula de Stirling[reference:25]. Karl": "fórmula de Stirling. Karl",
            "colas[reference:34][reference:35]. Sin": "colas. Sin",
            "texto [ref 3] y [ref:4, 5]": "texto y",
            "[cite_start]Hola [cite: 1, 2].": "Hola.",
            "dato :contentReference[oaicite:0]{index=0} fin": "dato fin",
            "dato【4†fuente】 fin": "dato fin",
            "aciteturn0search3 b": "a b",
        }
        for sucio, limpio in casos.items():
            with self.subTest(sucio=sucio):
                self.assertEqual(limpiar_texto(sucio), limpio)

    def test_no_toca_corchetes_normales_ni_enlaces_ni_el_codigo(self):
        from limpieza import limpiar_neurona, limpiar_texto
        for t in ("Véase [ref](https://doi.org/10.1/x).", "El intervalo [a, b] y $A[i,j]$.", "[Laplace 1812]", "Uno.\n\nDos."):
            self.assertEqual(limpiar_texto(t), t)
        n = {"id": "x[ref 1]", "nombre": "N[ref 1]", "teoria": "T[reference:1]",
             "referencias": [{"titulo": "Libro", "url": "https://x.org/[ref 1]", "nota": "N[reference:2]"}],
             "laboratorio": {"explicacion": "E[ref 3]", "codigo": "d = {}\nprint(d['x'][ref])", "controles": [{"label": "L[ref 1]"}]}}
        self.assertEqual(limpiar_neurona(n), 3)
        self.assertEqual((n["teoria"], n["referencias"][0]["nota"], n["laboratorio"]["explicacion"]), ("T", "N", "E"))
        self.assertEqual((n["id"], n["nombre"], n["referencias"][0]["url"], n["laboratorio"]["codigo"]),
                         ("x[ref 1]", "N[ref 1]", "https://x.org/[ref 1]", "d = {}\nprint(d['x'][ref])"))


class TestSincronizacionEnLaApp(unittest.TestCase):
    def setUp(self):
        import sincronizacion
        self.sinc = sincronizacion
        self.ruta = os.path.join(tempfile.mkdtemp(), "ajustes.json")
        p = patch.object(ajustes, "RUTA", self.ruta)
        p.start()
        self.addCleanup(p.stop)
        self.compartida = tempfile.mkdtemp(prefix="ap-comp-")
        self.client = TestClient(main.app, base_url="http://127.0.0.1")
        os.makedirs(os.path.join(DATA_DIR, "raw"), exist_ok=True)
        main.servicio_sync.cambiar_carpeta()
        self.addCleanup(self._limpiar)

    def _limpiar(self):
        main.servicio_sync.cambiar_carpeta()
        for f in ("sync_a.json", "sync_b.json"):
            try:
                os.remove(os.path.join(DATA_DIR, "raw", f))
            except OSError:
                pass

    def _elegir(self, carpeta):
        with patch.object(main.threading, "Thread"):          # la primera vuelta automática al elegir carpeta se hace a mano en cada prueba
            return self.client.put("/api/ajustes", json={"carpeta_sincronizacion": carpeta})

    def test_al_abrir_se_sincroniza_una_sola_vez_y_sin_repasos_periodicos(self):
        for ajustes_, esperadas in (({"carpeta_sincronizacion": self.compartida, "sincronizar_auto": True}, 1),
                                    ({"carpeta_sincronizacion": self.compartida, "sincronizar_auto": False}, 0),
                                    ({"carpeta_sincronizacion": "", "sincronizar_auto": True}, 0)):
            with self.subTest(ajustes=ajustes_):
                llamadas = []
                servicio = self.sinc.Servicio(DATA_DIR, lambda a=ajustes_: a, lambda n, ar: None)
                with patch.object(servicio, "ahora", side_effect=lambda: llamadas.append(1)):
                    servicio.iniciar_auto()
                    servicio.iniciar_auto()                       # abrir dos veces la pantalla de arranque no lanza otra
                    servicio.hilo.join(5)
                self.assertFalse(servicio.hilo.is_alive())        # el hilo termina: no queda nada repasando cada minuto
                self.assertEqual(len(llamadas), esperadas)

    def test_la_carpeta_debe_existir_ser_completa_y_no_ser_la_de_los_datos(self):
        for mala in ("no/es/absoluta", os.path.join(self.compartida, "no-existe"), DATA_DIR, os.path.join(DATA_DIR, "raw")):
            self.assertEqual(self._elegir(mala).status_code, 400, mala)
        self.assertEqual(ajustes.leer()["carpeta_sincronizacion"], "")
        self.assertEqual(self._elegir(self.compartida).status_code, 200)
        self.assertEqual(self._elegir("").json()["carpeta_sincronizacion"], "")      # quitarla también vale

    def test_sin_carpeta_el_estado_dice_que_no_esta_configurada_y_ahora_no_hace_nada(self):
        e = self.client.get("/api/sync/estado").json()
        self.assertFalse(e["configurada"])
        self.assertEqual(self.client.post("/api/sync/ahora").json()["ultima"], None)

    def test_una_vuelta_publica_lo_local_y_recibe_lo_de_otro_pc(self):
        with open(os.path.join(DATA_DIR, "raw", "sync_a.json"), "w", encoding="utf-8") as f:
            json.dump({"nombre": "A", "cluster": "C", "teoria": "t"}, f)
        self._elegir(self.compartida)
        otro = os.path.join(self.compartida, self.sinc.RAIZ, "otropc", "neuronas")
        os.makedirs(otro)
        with open(os.path.join(otro, "sync_b.json"), "w", encoding="utf-8") as f:
            json.dump({"_sync": {"t": 2_000_000_000_000_000, "rev": 1, "pc": "otropc", "borrada": False}, "datos": {"nombre": "B", "cluster": "C", "teoria": "u"}}, f)
        with patch.object(main.db_conn, "compile_raw_jsons") as compilar, patch.object(main.db_conn, "quitar_aristas_huerfanas"):
            e = self.client.post("/api/sync/ahora").json()
        self.assertIsNone(e["error"])
        self.assertGreaterEqual(e["ultima"]["enviadas"], 1)                               # (la carpeta de datos de las pruebas puede tener más neuronas de otras)
        self.assertEqual(e["ultima"]["recibidas"], 1)
        self.assertTrue(os.path.exists(os.path.join(DATA_DIR, "raw", "sync_b.json")))      # llegó
        compilar.assert_called()                                                           # y se recompiló la base
        publicadas = os.listdir(os.path.join(self.compartida, self.sinc.RAIZ, main.servicio_sync.sincronizador.pc, "neuronas"))
        self.assertIn("sync_a.json", publicadas)                                           # lo local salió

    def test_una_carpeta_que_deja_de_estar_disponible_se_cuenta_como_error_sin_romper_nada(self):
        self._elegir(self.compartida)
        shutil.rmtree(self.compartida)
        e = self.client.post("/api/sync/ahora").json()
        self.assertIn("FileNotFoundError", e["error"])


class TestEmpaquetado(unittest.TestCase):
    def test_todo_modulo_del_backend_que_otro_importa_va_en_el_instalador_y_en_tauri(self):
        """Los instaladores copian una lista fija de archivos: un módulo nuevo que se olvide ahí rompe el backend instalado (ImportError al arrancar)."""
        import ast
        import glob
        raiz = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
        modulos = {os.path.basename(f)[:-3] for f in glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), "*.py"))}
        importados = set()
        for nombre in modulos - {"test_backend"}:
            arbol = ast.parse(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), nombre + ".py"), encoding="utf-8").read())
            for nodo in ast.walk(arbol):
                if isinstance(nodo, ast.Import):
                    importados |= {a.name.split(".")[0] for a in nodo.names}
                elif isinstance(nodo, ast.ImportFrom) and nodo.module:
                    importados.add(nodo.module.split(".")[0])
        necesarios = ({"main"} | (importados & modulos)) - {"test_backend"}
        nsh = open(os.path.join(raiz, "frontend", "installer", "instalacion.nsh"), encoding="utf-8-sig").read()
        tauri = open(os.path.join(raiz, "frontend", "src-tauri", "tauri.conf.json"), encoding="utf-8").read()
        for m in sorted(necesarios):
            self.assertIn(f'\{m}.py"', nsh, f"{m}.py falta en installer/instalacion.nsh")
            self.assertIn(f'backend/{m}.py"', tauri, f"{m}.py falta en tauri.conf.json")

    def test_el_instalador_no_abre_consolas(self):
        """Con Terminal como consola predeterminada de Windows 11, un `Exec` de PowerShell abre una pestaña de Terminal (y un botón en la barra de tareas) aunque se oculte
        después: hay que crear el proceso con CREATE_NO_WINDOW, y los hijos de instalar.ps1 con -NoNewWindow (compartiendo esa consola oculta)."""
        import re
        inst = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "installer")
        nsh = open(os.path.join(inst, "instalacion.nsh"), encoding="utf-8-sig").read()
        self.assertIn("kernel32::CreateProcess(p 0, t r3", nsh)
        self.assertIn("0x08000000", nsh)
        self.assertNotRegex(nsh, r"(?m)^\s*Exec\s+'\"\$SYSDIR\\WindowsPowerShell", "powershell.exe no se lanza con Exec (abre consola visible)")
        ps1 = open(os.path.join(inst, "instalar.ps1"), encoding="utf-8-sig").read()
        sin_comentarios = "\n".join(re.sub(r"#.*$", "", l) for l in ps1.splitlines())
        self.assertNotIn("Start-Process", "\n".join(l for l in sin_comentarios.splitlines() if "-WindowStyle Hidden" in l), "los hijos van con -NoNewWindow")


from test_sincronizacion import TestSincronizacion  # noqa: E402,F401  (para que `unittest test_backend` también las ejecute)


if __name__ == "__main__":
    unittest.main()
