import test from 'node:test';
import assert from 'node:assert/strict';
import { estadoDe, mismoTema, palabrasClave, sugerenciasVisibles } from './sugerencias.ts';

const vivas = [
    { id: 'modelo_mortalidad_makeham', nombre: 'Modelo de mortalidad de Makeham', subredes: ['TFM'] },
    { id: 'modelo_mortalidad_gompertz', nombre: 'Modelo de mortalidad de Gompertz' },
    { id: 'calculo', nombre: 'Cálculo' },
    { id: 'bsm', nombre: 'Black–Scholes–Merton', subredes: ['TFM', 'Tesis'] },
    { id: 'numeros', nombre: 'Ley de los grandes números' },
];

test('palabrasClave: sin tildes, mayúsculas, palabras vacías ni plurales, y sin repetir', () => {
    assert.deepEqual(palabrasClave('Modelo de Gompertz'), ['gompertz']);
    assert.deepEqual(palabrasClave('  La Ley de los Grandes Números '), palabrasClave('ley grande numero'));
    assert.equal(palabrasClave('Black–Scholes–Merton').length, 3);
    assert.deepEqual(palabrasClave('Variaciones'), palabrasClave('variación'));
    assert.deepEqual(palabrasClave('Modelo de'), []);
});

test('mismoTema: «Modelo de Gompertz» es la neurona «Modelo de mortalidad de Gompertz», pero «Cálculo» no tapa «Cálculo de variaciones»', () => {
    assert.ok(mismoTema('Modelo de Gompertz', 'Modelo de mortalidad de Gompertz'));
    assert.ok(mismoTema('gompertz', 'Modelo de mortalidad de Gompertz'));
    assert.ok(mismoTema('Modelo de Black-Scholes', 'Black–Scholes–Merton'));
    assert.ok(mismoTema('Modelo de mortalidad de Gompertz', 'Gompertz–Makeham') === false, 'Gompertz–Makeham es otro modelo');
    assert.ok(!mismoTema('Cálculo de variaciones', 'Cálculo'), 'una sola palabra no basta para tapar un tema más específico');
    assert.ok(!mismoTema('Modelo de Makeham', 'Modelo de mortalidad de Gompertz'));
    assert.ok(!mismoTema('', 'Cálculo') && !mismoTema('Modelo', 'Modelo de Makeham'));
});

test('estadoDe: primero las neuronas vivas, luego la papelera, y si no, es nueva', () => {
    assert.deepEqual(estadoDe('Modelo de Gompertz', vivas, []), { tipo: 'existe', id: 'modelo_mortalidad_gompertz', nombre: 'Modelo de mortalidad de Gompertz' });
    assert.deepEqual(estadoDe('Lee-Carter', vivas, [{ id: 'lc', nombre: 'Modelo de Lee-Carter' }]), { tipo: 'papelera', id: 'lc', nombre: 'Modelo de Lee-Carter' });
    assert.deepEqual(estadoDe('Lee-Carter', vivas, []), { tipo: 'nueva' });
    assert.equal(estadoDe('Black-Scholes', vivas, [{ id: 'x', nombre: 'Black-Scholes' }]).tipo, 'existe', 'si está viva, la papelera no cuenta');
});

test('sugerenciasVisibles en la red general: lo que ya existe no se sugiere (el caso Makeham → Gompertz)', () => {
    const sugs = [{ nombre: 'Modelo de Gompertz', motivo: 'm' }, { nombre: 'Lee-Carter' }, { nombre: 'Dormoy' }];
    const v = sugerenciasVisibles(sugs, vivas, [], null);
    assert.deepEqual(v.map(x => x.sugerencia.nombre), ['Lee-Carter', 'Dormoy']);
    assert.ok(v.every(x => x.estado.tipo === 'nueva'));
    assert.deepEqual(sugerenciasVisibles([{ nombre: 'Gompertz' }], vivas, [], null), []);   // si no queda nada que sugerir, no sugiere nada
});

test('sugerenciasVisibles dentro de una subred: lo que existe pero no está en ella se ofrece añadir; lo que ya está, no', () => {
    const sugs = [{ nombre: 'Modelo de Gompertz' }, { nombre: 'Black-Scholes' }, { nombre: 'Nuevo tema' }];
    const v = sugerenciasVisibles(sugs, vivas, [], 'TFM');
    assert.deepEqual(v.map(x => [x.sugerencia.nombre, x.estado.tipo]), [['Modelo de Gompertz', 'existe'], ['Nuevo tema', 'nueva']]);   // Black-Scholes ya está en TFM
    assert.equal(sugerenciasVisibles([{ nombre: 'Black-Scholes' }], vivas, [], 'Otra').length, 1);
});

test('sugerenciasVisibles: la papelera se ofrece restaurar y los datos raros se ignoran', () => {
    const v = sugerenciasVisibles([{ nombre: 'Lee-Carter' }], vivas, [{ id: 'lc', nombre: 'Lee-Carter' }], null);
    assert.deepEqual(v.map(x => x.estado), [{ tipo: 'papelera', id: 'lc', nombre: 'Lee-Carter' }]);
    assert.deepEqual(sugerenciasVisibles([null, { nombre: 3 }, { nombre: '  ' }, 'texto'], vivas, [], null), []);
    assert.deepEqual(sugerenciasVisibles(undefined, vivas, [], null), []);
});
