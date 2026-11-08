// Disposición compacta de una subred: lo conectado queda junto y se ve la estructura. Un layout de fuerzas (resortes en las conexiones, repulsión entre
// todas, una gravedad suave al centro) que sale solo de los ids y de las conexiones —nunca de Math.random()— y respeta lo ya colocado (`previas`):
// una neurona nueva en la subred nunca mueve a las que ya tenían sitio. Función pura, sin DOM: corre en un Web Worker (layout.worker.ts) o, si no se
// puede crear, en el hilo principal. Tests en distribucionSubred.test.mjs.
import { rngDe } from './disposicion.ts';

export type Vec3 = [number, number, number];

/** Distancia ideal entre dos neuronas conectadas (cada núcleo mide 0,2-0,3). */
export const LARGO_RESORTE = 4;
const CORTE = LARGO_RESORTE * 1.8;           // la repulsión solo actúa dentro de esta distancia (con una rejilla, el coste es lineal y no cuadrático)
const K_RESORTE = 0.15, K_REPULSION = 0.45, K_GRAVEDAD = 0.012;
const esVec3 = (p: unknown): p is Vec3 => Array.isArray(p) && p.length === 3 && p.every(n => typeof n === 'number' && Number.isFinite(n));

/**
 * Posición de cada neurona de la subred. `previas`: las que ya tenían sitio lo conservan SIEMPRE; las demás se colocan junto a sus vecinas ya colocadas
 * (o en una nube pequeña si no tienen ninguna) y se asientan con las fuerzas. Si no había ninguna previa, el resultado queda centrado en el origen.
 * shortcut: rejilla de 27 celdas por neurona, suficiente hasta unos pocos miles; con muchas más habría que usar un árbol de Barnes-Hut.
 */
