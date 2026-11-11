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

/** Punto de la nube (centrada en el origen) que sale de un generador con semilla: más denso hacia el centro, como un conglomerado. */
function puntoDeNube(r: () => number, radio: number): Vec3 {
    let u = r() + r() + r() - 1.5, v = r() + r() + r() - 1.5, w = r() + r() + r() - 1.5;
    const largo = Math.hypot(u, v, w) || 1;
    u /= largo; v /= largo; w /= largo;
    const dist = Math.abs(r() + r() - 1) * radio;
    return [u * dist, v * dist, w * dist];
}

/** Posición de una neurona dentro de la nube de su clúster: depende solo de su id (y del centro del clúster). Sin separación mínima: ver `desplazamientosCluster`. */
export function posicionNeurona(id: string, centro: Vec3, radio = 10): Vec3 {
    const [x, y, z] = puntoDeNube(rngDe(`n:${id}`), radio);
    return [centro[0] + x, centro[1] + y, centro[2] + z];
}

/** Distancia mínima entre dos neuronas del mismo clúster (cada núcleo mide 0,2-0,3: así nunca están una encima de otra y sigue habiendo conglomerado). */
export const DISTANCIA_MINIMA = 2.5;
const INTENTOS_POR_PASO = 40, PASO_NUBE = 0.5, MAX_INTENTOS = 4000;   // la nube crece 0,5 cada 40 candidatos rechazados: solo lo justo

const esVec3 = (p: unknown): p is Vec3 => Array.isArray(p) && p.length === 3 && p.every(n => typeof n === 'number' && Number.isFinite(n));
const distancia = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * Posición (relativa al centro del clúster) de cada neurona, con una distancia mínima entre todas. Las que ya tenían sitio (`previas`) lo
 * conservan SIEMPRE, aunque estuvieran más juntas; las nuevas, en orden alfabético de id, prueban los candidatos de su propia semilla
 * hasta uno que cumpla (el primero es el de `posicionNeurona`, así que una neurona sin vecinas cerca no cambia de sitio). Si la nube se
 * llena, su radio crece lo justo solo para esa neurona. Una neurona nueva nunca mueve a otra; sin memoria, el mismo conjunto de ids da
 * el mismo resultado en cualquier ordenador.
 * Las colocadas van en una rejilla de celdas del tamaño de la distancia mínima: para un candidato solo hay que mirar las 27 celdas de alrededor (todo lo que
 * está a menos de `minima` cae ahí), así que cada neurona cuesta lo mismo con 60 que con 2000 en el clúster (comparando con todas, 500 tardaban 1,6 s y 2000, 68 s).
 * Da exactamente los mismos sitios que la comparación con todas (hay un test que lo comprueba).
 */
function crearRejilla(lado: number) {
    // Clave numérica por hash de la celda (sin crear textos): si dos celdas chocan, el cajón lleva puntos de más, que son puntos reales y no cambian el resultado.
    const celdas = new Map<number, Vec3[]>();
    const clave = (x: number, y: number, z: number) => (x * 73856093) ^ (y * 19349663) ^ (z * 83492791);
    return {
        agregar(p: Vec3): void {
            const k = clave(Math.floor(p[0] / lado), Math.floor(p[1] / lado), Math.floor(p[2] / lado));
            const c = celdas.get(k);
            if (c) c.push(p); else celdas.set(k, [p]);
        },
        /** Distancia al punto más cercano; exacta si es menor que `lado` (lo único que importa) y, si no hay ninguno tan cerca, mayor o infinita. */
        masCercano(p: Vec3): number {
            const cx = Math.floor(p[0] / lado), cy = Math.floor(p[1] / lado), cz = Math.floor(p[2] / lado);
            let m = Infinity;
            for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
                const c = celdas.get(clave(cx + dx, cy + dy, cz + dz));
                if (c) for (const q of c) m = Math.min(m, distancia(p, q));
            }
            return m;
        },
    };
}

export function desplazamientosCluster(ids: string[], previas: Record<string, Vec3> = {}, minima = DISTANCIA_MINIMA, radio = 10): Record<string, Vec3> {
    const orden = [...new Set(ids)].sort();
    const res: Record<string, Vec3> = {};
    const colocadas = crearRejilla(Math.max(minima, 1e-9));
    for (const id of orden) {
        if (esVec3(previas[id])) { res[id] = previas[id]; colocadas.agregar(previas[id]); }
    }
    for (const id of orden) {
        if (id in res) continue;
        const r = rngDe(`n:${id}`);
        let elegido: Vec3 | null = null, mejorDist = -1;
        for (let i = 0; i < MAX_INTENTOS; i++) {
            const p = puntoDeNube(r, radio + Math.floor(i / INTENTOS_POR_PASO) * PASO_NUBE);
            const d = colocadas.masCercano(p);
            if (d >= minima) { elegido = p; break; }
            if (d > mejorDist) { elegido = p; mejorDist = d; }       // por si se agotan los intentos: el menos malo
        }
        res[id] = elegido!;
        colocadas.agregar(elegido!);
    }
    return res;
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

const CLAVE_POSICIONES = 'alejandria.posicionesNeuronas';
const MAX_POSICIONES = 5000;

/**
 * Posiciones (relativas al centro) de las neuronas de cada clúster, recordadas en este ordenador para que ninguna se mueva al añadir otras.
 * `clusters`: nombre del clúster → ids de sus neuronas. Una neurona que cambia de clúster se vuelve a colocar en el nuevo.
 */
export function posicionesRecordadas(clusters: Record<string, string[]>): Record<string, Vec3> {
    let guardado: Record<string, [string, Vec3]> = {};
    try { guardado = JSON.parse(localStorage.getItem(CLAVE_POSICIONES) ?? '{}') ?? {}; } catch { guardado = {}; }
    const res: Record<string, Vec3> = {};
    const nuevo: Record<string, [string, Vec3]> = { ...guardado };
    for (const [cluster, ids] of Object.entries(clusters)) {
        const previas: Record<string, Vec3> = {};
        for (const id of ids) {
            const g = guardado[id];
            if (Array.isArray(g) && g[0] === cluster && esVec3(g[1])) previas[id] = g[1];
        }
        const desp = desplazamientosCluster(ids, previas);
        for (const id of ids) { res[id] = desp[id]; nuevo[id] = [cluster, desp[id]]; }
    }
    try {
        const claves = Object.keys(nuevo);
        const recortado = claves.length > MAX_POSICIONES ? Object.fromEntries(claves.slice(-MAX_POSICIONES).map(k => [k, nuevo[k]])) : nuevo;
        localStorage.setItem(CLAVE_POSICIONES, JSON.stringify(recortado));
    } catch { /* sin almacenamiento: la colocación sigue siendo determinista por id */ }
    return res;
}

/** Firma de lo que cambia el dibujo del universo: si no cambia, no hace falta recalcular la geometría al consultar el backend. */
export const firmaUniverso = (nodos: any[], aristas: any[]): string =>
    JSON.stringify([
        nodos.map(n => [n.id, n.cluster_id ?? '', n.nombre ?? '', Array.isArray(n.subredes) ? [...n.subredes].sort() : []]).sort(),
        aristas.map(a => [a.origen_id, a.destino_id, a.estado ?? '']).sort(),
    ]);
