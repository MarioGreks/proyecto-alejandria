import test from 'node:test';
import assert from 'node:assert/strict';
import { LARGO_RESORTE, disponerSubred, encuadre } from './distribucionSubred.ts';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
// dos grupos densos (A y B) unidos por una sola conexión, más dos neuronas sueltas
const grupo = (p, n) => Array.from({ length: n }, (_, i) => `${p}${i}`);
const A = grupo('a', 8), B = grupo('b', 8);
const ids = [...A, ...B, 'suelta1', 'suelta2'];
const aristas = [];
for (const G of [A, B]) for (let i = 0; i < G.length; i++) for (let j = i + 1; j < G.length; j++) if ((i + j) % 2 === 0 || j === i + 1) aristas.push([G[i], G[j]]);
aristas.push(['a0', 'b0']);

test('es determinista: los mismos ids y conexiones dan siempre las mismas posiciones, en cualquier orden de entrada', () => {
    const x = disponerSubred(ids, aristas), y = disponerSubred([...ids].reverse(), [...aristas].reverse());
    for (const id of ids) assert.deepEqual(x[id], y[id], id);
});

test('lo conectado queda junto: la distancia media entre conectadas es menor que entre las que no lo están', () => {
    const p = disponerSubred(ids, aristas);
    const con = new Set(aristas.map(([a, b]) => `${a}|${b}`));
    let sc = 0, nc = 0, ss = 0, ns = 0;
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
        const d = dist(p[ids[i]], p[ids[j]]);
        if (con.has(`${ids[i]}|${ids[j]}`) || con.has(`${ids[j]}|${ids[i]}`)) { sc += d; nc++; } else { ss += d; ns++; }
    }
    assert.ok(sc / nc < ss / ns * 0.7, `conectadas ${sc / nc} vs no conectadas ${ss / ns}`);
    // los dos grupos se separan: cada neurona de A está más cerca de su grupo que de B
    const centro = G => G.reduce((c, id) => c.map((v, k) => v + p[id][k] / G.length), [0, 0, 0]);
    const ca = centro(A), cb = centro(B);
    for (const id of A.slice(1)) assert.ok(dist(p[id], ca) < dist(p[id], cb), id);
});

test('ninguna neurona queda encima de otra y el resultado está centrado y es compacto', () => {
    const p = disponerSubred(ids, aristas);
    let minima = Infinity;
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) minima = Math.min(minima, dist(p[ids[i]], p[ids[j]]));
    assert.ok(minima > LARGO_RESORTE * 0.2, `distancia mínima ${minima}`);
    const { centro, radio } = encuadre(ids.map(id => p[id]));
    assert.ok(Math.hypot(...centro) < 1e-6);
    assert.ok(radio < LARGO_RESORTE * 8, `radio ${radio}`);
});

test('con previas no se mueve nada de lo recordado y una neurona nueva se coloca junto a su vecina', () => {
    const base = disponerSubred(ids, aristas);
    const mas = [...ids, 'nueva'];
    const p = disponerSubred(mas, [...aristas, ['nueva', 'b3']], base);
    for (const id of ids) assert.deepEqual(p[id], base[id], id);                       // las que ya estaban, exactamente donde estaban
    assert.ok(dist(p.nueva, p.b3) < LARGO_RESORTE * 3, `nueva a ${dist(p.nueva, p.b3)} de su vecina`);
    assert.deepEqual(disponerSubred(ids, aristas, base), base);                       // todo recordado: se devuelve tal cual
});

test('casos límite: vacío, una sola neurona, conexiones a ids ajenos o repetidas y previas inválidas', () => {
    assert.deepEqual(disponerSubred([], []), {});
    assert.deepEqual(disponerSubred(['x'], []), { x: [0, 0, 0] });
    const p = disponerSubred(['x', 'y'], [['x', 'y'], ['y', 'x'], ['x', 'x'], ['x', 'fuera']], { x: [NaN, 0, 0], y: 'mal' });
    assert.ok(Object.values(p).every(v => v.every(Number.isFinite)));
    assert.ok(dist(p.x, p.y) > LARGO_RESORTE * 0.6 && dist(p.x, p.y) < LARGO_RESORTE * 1.7, `x-y ${dist(p.x, p.y)}`);
    assert.deepEqual(encuadre([]), { centro: [0, 0, 0], radio: 0 });
});

test('2000 neuronas se colocan en un tiempo razonable (se calcula fuera del hilo principal)', () => {
    const muchas = Array.from({ length: 2000 }, (_, i) => `n${i}`);
    const ar = muchas.flatMap((id, i) => (i ? [[id, `n${Math.floor((i - 1) / 2)}`], ...(i % 5 === 0 ? [[id, `n${(i * 7) % i}`]] : [])] : []));
    const t = Date.now();
    const p = disponerSubred(muchas, ar);
    const ms = Date.now() - t;
    assert.equal(Object.keys(p).length, 2000);
    assert.ok(ms < 8000, `${ms} ms`);
    console.log(`  2000 neuronas: ${ms} ms`);
});
