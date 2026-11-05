import test from 'node:test';
import assert from 'node:assert/strict';
import { etiquetaHtml, etiquetaPlana } from './etiquetaMath.ts';

const sinEtiquetas = (html) => html.replace(/<[^>]*>/g, '');

test('una etiqueta con fórmula la dibuja con KaTeX y no deja el $ en crudo', () => {
    const html = etiquetaHtml('Prevalencia $P(D)$');
    assert.match(html, /^Prevalencia /);
    assert.ok(html.includes('class="katex"'));
    assert.ok(!sinEtiquetas(html).includes('$'));
});

test('las etiquetas que la IA escribió para Bayes se dibujan bien (con \\mid y \\text)', () => {
    for (const t of ['Prevalencia $P(D)$', 'Sensibilidad $P(+ \\mid D)$', 'Especificidad $P(- \\mid \\text{no } D)$']) {
        const html = etiquetaHtml(t);
        assert.ok(html.includes('class="katex"'), t);
        assert.ok(!html.includes('katex-error'), t);
        assert.ok(!sinEtiquetas(html).includes('$'), t);
    }
});

test('una etiqueta sin fórmulas sale igual (y los símbolos de HTML se escapan)', () => {
    assert.equal(etiquetaHtml('Velocidad inicial (m/s)'), 'Velocidad inicial (m/s)');
    assert.equal(etiquetaHtml('a < b & c > d'), 'a &lt; b &amp; c &gt; d');
});

test('una etiqueta con HTML ajeno nunca se inserta como HTML', () => {
    const html = etiquetaHtml('<img src=x onerror=alert(1)> y $x$');
    assert.ok(!html.includes('<img'));
    assert.ok(html.includes('&lt;img'));
    assert.ok(etiquetaHtml('<script>alert(1)</script>').indexOf('<script') === -1);
});

test('KaTeX sin confianza: una fórmula no puede crear enlaces', () => {
    const html = etiquetaHtml('$\\href{javascript:alert(1)}{x}$');
    assert.ok(!html.includes('<a '), html);
    assert.ok(!html.includes('javascript:alert') || !html.includes('href='), html);
});

test('un LaTeX que KaTeX no entiende no rompe nada', () => {
    assert.doesNotThrow(() => etiquetaHtml('Coste $\\fraccion{1}{$ final'));
    assert.equal(typeof etiquetaHtml('$\\noexiste$'), 'string');
});

test('etiquetaPlana: texto llano legible para aria-label y desplegables', () => {
    assert.equal(etiquetaPlana('Prevalencia $P(D)$'), 'Prevalencia P(D)');
    assert.equal(etiquetaPlana('Sensibilidad $P(+ \\mid D)$'), 'Sensibilidad P(+ | D)');
    assert.equal(etiquetaPlana('Especificidad $P(- \\mid \\text{no } D)$'), 'Especificidad P(- | no  D)');
    assert.equal(etiquetaPlana('Tasa $\\mu$ y $\\sigma$'), 'Tasa μ y σ');
    assert.equal(etiquetaPlana('Velocidad inicial (m/s)'), 'Velocidad inicial (m/s)');
    for (const t of ['$P(+ \\mid D)$', '$\\text{no } D$']) assert.ok(!/\\|mid|\$|text/.test(etiquetaPlana(t)), t);
});

test('un $ suelto (un precio) se queda como texto', () => {
    assert.equal(etiquetaHtml('Precio ($)'), 'Precio ($)');
});
