// Disposición de una subred: se calcula en un Web Worker (o, si no se puede crear, aquí mismo) y se recuerda en este ordenador por subred, así que añadir una
// neurona a la subred nunca recoloca las que ya estaban. El algoritmo vive en distribucionSubred.ts.
import { disponerSubred } from './distribucionSubred.ts';
import type { Vec3 } from './distribucionSubred.ts';

const CLAVE = 'alejandria.disposicionSubredes';
const MAX_SUBREDES = 60;

const esVec3 = (p: unknown): p is Vec3 => Array.isArray(p) && p.length === 3 && p.every(n => typeof n === 'number' && Number.isFinite(n));

const leerTodo = (): Record<string, Record<string, Vec3>> => {
    try { const v = JSON.parse(localStorage.getItem(CLAVE) ?? '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
};

/** Lo que este ordenador recuerda de la disposición de una subred (id → posición). */
export function disposicionRecordada(subred: string): Record<string, Vec3> {
    const g = leerTodo()[subred.toLowerCase()] ?? {};
    return Object.fromEntries(Object.entries(g).filter(([, p]) => esVec3(p)));
}

/** Recuerda la disposición de la subred (solo de las neuronas que tiene hoy: así no crece sin límite). */
export function recordarDisposicion(subred: string, pos: Record<string, Vec3>): void {
    try {
        const todo = leerTodo();
        delete todo[subred.toLowerCase()];                    // la reinserta al final: las más antiguas sin usar son las que se olvidan
        todo[subred.toLowerCase()] = pos;
        const claves = Object.keys(todo);
        const recortado = claves.length > MAX_SUBREDES ? Object.fromEntries(claves.slice(-MAX_SUBREDES).map(k => [k, todo[k]])) : todo;
        localStorage.setItem(CLAVE, JSON.stringify(recortado));
    } catch { /* sin almacenamiento: se recalcula la próxima vez (sale igual de los ids y las conexiones) */ }
}

/** Al renombrar una subred conserva su disposición (si no, al entrar se recolocaría entera). */
export function renombrarDisposicion(viejo: string, nuevo: string): void {
    const previas = disposicionRecordada(viejo);
    if (Object.keys(previas).length === 0) return;
    recordarDisposicion(nuevo, { ...disposicionRecordada(nuevo), ...previas });
    if (viejo.toLowerCase() !== nuevo.toLowerCase()) {
        try { const todo = leerTodo(); delete todo[viejo.toLowerCase()]; localStorage.setItem(CLAVE, JSON.stringify(todo)); } catch { /* sin almacenamiento: nada que olvidar */ }
    }
}

let trabajador: Worker | null | undefined;
let contador = 0;
const pendientes = new Map<number, { ok: (r: Record<string, Vec3>) => void; alt: () => Record<string, Vec3> }>();

function obtenerTrabajador(): Worker | null {
    if (trabajador !== undefined) return trabajador;
    try {
        trabajador = new Worker(new URL('./layout.worker.ts', import.meta.url), { type: 'module' });
        trabajador.onmessage = e => { const p = pendientes.get(e.data.id); pendientes.delete(e.data.id); p?.ok(e.data.res); };
        trabajador.onerror = () => {      // si falla, lo pendiente se calcula aquí y el siguiente cálculo va por el hilo principal
            trabajador = null;
            const en_espera = [...pendientes.values()];
            pendientes.clear();
            en_espera.forEach(p => p.ok(p.alt()));
        };
    } catch { trabajador = null; }
    return trabajador;
}

/** Posición de cada neurona de la subred: respeta lo recordado y completa lo que falte con el layout de fuerzas. Guarda el resultado. */
export function calcularDisposicion(subred: string, ids: string[], aristas: [string, string][]): Promise<Record<string, Vec3>> {
    const previas = disposicionRecordada(subred);
    const w = obtenerTrabajador();
    const terminar = (res: Record<string, Vec3>) => { recordarDisposicion(subred, res); return res; };
    if (!w) return Promise.resolve(terminar(disponerSubred(ids, aristas, previas)));
    return new Promise<Record<string, Vec3>>(resolver => {
        const id = ++contador;
        pendientes.set(id, { ok: r => resolver(terminar(r)), alt: () => disponerSubred(ids, aristas, previas) });
        w.postMessage({ id, ids, aristas, previas });
    });
}
