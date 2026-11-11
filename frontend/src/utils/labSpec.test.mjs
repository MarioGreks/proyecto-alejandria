// npm test  (usa node:test y el soporte de TypeScript de Node 24: no hay dependencias nuevas)
import test from 'node:test';
import assert from 'node:assert/strict';
import { aprobarLaboratorio, inyectar, laboratorioAprobado, literal, limitesAuto, nuevoControl, opcionesATexto, sha256Hex, sincronizarValores, textoAOpciones, validarControles, variablesSinControl, marcas, marcasDe, marcasLog, pasoDe, cadaCuantas, formatoMarca, formatoValor, partirMath, puntoCercano, puntosDe, textoPlano, zorderDe } from './labSpec.ts';

const eje = (series, extra = {}) => ({ fila: 0, col: 0, filas: 1, cols: 1, titulo: null, xlabel: null, ylabel: null, xlim: null, ylim: null, grid: null, leyenda: null, aspecto_igual: false, categorias: [], series, ...extra });
const linea = (x, y) => ({ tipo: 'linea', x, y, color: '#000', ancho: 1.5, estilo: '-', marcador: null, ms: 6, alpha: 1 });

test('literal: números, booleanos y textos se convierten a literales de Python', () => {
    assert.equal(literal(0.25), '0.25');
    assert.equal(literal(true), 'True');
    assert.equal(literal(false), 'False');
    assert.equal(literal('abc'), '"abc"');
    assert.equal(literal('con "comillas"'), '"con \\"comillas\\""');
});

test('inyectar sustituye todas las apariciones y no toca otras llaves del código', () => {
    const codigo = 'a = {a}\nb = {a} + {flag}\nd = {"clave": {modo}}\nr = f"{a}"';
    const salida = inyectar(codigo, { a: 3, flag: false, modo: 'rapido' });
    assert.equal(salida, 'a = 3\nb = 3 + False\nd = {"clave": "rapido"}\nr = f"3"');
    assert.equal(inyectar('x = {a}', { a: 1e-7 }), 'x = 1e-7');
});

test('inyectar define al principio los controles que el código usa sin llaves (n = int(n)) y salta las palabras reservadas', () => {
    const salida = inyectar('n = int(n)\nm = {m}', { n: 2000, m: 3, mostrar: true, lambda: 2 });
    assert.equal(salida, 'n = 2000\nmostrar = True\nn = int(n)\nm = 3');
    assert.equal(inyectar('x = {a}', { a: 1 }), 'x = 1');   // sin sueltos, el código no cambia
});

test('marcas: valores bonitos dentro del rango y sin ruido de coma flotante', () => {
    assert.deepEqual(marcas(0, 1, 6), [0, 0.2, 0.4, 0.6, 0.8, 1]);
    assert.deepEqual(marcas(0, 10, 6), [0, 2, 4, 6, 8, 10]);
    assert.deepEqual(marcas(50, 150, 7), [60, 80, 100, 120, 140]);
    assert.ok(marcas(-3.2, 7.9, 6).every(v => v >= -3.2 && v <= 7.9));
    assert.deepEqual(marcas(5, 5), [5]);
});

test('formatoMarca: decimales según el paso y notación científica en los extremos', () => {
    assert.equal(formatoMarca(0, 0.2), '0');
    assert.equal(formatoMarca(0.4, 0.2), '0.4');
    assert.equal(formatoMarca(25, 25), '25');
    assert.equal(formatoMarca(2e7, 1e7), '2.0e7');
});

test('limitesAuto: 5 % de margen, barras con suelo en 0, límites manuales, NaN ignorados y rango degenerado', () => {
    assert.deepEqual(limitesAuto(eje([linea([0, 10], [0, 100])])), { xmin: -0.5, xmax: 10.5, ymin: -5, ymax: 105 });
    const barras = { tipo: 'barras', x: [1, 2], alto: [3, 5], ancho: 0.8, color: '#000', borde: null, alpha: 1 };
    assert.equal(limitesAuto(eje([barras])).ymin, 0);
    assert.deepEqual(limitesAuto(eje([linea([0, 10], [0, 100])], { xlim: [0, null], ylim: [null, 50] })), { xmin: 0, xmax: 10.5, ymin: -5, ymax: 50 });
    const conHuecos = limitesAuto(eje([linea([0, 1, 2], [1, null, 3])]));
    assert.ok(Number.isFinite(conHuecos.ymin) && conHuecos.ymin < 1 && conHuecos.ymax > 3);
    const plano = limitesAuto(eje([linea([1, 2], [5, 5])]));
    assert.ok(plano.ymax > plano.ymin);
    assert.deepEqual(limitesAuto(eje([])), { xmin: 0, xmax: 1, ymin: 0, ymax: 1 });
});

