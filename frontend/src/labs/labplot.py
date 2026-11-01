"""Grabadora de figuras con la API de matplotlib/pyplot.

Ejecuta el código de un laboratorio con un "pyplot" falso que NO dibuja: solo anota qué se pidió
(líneas, puntos, barras, rectas, textos, títulos...) y devuelve esos datos para que el navegador los pinte.
Construir y renderizar una figura real cuesta 100-300 ms; calcular los datos, 1-7 ms.

Todo lo que la grabadora no sabe representar fielmente (contornos, 3D, imágenes, escalas log, ticks a medida,
argumentos desconocidos...) lanza NoSoportado y quien llama vuelve a ejecutar el código con matplotlib de
verdad (imagen PNG), sin que el laboratorio cambie. Ante la duda, siempre se prefiere la imagen a un dibujo falso.

Este archivo se ejecuta DENTRO de Pyodide (labWorker.ts lo importa con ?raw) y también se importa en sus tests
(test_labplot.py): no debe depender de nada más que numpy y matplotlib.colors.
"""
import math
import re
import sys
import types

import numpy as np


class NoSoportado(Exception):
    """La figura usa algo que la grabadora no sabe representar."""


MARCADORES = set(".,ov^<>1234sp*hH+xDd|_")
ESTILOS = {"-": "-", "--": "--", "-.": "-.", ":": ":", "solid": "-", "dashed": "--", "dashdot": "-.", "dotted": ":",
           "none": "", "None": "", " ": "", "": ""}
_CICLO = 10  # colores C0..C9

# Atributos de los ejes que se aceptan y se ignoran (cosméticos). Cualquier otro -> NoSoportado.
IGNORAR_EJE = {"tick_params", "set_facecolor", "set_axisbelow", "minorticks_on", "minorticks_off", "autoscale", "set_box_aspect"}
ATRIBUTOS_EJE_IGNORADOS = {"spines", "xaxis", "yaxis", "patch"}
IGNORAR_PLT = {"tight_layout", "subplots_adjust", "savefig", "close", "ion", "ioff", "draw", "pause"}

# Argumentos con nombre aceptados por método. Uno desconocido puede cambiar el dibujo -> NoSoportado.
_ADORNOS = {"clip_on", "rasterized", "antialiased", "snap", "url", "gid"}
PERMITIDOS = {
    "plot": {"color", "c", "label", "linewidth", "lw", "linestyle", "ls", "alpha", "marker", "markersize", "ms", "zorder",
             "markerfacecolor", "markeredgecolor", "markeredgewidth", "mfc", "mec", "mew", "solid_capstyle", "dash_capstyle"},
    "scatter": {"color", "c", "s", "marker", "label", "alpha", "edgecolor", "edgecolors", "zorder", "linewidths", "linewidth"},
    "bar": {"color", "alpha", "label", "edgecolor", "zorder", "linewidth", "lw"},
    "fill_between": {"color", "facecolor", "alpha", "label", "zorder", "where", "interpolate", "step", "linewidth", "lw", "edgecolor"},
    "recta": {"color", "c", "linewidth", "lw", "linestyle", "ls", "alpha", "label", "zorder", "ymin", "ymax", "xmin", "xmax"},
    "banda": {"color", "facecolor", "alpha", "label", "zorder", "edgecolor", "linewidth", "lw"},
    "text": {"ha", "va", "horizontalalignment", "verticalalignment", "fontsize", "fontweight", "color", "transform", "zorder",
             "bbox", "fontfamily", "family", "fontstyle", "style", "alpha", "linespacing", "wrap", "c"},
    "annotate": {"xycoords", "textcoords", "arrowprops", "annotation_clip", "ha", "va", "horizontalalignment", "verticalalignment",
                 "fontsize", "fontweight", "color", "bbox", "zorder", "fontfamily", "family", "fontstyle", "style", "alpha"},
    "titulo": {"fontsize", "fontweight", "pad", "color", "fontfamily", "family", "y", "fontstyle", "style"},
    "etiqueta": {"fontsize", "labelpad", "color", "fontweight", "fontfamily", "family", "fontstyle", "style"},
    "grid": {"alpha", "linestyle", "ls", "linewidth", "lw", "color", "c", "zorder"},
    "legend": {"loc", "fontsize", "ncol", "frameon", "framealpha", "edgecolor", "facecolor", "shadow", "fancybox",
               "labelspacing", "handlelength", "borderpad", "columnspacing", "handletextpad", "markerscale"},
}


