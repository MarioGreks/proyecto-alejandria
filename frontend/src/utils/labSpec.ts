// Formato de las figuras que devuelve el worker de laboratorios (ver src/labs/labplot.py) y utilidades puras para dibujarlas.

export type Num = number | null;

interface Base { alpha: number; label?: string | null; zorder?: number | null }

export type Serie =
    | (Base & { tipo: 'linea'; x: Num[]; y: Num[]; color: string; ancho: number; estilo: string; marcador: string | null; ms: number })
    | (Base & { tipo: 'dispersion'; x: Num[]; y: Num[]; color: string; ms: number; marcador: string; borde: string | null })
    | (Base & { tipo: 'barras'; x: Num[]; alto: Num[]; base?: Num[] | null; ancho: number; color: string; colores: string[] | null; borde: string | null })
    | (Base & { tipo: 'area'; x: Num[]; y1: Num[]; y2: Num[]; color: string })
    | (Base & { tipo: 'vline' | 'hline'; pos: number; color: string; ancho: number; estilo: string })
    | (Base & { tipo: 'banda_x' | 'banda_y'; desde: number; hasta: number; color: string })
    | { tipo: 'texto'; x: number; y: number; texto: string; ejes: boolean; ha: string; va: string; tam: number; negrita: boolean; color: string; zorder?: number | null; flecha?: { x: number; y: number } }
    // imshow: píxeles RGBA (base64, fila a fila) que ocupan `extent` = [izquierda, derecha, abajo, arriba]; la fila 0 va arriba si origen = 'upper'
    | { tipo: 'imagen'; ancho: number; alto: number; origen: 'upper' | 'lower'; extent: [number, number, number, number]; rgba: string; zorder?: number | null };

export interface Eje {
    fila: number; col: number; filas: number; cols: number;
    titulo: string | null; xlabel: string | null; ylabel: string | null;
    xlim: [Num, Num] | null; ylim: [Num, Num] | null;
    grid: { alpha: number; eje: string } | null;
    leyenda: string | null;
    aspecto_igual: boolean;
    categorias: string[];   // nombres del eje X (barras con etiquetas de texto); vacío = eje numérico
    xticks?: Marcas | null; yticks?: Marcas | null;   // marcas a medida (plt.xticks / set_yticks); ausente = automáticas
    xscale?: 'log' | null; yscale?: 'log' | null;      // escala logarítmica (base 10); ausente = lineal
    series: Serie[];
}

export interface Marcas { pos: number[]; labels: string[] | null }

export interface Figura { tam: [number, number]; titulo: string | null; ejes: Eje[] }

export interface Limites { xmin: number; xmax: number; ymin: number; ymax: number }

export type Valor = number | boolean | string;

// --- Definición de un laboratorio (lo que viaja en el JSON del nodo) ---------------------------------------------

export interface OpcionControl { valor: number | string; label?: string }

export interface ControlParams {
    variable: string;
    label: string;
    tipo?: 'slider' | 'checkbox' | 'select';   // sin tipo = slider (laboratorios antiguos)
    min?: number;
    max?: number;
    step?: number;
    default: Valor;
    opciones?: (number | string | OpcionControl)[];
    grupo?: string;                            // los controles con el mismo grupo se enseñan juntos bajo un título
}

export interface LaboratorioData {
    explicacion?: string;
    controles?: ControlParams[];
    codigo: string;
}

export const MAX_CONTROLES = 24;   // el mismo tope que el backend: un laboratorio con más variables que esto no se puede explorar

export const PLANTILLA_LABORATORIO: LaboratorioData = {
    controles: [{ variable: 'a', label: 'Amplitud', tipo: 'slider', min: 0, max: 5, step: 0.1, default: 1 }],
    codigo: `import numpy as np
import matplotlib.pyplot as plt

a = {a}                       # {a} se sustituye por el valor del control "a"
x = np.linspace(-10, 10, 400)
y = a * np.sin(x)

plt.figure(figsize=(8, 4))
plt.plot(x, y, label='y = a·sin(x)')
plt.title('Mi simulación')
plt.xlabel('x'); plt.ylabel('y')
plt.grid(True, alpha=0.3); plt.legend()
plt.show()
`,
};

const NOMBRE_VARIABLE = /^[A-Za-z_][A-Za-z0-9_]{0,39}$/;
const valoresDe = (c: ControlParams): (number | string)[] => (c.opciones ?? []).map(o => (typeof o === 'object' ? o.valor : o));

