// Web Worker que ejecuta el código de un laboratorio con Python en WebAssembly (Pyodide): sin viaje al backend y aislado del sistema.
// El runtime y los paquetes (numpy, scipy, matplotlib, pandas) van con la app en public/pyodide/ (los deja scripts/bajar-pyodide.mjs): no hace falta internet.
import { loadPyodide } from 'pyodide';
import type { PyodideInterface } from 'pyodide';
import labplotSrc from './labplot.py?raw';

const INDEX_URL = new URL(`${import.meta.env.BASE_URL}pyodide/`, self.location.href).href;

// Código Python que une la grabadora de figuras (labplot) con el respaldo de matplotlib real (imagen PNG).
const GLUE = `
import base64, contextlib, io, json, sys, traceback
import labplot

def _imagen(codigo, motivo):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    plt.close("all")
    salida = io.StringIO()
    try:
        with contextlib.redirect_stdout(salida):
            exec(compile(codigo, "<laboratorio>", "exec"), {"__name__": "__laboratorio__"})
        imgs = []
        for n in plt.get_fignums():
            buf = io.BytesIO()
            plt.figure(n).savefig(buf, format="png", dpi=100, bbox_inches="tight")
            imgs.append(base64.b64encode(buf.getvalue()).decode())
        return {"modo": "imagen", "motivo": motivo, "imagenes": imgs, "stdout": salida.getvalue()}
    except BaseException:
        return {"modo": "imagen", "motivo": motivo, "error": traceback.format_exc(), "stdout": salida.getvalue()}
    finally:
        plt.close("all")

def precargar(codigo):
    # Importar scipy.stats, pyplot... tarda segundos la primera vez: se hace ANTES de que empiece a correr el tiempo máximo del laboratorio.
    from pyodide.code import find_imports
    try:
        modulos = find_imports(codigo)
    except SyntaxError:
        return                                   # el error de sintaxis lo informará la ejecución normal
    for m in modulos:
        try:
            __import__(m)
        except Exception:
            pass                                 # un módulo que no existe también lo informará la ejecución normal

_motivo = None

def grabar(codigo):
    # Primer intento: la grabadora (rápida). Devuelve el JSON, o None si hay que pasar al respaldo en imagen.
    global _motivo
    salida = io.StringIO()
    with contextlib.redirect_stdout(salida):
        r = labplot.ejecutar(codigo)
    if r["modo"] == "datos":
        r["stdout"] = salida.getvalue()
        return json.dumps(r)
    _motivo = r.get("motivo")
    return None

def respaldo(codigo):
    # Segundo intento: matplotlib real y PNG. Vuelve a ejecutar el código y renderiza: puede tardar segundos.
    return json.dumps(_imagen(codigo, _motivo))

def correr(codigo):
    texto = grabar(codigo)
    return texto if texto is not None else respaldo(codigo)
`;

// La primera figura real de matplotlib (fuentes, mathtext, histogramas, imágenes, PNG) es mucho más lenta que las siguientes:
// se dibuja una diminuta al arrancar para que el primer laboratorio que caiga al respaldo en imagen no pague ese coste.
const CALENTAR = `
import io as _io
import matplotlib.pyplot as _plt
_f, _a = _plt.subplots(1, 2, figsize=(2, 1))
_a[0].plot([0, 1], [0, 1], "o-", label="a"); _a[0].hist([0.1, 0.5, 0.5], bins=3); _a[0].set_title(r"$\\sigma_i$ μ"); _a[0].legend(); _a[0].grid(True)
_a[1].imshow([[0, 1], [1, 0]], cmap="gray"); _a[1].semilogy([1, 10])
_f.tight_layout()
_f.savefig(_io.BytesIO(), format="png", dpi=40, bbox_inches="tight")
_plt.close("all")
`;

let py: PyodideInterface | null = null;
const post = (m: unknown) => (self as any).postMessage(m);

async function iniciar() {
    const t: Record<string, number> = {};
    let t0 = performance.now();
    const marca = (k: string) => { const t1 = performance.now(); t[k] = Math.round(t1 - t0); t0 = t1; };
    py = await loadPyodide({ indexURL: INDEX_URL });
    marca('runtime');
    await py.loadPackage(['numpy']);
    marca('numpy');
    await py.loadPackage(['matplotlib']);            // la grabadora usa matplotlib.colors para convertir colores
    marca('matplotlib');
    py.FS.writeFile('/home/pyodide/labplot.py', labplotSrc);
    py.runPython('import sys; sys.path.insert(0, "/home/pyodide")');
    py.runPython(GLUE);
    marca('modulos');
    // pyplot real (respaldo en imagen) la primera vez construye la caché de fuentes: mejor aquí, mientras se ve "Preparando el motor".
    py.runPython('import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot');
    marca('pyplot');
    post({ tipo: 'listo', tiempos: t });
    // Después de «listo»: si llega un laboratorio, espera a que esto acabe (~0,5 s) sin que cuente para su tiempo máximo.
    try { py.runPython(CALENTAR); } catch { /* solo era para ganar tiempo: si falla, el primer respaldo tardará algo más */ }
    // scipy (~3,5 s) NO se precarga: instanciar WebAssembly bloquea el worker y el laboratorio que se esté moviendo se quedaría congelado.
    // Se carga bajo demanda (loadPackagesFromImports) y solo si el laboratorio lo importa.
}

async function ejecutar(id: number, codigo: string) {
    if (!py) throw new Error('Pyodide no está iniciado');
    const t0 = performance.now();
    await py.loadPackagesFromImports(codigo);       // scipy, pandas... solo si el laboratorio los importa (la primera vez los descarga)
    py.globals.set('_codigo', codigo);
    py.runPython('precargar(_codigo)');             // importar scipy.stats... también es "preparar": no cuenta para el tiempo máximo
    const tPaquetes = performance.now() - t0;
    post({ tipo: 'ejecutando', id });               // desde aquí corre el tiempo máximo: bajar e importar paquetes no cuenta
    let texto: string | undefined = py.runPython('grabar(_codigo)');
    if (texto == null) {                            // la grabadora no sabe dibujarlo: matplotlib real, con su propio tiempo máximo
        post({ tipo: 'respaldo', id });
        texto = py.runPython('respaldo(_codigo)') as string;
    }
    post({ tipo: 'resultado', id, resultado: JSON.parse(texto!), ms: performance.now() - t0, msPaquetes: tPaquetes });
}

self.onmessage = async (e: MessageEvent) => {
    const m = e.data;
    try {
        if (m.tipo === 'iniciar') await iniciar();
        else if (m.tipo === 'ejecutar') await ejecutar(m.id, m.codigo);
    } catch (err: any) {
        post({ tipo: 'error', id: m.id, mensaje: String(err?.message ?? err) });
    }
};
