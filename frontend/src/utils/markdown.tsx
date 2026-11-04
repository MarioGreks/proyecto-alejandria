import { openUrl } from '@tauri-apps/plugin-opener';

export const handleOpenExternal = async (e: React.MouseEvent<HTMLAnchorElement>, href?: string) => {
    e.preventDefault();
    if (!href) return;
    try {
        await openUrl(href);
    } catch {
        window.open(href, '_blank', 'noopener,noreferrer');
    }
};

export const markdownComponents = {
    a: ({ href, children, ...props }: any) => (
        <a
            href={href}
            onClick={(e) => handleOpenExternal(e, href)}
            target="_blank"
            rel="noopener noreferrer"
            {...props}
        >
            {children}
        </a>
    )
};

import { limpiarCitas } from './citas';
export { limpiarCitas };

// Pre-procesador para forzar que los $$ siempre sean bloques (display mode) en Markdown.
export const forceBlockMath = (text: string) => {
    if (!text) return text;
    // Capturamos el bloque entero $$ ... $$
    let processed = limpiarCitas(text).replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula) => {
        // Lo aislamos con dobles saltos de línea por fuera (rompe el párrafo de Markdown)
        // y usamos un solo salto de línea por dentro (mantiene la integridad del bloque math).
        return `\n\n$$\n${formula.trim()}\n$$\n\n`;
    });
    return processed.replace(/\n{3,}/g, '\n\n').trim();
};
