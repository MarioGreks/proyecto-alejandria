import test from 'node:test';
import assert from 'node:assert/strict';
import { aplicarRevision, erroresEditor, formDesdeNeurona, formParaGuardar, hayCambios, normalizarTipo, normalizarVeredicto } from './neurona.ts';
import { errorDe } from './errorApi.ts';

const API = {
    id: 'bayes', nombre: 'Teorema de Bayes', cluster: 'Estadística', tipo: 'formal', teoria: 'P(A|B)=...',
    glosario: [{ termino: 'Prior', definicion: 'Probabilidad previa' }],
    ejercicios: [{ enunciado: 'Calcula', solucion: '0.5' }],
    referencias: [{ titulo: 'An Essay', autores: 'Bayes (1763)', url: 'https://doi.org/x', nota: 'n' }, 'Una referencia suelta'],
    laboratorio: { codigo: 'print(1)', controles: [] },
};

test('el tipo se normaliza sin tildes ni mayúsculas y lo desconocido es null', () => {
    assert.equal(normalizarTipo('Histórico'), 'historico');
    assert.equal(normalizarTipo(' TEÓRICO '), 'teorico');
    assert.equal(normalizarTipo('formal'), 'formal');
    for (const raro of ['matematico', '', null, undefined, 3, ['formal']]) assert.equal(normalizarTipo(raro), null);
});

test('el formulario sale de la neurona: referencias sueltas pasan a objeto y lo que falta queda vacío', () => {
    const f = formDesdeNeurona(API);
    assert.equal(f.nombre, 'Teorema de Bayes');
    assert.deepEqual(f.referencias[1], { titulo: 'Una referencia suelta', autores: '', url: '', nota: '' });
    assert.equal('laboratorio' in f, false);                       // el laboratorio y el clúster no se editan aquí
    assert.deepEqual(formDesdeNeurona({}), { nombre: '', teoria: '', tipo: 'formal', glosario: [], ejercicios: [], referencias: [], sugerencias: [] });
    assert.equal(formDesdeNeurona({ glosario: 'no es lista', ejercicios: [null, 3] }).ejercicios.length, 2);   // datos rotos no tiran el editor
});

test('al guardar se descartan las filas vacías y se recortan nombre, título y enlace', () => {
    const f = { ...formDesdeNeurona(API), nombre: '  Bayes  ' };
    f.glosario.push({ termino: '  ', definicion: '' });
    f.ejercicios.push({ enunciado: '', solucion: '' });
    f.referencias.push({ titulo: '', autores: '', url: '', nota: '' }, { titulo: ' Con título ', autores: '', url: ' https://a.b ', nota: '' });
    const g = formParaGuardar(f);
    assert.equal(g.nombre, 'Bayes');
    assert.equal(g.glosario.length, 1);
    assert.equal(g.ejercicios.length, 1);
    assert.deepEqual(g.referencias.map(r => r.titulo), ['An Essay', 'Una referencia suelta', 'Con título']);
    assert.equal(g.referencias[2].url, 'https://a.b');
});

test('validación: nombre obligatorio, referencia con título y enlace solo http(s)', () => {
    const ok = formDesdeNeurona(API);
    assert.deepEqual(erroresEditor(ok), []);
    assert.deepEqual(erroresEditor({ ...ok, nombre: '   ' }), ['El nombre no puede estar vacío.']);
    const mal = { ...ok, referencias: [{ titulo: '', autores: '', url: 'javascript:alert(1)', nota: '' }] };
    assert.deepEqual(erroresEditor(mal), ['Referencia 1: falta el título.', 'Referencia 1: el enlace debe empezar por http:// o https://.']);
});

test('hayCambios detecta cualquier edición', () => {
    const a = formDesdeNeurona(API);
    assert.equal(hayCambios(a, formDesdeNeurona(API)), false);
    assert.equal(hayCambios(a, { ...a, teoria: a.teoria + ' ' }), true);
});

test('aplicar una revisión toma solo los campos del editor y avisa de lo que ignora', () => {
    const actual = formDesdeNeurona(API);
    const revisada = { id: 'bayes', cluster: 'Otro', tipo: 'Histórico', nombre: 'Bayes y el ensayo', teoria: 'nueva',
        glosario: [{ termino: 'a', definicion: 'b' }], ejercicios: [], referencias: [{ titulo: 'Corregida', autores: 'Bayes y Price (1763)' }],
        laboratorio: { codigo: 'rm -rf', controles: [] } };
    const { form, avisos } = aplicarRevision(actual, revisada, 'bayes');
    assert.equal(form.nombre, 'Bayes y el ensayo');
    assert.equal(form.tipo, 'historico');
    assert.deepEqual(form.referencias, [{ titulo: 'Corregida', autores: 'Bayes y Price (1763)', url: '', nota: '' }]);
    assert.deepEqual(form.ejercicios, []);                                      // una lista vacía SÍ cuenta: la IA quitó los ejercicios
    assert.equal(avisos.length, 1);
    assert.match(avisos[0], /«cluster», «laboratorio»/);
    assert.equal(actual.nombre, 'Teorema de Bayes');                            // no muta el formulario de partida
});

