// Temas relacionados sugeridos: cada neurona puede traer `sugerencias: [{nombre, motivo}]` (las escribe la IA externa al crearla o revisarla; ver
// backend/sugerencias.py). Qué se enseña depende de qué neuronas existen AHORA, y se decide aquí al pintar el panel: así una sugerencia desaparece sola en cuanto
// creas esa neurona, y reaparece si la borras del todo.
import { API } from './api.ts';
import { errorDe } from './errorApi.ts';
import { esMiembro } from './subredes.ts';

export interface Sugerencia { nombre: string; motivo?: string }
interface Neurona { id: string; nombre: string; subredes?: string[] }

/** Cómo está un tema sugerido respecto a lo que ya tienes:
 *  - nueva: no existe ni en la papelera → se puede crear;
 *  - existe: ya es una neurona, pero no está en la subred que estás viendo → se ofrece añadirla a ella;
 *  - papelera: la borraste hace poco → se ofrece restaurarla. */
export type Estado =
    | { tipo: 'nueva' }
    | { tipo: 'existe'; id: string; nombre: string }
    | { tipo: 'papelera'; id: string; nombre: string };

// Palabras que no distinguen un tema de otro («Modelo de Gompertz» y «Gompertz» son el mismo tema).
const VACIAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'o', 'u', 'en', 'a', 'al', 'un', 'una', 'unos', 'unas', 'para', 'por', 'con', 'modelo', 'modelos', 'teoria', 'concepto']);

const singular = (p: string): string => (p.length > 4 && p.endsWith('ones') ? p.slice(0, -2) : p.length > 4 && p.endsWith('s') ? p.slice(0, -1) : p);

/** Palabras distintivas de un nombre: sin tildes ni mayúsculas, sin las vacías y con el plural quitado («números» → «numero»). */
export function palabrasClave(nombre: string): string[] {
    const sin = nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const out = sin.split(/[^a-z0-9]+/).filter(p => p && !VACIAS.has(p)).map(singular);
    return [...new Set(out)];
}

/** ¿Son el mismo tema? Todas las palabras clave de uno están en el otro; si es el más corto el de la neurona, ha de tener al menos dos (así «Cálculo» no tapa «Cálculo de variaciones»). */
export function mismoTema(sugerido: string, neurona: string): boolean {
    const s = palabrasClave(sugerido), n = palabrasClave(neurona);
    if (s.length === 0 || n.length === 0) return false;
    const contenido = (a: string[], b: string[]) => a.every(p => b.includes(p));
    return contenido(s, n) || (n.length >= 2 && contenido(n, s));
}

const buscar = <T extends { nombre: string }>(lista: T[], tema: string): T | undefined => {
    const igual = (x: T) => palabrasClave(x.nombre).join(' ') === palabrasClave(tema).join(' ');
    return lista.find(igual) ?? lista.find(x => mismoTema(tema, x.nombre));
};

export function estadoDe(tema: string, vivas: Neurona[], enPapelera: { id: string; nombre: string }[]): Estado {
    const viva = buscar(vivas, tema);
    if (viva) return { tipo: 'existe', id: viva.id, nombre: viva.nombre };
    const borrada = buscar(enPapelera, tema);
    return borrada ? { tipo: 'papelera', id: borrada.id, nombre: borrada.nombre } : { tipo: 'nueva' };
}

export interface Visible { sugerencia: Sugerencia; estado: Estado }

/**
 * Lo que se enseña en el panel de una neurona. Si el tema ya es una neurona se oculta, salvo que estés viendo una subred a la que aún no pertenece (entonces se
 * ofrece añadirla). Los temas en la papelera se enseñan para restaurarlos. `vivas` son TODAS las neuronas, no solo las de la subred que estás viendo.
 */
export function sugerenciasVisibles(sugerencias: Sugerencia[], vivas: Neurona[], enPapelera: { id: string; nombre: string }[], subredActiva: string | null): Visible[] {
    const out: Visible[] = [];
    for (const sugerencia of Array.isArray(sugerencias) ? sugerencias : []) {
        if (!sugerencia || typeof sugerencia.nombre !== 'string' || !sugerencia.nombre.trim()) continue;
        const estado = estadoDe(sugerencia.nombre, vivas, enPapelera);
        if (estado.tipo === 'existe') {
            const neurona = vivas.find(v => v.id === estado.id);
            if (esMiembro(neurona, subredActiva)) continue;        // ya la tienes (y, si estás en una subred, ya está en ella)
        }
        out.push({ sugerencia, estado });
    }
    return out;
}

/** Marca esa sugerencia como descartada en la neurona: no vuelve a salir. */
export async function descartarSugerencia(idNeurona: string, nombre: string): Promise<void> {
    const res = await fetch(`${API}/api/node/${encodeURIComponent(idNeurona)}/sugerencia/descartar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre }),
    });
    if (!res.ok) throw new Error(await errorDe(res));
}

/** Las neuronas que hay ahora mismo en la papelera (id y nombre). Si falla, lista vacía: solo se pierde la oferta de restaurar. */
export async function neuronasEnPapelera(): Promise<{ id: string; nombre: string }[]> {
    try {
        const res = await fetch(`${API}/api/papelera`);
        if (!res.ok) return [];
        const datos = await res.json();
        return Array.isArray(datos?.neuronas) ? datos.neuronas.map((n: any) => ({ id: String(n.id), nombre: String(n.nombre ?? n.id) })) : [];
    } catch { return []; }
}

/** Saca esa neurona de la papelera (con sus conexiones). */
export async function restaurarNeurona(id: string): Promise<void> {
    const res = await fetch(`${API}/api/papelera/${encodeURIComponent(id)}/restaurar`, { method: 'POST' });
    if (!res.ok) throw new Error(await errorDe(res));
}
