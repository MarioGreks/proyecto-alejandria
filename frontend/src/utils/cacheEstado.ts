// Última respuesta conocida de cada consulta de estado (ajustes, sincronización...). Ajustes se abre al instante con lo último que se supo y se refresca por
// detrás, en vez de enseñar una cajita de «Conectando...» que luego salta al contenido de verdad. La barra de abajo ya consulta esos datos de todos modos.
const cache = new Map<string, unknown>();

export const leerCache = <T,>(clave: string): T | null => (cache.has(clave) ? (cache.get(clave) as T) : null);
export const guardarCache = (clave: string, valor: unknown): void => { cache.set(clave, valor); };

/** Para no repintar un diálogo grande cada pocos segundos con los mismos datos: se queda el objeto de antes si no ha cambiado nada. */
export const iguales = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
