// Genera THIRD-PARTY-NOTICES.md (raíz del repositorio) con los avisos de copyright y las licencias de lo que se redistribuye:
//   - JavaScript empaquetado en la app: cierre de dependencias de producción de package.json (se lee node_modules).
//   - Rust compilado en la app: `cargo metadata` (sin red) y los archivos de licencia de cada crate en el registro de Cargo.
//   - Pyodide y las ruedas de Python que lleva la app (public/pyodide): sus METADATA y archivos de licencia.
// Además lista, solo como información, lo que el instalador descarga desde su origen (librerías de backend/requirements.txt, sacadas del entorno de backend/.venv si existe).
// Uso: `npm run avisos` (antes: `npm install` y haber compilado la app una vez, para que existan node_modules y el registro de Cargo).
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FRONT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAIZ = join(FRONT, '..');
const COPYLEFT = /\b(A?GPL|LGPL|SSPL)\b|non-?commercial/i;     // GPL, LGPL, AGPL, SSPL o «no comercial»
const DEBIL = /\bMPL\b|MPL-/i;                                  // copyleft débil: se lista con su fuente
const sinFraseLibre = s => s.replace(/commercial or non-?commercial/gi, '');   // la Unlicense dice «commercial or non-commercial» y no es una restricción

const hash = s => createHash('sha256').update(s).digest('hex').slice(0, 12);
const linea = (s, n = 90) => { const t = s.replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const esCopyright = l => /^\s*(copyright|\(c\)|©)/i.test(l);
const copyright = texto => texto.split(/\r?\n/).filter(esCopyright).map(l => linea(l, 100)).slice(0, 3).join(' · ');
const normalizar = texto => texto.replace(/\r/g, '').split('\n').filter(l => !esCopyright(l)).join(' ').replace(/\s+/g, ' ').trim();
const celda = s => (s || '').replace(/\|/g, '/').replace(/\r?\n/g, ' ');
const NOMBRE_LICENCIA = /^(licen[cs]e|licen[cs]es|copying|unlicense|licen[cs]e-.*|copying-.*|licen[cs]e\..*|copying\..*)$/i;
const NOMBRE_NOTICE = /^notice(\..*|-.*)?$/i;

/** Archivos de licencia y de NOTICE de una carpeta (solo el primer nivel). */
function leerCarpeta(dir) {
    const lic = [], notice = [];
    let nombres = [];
    try { nombres = readdirSync(dir); } catch { return { lic, notice }; }
    for (const n of nombres) {
        const ruta = join(dir, n);
        let ok = false;
        try { ok = statSync(ruta).isFile() && statSync(ruta).size < 400_000; } catch { /* enlace roto */ }
        if (!ok) continue;
        if (NOMBRE_NOTICE.test(n)) notice.push({ nombre: n, texto: readFileSync(ruta, 'utf8') });
        else if (NOMBRE_LICENCIA.test(n)) lic.push({ nombre: n, texto: readFileSync(ruta, 'utf8') });
    }
    return { lic, notice };
}

const paquetes = [];       // { pila, nombre, version, licencia, lic: [{nombre, texto}], notice: [...], fuente }

// ---------------------------------------------------------------- npm (producción, cierre transitivo)
function npm() {
    const raiz = JSON.parse(readFileSync(join(FRONT, 'package.json'), 'utf8'));
    const vistos = new Map();
    const buscar = (nombre, desde) => {
        for (let d = desde; ; d = dirname(d)) {
            const p = join(d, 'node_modules', nombre, 'package.json');
            if (existsSync(p)) return p;
            if (dirname(d) === d) return null;
        }
    };
    const visitar = (nombre, desde) => {
        const p = buscar(nombre, desde);
        if (!p || vistos.has(p)) return;
        const j = JSON.parse(readFileSync(p, 'utf8'));
        vistos.set(p, j);
        for (const dep of Object.keys({ ...j.dependencies, ...j.optionalDependencies })) visitar(dep, dirname(p));
    };
    for (const dep of Object.keys(raiz.dependencies)) visitar(dep, FRONT);
    for (const [p, j] of vistos) {
        const licencia = (typeof j.license === 'string' ? j.license : j.license?.type) || (j.licenses ?? []).map(l => l.type).join(' OR ') || 'sin campo de licencia';
        const repo = (typeof j.repository === 'string' ? j.repository : j.repository?.url ?? j.homepage ?? '').replace(/^git\+/, '').replace(/\.git$/, '');
        paquetes.push({ pila: 'npm', nombre: j.name, version: j.version, licencia, ...leerCarpeta(dirname(p)), fuente: repo });
    }
}

// ---------------------------------------------------------------- Rust
function rust() {
    const r = spawnSync('cargo', ['metadata', '--manifest-path', join(FRONT, 'src-tauri', 'Cargo.toml'), '--format-version', '1', '--offline', '--filter-platform', 'x86_64-pc-windows-msvc'], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
    if (r.status !== 0) throw new Error('cargo metadata falló (¿está instalado Rust y se compiló la app una vez?):\n' + r.stderr);
    const m = JSON.parse(r.stdout);
    const ids = new Set(m.resolve.nodes.map(n => n.id));
    for (const p of m.packages) {
        if (!ids.has(p.id) || !p.source) continue;                   // sin `source` = el propio proyecto
        paquetes.push({ pila: 'Rust', nombre: p.name, version: p.version, licencia: p.license ?? (p.license_file ? `ver ${p.license_file}` : 'sin licencia declarada'), ...leerCarpeta(dirname(p.manifest_path)), fuente: p.repository ?? '' });
    }
}

// ---------------------------------------------------------------- Pyodide y sus ruedas
// El tar de Windows (bsdtar) lee .zip/.whl; el GNU tar de Git Bash no: se usa el de System32 si existe.
const TAR = process.platform === 'win32' && existsSync('C:\\Windows\\System32\\tar.exe') ? 'C:\\Windows\\System32\\tar.exe' : 'tar';
function tar(args) { return spawnSync(TAR, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
let pyodide = null;
function ruedas() {
    const dir = join(FRONT, 'public', 'pyodide');
    if (!existsSync(dir)) throw new Error('Faltan los paquetes de Pyodide: ejecuta `npm run pyodide` primero.');
    const pj = JSON.parse(readFileSync(join(FRONT, 'node_modules', 'pyodide', 'package.json'), 'utf8'));
    pyodide = { version: pj.version, licencia: pj.license };
    for (const w of readdirSync(dir).filter(n => n.endsWith('.whl')).sort()) {
        const ruta = join(dir, w);
        const lista = tar(['-tf', ruta]).stdout.split(/\r?\n/).filter(Boolean);
        const meta = tar(['-xOf', ruta, lista.find(n => n.endsWith('.dist-info/METADATA'))]).stdout;
        const campo = k => (meta.match(new RegExp(`^${k}: (.*)$`, 'm')) ?? [])[1]?.trim();
        const clasif = (meta.match(/^Classifier: License :: (?:OSI Approved :: )?(.*)$/m) ?? [])[1]?.trim();
        const l = campo('License-Expression') ?? clasif ?? (campo('License') && campo('License').length < 40 && !/[=\n]/.test(campo('License')) ? campo('License') : 'ver texto de licencia');
        const lic = [], notice = [];
        for (const n of lista.filter(n => /(^|\/)(licen[cs]e|copying|notice|authors)[^/]*$/i.test(n) && !n.endsWith('.py') && !n.endsWith('/'))) {
            const texto = tar(['-xOf', ruta, n]).stdout;
            (NOMBRE_NOTICE.test(basename(n)) ? notice : lic).push({ nombre: n.split('/').slice(-2).join('/'), texto });
        }
        paquetes.push({ pila: 'Pyodide', nombre: campo('Name'), version: campo('Version'), licencia: l, lic, notice, fuente: campo('Home-page') ?? (meta.match(/^Project-URL: (?:Source|Homepage|Repository)[^,]*, (.*)$/m) ?? [])[1] ?? '' });
    }
}

// ---------------------------------------------------------------- Lo que se descarga al instalar (solo información)
function descargado() {
    const py = join(RAIZ, 'backend', '.venv', 'Scripts', 'python.exe');
    if (!existsSync(py)) return null;
    const codigo = `
import importlib.metadata as m, json, re
norm=lambda n: re.sub(r'[-_.]+','-',n).lower()
raices=[norm(re.split(r'[=<>~!\\[; ]',l.strip())[0]) for l in open(r'${join(RAIZ, 'backend', 'requirements.txt').replace(/\\/g, '\\\\')}') if l.strip() and not l.startswith('#')]
dist={norm(d.metadata['Name']):d for d in m.distributions()}
visto={}
def ir(n):
    if n in visto or n not in dist: return
    visto[n]=dist[n]
    for r in dist[n].requires or []:
        if 'extra ==' in r: continue
        ir(norm(re.split(r'[=<>~!\\[; (]',r.strip())[0]))
for r in raices: ir(r)
fil=[]
for n,d in sorted(visto.items()):
    md=d.metadata; l=md.get('License-Expression') or ''
    if not l:
        c=[x.split('::')[-1].strip() for x in md.get_all('Classifier') or [] if x.startswith('License ::')]
        l=c[0] if c else (md.get('License') or '')
        if len(l)>50 or '\\n' in l: l=c[0] if c else 'ver paquete'
    fil.append([md['Name'], md['Version'], l])
print(json.dumps(fil))`;
    const r = spawnSync(py, ['-I', '-c', codigo], { encoding: 'utf8' });
    return r.status === 0 ? JSON.parse(r.stdout) : null;
}

npm(); rust(); ruedas();
const descargados = descargado();

// ---------------------------------------------------------------- Agrupar los textos de licencia (cada texto distinto, una vez)
const grupos = new Map();       // hash normalizado -> { id, texto, licencias:Set, n }
for (const p of paquetes) {
    p.ids = [];
    for (const f of p.lic) {
        const h = hash(normalizar(f.texto));
        if (!grupos.has(h)) grupos.set(h, { texto: f.texto.trim(), licencias: new Map(), n: 0 });
        const g = grupos.get(h); g.n++; g.licencias.set(p.licencia, (g.licencias.get(p.licencia) ?? 0) + 1);
        if (!p.ids.includes(h)) p.ids.push(h);
    }
}
const clasificar = t => /Mozilla Public License/i.test(t) ? 'MPL-2.0' : /Apache License/i.test(t) && /Version 2\.0/i.test(t) ? 'Apache-2.0'
    : /Permission is hereby granted, free of charge/i.test(t) ? 'MIT' : /Redistribution and use in source and binary forms/i.test(t) ? (/Neither the name|endorse or promote/i.test(t) ? 'BSD-3-Clause' : 'BSD-2-Clause')
    : /Permission to use, copy, modify, and\/or distribute/i.test(t) ? 'ISC' : null;
const ordenados = [...grupos.entries()].sort((a, b) => b[1].n - a[1].n);
const porSpdx = new Map();                              // SPDX -> grupo más usado (para los paquetes que no traen archivo de licencia)
for (const [h, g] of ordenados) { g.spdx = clasificar(g.texto); if (g.spdx && !porSpdx.has(g.spdx)) porSpdx.set(g.spdx, h); }
for (const p of paquetes) {
    if (p.lic.length) continue;
    const hs = [...new Set(String(p.licencia).split(/\s+(?:OR|AND|WITH)\s+|[\/()]/).map(s => porSpdx.get(s.trim())).filter(Boolean))];
    if (hs.length) { p.ids = /\bAND\b/.test(p.licencia) ? hs : hs.slice(0, 1); p.sinArchivo = true; }   // «A AND B»: hacen falta los dos textos; «A OR B»: basta uno
}
const idDe = new Map(ordenados.map(([h], i) => [h, `L${i + 1}`]));

// ---------------------------------------------------------------- Comprobaciones
const copyleft = paquetes.filter(p => COPYLEFT.test(p.licencia));
const debiles = paquetes.filter(p => DEBIL.test(p.licencia));
const sinTexto = paquetes.filter(p => p.lic.length === 0);
const mencionan = paquetes.filter(p => p.lic.some(f => COPYLEFT.test(sinFraseLibre(f.texto).replace(/(?:^|\n)\s*[^\n]*(?:does not|no es|not (?:covered|under))[^\n]*/gi, ''))) && !COPYLEFT.test(p.licencia));
console.warn(`Paquetes: npm ${paquetes.filter(p => p.pila === 'npm').length}, Rust ${paquetes.filter(p => p.pila === 'Rust').length}, ruedas de Pyodide ${paquetes.filter(p => p.pila === 'Pyodide').length}.`);
console.warn(`Con GPL/LGPL/AGPL/SSPL/no comercial en su licencia declarada: ${copyleft.length}${copyleft.length ? ' -> ' + copyleft.map(p => `${p.nombre}@${p.version} (${p.licencia})`).join(', ') : ''}`);
console.warn(`Sin archivo de licencia encontrado: ${sinTexto.length}${sinTexto.length ? ' -> ' + sinTexto.map(p => `${p.pila}:${p.nombre}@${p.version}`).join(', ') : ''}`);
if (mencionan.length) console.warn(`Su archivo de licencia nombra GPL/LGPL (revisar a mano): ${mencionan.map(p => `${p.pila}:${p.nombre}`).join(', ')}`);

// ---------------------------------------------------------------- Escribir el archivo
const o = [];
o.push('# Avisos de terceros', '',
    'Proyecto Alejandría es software MIT (ver [LICENSE](LICENSE)). Este archivo recoge los avisos de copyright y las licencias de las bibliotecas de terceros que **se redistribuyen dentro de la aplicación y del instalador**, y, solo como información, las que el instalador **descarga desde su origen**. Es orientación, no asesoría legal.', '',
    '> Generado por `npm run avisos` (script `frontend/scripts/avisos.mjs`): no se edita a mano.', '');

o.push('## Resumen', '',
    `- JavaScript empaquetado en la app (npm, producción y sus dependencias): **${paquetes.filter(p => p.pila === 'npm').length}** paquetes.`,
    `- Rust compilado en la app (Tauri y dependencias, Windows): **${paquetes.filter(p => p.pila === 'Rust').length}** crates.`,
    `- Pyodide y las ruedas de Python que lleva la app para los laboratorios: Pyodide ${pyodide.version} y **${paquetes.filter(p => p.pila === 'Pyodide').length}** ruedas.`,
    copyleft.length
        ? `- **Atención:** estas dependencias declaran GPL, LGPL, AGPL, SSPL o licencia no comercial: ${copyleft.map(p => `${p.nombre} ${p.version} (${p.licencia})`).join('; ')}.`
        : '- Ninguna de ellas declara GPL, LGPL, AGPL, SSPL ni licencia no comercial en sus metadatos.',
    '- Los modelos de IA (phi3:mini, qwen2.5, el modelo de clasificación) y Ollama **no se incluyen**: se descargan desde su origen; sus licencias están en la sección «Modelos de IA y software de terceros» del [README](README.md).', '');

o.push('## Pyodide (copyleft débil, MPL-2.0)', '',
    `La app incluye **Pyodide ${pyodide.version}** (${pyodide.licencia}) **sin modificar**. Código fuente de esa versión exacta: <https://github.com/pyodide/pyodide/tree/${pyodide.version}>.`, '');
const debilesOtros = debiles.filter(p => p.nombre !== 'pyodide');       // el paquete npm `pyodide` es el propio Pyodide, ya descrito arriba
if (debilesOtros.length) {
    o.push('Otras dependencias con MPL-2.0 (también sin modificar; su código fuente está en la dirección indicada o en su registro de paquetes):', '');
    for (const p of debilesOtros) o.push(`- ${p.pila}: ${p.nombre} ${p.version} (${p.licencia})${p.fuente ? ` — ${p.fuente}` : ''}`);
    o.push('');
}

const tabla = pila => {
    const fil = paquetes.filter(p => p.pila === pila).sort((a, b) => a.nombre.localeCompare(b.nombre));
    o.push('| Paquete | Versión | Licencia | Copyright | Texto |', '| --- | --- | --- | --- | --- |');
    for (const p of fil) o.push(`| ${celda(p.nombre)} | ${celda(p.version)} | ${celda(p.licencia)} | ${p.sinArchivo ? '_sin archivo de licencia en el paquete (texto estándar)_' : celda(copyright(p.lic.map(f => f.texto).join('\n')))} | ${p.ids.map(h => `[${idDe.get(h)}](#${idDe.get(h).toLowerCase()})`).join(', ') || '—'} |`);
    o.push('');
};
o.push('## JavaScript empaquetado (npm)', ''); tabla('npm');
o.push('## Rust compilado', ''); tabla('Rust');
o.push('## Ruedas de Python que lleva Pyodide', ''); tabla('Pyodide');

o.push('## Fuentes incluidas', '',
    '- **DejaVu Sans Mono** (laboratorios, interfaz y rótulos): licencia de las fuentes DejaVu/Bitstream Vera, texto en [frontend/public/fuentes/LICENSE_DEJAVU](frontend/public/fuentes/LICENSE_DEJAVU).',
    '- **Fuentes de KaTeX** (fórmulas): vienen en el paquete `katex` de la lista npm (su licencia figura arriba).', '');

if (descargado) {
    o.push('## Se descarga al instalar (no se redistribuye aquí)', '',
        'El instalador baja estas piezas desde su origen; cada una llega con su propia licencia. Se listan por transparencia.', '',
        '- **uv** (MIT o Apache-2.0): <https://github.com/astral-sh/uv>. **Python 3.13** (PSF-2.0), que instala uv desde <https://github.com/astral-sh/python-build-standalone>.',
        '- **Ollama** (MIT, opcional): <https://ollama.com>. Modelos de IA: ver el README.', '');
    if (descargados) {
        o.push('Librerías de Python de `backend/requirements.txt` y sus dependencias (licencia según los metadatos del entorno de desarrollo; las versiones instaladas pueden diferir ligeramente):', '', '| Paquete | Versión (desarrollo) | Licencia |', '| --- | --- | --- |');
        for (const [n, v, l] of descargados) o.push(`| ${celda(n)} | ${celda(v)} | ${celda(l)} |`);
        o.push('');
    }
}

o.push('## Textos de licencia', '',
    'Cada texto distinto aparece una vez. Los titulares del copyright de cada paquete están en las tablas de arriba; los textos de este apartado son los de los paquetes que remiten a ellos (puede cambiar solo la línea de copyright).', '');
for (const [h, g] of ordenados) {
    const nombres = [...g.licencias.entries()].sort((a, b) => b[1] - a[1]).map(([l]) => l).slice(0, 3).join(' / ');
    o.push(`### ${idDe.get(h)}`, '', `${nombres} · ${g.n} ${g.n === 1 ? 'archivo' : 'archivos'}`, '', '```text', g.texto, '```', '');
}

const conNotice = paquetes.filter(p => p.notice.length);
if (conNotice.length) {
    o.push('## Avisos NOTICE (Apache-2.0)', '');
    for (const p of conNotice) for (const f of p.notice) o.push(`### ${p.nombre} ${p.version} (${p.pila})`, '', '```text', f.texto.trim(), '```', '');
}

const salida = o.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
writeFileSync(join(RAIZ, 'THIRD-PARTY-NOTICES.md'), salida, 'utf8');
console.warn(`THIRD-PARTY-NOTICES.md escrito (${(salida.length / 1024).toFixed(0)} KB, ${ordenados.length} textos de licencia distintos, ${conNotice.length} NOTICE).`);