def _revisar(metodo, kw):
    extra = set(kw) - PERMITIDOS[metodo] - _ADORNOS
    if extra:
        raise NoSoportado(f"{metodo}: argumento(s) no soportado(s): {', '.join(sorted(extra))}")


def _color(valor):
    from matplotlib.colors import to_hex
    try:
        return to_hex(valor, keep_alpha=False)
    except Exception:
        raise NoSoportado(f"color no soportado: {valor!r}")


def _lista(valores):
    """Array numérico 1D -> lista JSON (7 cifras significativas; NaN/Inf -> None)."""
    a = np.asarray(valores, dtype=float)
    if a.ndim == 0:
        a = a.reshape(1)
    if a.ndim != 1:
        raise NoSoportado("datos con más de una dimensión")
    return [float(f"{v:.6g}") if math.isfinite(v) else None for v in a.tolist()]


def _escalar(v):
    v = float(v)
    return float(f"{v:.6g}") if math.isfinite(v) else None


def _parse_fmt(fmt):
    color = marcador = estilo = None
    m = re.match(r"C\d", fmt)
    if m:
        color, fmt = m.group(0), fmt[2:]
    for ls in ("--", "-.", "-", ":"):
        if ls in fmt:
            estilo, fmt = ls, fmt.replace(ls, "", 1)
            break
    for ch in fmt:
        if ch in "bgrcmykw" and color is None:
            color = ch
        elif ch in MARCADORES:
            marcador = ch
        else:
            raise NoSoportado(f"formato de línea no soportado: {fmt!r}")
    if marcador and estilo is None:
        estilo = ""  # 'o' a secas: solo puntos
    return color, marcador, estilo


class _Mudo:
    """Valor devuelto por las llamadas que el código puede encadenar pero que no importan (líneas, spines...)."""
    def __getattr__(self, nombre):
        if nombre.startswith("__"):
            raise AttributeError(nombre)
        return _Mudo()

    def __call__(self, *a, **k):
        return _Mudo()

    def __getitem__(self, k):
        return _Mudo()

    def __iter__(self):
        return iter([_Mudo()])


class _Barra:
    """Lo que devuelve ax.bar(): el código suele leer su posición para colocar etiquetas encima."""
    def __init__(self, x, ancho, alto, y=0.0):
        self._x, self._ancho, self._alto, self._y = x, ancho, alto, y

    def get_x(self):
        return self._x

    def get_y(self):
        return self._y

    def get_width(self):
        return self._ancho

    def get_height(self):
        return self._alto

    def __getattr__(self, nombre):
        if nombre.startswith("__"):
            raise AttributeError(nombre)
        raise NoSoportado(f"barra.{nombre}")