test('marcas a medida: se respetan (con etiquetas), amplían la vista y se recortan a ella; sin ellas, las automáticas', () => {
    const fijas = { pos: [0, 1, 2, 3], labels: ['a', 'b', 'c', 'd'] };
    assert.deepEqual(marcasDe(fijas, 0.5, 2.5, 6), { pos: [1, 2], labels: ['b', 'c'] });
    assert.deepEqual(marcasDe({ pos: [0, 5], labels: null }, 0, 5, 6), { pos: [0, 5], labels: null });
    assert.deepEqual(marcasDe(null, 0, 10, 6).labels, null);
    assert.deepEqual(marcasDe(undefined, 0, 10, 6).pos, marcas(0, 10, 6));
    assert.equal(pasoDe([0, 1, 5]), 1);
    assert.equal(pasoDe([3]), 1);
    const l = limitesAuto(eje([linea([0, 1], [0, 1])], { xticks: { pos: [-3, 4], labels: null } }));
    assert.deepEqual([l.xmin, l.xmax], [-3, 4]);                                     // ticks fuera de los datos amplían la vista
    assert.equal(limitesAuto(eje([linea([0, 10], [0, 1])], { xticks: { pos: [2, 4], labels: null } })).xmin, -0.5);   // dentro: no cambia nada
});

test('cadaCuantas: 1 si las etiquetas caben; si no, una de cada n; y sin romper con 0 o 1 marcas', () => {
    assert.equal(cadaCuantas([10, 12, 8], 40), 1);
    assert.equal(cadaCuantas([20, 20, 20], 15), 2);     // 28 px por etiqueta y 15 de separación
    assert.equal(cadaCuantas([40, 20], 10), 5);
    assert.equal(cadaCuantas([30], 5), 1);
    assert.equal(cadaCuantas([], 5), 1);
    assert.equal(cadaCuantas([30, 30], 0), 1);
});

test('las rectas cuentan para el autoescalado y el zorder por defecto ordena área < línea < texto', () => {
    const l = limitesAuto(eje([{ tipo: 'vline', pos: 100, color: '#f00', ancho: 1, estilo: '--', alpha: 1 }, linea([0, 50], [0, 1])]));
    assert.ok(l.xmax >= 100);
    const area = { tipo: 'area', x: [0], y1: [0], y2: [1], color: '#000', alpha: 0.5 };
    const texto = { tipo: 'texto', x: 0, y: 0, texto: 'a', ejes: false, ha: 'left', va: 'baseline', tam: 10, negrita: false, color: '#000' };
    assert.ok(zorderDe(area) < zorderDe(linea([0], [0])) && zorderDe(linea([0], [0])) < zorderDe(texto));
    assert.equal(zorderDe({ ...linea([0], [0]), zorder: 9 }), 9);
});

test('partirMath y textoPlano separan y limpian los $...$ de títulos y leyendas', () => {
    assert.deepEqual(partirMath('Fuerza $\\mu(x) = A$ final'), [
        { math: false, texto: 'Fuerza ' }, { math: true, texto: '\\mu(x) = A' }, { math: false, texto: ' final' }]);
    assert.deepEqual(partirMath('sin fórmulas'), [{ math: false, texto: 'sin fórmulas' }]);
    assert.equal(textoPlano('$\\mu(x)$ y $\\sigma$'), 'μ(x) y σ');
});

test('formatoValor: 4 cifras significativas sin ceros de relleno', () => {
    assert.equal(formatoValor(3.14159265), '3.142');
    assert.equal(formatoValor(100), '100');
    assert.equal(formatoValor(0.00012346), '0.0001235');
});

