// Banco de pruebas del prototipo Pyodide (solo desarrollo): http://localhost:1420/prototipo-pyodide.html
import { LabRunner } from './labRunner';

interface Fixture { nombre: string; codigo: string; esperado: any }

function diferencias(a: any, b: any, ruta = '', out: string[] = []): string[] {
    if (typeof a === 'number' && typeof b === 'number') {
        if (Math.abs(a - b) > 1e-6 * Math.max(1, Math.abs(a), Math.abs(b))) out.push(`${ruta}: ${a} != ${b}`);
    } else if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) out.push(`${ruta}: longitud ${a.length} != ${b.length}`);
        else a.forEach((v, i) => diferencias(v, b[i], `${ruta}[${i}]`, out));
    } else if (a && b && typeof a === 'object' && typeof b === 'object') {
        for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (k !== 'stdout') diferencias(a[k], b[k], `${ruta}.${k}`, out);
    } else if (a !== b) out.push(`${ruta}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
    return out;
}

const mediana = (xs: number[]) => [...xs].sort((x, y) => x - y)[Math.floor(xs.length / 2)];

async function bench(repeticiones = 15) {
    const t0 = performance.now();
    const runner = new LabRunner();
    const tiemposInicio = await runner.listo;
    const arranque = Math.round(performance.now() - t0);
    const fixtures: Fixture[] = await (await fetch('/_prototipo/fixtures.json')).json();

    const filas: any[] = [];
    for (const f of fixtures) {
        const primero = await runner.ejecutar(f.codigo, 60000);     // incluye la descarga de scipy/pandas la primera vez
        const ms: number[] = [];
        for (let i = 0; i < repeticiones; i++) ms.push((await runner.ejecutar(f.codigo, 60000)).ms);
        const r = primero.resultado;
        let veredicto: string;
        if (f.esperado.modo === 'datos') {
            const dif = r.modo === 'datos' ? diferencias(r.figuras, f.esperado.figuras, 'figuras') : [`modo ${r.modo}`];
            veredicto = dif.length === 0 ? 'IGUAL a CPython' : `${dif.length} diferencias (p. ej. ${dif[0]})`;
        } else {
            veredicto = r.modo === 'imagen' && r.imagenes?.length && !r.error ? `PNG ok (${Math.round(r.imagenes[0].length * 0.75 / 1024)} KB)` : `FALLO: ${r.error ?? 'sin imagen'}`.slice(0, 160);
        }
        (window as any).__parcial = filas;
        filas.push({ nombre: f.nombre, modo: r.modo, primero_ms: Math.round(primero.ms), paquetes_ms: Math.round(primero.msPaquetes), cuadro_ms: Math.round(mediana(ms) * 10) / 10, veredicto });
    }

    // Un bucle infinito: ¿cuánto tarda en cortarse y cuánto en volver a estar listo?
    const tc = performance.now();
    let corte = 'no se cortó';
    try { await runner.ejecutar('while True: pass', 1500); } catch (e: any) { corte = e.message; }
    const msCorte = Math.round(performance.now() - tc);
    const tr = performance.now();
    await runner.listo;
    const msReinicio = Math.round(performance.now() - tr);
    const despues = await runner.ejecutar(fixtures[0].codigo, 60000);

    return { arranque_ms: arranque, tiemposInicio, filas, bucleInfinito: { corte, msCorte, msReinicio, funcionaDespues: despues.resultado.modo }, repeticiones };
}

(window as any).__prototipo = { bench };
document.getElementById('estado')!.textContent = 'Listo: ejecuta window.__prototipo.bench() desde la consola.';
