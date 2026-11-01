import test from 'node:test';
import assert from 'node:assert/strict';
import { dibujarPilar, RAMPA } from './pilarAscii.ts';

test('dibujarPilar: rejilla del tamaño pedido, solo caracteres de la rampa y algo dibujado', () => {
    const f = dibujarPilar(0, 30, 20).split('\n');
    assert.equal(f.length, 20);
    assert.ok(f.every(l => l.length === 30));
    assert.ok([...f.join('')].every(c => RAMPA.includes(c)));
    assert.ok(f.join('').replace(/ /g, '').length > 100);
});

test('dibujarPilar: gira (fotogramas distintos), es periódico (2π) y la silueta no se sale de la rejilla', () => {
    assert.notEqual(dibujarPilar(0), dibujarPilar(0.5));
    assert.equal(dibujarPilar(0.7), dibujarPilar(0.7 + 2 * Math.PI));
    const f = dibujarPilar(1.2, 40, 28).split('\n');
    assert.ok(f.slice(0, 1).join('').trim() === '' && f.slice(-1).join('').trim() !== '');   // hay margen arriba y la basa llega abajo
});

test('barraAscii: 20 posiciones, redondeo y límites', async () => {
    const { barraAscii } = await import('./barraAscii.ts');
    assert.equal(barraAscii(0), '[....................]   0%');
    assert.equal(barraAscii(50), '[##########..........]  50%');
    assert.equal(barraAscii(100), '[####################] 100%');
    assert.equal(barraAscii(140), barraAscii(100));
    assert.equal(barraAscii(-5), barraAscii(0));
});
