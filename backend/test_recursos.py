r"""Tests del limitador de recursos (perfiles, topes, opciones de Ollama, vigilancia de RAM y endpoints).
Se ejecutan con el resto:  .venv\Scripts\python.exe -m unittest test_backend -v   (test_backend los importa)"""
import os
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch

import ajustes
import ollama_service
import recursos

PC_JUSTO = {"ram_total_mb": 8192, "nucleos": 4, "gpus": ["Intel(R) UHD Graphics"], "gpu_dedicada": False}
PC_MEDIO = {"ram_total_mb": 16384, "nucleos": 8, "gpus": ["NVIDIA GeForce GTX 1650"], "gpu_dedicada": True}
PC_POTENTE = {"ram_total_mb": 32768, "nucleos": 16, "gpus": ["NVIDIA GeForce RTX 4070"], "gpu_dedicada": True}


class _ConAjustesTemporales(unittest.TestCase):
    def setUp(self):
        self.ruta = os.path.join(tempfile.mkdtemp(), "ajustes.json")
        p = patch.object(ajustes, "RUTA", self.ruta)
        p.start()
        self.addCleanup(p.stop)
        recursos._estado_pausa.update(pausada=False, motivo="", desde=0.0)
        self.addCleanup(lambda: recursos._estado_pausa.update(pausada=False, motivo="", desde=0.0))


class TestAjustesDeRendimiento(_ConAjustesTemporales):
    def test_por_defecto_no_se_limita_nada(self):
        a = ajustes.leer()
        self.assertEqual((a["perfil"], a["limite_cpu"], a["limite_ram_mb"], a["fps_max"], a["calidad_3d"], a["ia_en_gpu"], a["sinapsis_auto"]), ("", 100, 0, 0, "alta", True, True))
        self.assertFalse(recursos.limitando(a))
        self.assertEqual(recursos.opciones_ollama(a), {})                       # sin límites Ollama decide solo, como antes

    def test_un_archivo_editado_a_mano_con_valores_absurdos_se_corrige(self):
        ajustes.guardar({"perfil": "turbo", "calidad_3d": "ultra", "limite_cpu": 900, "limite_ram_mb": -5, "fps_max": 99999})
        a = ajustes.leer()
        self.assertEqual((a["perfil"], a["calidad_3d"], a["limite_cpu"], a["limite_ram_mb"], a["fps_max"]), ("", "alta", 100, 0, 240))
        ajustes.guardar({"limite_cpu": 0})
        self.assertEqual(ajustes.leer()["limite_cpu"], 1)                       # nunca 0 %: la app quedaría sin CPU


class TestPerfiles(unittest.TestCase):
    def test_el_perfil_sugerido_sigue_al_equipo(self):
        self.assertEqual(recursos.perfil_sugerido(PC_JUSTO), "ligero")
        self.assertEqual(recursos.perfil_sugerido({**PC_POTENTE, "nucleos": 4}), "ligero")        # mucha RAM pero solo 4 núcleos
        self.assertEqual(recursos.perfil_sugerido(PC_MEDIO), "equilibrado")
        self.assertEqual(recursos.perfil_sugerido(PC_POTENTE), "maximo")

    def test_los_valores_de_cada_perfil_son_coherentes(self):
        ligero, medio, maximo = (recursos.valores_perfil(p, PC_JUSTO) for p in recursos.PERFILES_VALIDOS)
        self.assertLess(ligero["limite_cpu"], medio["limite_cpu"])
        self.assertLess(medio["limite_cpu"], maximo["limite_cpu"])
        self.assertEqual(maximo, {"limite_cpu": 100, "limite_ram_mb": 0, "fps_max": 0, "calidad_3d": "alta", "ia_en_gpu": True, "sinapsis_auto": True})
        self.assertFalse(ligero["sinapsis_auto"])                                # Ligero: las conexiones se calculan bajo demanda
        self.assertEqual((ligero["fps_max"], ligero["calidad_3d"]), (30, "baja"))

    def test_la_ram_de_un_perfil_nunca_baja_del_minimo_ni_supera_el_equipo(self):
        diminuto = {**PC_JUSTO, "ram_total_mb": 4096}
        self.assertEqual(recursos.valores_perfil("ligero", diminuto)["limite_ram_mb"], recursos.MIN_RAM_MB)
        self.assertLess(recursos.valores_perfil("ligero", PC_POTENTE)["limite_ram_mb"], PC_POTENTE["ram_total_mb"])
        self.assertLessEqual(recursos.valores_perfil("equilibrado", PC_POTENTE)["limite_ram_mb"], 8192)

    def test_ligero_deja_la_gpu_en_paz_si_es_integrada(self):
        self.assertFalse(recursos.valores_perfil("ligero", PC_JUSTO)["ia_en_gpu"])
        self.assertTrue(recursos.valores_perfil("ligero", PC_MEDIO)["ia_en_gpu"])

    def test_gpu_dedicada_por_el_nombre(self):
        for n in ["NVIDIA GeForce RTX 3060", "AMD Radeon RX 6600", "NVIDIA Quadro T1000", "Intel(R) Arc(TM) A750"]:
            self.assertTrue(recursos.es_gpu_dedicada(n), n)
        for n in ["Intel(R) UHD Graphics 620", "Intel(R) Iris(R) Xe Graphics", "AMD Radeon(TM) Graphics", ""]:
            self.assertFalse(recursos.es_gpu_dedicada(n), n)


