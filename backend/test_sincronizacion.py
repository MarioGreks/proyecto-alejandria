"""Pruebas de la sincronización entre PCs: varios «PCs» (carpetas de datos distintas) y una carpeta compartida, sin tocar la base de datos real."""
import json
import os
import shutil
import tempfile
import unittest

import sincronizacion
from sincronizacion import Sincronizador


class AristasMem:
    """Las conexiones de un PC, en memoria (en producción son aristas.parquet)."""
    def __init__(self):
        self.filas = {}

    def listar(self):
        return [dict(f) for f in self.filas.values()]

    def guardar(self, a):
        self.filas[(a["origen_id"], a["destino_id"])] = dict(a)

    def borrar(self, o, d):
        self.filas.pop((o, d), None)


class Reloj:
    """Instantes crecientes (µs) para que el orden de los acontecimientos sea determinista."""
    def __init__(self):
        self.t = 1_700_000_000_000_000

    def __call__(self):
        self.t += 1_000_000
        return self.t


class Pc:
    def __init__(self, nombre, compartida, reloj):
        self.nombre, self.reloj = nombre, reloj
        self.datos = tempfile.mkdtemp(prefix=f"ap-{nombre}-")
        self.raw = os.path.join(self.datos, "raw")
        os.makedirs(self.raw)
        self.aristas = AristasMem()
        self.cambios = []
        self.sync = Sincronizador(self.datos, compartida, self.aristas, al_cambiar=self._al_cambiar, ahora_us=reloj, host=nombre)

    def _al_cambiar(self, n, a):
        self.cambios.append((n, a))
        self.quitar_huerfanas()                           # como db_conn.quitar_aristas_huerfanas tras recompilar

    def quitar_huerfanas(self):
        vivas = set(self.ids())
        for k in [k for k in self.aristas.filas if k[0] not in vivas or k[1] not in vivas]:
            del self.aristas.filas[k]

    def neurona(self, id_, **campos):
        ruta = os.path.join(self.raw, id_ + ".json")
        contenido = {"nombre": id_.upper(), "cluster": "Mates", "teoria": "texto de " + id_, **campos}
        with open(ruta, "w", encoding="utf-8") as f:
            json.dump(contenido, f, ensure_ascii=False)
        t = self.reloj() / 1_000_000                       # la «hora de edición» del archivo: la del reloj de la prueba
        os.utime(ruta, (t, t))

    def leer(self, id_):
        ruta = os.path.join(self.raw, id_ + ".json")
        if not os.path.exists(ruta):
            return None
        with open(ruta, encoding="utf-8") as f:
            return json.load(f)

    def borrar(self, id_):
        os.remove(os.path.join(self.raw, id_ + ".json"))
        self.quitar_huerfanas()                          # borrar una neurona quita sus conexiones (main.delete_node)

    def ids(self):
        return sorted(f[:-5] for f in os.listdir(self.raw) if f.endswith(".json"))

    def conexion(self, o, d, estado="pendiente", motivo="porque sí"):
        if o not in self.ids() or d not in self.ids():
            return                                       # en la app solo se conectan neuronas que existen
        self.aristas.guardar({"origen_id": o, "destino_id": d, "motivo": motivo, "estado": estado})

    def vuelta(self):
        return self.sync.sincronizar()


