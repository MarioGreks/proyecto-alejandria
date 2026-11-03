import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const leer = ruta => readFileSync(new URL(ruta, import.meta.url), 'utf-8').replace(/^﻿/, '');
const conf = JSON.parse(leer('../../src-tauri/tauri.conf.json'));
const actualizador = conf.plugins?.updater;

test('el actualizador lleva una clave pública minisign y solo habla por https con el repositorio del proyecto', () => {
    assert.ok(actualizador, 'falta plugins.updater en tauri.conf.json');
    const clave = Buffer.from(actualizador.pubkey, 'base64').toString('utf-8');
    assert.match(clave, /^untrusted comment: minisign public key: [0-9A-F]+\n[A-Za-z0-9+/=]{40,}\s*$/);
    assert.ok(actualizador.endpoints.length >= 1);
    for (const e of actualizador.endpoints) assert.match(e, /^https:\/\/github\.com\/MarioGreks\/proyecto-alejandria\/releases\/latest\/download\/latest\.json$/);
    assert.ok(!actualizador.dangerousInsecureTransportProtocol, 'no se admite http');
});

test('la ventana no recibe permisos del plugin (la comprobación va por los comandos propios de Rust, con la dirección fija)', () => {
    const permisos = JSON.parse(leer('../../src-tauri/capabilities/default.json')).permissions;
    assert.deepEqual(permisos.filter(p => String(p).startsWith('updater')), []);
});

test('el CI firma el instalador y publica la firma y latest.json junto a él', () => {
    const flujo = leer('../../../.github/workflows/publicar.yml');
    assert.match(flujo, /TAURI_SIGNING_PRIVATE_KEY: \$\{\{ secrets\.TAURI_SIGNING_PRIVATE_KEY \}\}/);
    assert.match(flujo, /tauri signer sign/);
    for (const f of ['Proyecto-Alejandria-Setup.exe.sig', 'latest.json', 'Proyecto-Alejandria-Setup.exe', 'SHA256SUMS.txt']) assert.ok(flujo.includes(f), f);
});

test('el instalador entiende lo que le pasa el actualizador (/UPDATE, /P) y pide carpetas nuevas solo si sube ESQUEMA', () => {
    const nsi = leer('../../installer/instalador.nsi');
    assert.ok(nsi.includes('GetOptions} $R0 "/UPDATE"'));
    assert.ok(nsi.includes('GetOptions} $R0 "/ACTUALIZAR"'));
    assert.match(nsi, /!define ESQUEMA \d+/);
    assert.match(leer('../../installer/instalacion.nsh'), /WriteRegDWORD HKCU "\$ClaveDesinst" "Esquema" \$EsquemaActual/);
    assert.ok(!/PRUEBA_BASE/.test(leer('../../installer/construir.mjs')), 'el instalador publicado no debe fabricarse con la variante de prueba');
});
