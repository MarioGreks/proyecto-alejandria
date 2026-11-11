// «Reorganizar»: vuelve a colocar cada neurona dentro de su clúster con el layout de fuerzas de las subredes (las conectadas quedan juntas, la maraña se deshace).
// Solo depende de los ids, los clústeres y las conexiones, nunca de Math.random(): con las mismas neuronas y conexiones sale igual en cualquier ordenador.
// Los clústeres no se mueven (su casilla es otra memoria). Las posiciones nuevas pasan a ser las recordadas, así que no saltan al recargar. Tests en reorganizar.test.mjs.
import { guardarPosiciones } from './disposicion.ts';
import type { Vec3 } from './disposicion.ts';
import { disponerSubred } from './distribucionSubred.ts';

/** Distancia ideal entre dos neuronas conectadas al reorganizar (las subredes usan 4): más corta, para que se vea qué está unido a qué sin que se solapen (mínima entre todas, ~1,6). */
export const LARGO_REORGANIZAR = 2.5;

/**
 * `clusters`: nombre del clúster → ids de sus neuronas. `enlaces`: pares de ids conectados (solo cuentan los de dos neuronas del mismo clúster).
 * Devuelve la posición de cada neurona relativa al centro de su clúster y la deja recordada.
 */
export function reorganizarPosiciones(clusters: Record<string, string[]>, enlaces: [string, string][]): Record<string, Vec3> {
    const clusterDe = new Map<string, string>();
    for (const [cluster, ids] of Object.entries(clusters)) for (const id of ids) clusterDe.set(id, cluster);
    const internos: Record<string, [string, string][]> = {};
    for (const [a, b] of enlaces) {
        const c = clusterDe.get(a);
        if (c !== undefined && c === clusterDe.get(b)) (internos[c] ??= []).push([a, b]);
    }
    const res: Record<string, Vec3> = {};
    const memoria: Record<string, [string, Vec3]> = {};
    for (const [cluster, ids] of Object.entries(clusters)) {
        const pos = disponerSubred(ids, internos[cluster] ?? [], {}, 180, LARGO_REORGANIZAR);
        for (const id of ids) if (pos[id]) { res[id] = pos[id]; memoria[id] = [cluster, pos[id]]; }
    }
    guardarPosiciones(memoria);
    return res;
}
