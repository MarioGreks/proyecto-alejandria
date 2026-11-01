import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptarResultado, esJsonXY } from './adaptar.ts';

test('adaptarResultado: figuras para el canvas y la consola como salida de texto', () => {
    const r = adaptarResultado({ modo: 'datos', figuras: [{ tam: [6, 4], ejes: [] }], stdout: 'hola\n' });
    assert.deepEqual(r, { modo: 'datos', figuras: [{ tam: [6, 4], ejes: [] }], outputs: [{ type: 'stdout', content: 'hola\n' }] });
    assert.deepEqual(adaptarResultado({ modo: 'datos', figuras: [], stdout: '' }).outputs, []);   // sin consola, sin salida
});

test('adaptarResultado: el respaldo de matplotlib da imágenes PNG y, si falla, el traceback como error', () => {
    const ok = adaptarResultado({ modo: 'imagen', motivo: 'ax.contour', imagenes: ['AAA', 'BBB'], stdout: 'lambda = 1' });
    assert.equal(ok.modo, 'imagen');
    assert.deepEqual(ok.figuras, []);
    assert.deepEqual(ok.outputs, [{ type: 'stdout', content: 'lambda = 1' }, { type: 'image/png', content: 'AAA' }, { type: 'image/png', content: 'BBB' }]);
    const mal = adaptarResultado({ modo: 'imagen', motivo: 'x', error: 'Traceback...\nZeroDivisionError', stdout: '' });
    assert.deepEqual(mal.outputs, [{ type: 'error', content: 'Traceback...\nZeroDivisionError' }]);
});

test('esJsonXY: oculta el JSON {x, y} que imprimían los laboratorios antiguos y nada más', () => {
    assert.equal(esJsonXY({ type: 'stdout', content: '{"x": [1, 2], "y": [3, 4]}\n' }), true);
    assert.equal(esJsonXY({ type: 'stdout', content: '{"otra": 1}' }), false);
    assert.equal(esJsonXY({ type: 'stdout', content: 'Multiplicadores lambda = [0.25 1.]' }), false);
    assert.equal(esJsonXY({ type: 'error', content: '{"x": 1, "y": 2}' }), false);
});
