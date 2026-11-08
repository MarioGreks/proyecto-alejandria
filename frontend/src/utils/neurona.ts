// Lógica pura del editor de neuronas (sin React ni red): formulario, validación y aplicación de una revisión pegada. El backend (main.py: NeuronaEditar) vuelve
// a validar todo; aquí solo se evitan viajes inútiles y se avisa al usuario antes de guardar.

export type TipoNeurona = 'formal' | 'historico' | 'teorico';

export const TIPOS_NEURONA: { id: TipoNeurona; etiqueta: string; sigla: string; ayuda: string }[] = [
    { id: 'formal', etiqueta: 'Formal', sigla: 'F', ayuda: 'Concepto matemático: teoría con desarrollo formal, ejercicios y laboratorio.' },
    { id: 'historico', etiqueta: 'Histórico', sigla: 'H', ayuda: 'Persona, época, escuela o idea sin fórmula propia: relato documentado.' },
    { id: 'teorico', etiqueta: 'Teórico', sigla: 'T', ayuda: 'Marco conceptual o argumental sin formalismo: teoría argumentada y casos de análisis.' },
];

export interface ReferenciaForm { titulo: string; autores: string; url: string; nota: string }
export interface SugerenciaForm { nombre: string; motivo: string }
export interface NeuronaForm {
    nombre: string;
    teoria: string;
    tipo: TipoNeurona;
    glosario: { termino: string; definicion: string }[];
    ejercicios: { enunciado: string; solucion: string }[];
    referencias: ReferenciaForm[];
    sugerencias: SugerenciaForm[];      // temas relacionados sugeridos (los que no se descartaron); se editan pegando una revisión
}

/** «histórico», «Historico », «TEÓRICO»... → el tipo; cualquier otra cosa → null. */
export const normalizarTipo = (t: unknown): TipoNeurona | null => {
    if (typeof t !== 'string') return null;
    const s = t.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
    return s === 'formal' || s === 'historico' || s === 'teorico' ? s : null;
};

const texto = (v: unknown): string => (typeof v === 'string' ? v : '');
const lista = (v: unknown): any[] => (Array.isArray(v) ? v : []);
const referencia = (r: any): ReferenciaForm =>
    typeof r === 'string' ? { titulo: r, autores: '', url: '', nota: '' }          // las neuronas antiguas podían traer la referencia como texto suelto
        : { titulo: texto(r?.titulo), autores: texto(r?.autores), url: texto(r?.url), nota: texto(r?.nota) };

const sugerencia = (s: any): SugerenciaForm => (typeof s === 'string' ? { nombre: s.trim(), motivo: '' } : { nombre: texto(s?.nombre).trim(), motivo: texto(s?.motivo).trim() });
const sugerencias = (v: unknown): SugerenciaForm[] => lista(v).map(sugerencia).filter(s => s.nombre !== '');

/** Lo que devuelve GET /node/{id} → el formulario del editor. */
export function formDesdeNeurona(n: any): NeuronaForm {
    return {
        nombre: texto(n?.nombre),
        teoria: texto(n?.teoria),
        tipo: normalizarTipo(n?.tipo) ?? 'formal',
        glosario: lista(n?.glosario).map(g => ({ termino: texto(g?.termino), definicion: texto(g?.definicion) })),
        ejercicios: lista(n?.ejercicios).map(e => ({ enunciado: texto(e?.enunciado), solucion: texto(e?.solucion) })),
        referencias: lista(n?.referencias).map(referencia),
        sugerencias: sugerencias(n?.sugerencias),
    };
}

/** El formulario tal como se envía: sin filas completamente vacías (las que se añaden con «+» y no se rellenan). */
export function formParaGuardar(f: NeuronaForm): NeuronaForm {
    const t = (s: string) => s.trim() === '';
    return {
        ...f,
        nombre: f.nombre.trim(),
        glosario: f.glosario.filter(g => !(t(g.termino) && t(g.definicion))),
        ejercicios: f.ejercicios.filter(e => !(t(e.enunciado) && t(e.solucion))),
        referencias: f.referencias.map(r => ({ ...r, titulo: r.titulo.trim(), url: r.url.trim() })).filter(r => !(t(r.titulo) && t(r.autores) && t(r.url) && t(r.nota))),
    };
}

