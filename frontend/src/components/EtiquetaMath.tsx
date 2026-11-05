import { useMemo } from 'react';
import { etiquetaHtml } from '../utils/etiquetaMath';

/** Texto de una etiqueta con fórmulas $...$ dibujadas (los estilos de KaTeX ya los carga el panel de la neurona). */
export default function EtiquetaMath({ texto }: { texto: string }) {
    const html = useMemo(() => etiquetaHtml(texto), [texto]);
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