class _Eje:
    transAxes = "ejes"  # centinela: ax.text(..., transform=ax.transAxes)
    transData = "datos"

    def __init__(self, fig, fila, col, filas, cols):
        self.fig, self.pos = fig, (fila, col, filas, cols)
        self.series, self.n_color = [], 0
        self.titulo = self.xlabel = self.ylabel = None
        self.xlim = self.ylim = None
        self.grid_ = None
        self.leyenda = None
        self.aspecto_igual = False
        self.categorias = []  # nombres del eje X cuando se dibujan barras con etiquetas de texto
        self.xticks = self.yticks = None  # marcas a medida: {"pos": [...], "labels": [...] | None}
        self.xscale = self.yscale = None  # "log" o None (lineal)

    # --- helpers -----------------------------------------------------
    def _siguiente_color(self):
        c = _color(f"C{self.n_color % _CICLO}")
        self.n_color += 1
        return c

    @staticmethod
    def _estilo(valor):
        if valor not in ESTILOS:
            raise NoSoportado(f"linestyle no soportado: {valor!r}")
        return ESTILOS[valor]

    @staticmethod
    def _comun(kw):
        return {"alpha": _escalar(kw.get("alpha", 1.0)), "label": kw.get("label"), "zorder": kw.get("zorder")}

    # --- trazado -------------------------------------------------------
    def plot(self, *args, **kw):
        _revisar("plot", kw)
        datos = list(args)
        grupos = []
        while datos:
            a = datos.pop(0)
            if datos and not isinstance(datos[0], str):
                x, y = a, datos.pop(0)
            else:
                x, y = None, a
            fmt = datos.pop(0) if datos and isinstance(datos[0], str) else None
            grupos.append((x, y, fmt))
        lineas = []
        for x, y, fmt in grupos:
            y = np.asarray(y, dtype=float)
            if y.ndim == 2:
                raise NoSoportado("plot con matriz")
            x = np.arange(y.size, dtype=float) if x is None else np.asarray(x, dtype=float)
            if x.size == 1 and y.size > 1:
                x = np.repeat(x, y.size)
            if x.shape != y.shape:
                raise ValueError(f"x e y deben tener el mismo tamaño: {x.shape} vs {y.shape}")
            c_fmt, marcador, estilo = _parse_fmt(fmt) if fmt else (None, None, None)
            color = kw.get("color", kw.get("c", c_fmt))
            marcador = kw.get("marker", marcador)
            if marcador in ("", "None", None):
                marcador = None
            elif marcador not in MARCADORES:
                raise NoSoportado(f"marker no soportado: {marcador!r}")
            ls = kw.get("linestyle", kw.get("ls"))
            estilo = self._estilo(ls) if ls is not None else ("-" if estilo is None else estilo)
            self.series.append({"tipo": "linea", "x": _lista(x), "y": _lista(y),
                                "color": _color(color) if color is not None else self._siguiente_color(),
                                "ancho": _escalar(kw.get("linewidth", kw.get("lw", 1.5))), "estilo": estilo,
                                "marcador": marcador, "ms": _escalar(kw.get("markersize", kw.get("ms", 6))), **self._comun(kw)})
            lineas.append(_Mudo())
        return lineas

    def scatter(self, x, y, s=None, c=None, marker="o", **kw):
        _revisar("scatter", kw)
        if c is not None and not isinstance(c, str):
            raise NoSoportado("scatter con colores por punto")
        if np.ndim(s) > 0:
            raise NoSoportado("scatter con tamaños por punto")
        if marker not in MARCADORES:
            raise NoSoportado(f"marker no soportado: {marker!r}")
        color = kw.get("color", c)
        borde = kw.get("edgecolor", kw.get("edgecolors"))
        self.series.append({"tipo": "dispersion", "x": _lista(np.asarray(x, dtype=float).ravel()),
                            "y": _lista(np.asarray(y, dtype=float).ravel()),
                            "color": _color(color) if color is not None else self._siguiente_color(),
                            "ms": _escalar(math.sqrt(36.0 if s is None else float(s))), "marcador": marker,
                            "borde": _color(borde) if isinstance(borde, str) else None, **self._comun(kw)})
        return _Mudo()

    def bar(self, x, height, width=0.8, bottom=None, align="center", **kw):
        _revisar("bar", kw)
        color = kw.get("color")
        if align != "center" or np.ndim(width) > 0:
            raise NoSoportado("bar con align/anchos")
        arr = np.asarray(x)
        if arr.dtype.kind in "US":  # barras con nombres en el eje X: posiciones 0, 1, 2... y etiquetas
            if self.xticks:
                raise NoSoportado("categorías con xticks a medida")
            for nombre in arr.ravel().tolist():
                if nombre not in self.categorias:
                    self.categorias.append(nombre)
            xs = np.array([self.categorias.index(n) for n in arr.ravel().tolist()], dtype=float)
        else:
            xs = arr.astype(float).ravel()
        alturas = np.broadcast_to(np.asarray(height, dtype=float), xs.shape)
        # un color, o una lista de colores (uno por barra); una tupla de 3-4 números es UN color RGB(A)
        un_rgb = isinstance(color, tuple) and len(color) in (3, 4) and all(isinstance(c, (int, float)) for c in color)
        colores = None
        if color is not None and not isinstance(color, str) and not un_rgb:
            colores = [_color(c) for c in color]
            if len(colores) != xs.size:
                raise NoSoportado("bar con un número de colores distinto al de barras")
        borde = kw.get("edgecolor")
        base = None if bottom is None else np.broadcast_to(np.asarray(bottom, dtype=float), xs.shape)   # barras apiladas
        self.series.append({"tipo": "barras", "x": _lista(xs), "alto": _lista(alturas), "base": None if base is None else _lista(base), "ancho": _escalar(width),
                            "color": colores[0] if colores else (_color(color) if color is not None else self._siguiente_color()),
                            "colores": colores, "borde": _color(borde) if isinstance(borde, str) else None, **self._comun(kw)})
        suelo = [0.0] * xs.size if base is None else base.tolist()
        return [_Barra(x0 - width / 2.0, width, h, y0) for x0, h, y0 in zip(xs.tolist(), alturas.tolist(), suelo)]

    def fill_between(self, x, y1, y2=0, **kw):
        _revisar("fill_between", kw)
        if kw.get("step") is not None or kw.get("interpolate"):
            raise NoSoportado("fill_between con step/interpolate")
        x = np.asarray(x, dtype=float).ravel()
        color = kw.get("color", kw.get("facecolor"))
        color = _color(color) if color is not None else self._siguiente_color()
        a1, a2 = (np.broadcast_to(np.asarray(y, dtype=float), x.shape) for y in (y1, y2))
        tramos = [slice(0, x.size)]
        if kw.get("where") is not None:   # un área por cada racha de puntos seguidos donde se cumple la condición (como matplotlib sin interpolate)
            idx = np.flatnonzero(np.broadcast_to(np.asarray(kw["where"], dtype=bool), x.shape))
            tramos = [slice(g[0], g[-1] + 1) for g in np.split(idx, np.flatnonzero(np.diff(idx) > 1) + 1) if g.size >= 2] if idx.size else []
        for k, t in enumerate(tramos):
            propios = {**kw, "label": kw.get("label") if k == 0 else None}   # la leyenda lleva una sola entrada
            self.series.append({"tipo": "area", "x": _lista(x[t]), "y1": _lista(a1[t]), "y2": _lista(a2[t]), "color": color,
                                **self._comun({"alpha": 0.5, **propios})})
        return _Mudo()

    def _recta(self, tipo, pos, kw):
        _revisar("recta", kw)
        if any(kw.get(k) not in (None, 0, 1) for k in ("ymin", "ymax", "xmin", "xmax")) or any(k in kw for k in ("ymin", "ymax", "xmin", "xmax")):
            raise NoSoportado("recta parcial")
        ls = kw.get("linestyle", kw.get("ls"))
        self.series.append({"tipo": tipo, "pos": _escalar(pos), "color": _color(kw.get("color", kw.get("c", "C0"))),
                            "ancho": _escalar(kw.get("linewidth", kw.get("lw", 1.5))),
                            "estilo": self._estilo(ls) if ls is not None else "-", **self._comun(kw)})
        return _Mudo()

    def axvline(self, x=0, **kw):
        return self._recta("vline", x, kw)

    def axhline(self, y=0, **kw):
        return self._recta("hline", y, kw)

    def _banda(self, tipo, a, b, kw):
        _revisar("banda", kw)
        self.series.append({"tipo": tipo, "desde": _escalar(a), "hasta": _escalar(b),
                            "color": _color(kw.get("color", kw.get("facecolor", "C0"))), **self._comun({"alpha": 0.5, **kw})})
        return _Mudo()

    def axvspan(self, xmin, xmax, **kw):
        return self._banda("banda_x", xmin, xmax, kw)

    def axhspan(self, ymin, ymax, **kw):
        return self._banda("banda_y", ymin, ymax, kw)

    def text(self, x, y, s, **kw):
        _revisar("text", kw)
        transform = kw.get("transform")
        if transform not in (None, "datos", "ejes"):
            raise NoSoportado("transform no soportado")
        tam = kw.get("fontsize", 10)
        self.series.append({"tipo": "texto", "x": _escalar(x), "y": _escalar(y), "texto": str(s), "ejes": transform == "ejes",
                            "ha": kw.get("ha", kw.get("horizontalalignment", "left")),
                            "va": kw.get("va", kw.get("verticalalignment", "baseline")),
                            "tam": _escalar(tam) if isinstance(tam, (int, float)) else 10.0,
                            "negrita": kw.get("fontweight") in ("bold", "heavy", 700, 800, 900),
                            "color": _color(kw.get("color", kw.get("c", "black"))), "zorder": kw.get("zorder")})
        return _Mudo()

    def annotate(self, text, xy, xytext=None, **kw):
        _revisar("annotate", kw)
        coords = kw.get("xycoords", "data")
        if coords not in ("data", "axes fraction") or kw.get("textcoords", coords) != coords:
            raise NoSoportado("annotate con coordenadas no soportadas")
        destino = xytext if xytext is not None else xy
        resto = {k: v for k, v in kw.items() if k in ("fontsize", "color", "ha", "va", "fontweight", "zorder", "horizontalalignment", "verticalalignment")}
        self.text(destino[0], destino[1], text, transform="ejes" if coords == "axes fraction" else None, **resto)
        if kw.get("arrowprops") is not None and xytext is not None:
            self.series[-1]["flecha"] = {"x": _escalar(xy[0]), "y": _escalar(xy[1])}
        return _Mudo()

    # --- decoración ------------------------------------------------------
    def set_title(self, s, loc="center", **kw):
        _revisar("titulo", kw)
        if loc != "center":
            raise NoSoportado("título no centrado")
        self.titulo = str(s)
        return _Mudo()

    def set_xlabel(self, s, **kw):
        _revisar("etiqueta", kw)
        self.xlabel = str(s)
        return _Mudo()

    def set_ylabel(self, s, **kw):
        _revisar("etiqueta", kw)
        self.ylabel = str(s)
        return _Mudo()

    @staticmethod
    def _limites(a, b):
        if b is None and np.ndim(a) > 0:
            a, b = a
        if a is None and b is None:
            raise NoSoportado("get de límites")
        return [None if a is None else _escalar(a), None if b is None else _escalar(b)]

    def set_xlim(self, left=None, right=None, **kw):
        if kw:
            raise NoSoportado("set_xlim con argumentos")
        self.xlim = self._limites(left, right)
        return _Mudo()

    def set_ylim(self, bottom=None, top=None, **kw):
        if kw:
            raise NoSoportado("set_ylim con argumentos")
        self.ylim = self._limites(bottom, top)
        return _Mudo()

    def grid(self, visible=None, which="major", axis="both", **kw):
        _revisar("grid", kw)
        if which != "major":
            raise NoSoportado("grid menor")
        self.grid_ = None if visible is False else {"alpha": _escalar(kw.get("alpha", 1.0)), "eje": axis}

    def legend(self, *args, **kw):
        _revisar("legend", kw)
        if args:
            raise NoSoportado("legend con argumentos posicionales")
        self.leyenda = str(kw.get("loc", "best"))
        return _Mudo()

    def set_aspect(self, aspecto="auto", **kw):
        if aspecto in ("equal", 1, 1.0):
            self.aspecto_igual = True
        elif aspecto != "auto":
            raise NoSoportado("aspecto no soportado")

    @staticmethod
    def _marcas(ticks, labels, kw):
        if kw or ticks is None:
            raise NoSoportado("xticks/yticks con argumentos de formato o sin posiciones")
        pos = _lista(ticks)
        if any(p is None for p in pos):
            raise NoSoportado("marcas no finitas")
        if labels is not None:
            labels = [str(t) for t in np.asarray(labels, dtype=object).ravel().tolist()]
            if len(labels) != len(pos):
                raise NoSoportado("marcas y etiquetas de distinta longitud")
        return {"pos": pos, "labels": labels}

    def set_xticks(self, ticks=None, labels=None, **kw):
        if self.categorias:
            raise NoSoportado("xticks sobre un eje de categorías")
        self.xticks = self._marcas(ticks, labels, kw)
        return _Mudo()

    def set_yticks(self, ticks=None, labels=None, **kw):
        self.yticks = self._marcas(ticks, labels, kw)
        return _Mudo()

    @staticmethod
    def _escala(escala, kw):
        if escala not in ("linear", "log") or set(kw) - {"base"} or kw.get("base", 10) != 10:
            raise NoSoportado(f"escala {escala} {kw}")
        return "log" if escala == "log" else None

    def set_xscale(self, escala, **kw):
        self.xscale = self._escala(escala, kw)

    def set_yscale(self, escala, **kw):
        self.yscale = self._escala(escala, kw)

    def semilogx(self, *a, **kw):
        r = self.plot(*a, **kw)
        self.xscale = "log"
        return r

    def semilogy(self, *a, **kw):
        r = self.plot(*a, **kw)
        self.yscale = "log"
        return r

    def loglog(self, *a, **kw):
        r = self.plot(*a, **kw)
        self.xscale = self.yscale = "log"
        return r

    def __getattr__(self, nombre):
        if nombre.startswith("__"):
            raise AttributeError(nombre)
        if nombre in ATRIBUTOS_EJE_IGNORADOS:
            return _Mudo()
        if nombre in IGNORAR_EJE:
            return lambda *a, **k: _Mudo()
        raise NoSoportado(f"ax.{nombre}")

    def a_dict(self):
        fila, col, filas, cols = self.pos
        return {"fila": fila, "col": col, "filas": filas, "cols": cols, "titulo": self.titulo, "xlabel": self.xlabel,
                "ylabel": self.ylabel, "xlim": self.xlim, "ylim": self.ylim, "grid": self.grid_, "leyenda": self.leyenda,
                "aspecto_igual": self.aspecto_igual, "categorias": self.categorias, "xticks": self.xticks, "yticks": self.yticks,
                "xscale": self.xscale, "yscale": self.yscale, "series": self.series}