test('lo que falta o viene mal se deja como estaba y se avisa', () => {
    const actual = formDesdeNeurona(API);
    const { form, avisos } = aplicarRevision(actual, { nombre: '  ', teoria: 5, tipo: 'raro', glosario: 'x' }, 'bayes');
    assert.deepEqual(form, actual);
    const t = avisos.join('\n');
    for (const campo of ['nombre', 'teoria', 'tipo', 'glosario', 'ejercicios', 'referencias']) assert.match(t, new RegExp(`«${campo}»`));
});

test('un JSON de otra neurona o que no es una neurona se rechaza sin aplicar nada', () => {
    const actual = formDesdeNeurona(API);
    assert.throws(() => aplicarRevision(actual, { id: 'markov', nombre: 'X' }, 'bayes'), /de otra neurona/);
    for (const malo of [null, [], 'texto', 3]) assert.throws(() => aplicarRevision(actual, malo, 'bayes'), /no es una neurona/);
    assert.doesNotThrow(() => aplicarRevision(actual, { nombre: 'Sin id' }, 'bayes'));         // sin «id» se acepta: se toma como de esta neurona
});

const res = (status, cuerpo) => ({ status, json: async () => { if (cuerpo === undefined) throw new Error('sin cuerpo'); return cuerpo; } });

test('el mensaje de error del backend: texto, lista de validación de pydantic o respuesta sin cuerpo', async () => {
    assert.equal(await errorDe(res(404, { detail: 'Neurona no encontrada' })), 'Neurona no encontrada');
    assert.equal(await errorDe(res(422, { detail: [{ loc: ['body'], msg: 'Value error, Pon al menos un teléfono o un correo.' }] })), 'Pon al menos un teléfono o un correo.');
    assert.equal(await errorDe(res(422, { detail: [{ loc: ['body', 'nombre'], msg: 'String should have at least 1 character' }] })), 'nombre: String should have at least 1 character');
    assert.equal(await errorDe(res(500)), 'El servidor respondió 500');
    assert.equal(await errorDe(res(502, { detail: [] })), 'El servidor respondió 502');
});

test('las sugerencias pegadas en una revisión se aplican; si no vienen se dejan como estaban sin avisar, y si vienen mal se avisa', () => {
    const actual = { ...formDesdeNeurona(API), sugerencias: [{ nombre: 'Vieja', motivo: 'm' }] };
    const base = { id: 'bayes', nombre: 'B', teoria: 't', glosario: [], ejercicios: [], referencias: [] };
    const con = aplicarRevision(actual, { ...base, sugerencias: [{ nombre: ' Inferencia bayesiana ', motivo: ' Aplicación ' }, 'Prior conjugada', { motivo: 'sin nombre' }, null] }, 'bayes');
    assert.deepEqual(con.form.sugerencias, [{ nombre: 'Inferencia bayesiana', motivo: 'Aplicación' }, { nombre: 'Prior conjugada', motivo: '' }]);
    assert.equal(con.avisos.length, 0);
    const sin = aplicarRevision(actual, base, 'bayes');
    assert.deepEqual(sin.form.sugerencias, actual.sugerencias);
    assert.equal(sin.avisos.length, 0);
    assert.deepEqual(aplicarRevision(actual, { ...base, sugerencias: [] }, 'bayes').form.sugerencias, []);       // lista vacía: la IA no propone nada
    const mal = aplicarRevision(actual, { ...base, sugerencias: 'texto' }, 'bayes');
    assert.deepEqual(mal.form.sugerencias, actual.sugerencias);
    assert.match(mal.avisos.join(), /«sugerencias»/);
    assert.equal(hayCambios(actual, con.form), true);
});

