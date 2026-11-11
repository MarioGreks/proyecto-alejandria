import test from 'node:test';
import assert from 'node:assert/strict';
import { DISTANCIA_MINIMA, asignarCasillas, centroDeCasilla, desplazamientosCluster, firmaUniverso, hashTexto, posicionNeurona, rngDe } from './disposicion.ts';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

test('rngDe: misma clave, misma secuencia; claves distintas, secuencias distintas', () => {
    const a = rngDe('x'), b = rngDe('x'), c = rngDe('y');
    const sa = [a(), a(), a()], sb = [b(), b(), b()], sc = [c(), c(), c()];
    assert.deepEqual(sa, sb);
    assert.notDeepEqual(sa, sc);
    assert.ok(sa.every(v => v >= 0 && v < 1));
    assert.equal(hashTexto('Estadística'), hashTexto('Estadística'));
});

test('una neurona tiene siempre la misma posición, sin importar cuántas haya ni en qué orden lleguen', () => {
    const centro = [5, -3, 2];
    assert.deepEqual(posicionNeurona('distribucion_poisson', centro), posicionNeurona('distribucion_poisson', centro));
    assert.notDeepEqual(posicionNeurona('distribucion_poisson', centro), posicionNeurona('distribucion_binomial', centro));
    assert.ok(dist(posicionNeurona('distribucion_poisson', centro), centro) <= 10 + 1e-9);   // dentro de la nube de su clúster
});

test('un clúster nuevo no mueve a los que ya estaban, y el orden de llegada no importa', () => {
    const antes = asignarCasillas(['Estadística', 'Finanzas', 'Matemáticas']);
    assert.deepEqual(asignarCasillas(['Matemáticas', 'Finanzas', 'Estadística']), antes);
    const despues = asignarCasillas(['Estadística', 'Finanzas', 'Matemáticas', 'Biometría y Demografía', 'Álgebra'], antes);
    for (const c of Object.keys(antes)) assert.equal(despues[c], antes[c]);
    assert.equal(new Set(Object.values(despues)).size, 5);                           // nunca dos en la misma casilla
});

test('el primero va al centro, los siguientes se reparten alrededor y las nubes no se solapan', () => {
    assert.deepEqual(centroDeCasilla(0), [0, 0, 0]);
    assert.ok(Math.abs(Math.hypot(...centroDeCasilla(1)) - 22) < 1e-9);
    assert.ok(dist(centroDeCasilla(1), centroDeCasilla(2)) > 40);                    // el segundo de la capa, casi en el lado opuesto
    const nombres = Array.from({ length: 30 }, (_, i) => `C${String(i).padStart(2, '0')}`);
    const cas = asignarCasillas(nombres);
    assert.deepEqual(Object.values(cas).sort((a, b) => a - b), Array.from({ length: 30 }, (_, i) => i));
    const centros = Object.values(cas).map(centroDeCasilla);
    let minima = Infinity;
    for (let i = 0; i < centros.length; i++) for (let j = i + 1; j < centros.length; j++) minima = Math.min(minima, dist(centros[i], centros[j]));
    assert.ok(minima > 14, `separación mínima ${minima}`);
});

test('una casilla recordada se respeta aunque otro clúster la prefiera por su nombre', () => {
    const cas = asignarCasillas(['B'], { B: 3 });
    assert.equal(cas.B, 3);
    const otra = asignarCasillas(['A', 'B'], { B: 3, A: 3 });                       // dato corrupto: dos con la misma casilla
    assert.notEqual(otra.A, otra.B);
});

test('firmaUniverso cambia con clúster o estado y no con el orden', () => {
    const n = [{ id: 'a', cluster_id: 'X', nombre: 'A' }, { id: 'b', cluster_id: 'Y', nombre: 'B' }];
    const l = [{ origen_id: 'a', destino_id: 'b', estado: 'pendiente' }];
    const f = firmaUniverso(n, l);
    assert.equal(firmaUniverso([...n].reverse(), l), f);
    assert.notEqual(firmaUniverso([{ ...n[0], cluster_id: 'Y' }, n[1]], l), f);
    assert.notEqual(firmaUniverso(n, [{ ...l[0], estado: 'aceptada' }]), f);
    assert.notEqual(firmaUniverso([{ ...n[0], subredes: ['TFM'] }, n[1]], l), f);                  // meter una neurona en una subred también repinta
    assert.equal(firmaUniverso([{ ...n[0], subredes: ['b', 'a'] }, n[1]], l), firmaUniverso([{ ...n[0], subredes: ['a', 'b'] }, n[1]], l));
});

const minimaEntre = (puntos) => {
    let m = Infinity;
    for (let i = 0; i < puntos.length; i++) for (let j = i + 1; j < puntos.length; j++) m = Math.min(m, dist(puntos[i], puntos[j]));
    return m;
};
const ids = (n, pre = 'n') => Array.from({ length: n }, (_, i) => `${pre}${String(i).padStart(3, '0')}`);