class _Figura:
    def __init__(self, figsize=None):
        w, h = (6.4, 4.8) if figsize is None else figsize
        self.tam = [_escalar(w), _escalar(h)]
        self.ejes, self.suptitulo = [], None

    def _eje(self, fila, col, filas, cols):
        eje = _Eje(self, fila, col, filas, cols)
        self.ejes.append(eje)
        return eje

    def subplots(self, nrows=1, ncols=1, squeeze=True, **kw):
        if kw.get("sharex") or kw.get("sharey") or kw.get("subplot_kw") or kw.get("gridspec_kw") \
                or kw.get("width_ratios") or kw.get("height_ratios") or set(kw) - {"sharex", "sharey", "subplot_kw", "gridspec_kw", "width_ratios", "height_ratios"}:
            raise NoSoportado("subplots con share/gridspec/subplot_kw")
        matriz = np.empty((nrows, ncols), dtype=object)
        for i in range(nrows):
            for j in range(ncols):
                matriz[i, j] = self._eje(i, j, nrows, ncols)
        if not squeeze:
            return matriz
        if nrows == 1 and ncols == 1:
            return matriz[0, 0]
        return matriz.ravel() if 1 in (nrows, ncols) else matriz

    def add_subplot(self, *pos, **kw):
        if kw:
            raise NoSoportado("add_subplot con argumentos")
        if len(pos) == 1 and isinstance(pos[0], int) and pos[0] >= 111:
            pos = tuple(int(d) for d in str(pos[0]))
        if len(pos) != 3:
            raise NoSoportado("add_subplot con posición compleja")
        filas, cols, idx = pos
        return self._eje((idx - 1) // cols, (idx - 1) % cols, filas, cols)

    def suptitle(self, s, **kw):
        _revisar("titulo", kw)
        self.suptitulo = str(s)
        return _Mudo()

    def tight_layout(self, *a, **k):
        return None

    def savefig(self, *a, **k):
        return None

    def __getattr__(self, nombre):
        if nombre.startswith("__"):
            raise AttributeError(nombre)
        raise NoSoportado(f"fig.{nombre}")

    def a_dict(self):
        return {"tam": self.tam, "titulo": self.suptitulo, "ejes": [e.a_dict() for e in self.ejes if e.series or e.titulo]}


class _Pyplot(types.ModuleType):
    """Sustituye a matplotlib.pyplot durante la ejecución del laboratorio."""

    def __init__(self):
        super().__init__("matplotlib.pyplot")
        self._figs, self._hechas = [], []
        self._actual = self._eje_actual = None
        self.rcParams = {}
        self.style = _Mudo()

    # --- figuras --------------------------------------------------------
    def figure(self, *a, figsize=None, **kw):
        if (a and not isinstance(a[0], (int, str))) or set(kw) - {"dpi", "facecolor", "layout"}:
            raise NoSoportado("figure con argumentos")
        fig = _Figura(figsize)
        self._figs.append(fig)
        self._actual, self._eje_actual = fig, None
        return fig

    def subplots(self, nrows=1, ncols=1, figsize=None, **kw):
        fig = self.figure(figsize=figsize)
        return fig, fig.subplots(nrows, ncols, **kw)

    def subplot(self, *pos, **kw):
        fig = self._actual or self.figure()
        self._eje_actual = fig.add_subplot(*pos, **kw)
        return self._eje_actual

    def gcf(self):
        return self._actual or self.figure()

    def gca(self):
        fig = self.gcf()
        if self._eje_actual is None or self._eje_actual.fig is not fig:
            self._eje_actual = fig.ejes[-1] if fig.ejes else fig._eje(0, 0, 1, 1)
        return self._eje_actual

    def show(self, *a, **k):
        self._hechas.extend(f for f in self._figs if f.ejes)
        self._figs, self._actual, self._eje_actual = [], None, None

    def terminar(self):
        self.show()
        return [f.a_dict() for f in self._hechas]

    # --- atajos que operan sobre los ejes actuales -------------------------
    def suptitle(self, s, **kw):
        return self.gcf().suptitle(s, **kw)

    def title(self, s, **kw):
        return self.gca().set_title(s, **kw)

    def xlabel(self, s, **kw):
        return self.gca().set_xlabel(s, **kw)

    def ylabel(self, s, **kw):
        return self.gca().set_ylabel(s, **kw)

    def xlim(self, *a, **kw):
        return self.gca().set_xlim(*a, **kw)

    def ylim(self, *a, **kw):
        return self.gca().set_ylim(*a, **kw)

    def xscale(self, escala, **kw):
        return self.gca().set_xscale(escala, **kw)

    def yscale(self, escala, **kw):
        return self.gca().set_yscale(escala, **kw)

    def xticks(self, ticks=None, labels=None, **kw):
        return self.gca().set_xticks(ticks, labels, **kw)

    def yticks(self, ticks=None, labels=None, **kw):
        return self.gca().set_yticks(ticks, labels, **kw)

    def __getattr__(self, nombre):
        if nombre.startswith("__"):
            raise AttributeError(nombre)
        if nombre in IGNORAR_PLT:
            return lambda *a, **k: _Mudo()
        if nombre in ("plot", "scatter", "bar", "fill_between", "axvline", "axhline", "axvspan", "axhspan", "text", "annotate", "grid", "legend",
                      "semilogx", "semilogy", "loglog"):
            return getattr(self.gca(), nombre)
        raise NoSoportado(f"plt.{nombre}")


def ejecutar(codigo):
    """Ejecuta `codigo` con el pyplot falso. Devuelve {'modo': 'datos', 'figuras': [...]} o {'modo': 'imagen', 'motivo': ...}.
    Cualquier error (no soportado, o del propio código bajo la grabadora) se resuelve con 'imagen': quien llama
    reejecuta con matplotlib de verdad, y si el código era el culpable verá su error real."""
    import matplotlib
    falso = _Pyplot()
    guardado_mod = sys.modules.get("matplotlib.pyplot")
    tenia_attr = hasattr(matplotlib, "pyplot")
    guardado_attr = getattr(matplotlib, "pyplot", None)
    sys.modules["matplotlib.pyplot"] = falso
    matplotlib.pyplot = falso  # "import a.b as c" mira primero el atributo del paquete
    try:
        exec(compile(codigo, "<laboratorio>", "exec"), {"__name__": "__laboratorio__"})
        figuras = falso.terminar()
    except NoSoportado as e:
        return {"modo": "imagen", "motivo": str(e)}
    except Exception as e:  # noqa: BLE001
        return {"modo": "imagen", "motivo": f"error bajo la grabadora: {type(e).__name__}: {e}"}
    finally:
        if guardado_mod is not None:
            sys.modules["matplotlib.pyplot"] = guardado_mod
        else:
            sys.modules.pop("matplotlib.pyplot", None)
        if tenia_attr:
            matplotlib.pyplot = guardado_attr
        else:
            del matplotlib.pyplot
    if not figuras:
        return {"modo": "imagen", "motivo": "el código no dibujó nada"}
    return {"modo": "datos", "figuras": figuras}