// --- Veredicto de la IA sobre las sinapsis ---
const ACTUALES = [
    { con: 'markov', nombre: 'Cadenas de Markov', estado: 'aceptada', motivo: 'm1' },
    { con: 'prior', nombre: 'Distribución a priori', estado: 'pendiente', motivo: 'm2' },
    { con: 'ruido', nombre: 'Ruido blanco', estado: 'rechazada', motivo: 'm3' },
];
const RED = [{ id: 'bayes', nombre: 'Teorema de Bayes' }, ...ACTUALES.map(s => ({ id: s.con, nombre: s.nombre })), { id: 'gompertz', nombre: 'Modelo de Gompertz' }];
const BASE = { id: 'bayes', nombre: 'B', teoria: 't', glosario: [], ejercicios: [], referencias: [] };
const rev = (extra) => aplicarRevision(formDesdeNeurona(API), { ...BASE, ...extra }, 'bayes', { actuales: ACTUALES, neuronas: RED });

test('los veredictos se leen con sinónimos, tildes y mayúsculas; lo desconocido es null', () => {
    for (const [v, esperado] of [['confirmar', 'confirmar'], ['Mantener', 'confirmar'], ['CUESTIÓNAR', 'cuestionar'], ['dudosa', 'cuestionar'], ['Quitar', 'quitar'], ['eliminar', 'quitar'], ['rechazar', 'quitar']])
        assert.equal(normalizarVeredicto(v), esperado, v);
    for (const malo of ['', 'quizás', 5, null, undefined]) assert.equal(normalizarVeredicto(malo), null);
});

test('el veredicto sobre las sinapsis se lee, por id o por nombre, y no toca el formulario', () => {
    const r = rev({ sinapsis: [{ con: 'markov', veredicto: 'confirmar', razon: ' Es su caso discreto ' }, { con: 'distribucion a priori', veredicto: 'Cuestionar', razon: 'Vaga' }, { con: 'ruido', veredicto: 'quitar' }],
        sinapsis_nuevas: [{ con: 'gompertz', motivo: 'Mortalidad' }] });
    assert.deepEqual(r.sinapsis.veredictos, [
        { con: 'markov', nombre: 'Cadenas de Markov', estado: 'aceptada', veredicto: 'confirmar', razon: 'Es su caso discreto' },
        { con: 'prior', nombre: 'Distribución a priori', estado: 'pendiente', veredicto: 'cuestionar', razon: 'Vaga' },
        { con: 'ruido', nombre: 'Ruido blanco', estado: 'rechazada', veredicto: 'quitar', razon: '' },
    ]);
    assert.deepEqual(r.sinapsis.nuevas, [{ con: 'gompertz', nombre: 'Modelo de Gompertz', motivo: 'Mortalidad' }]);
    assert.equal(r.avisos.length, 0);
    assert.equal(rev({ sinapsis: [], sinapsis_nuevas: [] }).form.nombre, 'B');
});

test('un veredicto imperfecto se ignora con aviso: ids inventados, veredictos raros, repetidos, a sí misma, ya conectadas y tipos de dato raros', () => {
    const r = rev({
        sinapsis: [{ con: 'inventada', veredicto: 'quitar' }, { con: 'markov', veredicto: 'quizás' }, { con: 'prior', veredicto: 'quitar', razon: 'a' }, { con: 'prior', veredicto: 'confirmar' }, null, { con: 5 }],
        sinapsis_nuevas: [{ con: 'bayes', motivo: 'sí misma' }, { con: 'markov', motivo: 'ya conectada' }, { con: 'nada' }, { con: 'gompertz' }, { con: 'gompertz', motivo: 'repetida' }],
    });
    assert.deepEqual(r.sinapsis.veredictos.map(v => [v.con, v.veredicto]), [['prior', 'quitar']]);
    assert.deepEqual(r.sinapsis.nuevas, [{ con: 'gompertz', nombre: 'Modelo de Gompertz', motivo: '' }]);
    const t = r.avisos.join('\n');
    for (const trozo of ['«inventada»', '«quizás»', 'repetida', '«bayes»', 'ya existe una conexión', '«nada»']) assert.match(t, new RegExp(trozo));
    const mal = rev({ sinapsis: 'texto', sinapsis_nuevas: 3 });
    assert.deepEqual(mal.sinapsis, { veredictos: [], nuevas: [] });
    assert.match(mal.avisos.join('\n'), /«sinapsis» no es una lista[\s\S]*«sinapsis_nuevas» no es una lista/);
});

test('sin la lista de conexiones, o si el JSON no trae veredicto, no hay propuestas ni avisos de más', () => {
    const sin = aplicarRevision(formDesdeNeurona(API), { ...BASE, sinapsis: [{ con: 'markov', veredicto: 'quitar' }] }, 'bayes');
    assert.deepEqual(sin.sinapsis, { veredictos: [], nuevas: [] });
    assert.equal(sin.avisos.length, 0);
    assert.deepEqual(rev({}).sinapsis, { veredictos: [], nuevas: [] });
    assert.equal(rev({}).avisos.length, 0);
});
