import test from 'node:test';
import assert from 'node:assert/strict';
import { colorSubred, esMiembro, listarSubredes, mismaSubred, normalizarNombre, vecinasDirectas } from './subredes.ts';

test('normalizarNombre: espacios de más fuera, máximo 60 caracteres, vacío si no es texto', () => {
    assert.equal(normalizarNombre('  Mi   Tesis '), 'Mi Tesis');
    assert.equal(normalizarNombre('x'.repeat(200)).length, 60);
    for (const malo of [undefined, null, 3, '', '   ', ['a']]) assert.equal(normalizarNombre(malo), '');
    assert.ok(mismaSubred('TFM', 'tfm') && !mismaSubred('TFM', 'Tesis'));
});

test('listarSubredes deduce la lista de las neuronas, cuenta, suma las vacías recordadas y no duplica por mayúsculas', () => {
    const nodos = [{ id: 'a', subredes: ['TFM', 'Tesis'] }, { id: 'b', subredes: ['tfm'] }, { id: 'c' }, { id: 'd', subredes: 'mal' }];
    assert.deepEqual(listarSubredes(nodos), [{ nombre: 'Tesis', neuronas: 1 }, { nombre: 'TFM', neuronas: 2 }]);
    assert.deepEqual(listarSubredes(nodos, ['Nueva', ' tfm ', '']).map(s => [s.nombre, s.neuronas]), [['Nueva', 0], ['Tesis', 1], ['TFM', 2]]);
    assert.deepEqual(listarSubredes([]), []);
});

test('esMiembro: sin subred activa (la general) todas cuentan; con ella, solo las etiquetadas, sin distinguir mayúsculas', () => {
    assert.ok(esMiembro({ id: 'a' }, null));
    assert.ok(esMiembro({ subredes: ['TFM'] }, 'tfm'));
    assert.ok(!esMiembro({ subredes: ['TFM'] }, 'Tesis') && !esMiembro({}, 'TFM') && !esMiembro({ subredes: 3 }, 'TFM'));
});

test('colorSubred: estable, válido, distinto para nombres distintos y sin distinguir mayúsculas', () => {
    assert.match(colorSubred('TFM'), /^#[0-9a-f]{6}$/);
    assert.equal(colorSubred('TFM'), colorSubred('tfm'));
    const colores = new Set(['TFM', 'Tesis', 'Trabajo x', 'Investigación y', 'Otra', 'Más'].map(colorSubred));
    assert.ok(colores.size >= 5, [...colores].join());
});

test('vecinasDirectas: las conectadas en cualquier sentido, sin repetir', () => {
    const ar = [{ origen_id: 'a', destino_id: 'b' }, { origen_id: 'c', destino_id: 'a' }, { origen_id: 'b', destino_id: 'a' }, { origen_id: 'x', destino_id: 'y' }];
    assert.deepEqual(vecinasDirectas('a', ar).sort(), ['b', 'c']);
    assert.deepEqual(vecinasDirectas('z', ar), []);
});
