import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const datos = JSON.parse(readFileSync(new URL('../../public/ejemplos/ejemplos.json', import.meta.url), 'utf-8'));
const textos = (o, ruta = '') => typeof o === 'string' ? [[ruta, o]]
    : Array.isArray(o) ? o.flatMap((v, i) => textos(v, `${ruta}[${i}]`))
    : o && typeof o === 'object' ? Object.entries(o).flatMap(([k, v]) => textos(v, `${ruta}.${k}`)) : [];

test('las neuronas de ejemplo no llevan barras duplicadas ni "\\n" escritos como texto (las fórmulas se verían rotas)', () => {
    for (const n of datos.neuronas) {
        for (const [ruta, t] of textos(n)) {
            if (ruta.endsWith('codigo')) continue;                         // en el código Python un \n es legítimo
            assert.ok(!/\\\\[A-Za-z;,|{]/.test(t), `${n.id}${ruta}: LaTeX con la barra duplicada`);
            assert.ok(!/(?<!\\)\\n(?![A-Za-z])/.test(t), `${n.id}${ruta}: un salto de línea escrito como \\n`);
        }
    }
});

test('cada neurona de ejemplo trae sus bloques de fórmulas en líneas propias y un laboratorio con controles', () => {
    for (const n of datos.neuronas) {
        assert.match(n.teoria, /\n\n\$\$/, `${n.id}: sin bloques $$ separados`);
        assert.ok(n.laboratorio.controles.length >= 1 && n.laboratorio.codigo.includes('plt.show()'), n.id);
    }
});
