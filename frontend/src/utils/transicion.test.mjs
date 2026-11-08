import test from 'node:test';
import assert from 'node:assert/strict';
import { DURACION_MS, FASE_MAX, avance, duracion, hornearEscalares, hornearPosiciones, posicionEnCurso, suave } from './transicion.ts';

test('suave y avance: empiezan en 0, llegan a 1 y son monótonos', () => {
    assert.equal(suave(0), 0);
    assert.equal(suave(1), 1);
    let previo = -1;
    for (let t = 0; t <= 1.0001; t += 0.01) { const v = avance(t, 0.2); assert.ok(v >= previo - 1e-12); previo = v; }
    assert.equal(avance(0, 0.5), 0);
    assert.equal(avance(1, 1), 1);                                     // incluso la más retrasada llega a tiempo
    assert.ok(avance(0.3, 0) > avance(0.3, 0.9));                      // la que sale antes va por delante
    assert.ok(FASE_MAX < 1);
});

test('posicionEnCurso: sale de donde estaba, llega adonde va y el desvío en arco solo se nota a mitad de camino', () => {
    assert.equal(posicionEnCurso(2, 10, 5, 0), 2);
    assert.ok(Math.abs(posicionEnCurso(2, 10, 5, 1) - 10) < 1e-9);
    assert.ok(Math.abs(posicionEnCurso(2, 10, 5, 0.5) - (6 + 5)) < 1e-9);
});

test('hornear a mitad de transición da lo mismo que se vería, y vuelve al origen o al destino en los extremos', () => {
    const ant = new Float32Array([0, 0, 0, 10, 0, 0]), dest = new Float32Array([4, 4, 4, 10, 10, 0]);
    const arco = new Float32Array([1, 0, 0, 0, 0, 2, 0, 0.5]);
    assert.deepEqual([...hornearPosiciones(ant, dest, arco, 0)], [0, 0, 0, 10, 0, 0]);
    const fin = hornearPosiciones(ant, dest, arco, 1);
    assert.ok([...fin].every((v, i) => Math.abs(v - dest[i]) < 1e-5), [...fin].join());
    const medio = hornearPosiciones(ant, dest, arco, 0.5);
    const e0 = avance(0.5, 0), e1 = avance(0.5, 0.5);
    assert.ok(Math.abs(medio[0] - posicionEnCurso(0, 4, 1, e0)) < 1e-5);
    assert.ok(Math.abs(medio[4] - posicionEnCurso(0, 10, 2, e1)) < 1e-5);
    const vis = hornearEscalares(new Float32Array([1, 0]), new Float32Array([0, 1]), arco, 0.5);
    assert.ok(vis[0] > 0 && vis[0] < 1 && vis[1] > 0 && vis[1] < 1);
});

test('duracion: instantánea si el sistema pide reducir animaciones', () => {
    assert.equal(duracion(true), 0);
    assert.equal(duracion(false), DURACION_MS);
});
