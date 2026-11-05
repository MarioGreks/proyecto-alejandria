import katex from 'katex';
import { partirMath, textoPlano } from './labSpec.ts';   // con extensión: así también lo carga `node --test`

const escapar = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** La etiqueta como texto llano (para `aria-label` y las opciones de un desplegable, que no admiten HTML): «Sensibilidad $P(+ \mid D)$» → «Sensibilidad P(+ | D)». */
export const etiquetaPlana = (texto: string): string =>
    textoPlano(texto.replace(/\\text\{([^}]*)\}/g, '$1').replace(/\\mid\b/g, '|').replace(/\\cdot\b/g, '·').replace(/\\times\b/g, '×').replace(/\\(?:left|right)\b/g, ''));

/**
 * HTML de una etiqueta de control con fórmulas entre $...$ («Prevalencia $P(D)$»). Lo que no es fórmula se escapa (la etiqueta viene de un
 * JSON ajeno, así que nunca se inserta como HTML) y las fórmulas pasan por KaTeX sin confianza (`trust: false`: sin \href ni similares).
 * Una fórmula que KaTeX no entienda se muestra como texto, sin romper el panel.
 */
export function etiquetaHtml(texto: string): string {
    return partirMath(texto).map(p => {
        if (!p.math) return escapar(p.texto);
        try {
            return katex.renderToString(p.texto, { throwOnError: false, strict: false, trust: false });
        } catch {
            return escapar(`$${p.texto}$`);
        }
    }).join('');
}