/** Errores que impiden guardar (los mismos que exige el backend). Vacío = se puede guardar. */
export function erroresEditor(f: NeuronaForm): string[] {
    const e: string[] = [];
    if (f.nombre.trim() === '') e.push('El nombre no puede estar vacío.');
    f.referencias.forEach((r, i) => {
        if (r.titulo.trim() === '') e.push(`Referencia ${i + 1}: falta el título.`);
        if (r.url.trim() !== '' && !/^https?:\/\//i.test(r.url.trim())) e.push(`Referencia ${i + 1}: el enlace debe empezar por http:// o https://.`);
    });
    return e;
}

export const hayCambios = (a: NeuronaForm, b: NeuronaForm): boolean => JSON.stringify(a) !== JSON.stringify(b);

// Campos del JSON de una neurona que el editor NO toca (tienen su propio editor o los gestiona la app).
const AJENOS = ['cluster', 'laboratorio', 'embedding', 'origen', 'motivo_clasificacion'];

/**
 * Aplica sobre el formulario actual el JSON que una IA externa devolvió tras «Pedir revisión». Solo toma nombre, teoría, glosario, ejercicios, referencias y
 * tipo; lo que falte o venga con un tipo de dato raro se queda como estaba (y se avisa). Lanza Error si el JSON es de otra neurona o no es una neurona.
 * No guarda nada: el usuario ve el resultado en el editor y decide.
 */
export function aplicarRevision(actual: NeuronaForm, datos: unknown, idEsperado: string): { form: NeuronaForm; avisos: string[] } {
    if (datos === null || typeof datos !== 'object' || Array.isArray(datos)) throw new Error('El JSON pegado no es una neurona (debe ser un objeto con campos).');
    const d = datos as Record<string, unknown>;
    if (typeof d.id === 'string' && d.id !== idEsperado) throw new Error(`El JSON es de otra neurona («${d.id}»), no de «${idEsperado}». No se ha aplicado nada.`);
    const form: NeuronaForm = { ...actual };
    const avisos: string[] = [];
    const falta = (campo: string, motivo = 'no viene') => avisos.push(`«${campo}» ${motivo}: se deja como estaba.`);

    if (typeof d.nombre === 'string' && d.nombre.trim()) form.nombre = d.nombre; else falta('nombre', d.nombre === undefined ? 'no viene' : 'no es un texto válido');
    if (typeof d.teoria === 'string') form.teoria = d.teoria; else falta('teoria', d.teoria === undefined ? 'no viene' : 'no es un texto');
    if (d.tipo !== undefined) {
        const t = normalizarTipo(d.tipo);
        if (t) form.tipo = t; else falta('tipo', 'no es formal, histórico ni teórico');
    }
    // Las sugerencias son opcionales (un prompt anterior a ellas no las trae): si faltan se dejan como estaban, sin avisar.
    if (Array.isArray(d.sugerencias)) form.sugerencias = sugerencias(d.sugerencias);
    else if (d.sugerencias !== undefined) falta('sugerencias', 'no es una lista');
    const campos = formDesdeNeurona({ glosario: d.glosario, ejercicios: d.ejercicios, referencias: d.referencias });
    for (const campo of ['glosario', 'ejercicios', 'referencias'] as const) {
        if (Array.isArray(d[campo])) (form as any)[campo] = campos[campo]; else falta(campo, d[campo] === undefined ? 'no viene' : 'no es una lista');
    }
    const ignorados = AJENOS.filter(k => d[k] !== undefined && !(k === 'laboratorio' && !d[k]));
    if (ignorados.length) avisos.push(`Se ignoran ${ignorados.map(k => `«${k}»`).join(', ')} (tienen su propio editor o los gestiona la app).`);
    return { form, avisos };
}
