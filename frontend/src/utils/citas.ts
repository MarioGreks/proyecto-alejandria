// Marcas de cita que dejan las IA con búsqueda web y que no significan nada fuera de su chat: «[reference:25]» (DeepSeek), «[ref 3]»,
// «[cite: 1, 2]» y «[cite_start]» (Gemini), «:contentReference[oaicite:0]{index=0}» y «【4†fuente】» (ChatGPT) y los caracteres privados
// U+E200…U+E201 de ChatGPT. Las fuentes de verdad van en el array `referencias`. Misma lista en backend/limpieza.py
// (que limpia al guardar); aquí se limpia al pintar, para las neuronas guardadas antes o llegadas de otro PC.
const MARCAS_CITA = [
    /:?contentReference\[oaicite:\d+\]\{index=\d+\}/g,
    /\[oaicite:\d+\]/g,
    /\[cite_start\]/gi,
    /\[(?:ref|refs|reference|references|cite|citation)(?:[:_\s-][^\]\n]{0,40})?\](?!\()/gi,   // (?!\() respeta un enlace [ref](url)
    /【[^】\n]{0,80}】/g,
    /[^]{0,200}/g,
];
const PATRONES = MARCAS_CITA.map(re => new RegExp(`[ \\t]*(?:${re.source})`, re.flags));

/** Quita las marcas de cita (y el espacio que las precede) sin tocar el resto del texto. */
export const limpiarCitas = (text: string): string => {
    if (!text) return text;
    let t = text;
    for (const re of PATRONES) t = t.replace(re, '');
    return t;
};
