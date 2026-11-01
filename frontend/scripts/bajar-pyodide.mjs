// Deja en public/pyodide/ todo lo que necesitan los laboratorios para funcionar sin internet:
// el runtime (copiado del paquete npm `pyodide`) y los paquetes de Python (bajados del CDN oficial de esa misma versión).
// Cada archivo se comprueba contra el sha256 de pyodide-lock.json; los que ya están y son correctos no se vuelven a bajar.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEN = join(RAIZ, 'node_modules', 'pyodide');
const DESTINO = join(RAIZ, 'public', 'pyodide');
const PAQUETES = ['numpy', 'scipy', 'matplotlib', 'pandas'];    // y sus dependencias; otros: añadirlos aquí
const NUCLEO = ['pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip'];

const sha256 = ruta => createHash('sha256').update(readFileSync(ruta)).digest('hex');

const version = JSON.parse(readFileSync(join(ORIGEN, 'package.json'), 'utf8')).version;
const lock = JSON.parse(readFileSync(join(ORIGEN, 'pyodide-lock.json'), 'utf8'));
const CDN = `https://cdn.jsdelivr.net/pyodide/v${version}/full/`;

const necesarios = new Set();
const anadir = nombre => {
    const n = nombre.toLowerCase();
    if (necesarios.has(n)) return;
    if (!lock.packages[n]) throw new Error(`El paquete "${n}" no existe en pyodide-lock.json`);
    necesarios.add(n);
    lock.packages[n].depends.forEach(anadir);
};
PAQUETES.forEach(anadir);

mkdirSync(DESTINO, { recursive: true });
for (const f of NUCLEO) copyFileSync(join(ORIGEN, f), join(DESTINO, f));

// Lock recortado: lo que no se ha empaquetado no existe para loadPackagesFromImports (falla con un ModuleNotFoundError claro, no con un 404).
const recortado = { info: lock.info, packages: Object.fromEntries([...necesarios].map(n => [n, lock.packages[n]])) };
writeFileSync(join(DESTINO, 'pyodide-lock.json'), JSON.stringify(recortado));

let bajados = 0;
for (const n of necesarios) {
    const { file_name: archivo, sha256: esperado } = lock.packages[n];
    const ruta = join(DESTINO, archivo);
    if (existsSync(ruta) && sha256(ruta) === esperado) continue;
    console.log(`bajando ${archivo}`);
    const r = await fetch(CDN + archivo);
    if (!r.ok) throw new Error(`${archivo}: HTTP ${r.status}`);
    writeFileSync(ruta, Buffer.from(await r.arrayBuffer()));
    if (sha256(ruta) !== esperado) throw new Error(`${archivo}: el sha256 no coincide con pyodide-lock.json`);
    bajados++;
}
console.log(`Pyodide ${version}: ${necesarios.size} paquetes en public/pyodide (${bajados} bajados).`);
