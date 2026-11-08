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

// ---------------------------------------------------------------------------------------------------------------------------
// Sinapsis (conexiones) en la revisión: la IA externa da un veredicto sobre cada una y propone conexiones nuevas. Nada se aplica solo: la interfaz enseña
// cada propuesta y el usuario decide (cada una se aplica con los endpoints de aristas de siempre, no con «Guardar»).
export type Veredicto = 'confirmar' | 'cuestionar' | 'quitar';
export interface SinapsisActual { con: string; nombre: string; estado: string; motivo: string }       // GET /api/node/{id}/sinapsis
export interface VecinaPosible { id: string; nombre: string }
export interface VeredictoSinapsis { con: string; nombre: string; estado: string; veredicto: Veredicto; razon: string }
export interface SinapsisNueva { con: string; nombre: string; motivo: string }
export interface RevisionSinapsis { veredictos: VeredictoSinapsis[]; nuevas: SinapsisNueva[] }

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
/** «Quitar», «eliminar», «mantener», «dudosa»... → el veredicto; cualquier otra cosa → null. Las IA no siempre usan la palabra exacta. */
export function normalizarVeredicto(v: unknown): Veredicto | null {
    if (typeof v !== 'string') return null;
    const s = sinTildes(v);
    if (/^(confirm|manten|conserv|valid|acept|correct|ok)/.test(s)) return 'confirmar';
    if (/^(cuestion|dud|revis|discut|debil)/.test(s)) return 'cuestionar';
    if (/^(quit|elimin|borr|rechaz|descart|retir|remove|delete)/.test(s)) return 'quitar';
    return null;
}

/** Acepta el id o el nombre (sin tildes ni mayúsculas) de una neurona; null si no es ninguna de las dadas. */
const resolver = (con: unknown, posibles: VecinaPosible[]): VecinaPosible | null => {
    if (typeof con !== 'string' || !con.trim()) return null;
    const c = con.trim();
    return posibles.find(p => p.id === c) ?? posibles.find(p => sinTildes(p.nombre) === sinTildes(c)) ?? null;
};

/** Lee `sinapsis` y `sinapsis_nuevas` del JSON revisado. Lo que no case con una conexión real se ignora y se avisa. */
export function leerSinapsis(d: Record<string, unknown>, actuales: SinapsisActual[], neuronas: VecinaPosible[], propio: string): { revision: RevisionSinapsis; avisos: string[] } {
    const avisos: string[] = [];
    const revision: RevisionSinapsis = { veredictos: [], nuevas: [] };
    const vistas = new Set<string>();
    if (d.sinapsis !== undefined && !Array.isArray(d.sinapsis)) avisos.push('«sinapsis» no es una lista: se ignora.');
    for (const [i, v] of (Array.isArray(d.sinapsis) ? d.sinapsis : []).entries()) {
        const a = resolver((v as any)?.con, actuales.map(s => ({ id: s.con, nombre: s.nombre })));
        const actual = a && actuales.find(s => s.con === a.id);
        const veredicto = normalizarVeredicto((v as any)?.veredicto);
        if (!actual) avisos.push(`Sinapsis ${i + 1}: «${String((v as any)?.con ?? '')}» no es una conexión de esta neurona: se ignora.`);
        else if (!veredicto) avisos.push(`Sinapsis con «${actual.nombre}»: el veredicto «${String((v as any)?.veredicto ?? '')}» no es confirmar, cuestionar ni quitar: se ignora.`);
        else if (vistas.has(actual.con)) avisos.push(`Sinapsis con «${actual.nombre}»: viene repetida, se queda con la primera.`);
        else { vistas.add(actual.con); revision.veredictos.push({ con: actual.con, nombre: actual.nombre, estado: actual.estado, veredicto, razon: texto((v as any)?.razon).trim() }); }
    }
    if (d.sinapsis_nuevas !== undefined && !Array.isArray(d.sinapsis_nuevas)) avisos.push('«sinapsis_nuevas» no es una lista: se ignora.');
    const conectadas = new Set(actuales.map(s => s.con));
    for (const [i, n] of (Array.isArray(d.sinapsis_nuevas) ? d.sinapsis_nuevas : []).entries()) {
        const vecina = resolver((n as any)?.con, neuronas.filter(x => x.id !== propio));
        if (!vecina) avisos.push(`Conexión nueva ${i + 1}: «${String((n as any)?.con ?? '')}» no es una neurona de tu red: se ignora.`);
        else if (conectadas.has(vecina.id)) avisos.push(`Conexión nueva con «${vecina.nombre}»: ya existe una conexión con ella (aceptada, pendiente o rechazada): se ignora.`);
        else { conectadas.add(vecina.id); revision.nuevas.push({ con: vecina.id, nombre: vecina.nombre, motivo: texto((n as any)?.motivo ?? (n as any)?.razon).trim() }); }
    }
    return { revision, avisos };
}

/**
 * Aplica sobre el formulario actual el JSON que una IA externa devolvió tras «Pedir revisión». Solo toma nombre, teoría, glosario, ejercicios, referencias y
 * tipo; lo que falte o venga con un tipo de dato raro se queda como estaba (y se avisa). Lanza Error si el JSON es de otra neurona o no es una neurona.
 * No guarda nada: el usuario ve el resultado en el editor y decide.
 */
export function aplicarRevision(actual: NeuronaForm, datos: unknown, idEsperado: string, sinapsis?: { actuales: SinapsisActual[]; neuronas: VecinaPosible[] }): { form: NeuronaForm; avisos: string[]; sinapsis: RevisionSinapsis } {
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
    // Sin la lista de conexiones de la neurona (el prompt no las llevó) no hay con qué cotejar: se ignoran en silencio, como cualquier campo ajeno.
    const { revision, avisos: avisosSinapsis } = sinapsis ? leerSinapsis(d, sinapsis.actuales, sinapsis.neuronas, idEsperado) : { revision: { veredictos: [], nuevas: [] }, avisos: [] };
    return { form, avisos: [...avisos, ...avisosSinapsis], sinapsis: revision };
}
