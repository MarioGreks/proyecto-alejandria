import test from 'node:test';
import assert from 'node:assert/strict';
import { PROMPT_FUENTES, PROMPT_EXPLORACION } from './prompts.ts';

test('la exploración libre obliga a consultar Google Scholar y ambos prompts admiten su ficha como URL de la referencia', () => {
    assert.match(PROMPT_EXPLORACION, /consulta como mínimo \*\*Google Scholar\*\*/);
    assert.match(PROMPT_EXPLORACION, /scholar\.google\.com/);
    assert.match(PROMPT_FUENTES, /ficha de la publicación en Google Scholar/);
});

test('ambos prompts piden castellano de España y una verificación doble que no se muestra', () => {
    for (const p of [PROMPT_FUENTES, PROMPT_EXPLORACION]) {
        assert.match(p, /castellano de España/);
        assert.match(p, /VERIFICACIÓN DOBLE OCULTA/);
        assert.match(p, /NO lo muestres ni lo menciones/);
        assert.ok(!p.includes('[object Object]') && !p.includes('undefined'));    // las plantillas se resolvieron
    }
});

test('los prompts siguen siendo plantillas válidas: bloque json y reglas de gráficos al día', () => {
    for (const p of [PROMPT_FUENTES, PROMPT_EXPLORACION]) {
        assert.ok(p.includes('```json'));
        assert.ok(p.includes('xticks'));
        assert.ok(p.includes('`hist`') && p.includes('`imshow`'));        // la grabadora ya los dibuja en vivo
    }
});

test('ambos prompts piden no dejar marcas de cita como [reference:3] en los textos', () => {
    for (const p of [PROMPT_FUENTES, PROMPT_EXPLORACION]) {
        assert.match(p, /NO dejes las marcas de cita/);
        assert.ok(p.includes('[reference:3]') && p.includes('"referencias"'));
    }
    assert.ok(PROMPT_FUENTES.trimEnd().endsWith('Devuelve ÚNICAMENTE el bloque JSON.'));   // la última regla sigue siendo la de formato
});
