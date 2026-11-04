import test from 'node:test';
import assert from 'node:assert/strict';
import { limpiarCitas } from './citas.ts';

test('limpiarCitas quita las marcas de cita de DeepSeek, ChatGPT y Gemini', () => {
    assert.equal(limpiarCitas('fórmula de Stirling[reference:25]. Karl Pearson'), 'fórmula de Stirling. Karl Pearson');
    assert.equal(limpiarCitas('respectivamente[reference:34][reference:35]. Sin'), 'respectivamente. Sin');
    assert.equal(limpiarCitas('texto [ref 3] y más [ref:4, 5]'), 'texto y más');
    assert.equal(limpiarCitas('[cite_start]Hola [cite: 1, 2].'), 'Hola.');
    assert.equal(limpiarCitas('dato :contentReference[oaicite:0]{index=0} fin'), 'dato fin');
    assert.equal(limpiarCitas('dato【4†fuente】 fin'), 'dato fin');
    assert.equal(limpiarCitas('aciteturn0search3 b'), 'a b');
});

test('limpiarCitas no toca LaTeX, enlaces ni corchetes normales', () => {
    const intactos = [
        'Véase [ref](https://doi.org/10.1/x).',
        'El intervalo [a, b] y el vector [1, 2, 3].',
        'La matriz $A[i,j]$ y la referencia [Laplace 1812].',
        'Párrafo uno.\n\nPárrafo dos.',
    ];
    for (const t of intactos) assert.equal(limpiarCitas(t), t);
    assert.equal(limpiarCitas(''), '');
});