class TestOpcionesDeOllama(unittest.TestCase):
    def a(self, **kw):
        return {**ajustes.DEFECTO, **kw}

    def test_ligero_reduce_contexto_hilos_y_tiempo_en_memoria_y_deja_la_gpu(self):
        a = self.a(perfil="ligero", limite_cpu=40, limite_ram_mb=2867, ia_en_gpu=False)
        extra = recursos.opciones_ollama(a, PC_JUSTO)
        self.assertEqual(extra["options"], {"num_ctx": 2048, "num_thread": 1, "num_gpu": 0})
        self.assertEqual(extra["keep_alive"], "30s")

    def test_equilibrado_con_gpu_no_fuerza_cpu(self):
        extra = recursos.opciones_ollama(self.a(perfil="equilibrado", limite_cpu=70), PC_MEDIO)
        self.assertEqual(extra["options"], {"num_ctx": 4096, "num_thread": 4})
        self.assertNotIn("num_gpu", extra["options"])

    def test_nunca_pide_cero_hilos(self):
        self.assertEqual(recursos.opciones_ollama(self.a(perfil="ligero"), {**PC_JUSTO, "nucleos": 1})["options"]["num_thread"], 1)

    def test_maximo_y_sin_elegir_no_tocan_nada(self):
        self.assertEqual(recursos.opciones_ollama(self.a(perfil="maximo"), PC_POTENTE), {})
        self.assertEqual(recursos.opciones_ollama(self.a(), PC_POTENTE), {})

    def test_personalizado_se_parece_al_perfil_que_corresponde_a_su_cpu(self):
        bajo = recursos.opciones_ollama(self.a(perfil="personalizado", limite_cpu=30), PC_JUSTO)
        medio = recursos.opciones_ollama(self.a(perfil="personalizado", limite_cpu=75), PC_JUSTO)
        self.assertEqual(bajo["options"]["num_ctx"], 2048)
        self.assertEqual(medio["options"]["num_ctx"], 4096)

    def test_con_ram_limitada_pero_cpu_libre_se_considera_que_hay_limite(self):
        a = self.a(perfil="personalizado", limite_ram_mb=3000)
        self.assertTrue(recursos.limitando(a))
        self.assertEqual(recursos.opciones_ollama(a, PC_JUSTO), {})              # con la CPU libre (100 %) no se recortan hilos ni contexto: solo manda el tope de RAM

    def test_el_entorno_de_ollama_serializa_las_peticiones_solo_con_limites(self):
        base = {"PATH": "x"}
        con = recursos.entorno_ollama(base, self.a(perfil="ligero"))
        self.assertEqual((con["OLLAMA_NUM_PARALLEL"], con["OLLAMA_MAX_LOADED_MODELS"], con["PATH"]), ("1", "1", "x"))
        sin = recursos.entorno_ollama(base, self.a())
        self.assertNotIn("OLLAMA_NUM_PARALLEL", sin)
        self.assertEqual(base, {"PATH": "x"})                                   # no modifica el diccionario que recibe

    def test_los_hilos_del_modelo_de_embeddings(self):
        self.assertIsNone(recursos.hilos_embedding(self.a(), PC_JUSTO))
        self.assertEqual(recursos.hilos_embedding(self.a(perfil="ligero"), {**PC_JUSTO, "nucleos": 8}), 2)
        self.assertEqual(recursos.hilos_embedding(self.a(perfil="ligero"), {**PC_JUSTO, "nucleos": 1}), 1)

    def test_las_consultas_al_modelo_llevan_las_opciones_del_perfil(self):
        import json
        import clasificador
        enviado = {}

        class Respuesta:
            def __enter__(self): return self
            def __exit__(self, *a): return False
            def read(self): return b'{"response": "{}"}'

        def urlopen(req, timeout=None):
            enviado.update(json.loads(req.data.decode()))
            return Respuesta()

        with patch.object(recursos, "opciones_ollama", return_value={"options": {"num_ctx": 2048}, "keep_alive": "30s"}), \
             patch.object(clasificador.urllib.request, "urlopen", side_effect=urlopen):
            clasificador.ClasificadorLocal._consultar("m", "hola")
        self.assertEqual(enviado["options"], {"num_ctx": 2048})
        self.assertEqual(enviado["keep_alive"], "30s")                          # el del perfil manda sobre los «5m» de siempre


