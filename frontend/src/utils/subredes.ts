// Subredes: grupos de neuronas (TFM, Tesis...) dentro de la red general. El modelo lo define backend/subredes.py: es una etiqueta dentro de cada neurona
// (`subredes: ["TFM", ...]`), así que todas siguen en la general y la lista se deduce de ellas. Aquí: las reglas de nombres iguales que el backend,
// lo que se recuerda en este ordenador (la subred activa y las que acabas de crear y aún están vacías) y las llamadas a la API.
import { API } from './api.ts';
import { errorDe } from './errorApi.ts';

export const MAX_NOMBRE = 60;

export interface InfoSubred { nombre: string; neuronas: number }

/** Nombre limpio: sin espacios de más y con un máximo de longitud (igual que el backend). */
export const normalizarNombre = (n: unknown): string => (typeof n === 'string' ? n.split(/\s+/).filter(Boolean).join(' ').slice(0, MAX_NOMBRE).trim() : '');

/** Dos nombres de subred son el mismo aunque cambien las mayúsculas. */
export const mismaSubred = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();

export const subredesDeNodo = (nodo: any): string[] => (Array.isArray(nodo?.subredes) ? nodo.subredes.filter((s: unknown) => typeof s === 'string') : []);

export const esMiembro = (nodo: any, subred: string | null): boolean => subred === null || subredesDeNodo(nodo).some(s => mismaSubred(s, subred));

/** Las subredes que se ven: las que llevan las neuronas más las vacías que recuerda este ordenador (las que ya tienen neuronas dejan de ser «vacías»). */
export function listarSubredes(nodos: any[], vacias: string[] = []): InfoSubred[] {
    const cuenta = new Map<string, InfoSubred>();
    for (const n of nodos) {
        for (const s of subredesDeNodo(n)) {
            const k = s.toLowerCase();
            const c = cuenta.get(k) ?? { nombre: s, neuronas: 0 };
            c.neuronas++;
            cuenta.set(k, c);
        }
    }
    for (const v of vacias) {
        const nombre = normalizarNombre(v);
        if (nombre && !cuenta.has(nombre.toLowerCase())) cuenta.set(nombre.toLowerCase(), { nombre, neuronas: 0 });
    }
    return [...cuenta.values()].sort((a, b) => a.nombre.toLowerCase().localeCompare(b.nombre.toLowerCase()));
}

/** Color de la subred, derivado de su nombre (el mismo en todos los PCs sin guardar nada). Devuelve «#rrggbb». */
export function colorSubred(nombre: string): string {
    let h = 0x811c9dc5;
    for (const c of nombre.toLowerCase()) { h ^= c.codePointAt(0)!; h = Math.imul(h, 0x01000193); }
    const tono = ((h >>> 0) % 360) / 360, s = 0.85, l = 0.58;
    const q = l + s - l * s, p = 2 * l - q;
    const canal = (t: number) => {
        t = (t + 1) % 1;
        const v = t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
        return Math.round(v * 255).toString(16).padStart(2, '0');
    };
    return `#${canal(tono + 1 / 3)}${canal(tono)}${canal(tono - 1 / 3)}`;
}

/** Ids de las neuronas conectadas directamente con `id` (solo las conexiones que se ven: las rechazadas no llegan al universo). */
export function vecinasDirectas(id: string, aristas: { origen_id: string; destino_id: string }[]): string[] {
    const out = new Set<string>();
    for (const a of aristas) {
        if (a.origen_id === id) out.add(a.destino_id);
        else if (a.destino_id === id) out.add(a.origen_id);
    }
    return [...out];
}

// Lo que se recuerda en este ordenador. Sin almacenamiento (ventana privada, datos bloqueados) todo sigue funcionando, solo que no se recuerda.
const CLAVE_ACTIVA = 'alejandria.subredActiva';
const CLAVE_VACIAS = 'alejandria.subredesVacias';

export function subredActivaGuardada(): string | null {
    try { return normalizarNombre(localStorage.getItem(CLAVE_ACTIVA)) || null; } catch { return null; }
}
export function guardarSubredActiva(nombre: string | null): void {
    try { nombre ? localStorage.setItem(CLAVE_ACTIVA, nombre) : localStorage.removeItem(CLAVE_ACTIVA); } catch { /* no se recuerda y ya */ }
}
export function vaciasGuardadas(): string[] {
    try {
        const v = JSON.parse(localStorage.getItem(CLAVE_VACIAS) ?? '[]');
        return Array.isArray(v) ? v.map(normalizarNombre).filter(Boolean) : [];
    } catch { return []; }
}
export function guardarVacias(nombres: string[]): void {
    try { localStorage.setItem(CLAVE_VACIAS, JSON.stringify(nombres)); } catch { /* no se recuerda y ya */ }
}

const post = async (url: string, cuerpo: unknown): Promise<number> => {
    const res = await fetch(`${API}${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
    if (!res.ok) throw new Error(await errorDe(res));
    return (await res.json()).cambiadas ?? 0;
};

/** Añade y/o quita subredes a esas neuronas. Devuelve cuántas cambiaron. */
export const asignarSubredes = (ids: string[], añadir: string[] = [], quitar: string[] = []): Promise<number> =>
    post('/api/subredes/asignar', { ids, añadir, quitar });
export const renombrarSubred = (viejo: string, nuevo: string): Promise<number> => post('/api/subredes/renombrar', { viejo, nuevo });
/** Borra la subred (la etiqueta); las neuronas siguen en la red general. */
export const borrarSubred = (nombre: string): Promise<number> => post('/api/subredes/borrar', { nombre });
