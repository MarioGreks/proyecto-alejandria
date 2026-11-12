import test from 'node:test';
import assert from 'node:assert/strict';
import { SIN_LIMITES, calidadDe, debeProponer, leerRendimientoGuardado, nombrePerfil, normalizarRendimiento, segundosDeAvance, textoCpu, textoFps, textoRam } from './rendimiento.ts';

/** Un localStorage de pruebas (Node no lo trae). */
function conAlmacen(valorInicial, f) {
    const almacen = new Map(valorInicial === undefined ? [] : [['alejandria.rendimiento', valorInicial]]);
    globalThis.localStorage = { getItem: k => (almacen.has(k) ? almacen.get(k) : null), setItem: (k, v) => almacen.set(k, String(v)), removeItem: k => almacen.delete(k) };
    try { return f(); } finally { delete globalThis.localStorage; }
}

test('sin datos o con basura, los ajustes valen «sin límites»', () => {
    assert.deepEqual(normalizarRendimiento(undefined), SIN_LIMITES);
    assert.deepEqual(normalizarRendimiento(null), SIN_LIMITES);
    assert.deepEqual(normalizarRendimiento('hola'), SIN_LIMITES);
    assert.deepEqual(normalizarRendimiento({ limite_cpu: 'mucho', fps_max: NaN, calidad_3d: 'ultra', ia_en_gpu: 'si' }), SIN_LIMITES);
});

test('los valores fuera de rango se acotan y los buenos se respetan', () => {
    const a = normalizarRendimiento({ perfil: 'ligero', limite_cpu: 400, limite_ram_mb: -3, fps_max: 30.4, calidad_3d: 'baja', ia_en_gpu: false, sinapsis_auto: false });
    assert.deepEqual(a, { perfil: 'ligero', limite_cpu: 100, limite_ram_mb: 0, fps_max: 30, calidad_3d: 'baja', ia_en_gpu: false, sinapsis_auto: false });
    assert.equal(normalizarRendimiento({ limite_cpu: 0 }).limite_cpu, 1);              // nunca 0 %
    assert.equal(normalizarRendimiento({ fps_max: 9999 }).fps_max, 240);
});

test('cada calidad dibuja menos que la anterior', () => {
    const alta = calidadDe('alta'), media = calidadDe('media'), baja = calidadDe('baja');
    assert.ok(alta.dprMax > media.dprMax && media.dprMax > baja.dprMax);
    assert.deepEqual([alta.bloom, alta.vignette], [true, true]);
    assert.deepEqual([media.bloom, media.vignette], [true, false]);
    assert.deepEqual([baja.bloom, baja.vignette], [false, false]);
    assert.equal(baja.dprMax, 1);                       // la resolución nativa nunca se baja de 1: se vería borroso
    assert.equal(calidadDe('alta').dprMax, 2);          // y la «alta» es lo que la app ya hacía antes del limitador
});

test('lo guardado en el navegador se lee, y si está roto o no hay, vale sin límites', () => {
    const guardado = JSON.stringify({ perfil: 'ligero', limite_cpu: 40, limite_ram_mb: 2867, fps_max: 30, calidad_3d: 'baja', ia_en_gpu: false, sinapsis_auto: false });
    assert.equal(conAlmacen(guardado, () => leerRendimientoGuardado()).fps_max, 30);
    assert.deepEqual(conAlmacen('{no es json', () => leerRendimientoGuardado()), SIN_LIMITES);
    assert.deepEqual(conAlmacen(undefined, () => leerRendimientoGuardado()), SIN_LIMITES);
    assert.deepEqual(leerRendimientoGuardado(), SIN_LIMITES);       // sin localStorage (el acceso lanza): tampoco rompe
});

test('solo se propone un perfil si aún no se eligió, el equipo lo necesita y no se dijo «ahora no»', () => {
    const sinElegir = SIN_LIMITES, elegido = { ...SIN_LIMITES, perfil: 'ligero' };
    assert.equal(debeProponer(sinElegir, 'ligero', false), true);
    assert.equal(debeProponer(sinElegir, 'equilibrado', false), true);
    assert.equal(debeProponer(sinElegir, 'maximo', false), false);         // un equipo potente no necesita límites: no se molesta
    assert.equal(debeProponer(sinElegir, 'ligero', true), false);          // ya dijo «ahora no»
    assert.equal(debeProponer(elegido, 'ligero', false), false);           // ya eligió
    assert.equal(debeProponer(sinElegir, '', false), false);               // respuesta rara del backend
});

test('el tiempo que se le pasa a advance va en SEGUNDOS y sigue desde el reloj de la escena (regresión 0.8.0: iba en ms y el 3D giraba como una peonza)', () => {
    assert.equal(segundosDeAvance(5, 1000, 1000), 5);          // el primer fotograma cae justo en la base: sin salto
    assert.equal(segundosDeAvance(5, 1000, 1500), 5.5);        // 500 ms después, medio segundo más
    assert.equal(segundosDeAvance(0, 40_000, 40_033), 0.033);  // marcas de rAF grandes (la página lleva 40 s abierta) no se cuelan como tiempo
    const delta = segundosDeAvance(12, 7000, 7033) - segundosDeAvance(12, 7000, 7000);
    assert.ok(delta > 0.03 && delta < 0.04, `un fotograma a 30 FPS avanza ~0,033 s, no ~33 (salió ${delta})`);
});

test('los textos de los controles', () => {
    assert.equal(textoRam(0), 'Sin tope');
    assert.equal(textoRam(2048), '2 GB');
    assert.match(textoRam(2560), /^2,5 GB$/);
    assert.equal(textoFps(0), 'Sin tope');
    assert.equal(textoFps(30), '30 FPS');
    assert.equal(textoCpu(100), 'Sin tope');
    assert.equal(textoCpu(40), '40 %');
    assert.equal(nombrePerfil('ligero'), 'Ligero');
    assert.equal(nombrePerfil(''), 'Sin elegir');
});