class TestModeloLigero(_ConAjustesTemporales):
    def elegido(self, instalados):
        with patch.object(ollama_service, "get_available_models", return_value=instalados):
            return ollama_service.get_best_llm_model()

    def test_en_ligero_el_automatico_prefiere_el_modelo_pequeno_instalado(self):
        ajustes.guardar({"perfil": "ligero"})
        self.assertEqual(self.elegido(["phi3:mini", "qwen2.5:1.5b"]), "qwen2.5:1.5b")
        self.assertEqual(self.elegido(["phi3:mini", "qwen2.5:0.5b"]), "qwen2.5:0.5b")
        self.assertEqual(self.elegido(["phi3:mini"]), "phi3:mini")              # sin modelo pequeño, el de siempre

    def test_fuera_de_ligero_todo_sigue_igual(self):
        ajustes.guardar({"perfil": "equilibrado"})
        self.assertEqual(self.elegido(["phi3:mini", "qwen2.5:1.5b"]), "phi3:mini")

    def test_el_modelo_elegido_a_mano_gana_al_perfil(self):
        ajustes.guardar({"perfil": "ligero", "modelo": "phi3:mini"})
        self.assertEqual(self.elegido(["phi3:mini", "qwen2.5:1.5b"]), "phi3:mini")

    def test_nunca_se_elige_un_modelo_pequeno_de_licencia_restringida(self):
        ajustes.guardar({"perfil": "ligero"})
        self.assertEqual(self.elegido(["qwen2.5:3b", "phi3:mini"]), "phi3:mini")


