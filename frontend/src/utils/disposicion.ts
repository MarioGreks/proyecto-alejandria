// Dónde va cada cosa en el universo 3D. Todo sale de los NOMBRES (id de la neurona, nombre del clúster), nunca de Math.random()
// ni del orden o del número de neuronas: así, recargar, añadir o borrar una neurona no mueve las demás, y un clúster nuevo
// no desplaza a los que ya estaban. Funciones puras (salvo la memoria de casillas en localStorage), con tests en disposicion.test.mjs.

export type Vec3 = [number, number, number];

/** FNV-1a de 32 bits: un número estable para cada texto. */
export function hashTexto(texto: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < texto.length; i++) {
        h ^= texto.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

/** Generador pseudoaleatorio (mulberry32) con semilla: la misma clave da siempre la misma secuencia en [0, 1). */
export function rngDe(clave: string): () => number {
    let a = hashTexto(clave);
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Casillas de los clústeres: la 0 es el centro; después, capas esféricas fijas. La capa k (k ≥ 1) tiene 12·k² casillas a radio
// 22 + 18·(k-1) (12 a radio 22, 48 a radio 40, 108 a radio 58...): con nubes de radio 10, dos clústeres vecinos no se pisan.
// Dentro de cada capa las casillas van en orden de «el punto más alejado de los ya usados»: con 2, 3 o 4 clústeres quedan
// repartidos alrededor del centro y no amontonados en una esquina.
const RADIO_CAPA1 = 22, PASO_CAPA = 18;
const casillasDeCapa = (k: number) => (k === 0 ? 1 : 12 * k * k);

function capaDe(casilla: number): { capa: number; i: number; n: number } {
    let capa = 0, inicio = 0;
    while (casilla >= inicio + casillasDeCapa(capa)) { inicio += casillasDeCapa(capa); capa++; }
    return { capa, i: casilla - inicio, n: casillasDeCapa(capa) };
}

const ordenCapa = new Map<number, Vec3[]>();
/** Puntos de una capa (reparto de Fibonacci sobre su esfera) ordenados por el más alejado de los anteriores. Se calcula una vez por capa. */
function puntosDeCapa(capa: number): Vec3[] {
    const hecho = ordenCapa.get(capa);
    if (hecho) return hecho;
    const n = casillasDeCapa(capa), radio = RADIO_CAPA1 + PASO_CAPA * (capa - 1);
    const fib: Vec3[] = Array.from({ length: n }, (_, i) => {
        const incl = Math.acos(1 - 2 * (i + 0.5) / n), azim = Math.PI * (1 + Math.sqrt(5)) * i + capa * 0.7;
        return [Math.sin(incl) * Math.cos(azim) * radio, Math.cos(incl) * radio, Math.sin(incl) * Math.sin(azim) * radio];
    });
    // Empieza por el punto más de frente a la cámara (z máxima) y sigue con el más alejado de todos los elegidos.
    const orden: Vec3[] = [];
    const restantes = [...fib].sort((a, b) => b[2] - a[2]);
    orden.push(restantes.shift()!);
    while (restantes.length) {
        let mejor = 0, mejorD = -1;
        restantes.forEach((p, i) => {
            const d = Math.min(...orden.map(q => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])));
            if (d > mejorD + 1e-9) { mejorD = d; mejor = i; }
        });
        orden.push(restantes.splice(mejor, 1)[0]);
    }
    ordenCapa.set(capa, orden);
    return orden;
}

/** Posición del centro de un clúster según su casilla. */
export function centroDeCasilla(casilla: number): Vec3 {
    const { capa, i } = capaDe(casilla);
    return capa === 0 ? [0, 0, 0] : [...puntosDeCapa(capa)[i]] as Vec3;
}

/**
 * Casilla de cada clúster. Los que ya tenían una (`previas`) la conservan; los nuevos, por orden alfabético, toman la primera libre
 * (el centro, luego la capa 1 en su orden de reparto, luego la 2...). Sin memoria, el mismo conjunto de nombres da el mismo
 * resultado en cualquier ordenador; con memoria, un clúster nuevo nunca mueve a otro.
 */
export function asignarCasillas(nombres: string[], previas: Record<string, number> = {}): Record<string, number> {
    const unicos = [...new Set(nombres)].sort();
    const res: Record<string, number> = {};
    const ocupadas = new Set<number>();
    for (const nombre of unicos) {
        const c = previas[nombre];
        if (Number.isInteger(c) && c >= 0 && !ocupadas.has(c)) { res[nombre] = c; ocupadas.add(c); }
    }
    let siguiente = 0;
    for (const nombre of unicos) {
        if (nombre in res) continue;
        while (ocupadas.has(siguiente)) siguiente++;
        res[nombre] = siguiente;
        ocupadas.add(siguiente);
    }
    return res;
}

/** Posición de una neurona dentro de la nube de su clúster: depende solo de su id (y del centro del clúster). */
export function posicionNeurona(id: string, centro: Vec3, radio = 10): Vec3 {
    const r = rngDe(`n:${id}`);
    let u = r() + r() + r() - 1.5, v = r() + r() + r() - 1.5, w = r() + r() + r() - 1.5;
    const largo = Math.hypot(u, v, w) || 1;
    u /= largo; v /= largo; w /= largo;
    const dist = Math.abs(r() + r() - 1) * radio;
    return [centro[0] + u * dist, centro[1] + v * dist, centro[2] + w * dist];
}

// Memoria de casillas de este ordenador: así un clúster conserva su sitio aunque mientras tanto aparezcan otros
// (sin ella, uno nuevo que «prefiriera» una casilla ocupada por otro de nombre posterior en el alfabeto podría quitársela).
const CLAVE_CASILLAS = 'alejandria.casillasClusters';
const MAX_RECORDADOS = 500;

export function casillasRecordadas(nombres: string[]): Record<string, number> {
    let previas: Record<string, number> = {};
    try { previas = JSON.parse(localStorage.getItem(CLAVE_CASILLAS) ?? '{}') ?? {}; } catch { previas = {}; }
    const res = asignarCasillas(nombres, previas);
    try {
        // los clústeres que hoy no están se recuerdan también, por si vuelven (p. ej. borras su única neurona y la vuelves a crear)
        const todas = { ...previas, ...res };
        const claves = Object.keys(todas);
        const recortadas = claves.length > MAX_RECORDADOS ? Object.fromEntries(claves.slice(-MAX_RECORDADOS).map(k => [k, todas[k]])) : todas;
        localStorage.setItem(CLAVE_CASILLAS, JSON.stringify(recortadas));
    } catch { /* sin almacenamiento: la asignación sigue siendo determinista por nombre */ }
    return res;
}

/** Firma de lo que cambia el dibujo del universo: si no cambia, no hace falta recalcular la geometría al consultar el backend. */
export const firmaUniverso = (nodos: any[], aristas: any[]): string =>
    JSON.stringify([
        nodos.map(n => [n.id, n.cluster_id ?? '', n.nombre ?? '']).sort(),
        aristas.map(a => [a.origen_id, a.destino_id, a.estado ?? '']).sort(),
    ]);