/** {nombres} del código que no tienen control. Pueden ser variables normales de Python (p. ej. en un f-string): solo es un aviso. */
export function variablesSinControl(codigo: string, controles: ControlParams[]): string[] {
    const definidas = new Set(controles.map(c => c.variable));
    return [...new Set([...codigo.matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map(m => m[1]))].filter(v => !definidas.has(v));
}

/** Los mismos requisitos que valida el backend al guardar, para avisar antes de enviar. Lista vacía = correcto. */
export function validarControles(controles: ControlParams[]): string[] {
    const errores: string[] = [];
    if (controles.length > MAX_CONTROLES) errores.push(`Como máximo ${MAX_CONTROLES} variables.`);
    const vistos = new Set<string>();
    for (const c of controles) {
        const nombre = c.variable || '(sin nombre)';
        if (!NOMBRE_VARIABLE.test(c.variable)) errores.push(`"${nombre}": el nombre debe empezar por letra o _ y usar solo letras, números y _.`);
        if (vistos.has(c.variable)) errores.push(`"${nombre}": nombre repetido.`);
        vistos.add(c.variable);
        if (!c.label.trim()) errores.push(`"${nombre}": falta la etiqueta.`);
        const tipo = c.tipo ?? 'slider';
        if (tipo === 'slider') {
            const { min, max, step } = c;
            if (![min, max, step].every(n => typeof n === 'number' && Number.isFinite(n))) errores.push(`"${nombre}": min, max y paso deben ser números.`);
            else if (!(min! < max!) || !(step! > 0)) errores.push(`"${nombre}": hace falta mínimo < máximo y paso > 0.`);
            else if (typeof c.default !== 'number' || c.default < min! || c.default > max!) errores.push(`"${nombre}": el valor inicial debe estar entre el mínimo y el máximo.`);
        } else if (tipo === 'checkbox') {
            if (typeof c.default !== 'boolean') errores.push(`"${nombre}": la casilla necesita un valor inicial sí/no.`);
        } else if (!valoresDe(c).length || !valoresDe(c).some(v => String(v) === String(c.default))) {
            errores.push(`"${nombre}": el desplegable necesita opciones y un valor inicial que esté entre ellas.`);
        }
    }
    return errores;
}

/** Valores actuales tras cambiar la lista de controles: se conservan los compatibles (recortados al rango) y el resto vuelve al inicial. */
export function sincronizarValores(controles: ControlParams[], previos: Record<string, Valor>): Record<string, Valor> {
    return Object.fromEntries(controles.map(c => {
        const prev = previos[c.variable], tipo = c.tipo ?? 'slider';
        if (tipo === 'slider' && typeof prev === 'number' && Number.isFinite(prev) && typeof c.min === 'number' && typeof c.max === 'number')
            return [c.variable, Math.min(c.max, Math.max(c.min, prev))];
        if (tipo === 'checkbox' && typeof prev === 'boolean') return [c.variable, prev];
        if (tipo === 'select' && prev !== undefined && valoresDe(c).some(v => String(v) === String(prev))) return [c.variable, prev];
        return [c.variable, c.default];
    }));
}

/** Control nuevo con un nombre libre (o el pedido, si no existe ya). */
export function nuevoControl(existentes: ControlParams[], variable?: string): ControlParams {
    const usados = new Set(existentes.map(c => c.variable));
    let nombre = variable && !usados.has(variable) ? variable : 'variable_1';
    for (let i = 2; usados.has(nombre); i++) nombre = `variable_${i}`;
    return { variable: nombre, label: nombre.replace(/_/g, ' '), tipo: 'slider', min: 0, max: 10, step: 0.1, default: 1 };
}

/** Opciones de un desplegable <-> texto separado por comas. Si todas son números se pasan al código como números; si no, como textos. */
export const opcionesATexto = (c: ControlParams): string => valoresDe(c).join(', ');
export function textoAOpciones(texto: string): (number | string)[] {
    const partes = texto.split(',').map(p => p.trim()).filter(Boolean);
    return partes.every(p => Number.isFinite(Number(p))) ? partes.map(Number) : partes;
}

// Valor de un control -> literal de Python que sustituye a {variable} en el código del laboratorio.
export const literal = (v: Valor): string =>
    typeof v === 'boolean' ? (v ? 'True' : 'False') : typeof v === 'number' ? String(v) : JSON.stringify(v);

const PALABRAS_PYTHON = new Set(['False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield']);

// Los controles que el código no usa como {variable} se definen igualmente al principio: las IA a veces escriben `n = int(n)` sin llaves, y sin esto
// esa variable no existe en Python (NameError) y el control no hace nada.
export const inyectar = (codigo: string, valores: Record<string, Valor>): string => {
    const sueltos = Object.entries(valores).filter(([clave]) => !codigo.includes(`{${clave}}`) && !PALABRAS_PYTHON.has(clave));
    const cuerpo = Object.entries(valores).reduce((c, [clave, v]) => c.split(`{${clave}}`).join(literal(v)), codigo);
    return sueltos.length ? `${sueltos.map(([clave, v]) => `${clave} = ${literal(v)}`).join('\n')}\n${cuerpo}` : cuerpo;
};

const ZORDER_POR_TIPO: Record<string, number> = { imagen: 0, area: 1, barras: 1, dispersion: 1, banda_x: 0.5, banda_y: 0.5, linea: 2, vline: 2, hline: 2, texto: 3 };
export const zorderDe = (s: Serie): number => s.zorder ?? ZORDER_POR_TIPO[s.tipo] ?? 2;

/** Texto sin LaTeX (para la leyenda dibujada en canvas): quita $ y barras y convierte comandos comunes. */
export const textoPlano = (t: string): string =>
    t.replace(/\\(mu|sigma|lambda|alpha|beta|gamma|delta|theta|pi|rho|tau|phi|omega)/g, (_, g) => ({ mu: 'μ', sigma: 'σ', lambda: 'λ', alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', theta: 'θ', pi: 'π', rho: 'ρ', tau: 'τ', phi: 'φ', omega: 'ω' } as Record<string, string>)[g])
        .replace(/\$/g, '').replace(/[{}]/g, '').replace(/\\/g, '');

/** Parte un texto con $...$ en trozos de texto y de fórmula. */
export const partirMath = (t: string): { math: boolean; texto: string }[] =>
    t.split(/(\$[^$]+\$)/g).filter(Boolean).map(p => p.length > 1 && p.startsWith('$') && p.endsWith('$')
        ? { math: true, texto: p.slice(1, -1) } : { math: false, texto: p });

const finito = (v: Num | undefined): v is number => typeof v === 'number' && Number.isFinite(v);

/** Límites automáticos como matplotlib: rango de los datos + 5 % de margen; las barras fijan el suelo en 0. */
export function limitesAuto(eje: Eje): Limites {
    let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
    let hayBarras = false;
    const xlog = eje.xscale === 'log', ylog = eje.yscale === 'log';
    // En un eje logarítmico los valores ≤ 0 no existen (matplotlib los enmascara): no cuentan para el rango.
    const ex = (v: Num | undefined) => { if (finito(v) && (!xlog || v > 0)) { xmin = Math.min(xmin, v); xmax = Math.max(xmax, v); } };
    const ey = (v: Num | undefined) => { if (finito(v) && (!ylog || v > 0)) { ymin = Math.min(ymin, v); ymax = Math.max(ymax, v); } };
    for (const s of eje.series) {
        switch (s.tipo) {
            case 'linea': case 'dispersion': s.x.forEach(ex); s.y.forEach(ey); break;
            case 'barras': hayBarras = true; s.x.forEach(v => { if (finito(v)) { ex(v - s.ancho / 2); ex(v + s.ancho / 2); } }); if (s.base) { s.base.forEach(ey); s.alto.forEach((h, i) => ey(finito(h) ? h + (s.base![i] ?? 0) : null)); } else s.alto.forEach(ey); ey(0); break;
            case 'area': s.x.forEach(ex); s.y1.forEach(ey); s.y2.forEach(ey); break;
            case 'vline': ex(s.pos); break;
            case 'hline': ey(s.pos); break;
            case 'banda_x': ex(s.desde); ex(s.hasta); break;
            case 'banda_y': ey(s.desde); ey(s.hasta); break;
            case 'texto': if (!s.ejes) { ex(s.x); ey(s.y); } break;
            case 'imagen': ex(s.extent[0]); ex(s.extent[1]); ey(s.extent[2]); ey(s.extent[3]); break;
        }
    }
    const margen = (lo: number, hi: number, log: boolean): [number, number] => {
        if (!Number.isFinite(lo)) return log ? [0.1, 10] : [0, 1];
        const [a, b] = log ? [Math.log10(lo), Math.log10(hi)] : [lo, hi];      // en una escala log el margen se aplica a los exponentes
        const [p, q] = a === b ? [a - 0.5, b + 0.5] : [a - (b - a) * 0.05, b + (b - a) * 0.05];
        return log ? [10 ** p, 10 ** q] : [p, q];
    };
    let [x0, x1] = margen(xmin, xmax, xlog);
    let [y0, y1] = margen(ymin, ymax, ylog);
    if (hayBarras && ymin >= 0 && !ylog) y0 = 0;
    // Como matplotlib: unas marcas fuera del rango de los datos amplían la vista hasta ellas.
    if (eje.xticks?.pos.length) { x0 = Math.min(x0, ...eje.xticks.pos); x1 = Math.max(x1, ...eje.xticks.pos); }
    if (eje.yticks?.pos.length) { y0 = Math.min(y0, ...eje.yticks.pos); y1 = Math.max(y1, ...eje.yticks.pos); }
    if (eje.xlim) { if (finito(eje.xlim[0])) x0 = eje.xlim[0]; if (finito(eje.xlim[1])) x1 = eje.xlim[1]; }
    if (eje.ylim) { if (finito(eje.ylim[0])) y0 = eje.ylim[0]; if (finito(eje.ylim[1])) y1 = eje.ylim[1]; }
    if (x0 === x1) { x0 = xlog ? x0 / 2 : x0 - 0.5; x1 = xlog ? x1 * 2 : x1 + 0.5; }
    if (y0 === y1) { y0 = ylog ? y0 / 2 : y0 - 0.5; y1 = ylog ? y1 * 2 : y1 + 0.5; }
    return { xmin: x0, xmax: x1, ymin: y0, ymax: y1 };
}

const numeroBonito = (x: number, redondear: boolean): number => {
    const exp = Math.floor(Math.log10(x));
    const f = x / Math.pow(10, exp);
    const nf = redondear ? (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) : (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10);
    return nf * Math.pow(10, exp);
};

/** Marcas "bonitas" (1, 2, 5 × 10^k) dentro de [min, max]. */
export function marcas(min: number, max: number, objetivo = 6): number[] {
    if (!(max > min)) return [min];
    const paso = numeroBonito(numeroBonito(max - min, false) / (objetivo - 1), true);
    const decimales = Math.max(0, -Math.floor(Math.log10(paso)) + 1);
    const out: number[] = [];
    for (let v = Math.ceil(min / paso - 1e-9) * paso; v <= max + paso * 1e-9; v += paso) out.push(Number(v.toFixed(Math.min(decimales, 12))));
    return out;
}

/** Separación entre marcas (la menor, por si no son uniformes): decide cuántos decimales se escriben. */
export const pasoDe = (pos: number[]): number =>
    pos.length > 1 ? Math.min(...pos.slice(1).map((v, i) => Math.abs(v - pos[i]))) || 1 : 1;

/** Cada cuántas marcas se escribe la etiqueta para que no se pisen: `anchos` = tamaño de cada etiqueta, `separacion` = píxeles entre marcas contiguas. */
export const cadaCuantas = (anchos: number[], separacion: number, hueco = 8): number =>
    separacion > 0 && anchos.length > 1 ? Math.max(1, Math.ceil((Math.max(...anchos) + hueco) / separacion)) : 1;

const SUPERINDICES: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };

/** Marcas de una escala logarítmica: una por década (10⁻², 10⁻¹, 1, 10...). Con menos de dos décadas en la vista se usan las lineales. */
export function marcasLog(min: number, max: number, objetivo = 6): { pos: number[]; labels: string[] | null } {
    const k0 = Math.ceil(Math.log10(min) - 1e-9), k1 = Math.floor(Math.log10(max) + 1e-9);
    if (!(min > 0) || k1 - k0 < 1) return { pos: marcas(min, max, objetivo), labels: null };
    const paso = Math.max(1, Math.ceil((k1 - k0 + 1) / objetivo));             // con muchas décadas, una de cada `paso`
    const pos: number[] = [], labels: string[] = [];
    for (let k = k0; k <= k1; k += paso) { pos.push(10 ** k); labels.push(k === 0 ? '1' : '10' + [...String(k)].map(c => SUPERINDICES[c]).join('')); }
    return { pos, labels };
}

/** Marcas de un eje dentro de [min, max]: las del laboratorio si las fijó (con sus etiquetas) o las automáticas. */
export function marcasDe(fijas: Marcas | null | undefined, min: number, max: number, objetivo: number, log = false): { pos: number[]; labels: string[] | null } {
    if (min > max) [min, max] = [max, min];     // eje invertido (imshow con origen arriba, o ylim(5, 0)): las marcas son las mismas
    if (!fijas?.pos.length) return log ? marcasLog(min, max, objetivo) : { pos: marcas(min, max, objetivo), labels: null };
    const eps = (max - min) * 1e-9;
    const dentro = fijas.pos.flatMap((p, i) => (p >= min - eps && p <= max + eps ? [i] : []));
    return { pos: dentro.map(i => fijas.pos[i]), labels: fijas.labels ? dentro.map(i => fijas.labels![i]) : null };
}

/** SHA-256 en hexadecimal: identifica el código de un laboratorio para recordar que el usuario ya lo aprobó. */
export async function sha256Hex(texto: string): Promise<string> {
    const bytes = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
    return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}

const CLAVE_APROBADOS = 'alejandria.labsAprobados';
const MAX_APROBADOS = 500;

// localStorage puede faltar o fallar (modo privado, datos bloqueados): sin él, simplemente se pregunta cada vez.
export function laboratorioAprobado(hash: string): boolean {
    try { return (JSON.parse(localStorage.getItem(CLAVE_APROBADOS) ?? '[]') as string[]).includes(hash); } catch { return false; }
}

export function aprobarLaboratorio(hash: string): void {
    try {
        const lista = (JSON.parse(localStorage.getItem(CLAVE_APROBADOS) ?? '[]') as string[]).filter(h => h !== hash);
        localStorage.setItem(CLAVE_APROBADOS, JSON.stringify([...lista, hash].slice(-MAX_APROBADOS)));
    } catch { /* sin almacenamiento: se volverá a preguntar */ }
}

/** Número para el tooltip: 4 cifras significativas, sin ceros de relleno. */
export const formatoValor = (v: number): string => String(Number(v.toPrecision(4)));

export interface Punto { x: number; y: number; texto: string }

/** Puntos "tocables" de un eje (vértices de líneas y puntos, y la cima de cada barra), con el texto del tooltip. */
export function puntosDe(eje: Eje): Punto[] {
    const out: Punto[] = [];
    const nombreX = (x: number) => eje.categorias[Math.round(x)] ?? formatoValor(x);
    for (const s of eje.series) {
        const pre = 'label' in s && s.label && !s.label.startsWith('_') ? `${textoPlano(s.label)}: ` : '';
        if (s.tipo === 'linea' || s.tipo === 'dispersion') {
            s.x.forEach((x, i) => { const y = s.y[i]; if (finito(x) && finito(y)) out.push({ x, y, texto: `${pre}x=${formatoValor(x)}, y=${formatoValor(y)}` }); });
        } else if (s.tipo === 'barras') {
            s.x.forEach((x, i) => { const y = s.alto[i]; if (finito(x) && finito(y)) out.push({ x, y, texto: `${pre}${nombreX(x)}: ${formatoValor(y)}` }); });
        }
    }
    return out;
}

/** El punto más cercano al cursor (en píxeles) si está a menos de `radio`; `aPx` pasa datos -> píxeles. */
export function puntoCercano(puntos: Punto[], cx: number, cy: number, aPx: (x: number, y: number) => [number, number], radio = 24): Punto | null {
    let mejor: Punto | null = null, mejorD = radio * radio;
    for (const p of puntos) {
        const [px, py] = aPx(p.x, p.y);
        const d = (px - cx) ** 2 + (py - cy) ** 2;
        if (d <= mejorD) { mejor = p; mejorD = d; }
    }
    return mejor;
}

export function formatoMarca(v: number, paso: number): string {
    if (v === 0) return '0';
    const abs = Math.abs(v);
    if (abs >= 1e6 || abs < 1e-4) return v.toExponential(1).replace('e+', 'e');
    const dec = Math.max(0, Math.min(8, -Math.floor(Math.log10(paso || 1))));
    return v.toFixed(dec);
}