test('ninguna neurona queda a menos de la distancia mínima de otra, y el resultado es siempre el mismo', () => {
    const d = desplazamientosCluster(ids(80));
    assert.equal(Object.keys(d).length, 80);
    assert.ok(minimaEntre(Object.values(d)) >= DISTANCIA_MINIMA - 1e-9, `mínima ${minimaEntre(Object.values(d))}`);
    assert.deepEqual(desplazamientosCluster([...ids(80)].reverse()), d);                  // el orden de llegada no importa
});

test('una neurona sin vecinas cerca conserva la posición de siempre', () => {
    assert.deepEqual(desplazamientosCluster(['distribucion_poisson'])['distribucion_poisson'], posicionNeurona('distribucion_poisson', [0, 0, 0]));
});

test('una neurona nueva nunca mueve a las que ya estaban (con lo recordado)', () => {
    const antes = desplazamientosCluster(ids(40));
    const despues = desplazamientosCluster([...ids(40), 'a_nueva', 'zeta_nueva', ...ids(10, 'p')], antes);
    for (const id of Object.keys(antes)) assert.deepEqual(despues[id], antes[id]);
    assert.ok(minimaEntre(Object.values(despues)) >= DISTANCIA_MINIMA - 1e-9);
});

test('lo recordado se respeta aunque estuviera más junto que la distancia mínima', () => {
    const d = desplazamientosCluster(['a', 'b', 'c'], { a: [0, 0, 0], b: [0.5, 0, 0] });
    assert.deepEqual(d.a, [0, 0, 0]);
    assert.deepEqual(d.b, [0.5, 0, 0]);
    assert.ok(dist(d.c, d.a) >= DISTANCIA_MINIMA && dist(d.c, d.b) >= DISTANCIA_MINIMA);
    assert.deepEqual(desplazamientosCluster(['a'], { a: [NaN, 0, 0] }).a, posicionNeurona('a', [0, 0, 0]));   // dato corrupto: se ignora
});

test('si el clúster se llena, la nube crece lo justo y se sigue cumpliendo la distancia', () => {
    const d = desplazamientosCluster(ids(400));
    const puntos = Object.values(d);
    assert.ok(minimaEntre(puntos) >= DISTANCIA_MINIMA - 1e-9);
    const mayor = Math.max(...puntos.map(p => Math.hypot(...p)));
    assert.ok(mayor > 10 && mayor < 40, `radio final ${mayor}`);                         // creció, pero sin irse lejos
});

test('desplazamientosCluster con rejilla da los mismos sitios que comparar con todas las neuronas (referencia O(n²))', () => {
    // La implementación anterior, tal cual: la rejilla solo acelera, no cambia ningún sitio (si cambiara, las neuronas de otro PC no coincidirían con las de este).
    const nube = (r, radio) => {
        let u = r() + r() + r() - 1.5, v = r() + r() + r() - 1.5, w = r() + r() + r() - 1.5;
        const largo = Math.hypot(u, v, w) || 1; u /= largo; v /= largo; w /= largo;
        const d = Math.abs(r() + r() - 1) * radio;
        return [u * d, v * d, w * d];
    };
    const referencia = (ids, previas = {}, minima = DISTANCIA_MINIMA, radio = 10) => {
        const orden = [...new Set(ids)].sort(), res = {}, colocadas = [];
        for (const id of orden) if (Array.isArray(previas[id])) { res[id] = previas[id]; colocadas.push(previas[id]); }
        for (const id of orden) {
            if (id in res) continue;
            const r = rngDe(`n:${id}`);
            let elegido = null, mejor = -1;
            for (let i = 0; i < 4000; i++) {
                const p = nube(r, radio + Math.floor(i / 40) * 0.5);
                const d = colocadas.reduce((m, q) => Math.min(m, dist(p, q)), Infinity);
                if (d >= minima) { elegido = p; break; }
                if (d > mejor) { elegido = p; mejor = d; }
            }
            res[id] = elegido; colocadas.push(elegido);
        }
        return res;
    };
    const ids = (n, p) => Array.from({ length: n }, (_, i) => `${p}_${i}`);
    assert.deepEqual(desplazamientosCluster(ids(150, 'a')), referencia(ids(150, 'a')));
    const previas = referencia(ids(30, 'b'));
    assert.deepEqual(desplazamientosCluster([...ids(30, 'b'), ...ids(40, 'c')], previas), referencia([...ids(30, 'b'), ...ids(40, 'c')], previas));
    assert.deepEqual(desplazamientosCluster(ids(60, 'd'), {}, 6, 1), referencia(ids(60, 'd'), {}, 6, 1));        // nube pequeña: obliga a crecer y agota intentos
    const juntas = Object.fromEntries(ids(10, 'e').map((id, i) => [id, [i * 0.1, 0, 0]]));
    assert.deepEqual(desplazamientosCluster(ids(40, 'e'), juntas), referencia(ids(40, 'e'), juntas));            // previas más juntas que la mínima
});

test('desplazamientosCluster: 1000 neuronas en un clúster se colocan en tiempo razonable (antes, 11 s)', () => {
    const t = performance.now();
    const d = desplazamientosCluster(Array.from({ length: 1000 }, (_, i) => `n_${i}`));
    assert.equal(Object.keys(d).length, 1000);
    assert.ok(performance.now() - t < 5000, `tardó ${Math.round(performance.now() - t)} ms`);
});
