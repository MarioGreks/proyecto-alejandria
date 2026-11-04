import test from 'node:test';
import assert from 'node:assert/strict';
import { esMayor, hayQueAvisarDeActualizado } from './versiones.ts';

test('esMayor compara número a número, no como texto', () => {
    assert.ok(esMayor('0.2.10', '0.2.9'));
    assert.ok(esMayor('0.10.0', '0.9.9'));
    assert.ok(esMayor('1.0', '0.9.9'));
    assert.ok(!esMayor('0.2.1', '0.2.1'));
    assert.ok(!esMayor('0.2.0', '0.2.1'));
    assert.ok(esMayor('0.2.1.1', '0.2.1'));
});

test('«Actualizado a la versión X» solo si ya se había abierto antes con una versión anterior', () => {
    assert.equal(hayQueAvisarDeActualizado(null, '0.2.1'), false);          // primera vez: nada que contar
    assert.equal(hayQueAvisarDeActualizado('0.2.1', '0.2.1'), false);       // misma versión
    assert.equal(hayQueAvisarDeActualizado('0.2.0', '0.2.1'), true);        // se actualizó
    assert.equal(hayQueAvisarDeActualizado('0.2.2', '0.2.1'), false);       // instalaron una anterior a mano: no es una actualización
});
