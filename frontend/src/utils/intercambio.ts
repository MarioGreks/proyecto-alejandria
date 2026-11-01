// Exportar / importar neuronas (el formato lo define backend/intercambio.py).
import { API } from './api';

export interface ResumenImportacion { añadidas: number; omitidas: number; conexiones: number }

const errorDe = async (res: Response): Promise<string> => {
    const cuerpo = await res.json().catch(() => null);
    return typeof cuerpo?.detail === 'string' ? cuerpo.detail : `El servidor respondió ${res.status}`;
};

/** Descarga todas tus neuronas como un archivo .json. */
export async function exportarNeuronas(): Promise<void> {
    const res = await fetch(`${API}/api/exportar`);
    if (!res.ok) throw new Error(await errorDe(res));
    const url = URL.createObjectURL(new Blob([JSON.stringify(await res.json(), null, 1)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `alejandria-neuronas-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/** Importa el contenido ya leído de un archivo exportado; nunca pisa neuronas que ya existan. */
export async function importarNeuronas(contenido: unknown): Promise<ResumenImportacion> {
    const res = await fetch(`${API}/api/importar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido }),
    });
    if (!res.ok) throw new Error(await errorDe(res));
    return res.json();
}

export const importarArchivo = async (archivo: File): Promise<ResumenImportacion> => {
    let contenido: unknown;
    try { contenido = JSON.parse(await archivo.text()); } catch { throw new Error('El archivo no es un JSON válido.'); }
    return importarNeuronas(contenido);
};

/** Las 3 neuronas de ejemplo que van con la app (public/ejemplos/ejemplos.json). */
export async function importarEjemplos(): Promise<ResumenImportacion> {
    const res = await fetch('/ejemplos/ejemplos.json');
    if (!res.ok) throw new Error('No se encontró el paquete de ejemplos.');
    return importarNeuronas(await res.json());
}

export const textoResumen = (r: ResumenImportacion): string =>
    `Añadidas ${r.añadidas}${r.omitidas ? `, ya las tenías ${r.omitidas}` : ''}${r.conexiones ? `, ${r.conexiones} conexión(es)` : ''}.`;
