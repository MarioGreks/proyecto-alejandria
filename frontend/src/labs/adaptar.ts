import type { Figura } from '../utils/labSpec';

export interface Salida { type: string; content: string }
export interface Adaptado { modo: 'datos' | 'imagen'; figuras: Figura[]; outputs: Salida[] }

/** Resultado del worker (Pyodide) -> la forma que pinta el widget: figuras para el canvas, o imágenes PNG, más texto de consola y errores. */
export function adaptarResultado(r: any): Adaptado {
    const outputs: Salida[] = [];
    if (r.stdout) outputs.push({ type: 'stdout', content: r.stdout });
    if (r.modo === 'imagen') {
        for (const b64 of r.imagenes ?? []) outputs.push({ type: 'image/png', content: b64 });
        if (r.error) outputs.push({ type: 'error', content: r.error });
    }
    return { modo: r.modo, figuras: r.figuras ?? [], outputs };
}

/** Los laboratorios antiguos imprimen además un JSON {x, y} que no es para mostrar. */
export const esJsonXY = (o: Salida): boolean => {
    if (o.type !== 'stdout' && o.type !== 'text') return false;
    const txt = o.content.trim();
    return (txt.startsWith('{') || txt.startsWith("'{") || txt.startsWith('"{')) && txt.includes('"x"') && txt.includes('"y"');
};