class TestVigilanciaDeRam(_ConAjustesTemporales):
    def test_pausa_la_ia_y_descarga_el_modelo_cuando_la_ram_libre_cae(self):
        ajustes.guardar({"perfil": "ligero"})
        descargas = []
        r = recursos.revisar_ram(libre_mb=500, descargar=lambda: descargas.append(1))
        self.assertTrue(r["pausada"])
        self.assertTrue(recursos.ia_pausada())
        self.assertIn("500 MB", r["motivo"])
        self.assertEqual(len(descargas), 1)
        recursos.revisar_ram(libre_mb=450, descargar=lambda: descargas.append(1))
        self.assertEqual(len(descargas), 1)                                      # ya estaba en pausa: no se vuelve a descargar

    def test_se_reanuda_solo_cuando_hay_el_doble_de_margen(self):
        ajustes.guardar({"perfil": "ligero"})                                    # umbral 700 MB
        recursos.revisar_ram(libre_mb=300, descargar=lambda: None)
        recursos.revisar_ram(libre_mb=1000, descargar=lambda: None)
        self.assertTrue(recursos.ia_pausada())                                   # 1000 < 1400: sigue en pausa (evita parpadear)
        recursos.revisar_ram(libre_mb=1500, descargar=lambda: None)
        self.assertFalse(recursos.ia_pausada())
        self.assertEqual(recursos.estado_pausa()["motivo"], "")

    def test_sin_limites_no_se_pausa_nunca_y_se_quita_la_pausa(self):
        r = recursos.revisar_ram(libre_mb=50, descargar=lambda: self.fail("no debe descargar"))
        self.assertFalse(r["pausada"])
        ajustes.guardar({"perfil": "ligero"})
        recursos.revisar_ram(libre_mb=50, descargar=lambda: None)
        self.assertTrue(recursos.ia_pausada())
        ajustes.guardar({"perfil": "maximo"})                                    # el usuario quita los límites: se levanta la pausa
        recursos.revisar_ram(libre_mb=50, descargar=lambda: None)
        self.assertFalse(recursos.ia_pausada())

    def test_el_umbral_de_equilibrado_es_mas_bajo(self):
        ajustes.guardar({"perfil": "equilibrado"})
        self.assertFalse(recursos.revisar_ram(libre_mb=600, descargar=lambda: None)["pausada"])
        self.assertTrue(recursos.revisar_ram(libre_mb=400, descargar=lambda: None)["pausada"])

    def test_esperar_recursos_bloquea_mientras_dura_la_pausa_y_se_rinde_al_final(self):
        self.assertTrue(recursos.esperar_recursos(maximo=1, dormir=lambda s: self.fail("no hay pausa")))
        recursos._estado_pausa["pausada"] = True
        pasos = []

        def dormir(s):
            pasos.append(s)
            if len(pasos) == 3:
                recursos._estado_pausa["pausada"] = False                         # a la tercera espera vuelve la memoria

        self.assertTrue(recursos.esperar_recursos(maximo=60, dormir=dormir))
        self.assertEqual(len(pasos), 3)
        recursos._estado_pausa["pausada"] = True
        self.assertFalse(recursos.esperar_recursos(maximo=0, dormir=lambda s: None))    # se agota la espera: sigue sin el modelo

    def test_una_tarea_de_conexiones_en_pausa_cae_al_metodo_sin_modelo(self):
        """Si la RAM no vuelve, el par no se consulta al LLM (cuenta como fallo, igual que con Ollama apagado) y la neurona no se queda sin propuesta."""
        import numpy as np
        import clasificador
        c = object.__new__(clasificador.ClasificadorLocal)
        base = [{"id": "a", "nombre": "Alfa", "teoria": "alfa beta", "embedding": [1.0, 0.0], "cluster_id": "X", "glosario": []},
                {"id": "b", "nombre": "Beta", "teoria": "beta alfa", "embedding": [0.9, 0.1], "cluster_id": "X", "glosario": []}]
        with patch.object(clasificador, "ensure_ollama_running", return_value=True), patch.object(clasificador, "get_best_llm_model", return_value="m"), \
             patch.object(clasificador.recursos, "esperar_recursos", return_value=False), patch.object(c, "_juzgar_par", side_effect=AssertionError("no debe consultar")):
            aristas = c.evaluar_conexiones("a", "Alfa", "alfa beta", np.array([1.0, 0.0]), base, nuevo_glosario=[], cluster_nuevo="X")
        self.assertEqual(len(aristas), 1)
        self.assertIn("No se pudo consultar al modelo local", aristas[0]["motivo"])


