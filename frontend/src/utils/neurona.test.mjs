import test from 'node:test';
import assert from 'node:assert/strict';
import { aplicarRevision, erroresEditor, formDesdeNeurona, formParaGuardar, hayCambios, normalizarTipo } from './neurona.ts';
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
    assert.deepEqual(formDesdeNeurona({}), { nombre: '', teoria: '', tipo: 'formal', glosario: [], ejercicios: [], referencias: [] });
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