export function disponerSubred(idsEntrada: string[], aristas: [string, string][], previas: Record<string, Vec3> = {}, iteraciones = 180): Record<string, Vec3> {
    const ids = [...new Set(idsEntrada)].sort();
    const n = ids.length;
    const res: Record<string, Vec3> = {};
    if (n === 0) return res;
    const indice = new Map(ids.map((id, i) => [id, i]));
    const pos = new Float64Array(n * 3);
    const fijo = new Uint8Array(n);
    const colocado = new Uint8Array(n);

    ids.forEach((id, i) => {
        const p = previas[id];
        if (esVec3(p)) { pos.set(p, i * 3); fijo[i] = colocado[i] = 1; }
    });
    const nFijos = fijo.reduce((a, b) => a + b, 0);
    if (nFijos === n) { ids.forEach((id, i) => { res[id] = [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]; }); return res; }

    // conexiones válidas, sin repetidos ni bucles
    const vistas = new Set<string>();
    const aris: [number, number][] = [];
    const vecinas: number[][] = Array.from({ length: n }, () => []);
    for (const [x, y] of aristas) {
        const a = indice.get(x), b = indice.get(y);
        if (a === undefined || b === undefined || a === b) continue;
        const clave = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (vistas.has(clave)) continue;
        vistas.add(clave);
        aris.push([a, b]);
        vecinas[a].push(b); vecinas[b].push(a);
    }

    aris.sort((p, q) => p[0] - q[0] || p[1] - q[1]);      // el orden de entrada no cambia el resultado (ni siquiera en los últimos decimales)
    vecinas.forEach(v => v.sort((p, q) => p - q));

    // sitio inicial de las nuevas: junto a la media de sus vecinas ya colocadas (varias pasadas, para que una cadena se propague) o en una nube pequeña
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < n; i++) if (fijo[i]) { cx += pos[i * 3]; cy += pos[i * 3 + 1]; cz += pos[i * 3 + 2]; }
    if (nFijos) { cx /= nFijos; cy /= nFijos; cz /= nFijos; }
    const radioNube = LARGO_RESORTE * Math.cbrt(n) * 0.8;
    const alAzar = (id: string, escala: number): Vec3 => {
        const r = rngDe(`sub:${id}`);
        let u = r() + r() + r() - 1.5, v = r() + r() + r() - 1.5, w = r() + r() + r() - 1.5;
        const l = Math.hypot(u, v, w) || 1;
        const d = escala * (0.3 + 0.7 * r());
        u /= l; v /= l; w /= l;
        return [u * d, v * d, w * d];
    };
    for (let pasada = 0; pasada < 4; pasada++) {
        for (let i = 0; i < n; i++) {
            if (colocado[i]) continue;
            const ya = vecinas[i].filter(j => colocado[j]);
            if (!ya.length) continue;
            const m = [0, 0, 0];
            for (const j of ya) { m[0] += pos[j * 3]; m[1] += pos[j * 3 + 1]; m[2] += pos[j * 3 + 2]; }
            const o = alAzar(ids[i], LARGO_RESORTE);
            pos[i * 3] = m[0] / ya.length + o[0]; pos[i * 3 + 1] = m[1] / ya.length + o[1]; pos[i * 3 + 2] = m[2] / ya.length + o[2];
            colocado[i] = 1;
        }
    }
    for (let i = 0; i < n; i++) {
        if (colocado[i]) continue;
        const o = alAzar(ids[i], radioNube);
        pos[i * 3] = cx + o[0]; pos[i * 3 + 1] = cy + o[1]; pos[i * 3 + 2] = cz + o[2];
    }

    const fuerza = new Float64Array(n * 3);
    for (let it = 0; it < iteraciones; it++) {
        const enfriamiento = 1 - it / iteraciones;
        const maxPaso = 0.05 + 0.9 * enfriamiento;     // las primeras vueltas se mueven mucho; las últimas, solo ajustan
        fuerza.fill(0);

        // repulsión: rejilla con celdas del tamaño del corte; cada pareja cercana se mira una vez
        const rejilla = new Map<number, number[]>();
        const celda = (v: number) => Math.floor(v / CORTE);
        const clave = (a: number, b: number, c: number) => ((a + 2048) * 4096 + (b + 2048)) * 4096 + (c + 2048);
        for (let i = 0; i < n; i++) {
            const k = clave(celda(pos[i * 3]), celda(pos[i * 3 + 1]), celda(pos[i * 3 + 2]));
            const l = rejilla.get(k);
            if (l) l.push(i); else rejilla.set(k, [i]);
        }
        for (let i = 0; i < n; i++) {
            const ax = celda(pos[i * 3]), ay = celda(pos[i * 3 + 1]), az = celda(pos[i * 3 + 2]);
            for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
                const l = rejilla.get(clave(ax + dx, ay + dy, az + dz));
                if (!l) continue;
                for (const j of l) {
                    if (j <= i) continue;
                    let x = pos[i * 3] - pos[j * 3], y = pos[i * 3 + 1] - pos[j * 3 + 1], z = pos[i * 3 + 2] - pos[j * 3 + 2];
                    let d = Math.hypot(x, y, z);
                    if (d >= CORTE) continue;
                    if (d < 1e-6) { const o = alAzar(`${ids[i]}|${ids[j]}`, 0.1); x = o[0] + 1e-3; y = o[1]; z = o[2]; d = Math.hypot(x, y, z); }
                    const f = K_REPULSION * LARGO_RESORTE * (CORTE - d) / CORTE / d;
                    fuerza[i * 3] += x * f; fuerza[i * 3 + 1] += y * f; fuerza[i * 3 + 2] += z * f;
                    fuerza[j * 3] -= x * f; fuerza[j * 3 + 1] -= y * f; fuerza[j * 3 + 2] -= z * f;
                }
            }
        }
        // resortes: acercan las conectadas hasta LARGO_RESORTE
        for (const [a, b] of aris) {
            const x = pos[b * 3] - pos[a * 3], y = pos[b * 3 + 1] - pos[a * 3 + 1], z = pos[b * 3 + 2] - pos[a * 3 + 2];
            const d = Math.hypot(x, y, z) || 1e-6;
            const f = K_RESORTE * (d - LARGO_RESORTE) / d;
            fuerza[a * 3] += x * f; fuerza[a * 3 + 1] += y * f; fuerza[a * 3 + 2] += z * f;
            fuerza[b * 3] -= x * f; fuerza[b * 3 + 1] -= y * f; fuerza[b * 3 + 2] -= z * f;
        }
        // gravedad suave al origen (o al centro de lo ya colocado): mantiene la subred compacta y junta las neuronas sueltas
        for (let i = 0; i < n; i++) {
            fuerza[i * 3] -= K_GRAVEDAD * (pos[i * 3] - cx);
            fuerza[i * 3 + 1] -= K_GRAVEDAD * (pos[i * 3 + 1] - cy);
            fuerza[i * 3 + 2] -= K_GRAVEDAD * (pos[i * 3 + 2] - cz);
        }
        for (let i = 0; i < n; i++) {
            if (fijo[i]) continue;
            const fx = fuerza[i * 3], fy = fuerza[i * 3 + 1], fz = fuerza[i * 3 + 2];
            const m = Math.hypot(fx, fy, fz);
            const e = m > maxPaso ? maxPaso / m : 1;
            pos[i * 3] += fx * e; pos[i * 3 + 1] += fy * e; pos[i * 3 + 2] += fz * e;
        }
    }

    // sin previas la subred queda centrada en el origen (la cámara la encuadra desde ahí); con previas no se mueve nada de lo recordado
    if (nFijos === 0) {
        let mx = 0, my = 0, mz = 0;
        for (let i = 0; i < n; i++) { mx += pos[i * 3]; my += pos[i * 3 + 1]; mz += pos[i * 3 + 2]; }
        mx /= n; my /= n; mz /= n;
        for (let i = 0; i < n; i++) { pos[i * 3] -= mx; pos[i * 3 + 1] -= my; pos[i * 3 + 2] -= mz; }
    }
    ids.forEach((id, i) => { res[id] = [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]; });
    return res;
}

/** Centro y radio de una nube de puntos, para encuadrar la cámara. */
export function encuadre(puntos: Vec3[]): { centro: Vec3; radio: number } {
    if (!puntos.length) return { centro: [0, 0, 0], radio: 0 };
    const c: Vec3 = [0, 0, 0];
    for (const p of puntos) { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; }
    c[0] /= puntos.length; c[1] /= puntos.length; c[2] /= puntos.length;
    let radio = 0;
    for (const p of puntos) radio = Math.max(radio, Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]));
    return { centro: c, radio };
}
