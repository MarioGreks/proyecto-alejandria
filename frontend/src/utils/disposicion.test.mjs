import test from 'node:test';
import assert from 'node:assert/strict';
import { asignarCasillas, centroDeCasilla, firmaUniverso, hashTexto, posicionNeurona, rngDe } from './disposicion.ts';

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
});
