// Exportar / importar neuronas (el formato lo define backend/intercambio.py).
import { API } from './api';

export interface ResumenImportacion { añadidas: number; omitidas: number; conexiones: number }

const errorDe = async (res: Response): Promise<string> => {
    const cuerpo = await res.json().catch(() => null);
    return typeof cuerpo?.detail === 'string' ? cuerpo.detail : `El servidor respondió ${res.status}`;
};

/** Descarga tus neuronas como un archivo .json: todas, o solo las de una subred. */
export async function exportarNeuronas(subred?: string): Promise<void> {
    const res = await fetch(`${API}/api/exportar${subred ? `?subred=${encodeURIComponent(subred)}` : ''}`);
    if (!res.ok) throw new Error(await errorDe(res));
    const url = URL.createObjectURL(new Blob([JSON.stringify(await res.json(), null, 1)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `alejandria-${subred ? `${subred.replace(/[^\w-]+/g, '_')}-` : 'neuronas-'}${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/** Importa el contenido ya leído de un archivo exportado; nunca pisa neuronas que ya existan. Con `subred`, todo lo del archivo entra además en esa subred. */
export async function importarNeuronas(contenido: unknown, subred?: string | null): Promise<ResumenImportacion> {
    const res = await fetch(`${API}/api/importar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido, subred: subred ?? null }),
    });
    if (!res.ok) throw new Error(await errorDe(res));
    return res.json();
}

export const importarArchivo = async (archivo: File, subred?: string | null): Promise<ResumenImportacion> => {
    let contenido: unknown;
    try { contenido = JSON.parse(await archivo.text()); } catch { throw new Error('El archivo no es un JSON válido.'); }
    return importarNeuronas(contenido, subred);
};

/** Las 3 neuronas de ejemplo que van con la app (public/ejemplos/ejemplos.json). */
export async function importarEjemplos(): Promise<ResumenImportacion> {
    const res = await fetch('/ejemplos/ejemplos.json');
    if (!res.ok) throw new Error('No se encontró el paquete de ejemplos.');
    return importarNeuronas(await res.json());
}

export const textoResumen = (r: ResumenImportacion): string =>
    `Añadidas ${r.añadidas}${r.omitidas ? `, ya las tenías ${r.omitidas}` : ''}${r.conexiones ? `, ${r.conexiones} conexión(es)` : ''}.`;
