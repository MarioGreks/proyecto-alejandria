// Transición entre dos disposiciones del universo (red general ⇄ subred, o subred ⇄ subred). Los shaders (Universe.tsx) interpolan en la GPU cada vértice entre
// «dónde estaba» y «dónde está ahora» con estas mismas fórmulas; aquí viven en JS para (1) «hornear» el estado a mitad de camino cuando el usuario cambia de red
// antes de que acabe la transición y (2) probarlas. Si cambias una, cambia también su copia en GLSL (marcadas con «GLSL»).

/** Parte de la línea de tiempo que se reparte entre neuronas como retraso (GLSL: 0.35): cada una sale un poco después que otra, y el cambio se siente orgánico. */
export const FASE_MAX = 0.35;
/** Duración total de la transición, en ms. */
export const DURACION_MS = 1300;

const acotar = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** Suavizado de 5.º grado (GLSL: e*e*e*(e*(e*6.0-15.0)+10.0)): arranca y llega sin tirones. */
export const suave = (x: number): number => x * x * x * (x * (x * 6 - 15) + 10);

/** Avance de una neurona con retraso `fase` (0..1) cuando la transición va por `t` (0..1). GLSL: clamp((uT - w*0.35)/0.65, 0., 1.) y el suavizado. */
export const avance = (t: number, fase: number): number => suave(acotar((t - fase * FASE_MAX) / (1 - FASE_MAX)));

/** Posición de un vértice a mitad de camino: de `ant` a `dest` con el desvío en arco `arco` (máximo a mitad de camino). GLSL: mix(aAnt, position, e) + aArco.xyz*sin(PI*e). */
export function posicionEnCurso(ant: number, dest: number, arco: number, e: number): number {
    return ant + (dest - ant) * e + arco * Math.sin(Math.PI * e);
}

/** Duración efectiva: 0 (cambio instantáneo) si el sistema pide reducir animaciones. */
export function duracion(reducirMovimiento: boolean): number {
    return reducirMovimiento ? 0 : DURACION_MS;
}

/**
 * Hornea el estado actual de unos vértices (tres números por vértice) a mitad de transición: devuelve dónde están ahora, para que la siguiente transición
 * parta de ahí y no pegue un salto. `arco` lleva 4 números por vértice (los tres primeros, el desvío; el cuarto, la fase).
 */
export function hornearPosiciones(ant: Float32Array, dest: Float32Array, arco: Float32Array, t: number, salida: Float32Array = new Float32Array(dest.length)): Float32Array {
    const n = dest.length / 3;
    for (let v = 0; v < n; v++) {
        const e = avance(t, arco[v * 4 + 3]);
        for (let k = 0; k < 3; k++) salida[v * 3 + k] = posicionEnCurso(ant[v * 3 + k], dest[v * 3 + k], arco[v * 4 + k], e);
    }
    return salida;
}

/** Igual para un número por vértice (la visibilidad: 1 se ve, 0 no). */
export function hornearEscalares(ant: Float32Array, dest: Float32Array, arco: Float32Array, t: number, salida: Float32Array = new Float32Array(dest.length)): Float32Array {
    for (let v = 0; v < dest.length; v++) {
        const e = avance(t, arco[v * 4 + 3]);
        salida[v] = ant[v] + (dest[v] - ant[v]) * e;
    }
    return salida;
}
