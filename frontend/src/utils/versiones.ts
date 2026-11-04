/** ¿La versión `a` (p. ej. «0.2.2») es mayor que `b`? Compara número a número; lo que no es número cuenta como 0. */
export const esMayor = (a: string, b: string): boolean => {
    const partes = (v: string) => v.split('.').map(x => parseInt(x, 10) || 0);
    const [x, y] = [partes(a), partes(b)];
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
        const [p, q] = [x[i] ?? 0, y[i] ?? 0];
        if (p !== q) return p > q;
    }
    return false;
};

/** ¿Hay que enseñar «Actualizado a la versión X»? Solo si ya se había arrancado antes con otra versión y la de ahora es más nueva (la primera vez no hay nada que contar). */
export const hayQueAvisarDeActualizado = (vista: string | null, actual: string): boolean => !!vista && esMayor(actual, vista);
