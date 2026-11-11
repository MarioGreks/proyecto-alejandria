import test from 'node:test';
import assert from 'node:assert/strict';
import { desplazamientosCluster, posicionesRecordadas } from './disposicion.ts';
import { reorganizarPosiciones } from './reorganizar.ts';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const ids = (n, p) => Array.from({ length: n }, (_, i) => `${p}_${i}`);

/** Un localStorage de pruebas (Node no lo trae). */
function conAlmacen(f) {
    const almacen = new Map();
    globalThis.localStorage = { getItem: k => (almacen.has(k) ? almacen.get(k) : null), setItem: (k, v) => almacen.set(k, String(v)), removeItem: k => almacen.delete(k) };
    try { return f(almacen); } finally { delete globalThis.localStorage; }
}

test('reorganizarPosiciones: las neuronas conectadas quedan más juntas que antes y todas se mueven de verdad', () => {
    conAlmacen(() => {
        const a = ids(40, 'a');
        const antes = posicionesRecordadas({ A: a });                        // la disposición de siempre (nube sin conexiones)
        const enlaces = a.slice(1).map((id, i) => [a[i], id]);               // una cadena: a_0 — a_1 — a_2 ...
        const nuevas = reorganizarPosiciones({ A: a }, enlaces);
        const largo = (p) => enlaces.reduce((s, [x, y]) => s + dist(p[x], p[y]), 0) / enlaces.length;
        assert.ok(largo(nuevas) < largo(antes) * 0.7, `conectadas: ${largo(nuevas).toFixed(1)} frente a ${largo(antes).toFixed(1)}`);
        const quietas = a.filter(id => dist(nuevas[id], antes[id]) < 1e-9);
        assert.ok(quietas.length <= 1, `${quietas.length} neuronas se han quedado donde estaban`);
    });
});

test('reorganizarPosiciones es determinista: mismas neuronas y conexiones, mismo resultado (da igual el orden o el ordenador)', () => {
    const clusters = { A: ids(30, 'a'), B: ids(12, 'b') };
    const enlaces = [['a_1', 'a_2'], ['a_2', 'a_9'], ['b_0', 'b_5'], ['a_3', 'b_3']];
    const x = conAlmacen(() => reorganizarPosiciones(clusters, enlaces));
    const y = conAlmacen(() => reorganizarPosiciones({ B: [...clusters.B].reverse(), A: [...clusters.A].reverse() }, [...enlaces].reverse().map(([p, q]) => [q, p])));
    assert.deepEqual(y, x);
});

test('reorganizarPosiciones: lo calculado queda recordado (no salta al recargar) y lo que ya no existe se olvida', () => {
    conAlmacen(() => {
        const nuevas = reorganizarPosiciones({ A: ids(10, 'a') }, [['a_0', 'a_1']]);
        assert.deepEqual(posicionesRecordadas({ A: ids(10, 'a') }), nuevas);              // lo que se recuerda es lo nuevo
    });
    conAlmacen(() => {
        posicionesRecordadas({ A: [...ids(5, 'a'), 'fantasma'] });
        reorganizarPosiciones({ A: ids(5, 'a') }, []);
        assert.ok(!('fantasma' in JSON.parse(globalThis.localStorage.getItem('alejandria.posicionesNeuronas'))));
    });
});

test('reorganizarPosiciones: las conexiones entre clústeres no mueven nada, las neuronas sueltas se colocan y la nube no se aprieta de más', () => {
    conAlmacen(() => {
        const clusters = { A: ids(25, 'a'), B: ids(25, 'b') };
        const sin = reorganizarPosiciones(clusters, []);
        const entre = reorganizarPosiciones(clusters, ids(25, 'a').map((id, i) => [id, `b_${i}`]));
        assert.deepEqual(entre, sin);                                                    // solo cuentan las conexiones dentro del clúster
        for (const c of ['a', 'b']) {
            const p = ids(25, c).map(id => sin[id]);
            let minima = Infinity;
            for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) minima = Math.min(minima, dist(p[i], p[j]));
            assert.ok(minima > 1, `distancia mínima ${minima.toFixed(2)}`);              // ninguna encima de otra
        }
    });
});

test('reorganizarPosiciones: casos límite (clúster de una neurona, sin neuronas, conexión a una neurona que no existe)', () => {
    conAlmacen(() => {
        const r = reorganizarPosiciones({ Solo: ['x'], Vacio: [] }, [['x', 'no_existe'], ['x', 'x']]);
        assert.deepEqual(Object.keys(r), ['x']);
        assert.equal(r.x.length, 3);
        assert.ok(r.x.every(Number.isFinite));
    });
    reorganizarPosiciones({ A: ['a'] }, []);                                              // sin almacenamiento tampoco falla
});

test('reorganizarPosiciones: 1000 neuronas en un clúster, con conexiones, se colocan en tiempo razonable', () => {
    conAlmacen(() => {
        const a = ids(1000, 'a');
        const t = performance.now();
        reorganizarPosiciones({ A: a }, a.slice(1).map((id, i) => [a[i], id]));
        assert.ok(performance.now() - t < 10000, `tardó ${Math.round(performance.now() - t)} ms`);
    });
});
