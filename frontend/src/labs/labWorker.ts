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

def correr(codigo):
    salida = io.StringIO()
    with contextlib.redirect_stdout(salida):
        r = labplot.ejecutar(codigo)
    if r["modo"] == "datos":
        r["stdout"] = salida.getvalue()
        return json.dumps(r)
    return json.dumps(_imagen(codigo, r.get("motivo")))
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
    const texto: string = py.runPython('correr(_codigo)');
    post({ tipo: 'resultado', id, resultado: JSON.parse(texto), ms: performance.now() - t0, msPaquetes: tPaquetes });
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