class TestEndpointsDeRecursos(_ConAjustesTemporales):
    def setUp(self):
        super().setUp()
        import main
        from fastapi.testclient import TestClient
        self.main = main
        self.client = TestClient(main.app, base_url="http://127.0.0.1")
        for p in (patch.object(recursos, "detectar_hardware", return_value=PC_JUSTO),
                  patch.object(recursos, "aplicar", return_value={"activo": True, "ollama_adoptado": 0, "error": ""}) ,
                  patch.object(recursos, "ollama_ajeno", return_value=False)):
            p.start()
            self.addCleanup(p.stop)

    def test_get_devuelve_hardware_sugerencia_y_valores_de_los_perfiles(self):
        r = self.client.get("/api/recursos").json()
        self.assertEqual(r["perfil_sugerido"], "ligero")
        self.assertEqual(set(r["perfiles"]), {"ligero", "equilibrado", "maximo"})
        self.assertEqual(r["ajustes"]["perfil"], "")
        self.assertFalse(r["limitando"])
        self.assertEqual(r["hardware"]["nucleos"], 4)

    def test_elegir_un_perfil_guarda_todos_sus_valores_y_aplica_los_topes(self):
        r = self.client.put("/api/recursos", json={"perfil": "ligero"}).json()
        self.assertEqual(r["ajustes"], {"perfil": "ligero", **recursos.valores_perfil("ligero", PC_JUSTO)})
        self.assertTrue(r["limitando"])
        recursos.aplicar.assert_called_once()
        self.assertEqual(ajustes.leer()["limite_cpu"], 40)

    def test_tocar_un_deslizable_pasa_el_perfil_a_personalizado(self):
        self.client.put("/api/recursos", json={"perfil": "equilibrado"})
        r = self.client.put("/api/recursos", json={"limite_cpu": 55}).json()
        self.assertEqual((r["ajustes"]["perfil"], r["ajustes"]["limite_cpu"], r["ajustes"]["fps_max"]), ("personalizado", 55, 60))   # lo demás se conserva

    def test_volver_a_maximo_quita_los_topes(self):
        self.client.put("/api/recursos", json={"perfil": "ligero"})
        r = self.client.put("/api/recursos", json={"perfil": "maximo"}).json()
        self.assertFalse(r["limitando"])
        self.assertEqual(ajustes.leer()["limite_cpu"], 100)

    def test_rechaza_valores_fuera_de_rango_sin_guardar_nada(self):
        for cuerpo in [{"limite_cpu": 5}, {"limite_cpu": 101}, {"limite_ram_mb": 512}, {"limite_ram_mb": -1}, {"fps_max": 500}, {"calidad_3d": "ultra"}, {"perfil": "turbo"}]:
            self.assertEqual(self.client.put("/api/recursos", json=cuerpo).status_code, 422, cuerpo)
        self.assertEqual(ajustes.leer()["perfil"], "")

    def test_ram_cero_es_sin_tope_y_se_acepta(self):
        self.assertEqual(self.client.put("/api/recursos", json={"limite_ram_mb": 0}).status_code, 200)

    def test_sin_limites_la_pausa_se_quita(self):
        ajustes.guardar({"perfil": "ligero"})
        recursos.revisar_ram(libre_mb=10, descargar=lambda: None)
        self.assertTrue(self.client.get("/api/sinapsis/estado").json()["ia_pausada"])
        self.client.put("/api/recursos", json={"perfil": "maximo"})
        estado = self.client.get("/api/sinapsis/estado").json()
        self.assertFalse(estado["ia_pausada"])
        self.assertEqual(estado["motivo_pausa"], "")

    def test_medicion_y_reinicio_de_ollama(self):
        medida = {"cpu_app_pct": 1.5, "ram_backend_mb": 300, "ram_ollama_mb": 0, "ram_libre_mb": 2000, "ram_total_mb": 8192}
        with patch.object(recursos, "medir", return_value=medida):
            self.assertEqual(self.client.get("/api/recursos/medicion").json(), medida)
        with patch.object(recursos, "reiniciar_ollama") as reinicio:
            self.assertEqual(self.client.post("/api/recursos/reiniciar-ollama").json(), {"estado": "reiniciando"})
            time.sleep(0.2)
            reinicio.assert_called_once()
        ajustes.guardar({"ia_activa": False})
        self.assertEqual(self.client.post("/api/recursos/reiniciar-ollama").status_code, 409)

    def test_calcular_sinapsis_de_una_neurona_que_no_existe_o_sin_huella(self):
        self.assertEqual(self.client.post("/api/node/no-existe-xyz/sinapsis/calcular").status_code, 404)