test('puntosDe y puntoCercano: tooltip de líneas y de barras con nombre, y nada si el cursor está lejos', () => {
    const barras = { tipo: 'barras', x: [0, 1], alto: [2, 5], ancho: 0.8, color: '#000', colores: null, borde: null, alpha: 1, label: 'Medias' };
    const e = eje([{ ...linea([0, 10], [0, 100]), label: 'serie' }, barras], { categorias: ['HM', 'GM'] });
    const puntos = puntosDe(e);
    assert.equal(puntos.length, 4);
    assert.equal(puntos[1].texto, 'serie: x=10, y=100');
    assert.equal(puntos[3].texto, 'Medias: GM: 5');
    const aPx = (x, y) => [x * 10, 200 - y];            // transformación cualquiera
    assert.equal(puntoCercano(puntos, 100, 100, aPx)?.texto, 'serie: x=10, y=100');
    assert.equal(puntoCercano(puntos, 105, 100, aPx)?.texto, 'serie: x=10, y=100');
    assert.equal(puntoCercano(puntos, 60, 160, aPx), null);   // a más de 24 px de todo
    assert.equal(puntosDe(eje([linea([0, 1], [null, 2])])).length, 1);  // los huecos (NaN) no son tocables
});

test('sha256Hex identifica el código y laboratorioAprobado/aprobarLaboratorio lo recuerdan sin romper si no hay localStorage', async () => {
    assert.equal(await sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    assert.notEqual(await sha256Hex('print(1)'), await sha256Hex('print(2)'));
    const h = await sha256Hex('print(1)');
    assert.equal(laboratorioAprobado(h), false);          // sin localStorage (Node): no falla, simplemente pregunta
    aprobarLaboratorio(h);                                 // tampoco falla
    const memoria = new Map();
    globalThis.localStorage = { getItem: k => memoria.get(k) ?? null, setItem: (k, v) => memoria.set(k, v) };
    try {
        assert.equal(laboratorioAprobado(h), false);
        aprobarLaboratorio(h);
        assert.equal(laboratorioAprobado(h), true);
        assert.equal(laboratorioAprobado(await sha256Hex('otro código')), false);   // cambia el código -> vuelve a preguntar
        aprobarLaboratorio(h);
        assert.equal(JSON.parse(memoria.get('alejandria.labsAprobados')).length, 1);  // sin duplicados
    } finally { delete globalThis.localStorage; }
});

const slider = (extra = {}) => ({ variable: 'a', label: 'A', tipo: 'slider', min: 0, max: 10, step: 0.5, default: 2, ...extra });

test('variablesSinControl: avisa de los {nombres} del código que no tienen control', () => {
    assert.deepEqual(variablesSinControl('a = {a}\nb = {b} + {b}\nf"{c}"\nd = {"k": 1}', [slider()]), ['b', 'c']);
    assert.deepEqual(variablesSinControl('x = 1', []), []);
});

test('validarControles: acepta los correctos y explica cada incoherencia', () => {
    assert.deepEqual(validarControles([slider(), { variable: 'v', label: 'V', tipo: 'checkbox', default: true }, { variable: 's', label: 'S', tipo: 'select', opciones: ['x', { valor: 'y' }], default: 'y' }]), []);
    assert.deepEqual(validarControles([slider({ default: undefined, step: undefined })]).length, 1);
    const malos = [slider({ variable: '1x' }), slider({ min: 5, max: 1 }), slider({ step: 0 }), slider({ default: 99 }), slider({ min: NaN }), slider({ label: ' ' }),
        { variable: 'c', label: 'C', tipo: 'checkbox', default: 1 }, { variable: 's', label: 'S', tipo: 'select', opciones: [], default: 'x' },
        { variable: 's', label: 'S', tipo: 'select', opciones: ['x'], default: 'z' }];
    for (const m of malos) assert.equal(validarControles([m]).length, 1, JSON.stringify(m));
    assert.equal(validarControles([slider(), slider()]).length, 1);                                   // variable repetida
    assert.equal(validarControles(Array.from({ length: 25 }, (_, i) => slider({ variable: `v${i}` }))).length, 1);   // más de 24
});

test('sincronizarValores: conserva lo compatible, recorta al rango y restablece lo nuevo o incompatible', () => {
    const controles = [slider({ max: 5 }), { variable: 'v', label: 'V', tipo: 'checkbox', default: true }, { variable: 's', label: 'S', tipo: 'select', opciones: ['x', 'y'], default: 'x' }, slider({ variable: 'nueva', default: 7 })];
    assert.deepEqual(sincronizarValores(controles, { a: 9, v: false, s: 'z', vieja: 1 }), { a: 5, v: false, s: 'x', nueva: 7 });
    assert.deepEqual(sincronizarValores(controles, { a: 3, v: 'no es bool', s: 'y' }), { a: 3, v: true, s: 'y', nueva: 7 });
});

test('nuevoControl y las opciones de un desplegable', () => {
    assert.equal(nuevoControl([]).variable, 'variable_1');
    assert.equal(nuevoControl([{ variable: 'variable_1' }]).variable, 'variable_2');
    assert.equal(nuevoControl([], 'sigma').variable, 'sigma');
    assert.equal(nuevoControl([{ variable: 'sigma' }], 'sigma').variable, 'variable_1');            // si ya existe, nombre libre
    assert.deepEqual(validarControles([nuevoControl([])]), []);                                       // un control nuevo es válido de entrada
    assert.deepEqual(textoAOpciones('1, 2,3.5'), [1, 2, 3.5]);
    assert.deepEqual(textoAOpciones('lineal, cuadrática,, '), ['lineal', 'cuadrática']);
    assert.deepEqual(textoAOpciones('1, dos'), ['1', 'dos']);                                         // mezcla: todo texto
    assert.equal(opcionesATexto({ opciones: ['x', { valor: 'y' }, 3] }), 'x, y, 3');
});

test('escala logarítmica: marcas por década con exponentes, margen en el exponente, solo valores positivos y barras apiladas', () => {
    assert.deepEqual(marcasLog(1, 1000), { pos: [1, 10, 100, 1000], labels: ['1', '10¹', '10²', '10³'] });
    assert.deepEqual(marcasLog(0.01, 1).labels, ['10⁻²', '10⁻¹', '1']);
    assert.equal(marcasLog(2, 8).labels, null);                                      // menos de una década: marcas lineales
    assert.equal(marcasLog(1, 1e12, 6).pos.length <= 7, true);                       // muchas décadas: no se escriben todas
    assert.deepEqual(marcasDe(null, 1, 100, 6, true).pos, [1, 10, 100]);
    const l = limitesAuto(eje([linea([1, 100], [0, 1000]), linea([-5, 10], [-1, 10])], { xscale: 'log', yscale: 'log' }));
    assert.ok(Math.abs(l.xmin - 10 ** -0.1) < 1e-9 && Math.abs(l.xmax - 10 ** 2.1) < 1e-9);   // 0 y -5 no cuentan; margen 5 % del exponente (0 a 2)
    assert.ok(l.ymin > 0 && l.ymin < 10 && l.ymax > 1000);
    const apiladas = limitesAuto(eje([{ tipo: 'barras', x: [0, 1], alto: [2, 3], base: [1, 4], ancho: 0.8, color: '#000', colores: null, borde: null, alpha: 1 }]));
    assert.equal(apiladas.ymin, 0);
    assert.ok(apiladas.ymax > 7);                                                    // el tope de la segunda barra es 4 + 3
});

test('imshow: la imagen fija los límites y un eje invertido da las mismas marcas que el normal', () => {
    const imagen = { tipo: 'imagen', ancho: 4, alto: 3, origen: 'upper', extent: [-0.5, 3.5, 2.5, -0.5], rgba: '' };
    const eje = { series: [imagen], xlim: [-0.5, 3.5], ylim: [2.5, -0.5], xticks: null, yticks: null, categorias: [] };
    assert.deepEqual(limitesAuto(eje), { xmin: -0.5, xmax: 3.5, ymin: 2.5, ymax: -0.5 });     // Y invertido, sin margen
    assert.deepEqual(marcasDe(null, 2.5, -0.5, 6), marcasDe(null, -0.5, 2.5, 6));
    assert.ok(marcasDe(null, 2.5, -0.5, 6).pos.length > 1);
    assert.equal(zorderDe(imagen), 0);                                                      // debajo de líneas y puntos
    assert.deepEqual(puntosDe(eje), []);
});