class TestSincronizacion(unittest.TestCase):
    def setUp(self):
        self.compartida = tempfile.mkdtemp(prefix="ap-compartida-")
        self.reloj = Reloj()
        self.addCleanup(shutil.rmtree, self.compartida, True)

    def pc(self, nombre):
        p = Pc(nombre, self.compartida, self.reloj)
        self.addCleanup(shutil.rmtree, p.datos, True)
        return p

    def converger(self, *pcs, vueltas=3):
        for _ in range(vueltas):
            for p in pcs:
                p.vuelta()

    def test_una_neurona_y_su_conexion_llegan_al_otro_pc(self):
        a, b = self.pc("A"), self.pc("B")
        a.neurona("x"), a.neurona("y"), a.conexion("x", "y", "aceptada")
        r = a.vuelta()
        self.assertEqual(r["enviadas"], 3)
        rb = b.vuelta()
        self.assertEqual(rb["recibidas"], 3)
        self.assertEqual(b.ids(), ["x", "y"])
        self.assertEqual(b.leer("x"), a.leer("x"))
        self.assertEqual(b.aristas.listar()[0]["estado"], "aceptada")
        self.assertIn((True, False), b.cambios)             # se recompiló lo local tras recibir neuronas

    def test_sincronizar_dos_veces_no_cambia_nada(self):
        a, b = self.pc("A"), self.pc("B")
        a.neurona("x"), b.neurona("z"), a.conexion("x", "x")
        self.converger(a, b)
        for p in (a, b):
            r = p.vuelta()
            self.assertEqual((r["enviadas"], r["recibidas"], r["borradas"], r["conflictos"]), (0, 0, 0, []), p.nombre)

    def test_una_edicion_se_propaga(self):
        a, b = self.pc("A"), self.pc("B")
        a.neurona("x", teoria="uno")
        self.converger(a, b)
        a.neurona("x", teoria="dos")
        self.converger(a, b)
        self.assertEqual(b.leer("x")["teoria"], "dos")

    def test_un_borrado_se_propaga_y_una_edicion_posterior_lo_resucita(self):
        a, b = self.pc("A"), self.pc("B")
        a.neurona("x"), a.neurona("y")
        self.converger(a, b)
        a.borrar("x")
        r = a.vuelta()
        b.vuelta()
        self.assertEqual(b.ids(), ["y"])
        self.assertGreaterEqual(r["enviadas"], 1)
        b.neurona("x", teoria="de vuelta")                  # B la crea de nuevo después del borrado
        self.converger(a, b)
        self.assertEqual(a.leer("x")["teoria"], "de vuelta")

    def test_la_papelera_viaja_como_una_edicion_y_restaurar_la_revive_en_todos(self):
        """Mover a la papelera marca el JSON (`papelera`); restaurar quita la marca; borrar de verdad es el borrado de siempre (tumba)."""
        a, b = self.pc("A"), self.pc("B")
        a.neurona("x")
        self.converger(a, b)
        a.neurona("x", papelera={"fecha": "2026-11-07T10:00:00+00:00"})
        self.converger(a, b)
        self.assertEqual(b.leer("x")["papelera"]["fecha"], "2026-11-07T10:00:00+00:00")     # el otro PC también la tiene en su papelera
        b.neurona("x")                                                                      # se restaura en B (sin la marca)...
        self.converger(a, b)
        self.assertNotIn("papelera", a.leer("x"))                                           # ...y revive también en A
        b.borrar("x")                                                                       # y borrar de verdad se propaga como siempre
        self.converger(a, b)
        self.assertIsNone(a.leer("x"))

    def test_un_conflicto_lo_gana_la_edicion_mas_reciente_y_los_dos_convergen(self):
        a, b = self.pc("A"), self.pc("B")
        a.neurona("x", teoria="base")
        self.converger(a, b)
        b.neurona("x", teoria="de B")                       # B edita primero...
        a.neurona("x", teoria="de A")                       # ...y A después: debe ganar A aunque B sincronice el último
        a.vuelta()
        rb = b.vuelta()
        self.assertEqual(rb["conflictos"], ["n/x"])
        self.converger(a, b)
        self.assertEqual(a.leer("x")["teoria"], "de A")
        self.assertEqual(b.leer("x")["teoria"], "de A")
        copias = os.listdir(os.path.join(b.datos, "conflictos"))   # lo de B no se tira: queda aparte
        self.assertEqual(len(copias), 1)
        with open(os.path.join(b.datos, "conflictos", copias[0]), encoding="utf-8") as f:
            self.assertEqual(json.load(f)["teoria"], "de B")

    def test_tres_pcs_convergen_sea_cual_sea_el_orden(self):
        for orden in ([0, 1, 2], [2, 1, 0], [1, 0, 2]):
            with self.subTest(orden=orden):
                compartida = tempfile.mkdtemp(prefix="ap-c3-")
                self.addCleanup(shutil.rmtree, compartida, True)
                pcs = [Pc(n, compartida, self.reloj) for n in "ABC"]
                for p in pcs:
                    self.addCleanup(shutil.rmtree, p.datos, True)
                pcs[0].neurona("a1"), pcs[1].neurona("b1"), pcs[2].neurona("c1")
                pcs[0].conexion("a1", "b1")
                for i in orden:
                    pcs[i].vuelta()
                pcs[1].neurona("a1", teoria="B la cambia")
                pcs[2].borrar("c1") if "c1" in pcs[2].ids() else None
                for _ in range(3):
                    for i in orden:
                        pcs[i].vuelta()
                finales = [(p.ids(), p.leer("a1"), sorted((e["origen_id"], e["destino_id"], e["estado"], e["motivo"]) for e in p.aristas.listar())) for p in pcs]
                self.assertTrue(all(f == finales[0] for f in finales), finales)
                self.assertEqual(finales[0][0], ["a1", "b1"])

    def test_al_azar_tres_pcs_siempre_acaban_iguales(self):
        """Ediciones, altas, borrados y cambios de estado al azar, sincronizaciones en cualquier orden: al final, todos iguales."""
        import random
        for semilla in range(40):
            with self.subTest(semilla=semilla):
                azar = random.Random(semilla)
                compartida = tempfile.mkdtemp(prefix="ap-azar-")
                self.addCleanup(shutil.rmtree, compartida, True)
                pcs = [Pc(n, compartida, self.reloj) for n in "ABC"]
                for p in pcs:
                    self.addCleanup(shutil.rmtree, p.datos, True)
                ids = [f"n{i}" for i in range(6)]
                for _ in range(120):
                    p = azar.choice(pcs)
                    op = azar.random()
                    if op < 0.35:
                        p.neurona(azar.choice(ids), teoria=f"v{azar.randrange(1000)}")
                    elif op < 0.45 and p.ids():
                        p.borrar(azar.choice(p.ids()))
                    elif op < 0.6:
                        o, d = azar.sample(ids, 2)
                        p.conexion(o, d, azar.choice(["pendiente", "aceptada", "rechazada"]), motivo=f"m{azar.randrange(100)}")
                    else:
                        p.vuelta()
                self.converger(*pcs, vueltas=4)
                finales = [([(i, p.leer(i)) for i in p.ids()],
                            sorted((e["origen_id"], e["destino_id"], e["estado"], e["motivo"]) for e in p.aristas.listar())) for p in pcs]
                self.assertTrue(all(f == finales[0] for f in finales))

    def test_un_json_a_medias_se_ignora_y_se_recupera_despues(self):
        a, b = self.pc("A"), self.pc("B")
        a.neurona("x")
        a.vuelta()
        ruta = os.path.join(a.sync.dir_propia, "neuronas", "x.json")
        completo = open(ruta, encoding="utf-8").read()
        with open(ruta, "w", encoding="utf-8") as f:
            f.write(completo[:len(completo) // 2])          # la nube lo entrega a medias
        r = b.vuelta()
        self.assertEqual(b.ids(), [])
        self.assertTrue(any("ilegible" in x for x in r["avisos"]))
        with open(ruta, "w", encoding="utf-8") as f:
            f.write(completo)
        b.vuelta()
        self.assertEqual(b.ids(), ["x"])

    def test_si_desaparecen_de_golpe_muchas_neuronas_no_se_borran_en_los_demas_y_se_restauran(self):
        a, b = self.pc("A"), self.pc("B")
        for i in range(8):
            a.neurona(f"n{i}")
        self.converger(a, b)
        shutil.rmtree(a.raw)                                 # la carpeta de datos de A se perdió o se vació
        os.makedirs(a.raw)
        r = a.vuelta()
        self.assertTrue(any("de golpe" in x for x in r["avisos"]))
        b.vuelta()
        self.assertEqual(len(b.ids()), 8)                    # B no perdió nada
        self.assertEqual(len(a.ids()), 8)                    # y A recuperó lo suyo desde B

    def test_un_borrado_pequeno_si_se_propaga(self):
        a, b = self.pc("A"), self.pc("B")
        for i in range(8):
            a.neurona(f"n{i}")
        self.converger(a, b)
        a.borrar("n0")
        self.converger(a, b)
        self.assertEqual(len(b.ids()), 7)

    def test_el_embedding_ni_se_publica_ni_cuenta_como_cambio(self):
        a, b = self.pc("A"), self.pc("B")
        a.neurona("x", embedding=[0.1] * 4)
        a.vuelta()
        with open(os.path.join(a.sync.dir_propia, "neuronas", "x.json"), encoding="utf-8") as f:
            self.assertNotIn("embedding", json.load(f)["datos"])
        a.neurona("x", embedding=[0.9] * 4)                  # el clasificador lo recalcula: no es una edición
        self.assertEqual(a.vuelta()["enviadas"], 0)
        b.vuelta()
        self.assertNotIn("embedding", b.leer("x"))

    def test_una_carpeta_que_no_existe_no_cambia_nada(self):
        a = self.pc("A")
        a.neurona("x")
        a.sync.carpeta = os.path.join(self.compartida, "no-montada")
        with self.assertRaises(FileNotFoundError):
            a.vuelta()
        self.assertEqual(a.ids(), ["x"])
        self.assertFalse(os.path.exists(os.path.join(a.datos, "sync_estado.json")))

    def test_el_estado_de_una_conexion_rechazada_viaja_para_que_no_se_vuelva_a_proponer(self):
        a, b = self.pc("A"), self.pc("B")
        a.neurona("x"), a.neurona("y"), a.conexion("x", "y", "pendiente")
        self.converger(a, b)
        a.conexion("x", "y", "rechazada")
        self.converger(a, b)
        self.assertEqual(b.aristas.listar()[0]["estado"], "rechazada")

    def test_una_conexion_espera_a_que_lleguen_sus_neuronas(self):
        a, b = self.pc("A"), self.pc("B")
        a.neurona("x"), a.neurona("y"), a.conexion("x", "y")
        a.vuelta()
        neuronas = os.path.join(a.sync.dir_propia, "neuronas")
        oculta = neuronas + "-oculta"
        os.rename(neuronas, oculta)                          # la nube aún no ha bajado las neuronas
        r = b.vuelta()
        self.assertEqual(b.aristas.listar(), [])
        self.assertTrue(any("espera" in x for x in r["avisos"]))
        os.rename(oculta, neuronas)
        b.vuelta()
        self.assertEqual(len(b.aristas.listar()), 1)

    def test_lo_mismo_en_los_dos_pcs_no_es_un_conflicto(self):
        a, b = self.pc("A"), self.pc("B")
        a.neurona("x", teoria="igual"), b.neurona("x", teoria="igual")      # p. ej. importada a mano en los dos
        a.vuelta()
        r = b.vuelta()
        self.assertEqual(r["conflictos"], [])
        self.assertFalse(os.path.exists(os.path.join(b.datos, "conflictos")))

    def test_cambiar_de_carpeta_vuelve_a_publicarlo_todo(self):
        a = self.pc("A")
        a.neurona("x")
        a.vuelta()
        nueva = tempfile.mkdtemp(prefix="ap-nueva-")
        self.addCleanup(shutil.rmtree, nueva, True)
        sincronizacion.olvidar(a.datos)
        a2 = Sincronizador(a.datos, nueva, a.aristas, ahora_us=self.reloj, host="A")
        self.assertEqual(a2.sincronizar()["enviadas"], 1)

    def test_los_datos_copiados_a_otro_equipo_no_comparten_identidad(self):
        a = self.pc("A")
        a.neurona("x")
        a.vuelta()
        copia = Sincronizador(a.datos, self.compartida, a.aristas, ahora_us=self.reloj, host="OTRO-EQUIPO")
        self.assertNotEqual(copia.pc, a.sync.pc)

    def test_un_archivo_ajeno_o_con_nombre_raro_en_la_carpeta_compartida_no_rompe_nada(self):
        a, b = self.pc("A"), self.pc("B")
        a.neurona("x")
        a.vuelta()
        raro = os.path.join(a.sync.dir_propia, "neuronas")
        for nombre, contenido in (("..%2f..%2fx.json", "{}"), ("ok.json", "[1,2]"), ("notas.txt", "hola"), ("y.json", '{"_sync": {"t": "no", "rev": 1, "pc": "A"}}')):
            with open(os.path.join(raro, nombre), "w", encoding="utf-8") as f:
                f.write(contenido)
        r = b.vuelta()
        self.assertEqual(b.ids(), ["x"])
        self.assertGreaterEqual(len(r["avisos"]), 1)


class TestSincronizacionIncremental(unittest.TestCase):
    """Una vuelta sin cambios no vuelve a leer las neuronas cuyo archivo sigue igual (mismo instante y tamaño), pero detecta cualquier cambio."""
    def setUp(self):
        self.compartida = tempfile.mkdtemp(prefix="ap-compartida-")
        self.reloj = Reloj()
        self.addCleanup(shutil.rmtree, self.compartida, True)
        self.a = Pc("A", self.compartida, self.reloj)
        self.addCleanup(shutil.rmtree, self.a.datos, True)
        for i in range(5):
            self.a.neurona(f"n{i}", teoria=f"texto {i}")
        self.a.vuelta()

    def pc_nuevo(self, nombre):
        p = Pc(nombre, self.compartida, self.reloj)
        self.addCleanup(shutil.rmtree, p.datos, True)
        return p

    def lecturas_en_una_vuelta(self, pc=None):
        """Una vuelta de `pc`, y qué archivos de su carpeta de neuronas se leyeron en ella."""
        pc = pc or self.a
        leidos = []
        original = sincronizacion._leer

        def contando(ruta):
            leidos.append(os.path.normcase(ruta))
            return original(ruta)
        sincronizacion._leer = contando
        try:
            resumen = pc.vuelta()
        finally:
            sincronizacion._leer = original
        return [os.path.basename(r) for r in leidos if os.path.normcase(pc.raw) in r], resumen

    def test_una_vuelta_sin_cambios_no_lee_ninguna_neurona(self):
        leidas, r = self.lecturas_en_una_vuelta()
        self.assertEqual(leidas, [])
        self.assertEqual((r["enviadas"], r["recibidas"], r["borradas"]), (0, 0, 0))

    def test_una_edicion_se_detecta_aunque_las_demas_no_se_lean(self):
        self.a.neurona("n2", teoria="editada")
        leidas, r = self.lecturas_en_una_vuelta()
        self.assertEqual(leidas, ["n2.json"])                      # solo la que cambió
        self.assertEqual(r["enviadas"], 1)
        b = self.pc_nuevo("B")
        b.vuelta()
        self.assertEqual(b.leer("n2")["teoria"], "editada")

    def test_un_cambio_de_contenido_con_el_mismo_tamano_tambien_se_detecta(self):
        ruta = os.path.join(self.a.raw, "n1.json")
        antes = os.path.getsize(ruta)
        self.a.neurona("n1", teoria="texto X")                     # «texto 1» → «texto X»: mismo tamaño, otro instante
        self.assertEqual(os.path.getsize(ruta), antes)
        self.assertEqual(self.a.vuelta()["enviadas"], 1)

    def test_un_borrado_se_detecta_sin_leer_nada(self):
        self.a.borrar("n3")
        leidas, r = self.lecturas_en_una_vuelta()
        self.assertEqual(leidas, [])
        self.assertEqual(r["enviadas"], 1)                         # la tumba se publica
        b = self.pc_nuevo("B")
        b.vuelta()
        self.assertNotIn("n3", b.ids())

    def test_anadir_el_embedding_al_archivo_no_es_un_cambio_y_se_anota_para_no_releerlo(self):
        ruta = os.path.join(self.a.raw, "n0.json")
        with open(ruta, encoding="utf-8") as f:
            c = json.load(f)
        c["embedding"] = [0.1] * 50                                # lo que hace compile_raw_jsons: reescribe el archivo (otro tamaño e instante)
        with open(ruta, "w", encoding="utf-8") as f:
            json.dump(c, f, indent=2)
        t = self.reloj() / 1_000_000
        os.utime(ruta, (t, t))
        leidas, r = self.lecturas_en_una_vuelta()
        self.assertEqual(leidas, ["n0.json"])                      # se lee una vez para comprobarlo...
        self.assertEqual(r["enviadas"], 0)                         # ...y no cuenta como cambio
        leidas, _ = self.lecturas_en_una_vuelta()
        self.assertEqual(leidas, [])                               # a la siguiente ya no

    def test_un_estado_anterior_sin_firmas_se_lee_una_vez_y_se_aprende(self):
        for it in self.a.sync.estado["items"].values():
            it.pop("m", None)                                      # el estado que dejó una versión sin esta mejora
        leidas, r = self.lecturas_en_una_vuelta()
        self.assertEqual(len(leidas), 5)
        self.assertEqual((r["enviadas"], r["recibidas"]), (0, 0))
        leidas, _ = self.lecturas_en_una_vuelta()
        self.assertEqual(leidas, [])

    def lecturas_de_la_nube(self, pc):
        """Una vuelta de `pc` y cuántos archivos de la carpeta compartida (lo que publican los demás) se abrieron."""
        leidos = []
        original = sincronizacion._leer

        def contando(ruta):
            leidos.append(os.path.normcase(ruta))
            return original(ruta)
        sincronizacion._leer = contando
        try:
            resumen = pc.vuelta()
        finally:
            sincronizacion._leer = original
        return [os.path.basename(r) for r in leidos if os.path.normcase(self.compartida) in r and os.path.normcase(pc.sync.dir_propia) not in r and not r.endswith("pc.json")], resumen   # pc.json: la ficha de cada PC, una por vuelta

    def test_lo_que_otro_pc_publico_y_no_ha_cambiado_no_se_abre_otra_vez(self):
        b = self.pc_nuevo("B")
        b.vuelta()                                                    # recibe las 5 (se abren una vez)
        abiertos, r = self.lecturas_de_la_nube(b)
        self.assertEqual(abiertos, [])
        self.assertEqual((r["enviadas"], r["recibidas"]), (0, 0))

    def test_una_reescritura_remota_del_mismo_tamano_y_el_mismo_instante_tambien_se_ve(self):
        """Dos reescrituras seguidas del mismo archivo (mismo tamaño, dentro del mismo tic del reloj) no pueden confundirse con «sin cambios»."""
        b = self.pc_nuevo("B")
        b.vuelta()
        ruta = os.path.join(self.a.sync.dir_propia, "neuronas", "n1.json")
        antes = os.stat(ruta)
        self.a.neurona("n1", teoria="texto Z")                    # mismo tamaño que «texto 1»
        self.a.vuelta()
        self.assertEqual(os.path.getsize(ruta), antes.st_size)
        os.utime(ruta, ns=(antes.st_atime_ns, antes.st_mtime_ns))     # y, para el caso, el mismo instante de modificación
        self.assertEqual(b.vuelta()["recibidas"], 1)
        self.assertEqual(b.leer("n1")["teoria"], "texto Z")

    def test_una_edicion_remota_se_abre_y_se_aplica_aunque_las_demas_esten_en_la_cache(self):
        b = self.pc_nuevo("B")
        b.vuelta()
        self.a.neurona("n3", teoria="cambiada en A")
        self.a.vuelta()
        abiertos, r = self.lecturas_de_la_nube(b)
        self.assertEqual(abiertos, ["n3.json"])                       # solo la que cambió
        self.assertEqual(r["recibidas"], 1)
        self.assertEqual(b.leer("n3")["teoria"], "cambiada en A")

    def test_lo_que_desaparece_de_la_nube_se_olvida_de_la_cache_y_no_rompe_nada(self):
        b = self.pc_nuevo("B")
        b.vuelta()
        os.remove(os.path.join(self.a.sync.dir_propia, "neuronas", "n2.json"))
        r = b.vuelta()                                                # B sigue teniendo n2: no se «borra» por desaparecer de la nube
        self.assertIn("n2", b.ids())
        self.assertFalse(any(k.endswith("/n2.json") for k in b.sync.estado["rem"]))
        self.assertEqual((r["recibidas"], r["borradas"]), (0, 0))

    def test_un_archivo_remoto_que_se_estropea_sin_cambiar_de_firma_se_salta_con_aviso(self):
        b = self.pc_nuevo("B")
        b.vuelta()
        ruta = os.path.join(self.a.sync.dir_propia, "neuronas", "n1.json")
        st = os.stat(ruta)
        with open(ruta, "wb") as f:
            f.write(b"x" * st.st_size)                                # basura del mismo tamaño...
        os.utime(ruta, ns=(st.st_atime_ns, st.st_mtime_ns))           # ...y el mismo instante: la cache cree que sigue igual
        del b.sync.estado["items"]["n/n1"]                           # y B «no sabe» de ella: hará falta leerla para aplicarla
        r = b.vuelta()                                                # no lanza: se salta con aviso
        self.assertTrue(any("n/n1" in av and "ilegible" in av for av in r["avisos"]), r["avisos"])
        self.assertEqual(b.leer("n1")["teoria"], "texto 1")           # lo que B ya tenía no se toca

    def test_lo_que_llega_de_otro_pc_tampoco_se_relee_y_una_edicion_posterior_se_ve(self):
        b = self.pc_nuevo("B")
        self.assertEqual(b.vuelta()["recibidas"], 5)
        leidas, _ = self.lecturas_en_una_vuelta(b)
        self.assertEqual(leidas, [])
        b.neurona("n4", teoria="editada en B")
        self.assertEqual(b.vuelta()["enviadas"], 1)
        self.assertEqual(self.a.vuelta()["recibidas"], 1)
        self.assertEqual(self.a.leer("n4")["teoria"], "editada en B")


if __name__ == "__main__":
    unittest.main()