class TestSinapsisBajoDemanda(_ConAjustesTemporales):
    def test_con_sinapsis_auto_apagado_no_se_lanza_la_tarea_de_fondo(self):
        import json
        import main
        from database import db_conn
        from fastapi import BackgroundTasks

        def limpiar():                                                           # que las neuronas de prueba y el contador de sinapsis no afecten a otros tests
            for i in ("rec-prueba-demanda", "rec-prueba-auto"):
                try:
                    os.remove(main.raw_path(i))
                except OSError:
                    pass
            db_conn.compile_raw_jsons(force=True)
            main.sinapsis.terminar()

        self.addCleanup(limpiar)
        ajustes.guardar({"sinapsis_auto": False})

        class FalsoClasificador:
            def clasificar_neurona(self, **kw):
                return {"cluster": "Matemáticas", "embedding": [0.1, 0.2], "motivo": "test"}

        tareas = BackgroundTasks()
        nodo = json.dumps({"id": "rec-prueba-demanda", "nombre": "Prueba", "teoria": "texto de prueba", "cluster": "Matemáticas"})
        import clasificador
        with patch.object(clasificador, "init_clasificador", return_value=FalsoClasificador()):
            r = main.inject_node(main.NodeInjectionRequest(raw_json=nodo), tareas)
        self.assertTrue(r["sinapsis_pendiente"])
        self.assertEqual(len(tareas.tasks), 0)
        ajustes.guardar({"sinapsis_auto": True})
        tareas = BackgroundTasks()
        nodo2 = json.dumps({"id": "rec-prueba-auto", "nombre": "Prueba 2", "teoria": "otro texto", "cluster": "Matemáticas"})
        with patch.object(clasificador, "init_clasificador", return_value=FalsoClasificador()):
            r = main.inject_node(main.NodeInjectionRequest(raw_json=nodo2), tareas)
        self.assertFalse(r["sinapsis_pendiente"])
        self.assertEqual(len(tareas.tasks), 1)


@unittest.skipUnless(sys.platform == "win32", "los topes duros usan Job Objects de Windows")
class TestJobObject(unittest.TestCase):
    """Con Windows de verdad (sin llamar a aplicar(): el propio proceso de los tests no debe quedar limitado). Se usa un job propio y un hijo que duerme."""

    def setUp(self):
        self.job = recursos._crear_job()
        self.assertIsNotNone(self.job)
        self.hijo = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(30)"], creationflags=0x08000000)
        self.addCleanup(lambda: (self.hijo.kill(), self.hijo.wait()))

    def test_acepta_los_limites_y_adopta_un_proceso(self):
        self.assertTrue(recursos._fijar_limites(self.job, 40, 3000, baja_prioridad=True))
        self.assertTrue(recursos._meter_pid(self.job, self.hijo.pid))

    def test_adoptar_dos_veces_el_mismo_proceso_sigue_contando_como_adoptado(self):
        """Windows rechaza asignar a un job un proceso que ya está en él: sin esta comprobación, reaplicar el perfil informaba «0 procesos de Ollama adoptados»."""
        self.assertTrue(recursos._meter_pid(self.job, self.hijo.pid))
        self.assertTrue(recursos._meter_pid(self.job, self.hijo.pid))

    def test_acepta_quitar_los_limites(self):
        self.assertTrue(recursos._fijar_limites(self.job, 40, 3000, baja_prioridad=True))
        self.assertTrue(recursos._fijar_limites(self.job, 100, 0, baja_prioridad=False))

    def test_un_pid_inexistente_no_rompe(self):
        self.assertFalse(recursos._meter_pid(self.job, 4_000_000))

    def test_memoria_y_hardware_se_leen(self):
        m = recursos.memoria_mb()
        self.assertGreater(m["total"], 256)
        self.assertLessEqual(m["libre"], m["total"])
        hw = recursos.detectar_hardware(recargar=True)
        self.assertGreaterEqual(hw["nucleos"], 1)
        self.assertIsInstance(hw["gpus"], list)

    def test_la_medicion_ve_este_proceso(self):
        recursos.medir()                                                         # la primera solo fija la referencia
        t0 = time.time()
        while time.time() - t0 < 0.3:
            pass                                                                 # un poco de CPU para que el delta no sea cero
        r = recursos.medir()
        self.assertGreater(r["ram_backend_mb"], 10)
        self.assertGreaterEqual(r["cpu_app_pct"], 0)
        self.assertLessEqual(r["cpu_app_pct"], 100)

    def test_encuentra_procesos_por_nombre_sin_fallar(self):
        self.assertIsInstance(recursos.pids_ollama(), list)
        self.assertNotIn(os.getpid(), recursos.pids_ollama())


if __name__ == "__main__":
    unittest.main()
