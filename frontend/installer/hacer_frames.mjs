// Genera installer/pilar.nsh: los fotogramas del pilar ASCII girando (los mismos que dibuja la app) para la página de bienvenida del instalador.
// Uso (desde frontend/):  node installer/hacer_frames.mjs
import { writeFileSync } from 'node:fs';
import { dibujarPilar } from '../src/utils/pilarAscii.ts';

const N = 24, COLS = 24, FILAS = 25;
let nsh = '; Generado por hacer_frames.mjs: no editar a mano.\n'
    + '; NSIS limita las cadenas a 1024 caracteres: cada fotograma cabe de sobra.\n'
    + `!define PILAR_FOTOGRAMAS ${N}\n\n`
    + 'Function ObtenerFotograma ; entrada: $0 = índice (0..N-1); deja el texto en la pila\n';
for (let i = 0; i < N; i++) {
    const texto = dibujarPilar((i / N) * 2 * Math.PI, COLS, FILAS).split('\n').map(l => l.trimEnd()).join('$\\r$\\n');
    nsh += `  StrCmp $0 ${i} 0 +3\n    Push "${texto}"\n    Return\n`;
}
nsh += '  Push ""\nFunctionEnd\n';
writeFileSync(new URL('./pilar.nsh', import.meta.url), '﻿' + nsh, 'utf8');   // con BOM: NSIS lo necesita para leer UTF-8
console.log(`pilar.nsh: ${N} fotogramas de ${COLS}x${FILAS}`);
