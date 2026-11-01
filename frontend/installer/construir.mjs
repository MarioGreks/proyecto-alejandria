// Compila installer/instalador.nsi con el makensis que Tauri descarga (a %LOCALAPPDATA%\tauri\NSIS la primera vez que se hace `tauri build --bundles nsis`).
// Antes hay que tener la app en release: `npm run instalador` hace `tauri build --no-bundle` y luego esto.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', 'src-tauri', 'target', 'release', 'bundle');
const makensis = join(process.env.LOCALAPPDATA ?? '', 'tauri', 'NSIS', 'makensis.exe');

if (!existsSync(join(AQUI, '..', 'src-tauri', 'target', 'release', 'frontend.exe'))) {
    console.error('Falta la app en release: ejecuta `npm run instalador` (o `npx tauri build --no-bundle`).');
    process.exit(1);
}
if (!existsSync(makensis)) {
    console.error(`No se encuentra ${makensis}.\nSe descarga solo la primera vez con \`npx tauri build --bundles nsis\` (NSIS 3.11 y nsis_tauri_utils de github.com/tauri-apps).`);
    process.exit(1);
}
for (const f of ['LICENSE', 'THIRD-PARTY-NOTICES.md']) {          // el instalador los copia junto a la app
    if (!existsSync(join(AQUI, '..', '..', f))) { console.error(`Falta ${f} en la raíz del repositorio (los avisos se generan con \`npm run avisos\`).`); process.exit(1); }
}
mkdirSync(SALIDA, { recursive: true });
// NSIS solo entiende UTF-8 (acentos) si el archivo empieza por BOM: se garantiza aquí por si un editor lo quitó.
for (const f of readdirSync(AQUI).filter(n => /\.(nsi|nsh|ps1)$/.test(n))) {
    const ruta = join(AQUI, f), texto = readFileSync(ruta, 'utf8');
    if (!texto.startsWith('﻿')) writeFileSync(ruta, '﻿' + texto, 'utf8');
}
const r = spawnSync(makensis, ['/V2', join(AQUI, 'instalador.nsi')], { stdio: 'inherit', cwd: AQUI });
if (r.status !== 0) process.exit(r.status ?? 1);
const exe = join(SALIDA, 'Proyecto-Alejandria-Setup.exe');
console.log(`\nInstalador: ${exe} (${(statSync(exe).size / 1048576).toFixed(1)} MB)`);
