r"""Tests de la grabadora de figuras (labplot.py). Necesitan numpy y matplotlib instalados (el entorno de backend/.venv los tiene por ahora).
Ejecutar desde frontend/src/labs/:  ..\..\..\backend\.venv\Scripts\python.exe -m unittest test_labplot -v"""
import sys
import unittest

import labplot


class TestGrabadora(unittest.TestCase):
    def datos(self, codigo):
        r = labplot.ejecutar(codigo)
        self.assertEqual(r["modo"], "datos", r)
        return r["figuras"]

    def imagen(self, codigo):
        r = labplot.ejecutar(codigo)
        self.assertEqual(r["modo"], "imagen", r)
        return r["motivo"]

    def test_plot_con_formato_barras_y_titulos(self):
        fig, = self.datos(
            "import numpy as np, matplotlib.pyplot as plt\n"
            "k = np.arange(4)\n"
            "plt.figure(figsize=(9, 5))\n"
            "plt.bar(k, k * 2.0, width=0.8, alpha=0.7, label='PMF')\n"
            "plt.plot(k, k + 1.0, 'r--o', label='Normal')\n"
            "plt.title('T'); plt.xlabel('k'); plt.ylabel('P'); plt.grid(True, alpha=0.3); plt.legend(); plt.show()")
        self.assertEqual(fig["tam"], [9.0, 5.0])
        eje, = fig["ejes"]
        barras, linea = eje["series"]
        self.assertEqual((barras["tipo"], barras["alto"], barras["alpha"]), ("barras", [0.0, 2.0, 4.0, 6.0], 0.7))
        self.assertEqual((linea["tipo"], linea["color"], linea["estilo"], linea["marcador"]), ("linea", "#ff0000", "--", "o"))
        self.assertEqual((eje["titulo"], eje["xlabel"], eje["ylabel"], eje["leyenda"]), ("T", "k", "P", "best"))
        self.assertEqual(eje["grid"]["alpha"], 0.3)

    def test_subplots_matriz_nan_y_colores_por_defecto(self):
        fig, = self.datos(
            "import numpy as np, matplotlib.pyplot as plt\n"
            "fig, axes = plt.subplots(2, 2, figsize=(8, 6))\n"
            "axes[0, 0].plot([0, 1, 2], [1.0, float('nan'), np.inf])\n"
            "axes[0, 1].plot([0, 1], [1, 2]); axes[0, 1].plot([0, 1], [2, 3])\n"
            "for ax in axes.ravel(): ax.set_title('$\\\\mu(x)$')\n"
            "fig.suptitle('Sup'); plt.tight_layout(); plt.show()")
        self.assertEqual(fig["titulo"], "Sup")
        self.assertEqual(len(fig["ejes"]), 4)
        self.assertEqual(fig["ejes"][0]["series"][0]["y"], [1.0, None, None])
        c1, c2 = (s["color"] for s in fig["ejes"][1]["series"])
        self.assertNotEqual(c1, c2)  # el ciclo de colores avanza
        self.assertEqual(fig["ejes"][3]["titulo"], "$\\mu(x)$")

    def test_rectas_texto_y_limites(self):
        fig, = self.datos(
            "import matplotlib.pyplot as plt\n"
            "fig, ax = plt.subplots()\n"
            "ax.axvline(2, color='red', linestyle='--'); ax.axhline(1, lw=2)\n"
            "ax.text(0.5, 0.9, 'hola', transform=ax.transAxes, ha='center')\n"
            "ax.annotate('pico', xy=(1, 1), xytext=(2, 2), arrowprops=dict(arrowstyle='->'))\n"
            "ax.set_xlim(0, 4); ax.set_ylim((0, 3)); plt.show()")
        eje, = fig["ejes"]
        tipos = [s["tipo"] for s in eje["series"]]
        self.assertEqual(tipos, ["vline", "hline", "texto", "texto"])
        self.assertTrue(eje["series"][2]["ejes"])
        self.assertEqual(eje["series"][3]["flecha"], {"x": 1.0, "y": 1.0})
        self.assertEqual((eje["xlim"], eje["ylim"]), ([0.0, 4.0], [0.0, 3.0]))

    def test_barras_con_nombres_colores_por_barra_y_posiciones_leidas(self):
        fig, = self.datos(
            "import matplotlib.pyplot as plt\n"
            "fig, ax = plt.subplots()\n"
            "barras = ax.bar(['HM', 'GM', 'AM'], [1.0, float('nan'), 3.0], color=['#e74c3c', '#f39c12', '#2ecc71'], edgecolor='black')\n"
            "for b, v in zip(barras, [1.0, 2.0, 3.0]):\n"
            "    ax.text(b.get_x() + b.get_width() / 2.0, b.get_height() + 0.1, f'{v:.1f}', ha='center')\n"
            "ax.bar(['AM', 'QM'], [3.5, 4.0], color='navy')\n"
            "plt.show()")
        eje, = fig["ejes"]
        self.assertEqual(eje["categorias"], ["HM", "GM", "AM", "QM"])       # las categorías se comparten entre llamadas
        b1, t1, t2, t3, b2 = eje["series"]
        self.assertEqual((b1["x"], b1["alto"], b1["colores"]), ([0.0, 1.0, 2.0], [1.0, None, 3.0], ["#e74c3c", "#f39c12", "#2ecc71"]))
        self.assertEqual(b2["x"], [2.0, 3.0])
        self.assertEqual((t1["x"], t1["y"]), (0.0, 1.1))                    # get_x() + get_width()/2 = centro de la barra
        self.assertEqual(t1["texto"], "1.0")

    def test_xticks_e_yticks_a_medida_se_graban_con_o_sin_etiquetas(self):
        fig, = self.datos(
            "import numpy as np, matplotlib.pyplot as plt\n"
            "k = np.arange(4)\n"
            "plt.bar(k, k * 2.0)\n"
            "plt.xticks(k)\n"
            "plt.yticks([0, 3, 6], ['bajo', 'medio', 'alto'])\n"
            "plt.show()")
        eje, = fig["ejes"]
        self.assertEqual(eje["xticks"], {"pos": [0.0, 1.0, 2.0, 3.0], "labels": None})
        self.assertEqual(eje["yticks"], {"pos": [0.0, 3.0, 6.0], "labels": ["bajo", "medio", "alto"]})

    def test_barras_apiladas_guardan_la_base_y_get_y_la_devuelve(self):
        fig, = self.datos(
            "import matplotlib.pyplot as plt\n"
            "a = [1.0, 2.0, 3.0]\n"
            "plt.bar([0, 1, 2], a, label='A')\n"
            "barras = plt.bar([0, 1, 2], [2.0, 1.0, 0.5], bottom=a, label='B')\n"
            "plt.text(0, barras[0].get_y() + barras[0].get_height(), 'tope'); plt.legend(); plt.show()")
        eje, = fig["ejes"]
        a, b, texto = eje["series"]
        self.assertIsNone(a["base"])
        self.assertEqual(b["base"], [1.0, 2.0, 3.0])
        self.assertEqual(texto["y"], 3.0)                       # base 1 + alto 2

    def test_fill_between_con_where_hace_un_area_por_racha_y_solo_la_primera_lleva_leyenda(self):
        fig, = self.datos(
            "import numpy as np, matplotlib.pyplot as plt\n"
            "x = np.arange(8.0)\n"
            "plt.fill_between(x, x * 0, np.sin(x), where=np.sin(x) > 0.1, color='g', label='positivo'); plt.show()")
        eje, = fig["ejes"]
        self.assertGreaterEqual(len(eje["series"]), 1)
        self.assertTrue(all(len(s["x"]) >= 2 for s in eje["series"]))                       # una racha de un solo punto no dibuja nada
        self.assertEqual([s["label"] for s in eje["series"]][1:], [None] * (len(eje["series"]) - 1))
        sin_nada, = self.datos("import numpy as np, matplotlib.pyplot as plt\nplt.plot([0, 1]); plt.fill_between([0, 1], 0, 1, where=[False, False]); plt.show()")
        self.assertEqual([s["tipo"] for s in sin_nada["ejes"][0]["series"]], ["linea"])

    def test_escala_logaritmica_por_cualquiera_de_sus_vias(self):
        for codigo, esperado in {
            "plt.plot([1, 10]); plt.yscale('log')": (None, "log"),
            "plt.plot([1, 10]); plt.gca().set_xscale('log'); plt.gca().set_yscale('log')": ("log", "log"),
            "plt.semilogx([1, 10], [1, 2])": ("log", None),
            "plt.semilogy([1, 10], [1, 2])": (None, "log"),
            "plt.loglog([1, 10], [1, 2])": ("log", "log"),
            "plt.plot([1, 10]); plt.yscale('log'); plt.yscale('linear')": (None, None),
        }.items():
            with self.subTest(codigo):
                fig, = self.datos(f"import matplotlib.pyplot as plt\n{codigo}\nplt.show()")
                self.assertEqual((fig["ejes"][0]["xscale"], fig["ejes"][0]["yscale"]), esperado)

    def test_sin_ticks_a_medida_van_a_null(self):
        fig, = self.datos("import matplotlib.pyplot as plt\nplt.plot([1, 2]); plt.show()")
        eje, = fig["ejes"]
        self.assertEqual((eje["xticks"], eje["yticks"]), (None, None))

    def test_lo_que_no_sabe_dibujar_cae_a_imagen(self):
        casos = {
            "contornos": "import numpy as np, matplotlib.pyplot as plt\nfig, ax = plt.subplots()\nax.contour(np.ones((3, 3)))\nplt.show()",
            "escala a medida": "import matplotlib.pyplot as plt\nplt.plot([1, 2]); plt.gca().set_yscale('symlog'); plt.show()",
            "log en base 2": "import matplotlib.pyplot as plt\nplt.plot([1, 2]); plt.yscale('log', base=2); plt.show()",
            "fill_between con interpolate": "import numpy as np, matplotlib.pyplot as plt\nx = np.arange(4)\nplt.fill_between(x, x, 2, where=x > 1, interpolate=True); plt.show()",
            "ticks con rotación": "import matplotlib.pyplot as plt\nplt.plot([1, 2]); plt.xticks([1, 2], rotation=45); plt.show()",
            "leer los ticks": "import matplotlib.pyplot as plt\nplt.plot([1, 2]); plt.xticks(); plt.show()",
            "ticks sobre categorías": "import matplotlib.pyplot as plt\nplt.bar(['a', 'b'], [1, 2]); plt.xticks([0, 1]); plt.show()",
            "argumento desconocido": "import matplotlib.pyplot as plt\nplt.plot([1, 2], drawstyle='steps'); plt.show()",
            "barras con colores de longitud distinta": "import matplotlib.pyplot as plt\nplt.bar([1, 2], [1, 2], color=['r', 'g', 'b']); plt.show()",
            "barras con anchos distintos": "import matplotlib.pyplot as plt\nplt.bar([1, 2], [1, 2], width=[0.3, 0.6]); plt.show()",
            "no dibuja nada": "x = 1 + 1",
            "error del propio código": "import matplotlib.pyplot as plt\nplt.plot([1, 2])\n1 / 0",
        }
        for nombre, codigo in casos.items():
            with self.subTest(nombre):
                self.imagen(codigo)

    def test_deja_el_pyplot_real_en_su_sitio_incluso_si_falla(self):
        import matplotlib
        import matplotlib.pyplot as real
        for codigo in ("import matplotlib.pyplot as plt\nplt.plot([1, 2])\nplt.show()", "import matplotlib.pyplot as plt\nplt.contour([[1]])"):
            labplot.ejecutar(codigo)
            self.assertIs(sys.modules["matplotlib.pyplot"], real)
            self.assertIs(matplotlib.pyplot, real)


if __name__ == "__main__":
    unittest.main()
