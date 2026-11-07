import test from 'node:test';
import assert from 'node:assert/strict';
import { contactoVacio, errorContacto, etiquetaTipo, filtrarContactos } from './agenda.ts';

// Contactos inventados: la agenda real nunca va en el repositorio.
const base = { ...contactoVacio(), quien: 'Profesora Ficticia (Universidad de Ejemplo, Sídney)', correo: 'ficticia@example.org', necesito: 'Preguntarle por el intercambio de 2027' };
const LISTA = [
    { id: '1', ...base },
    { id: '2', ...base, quien: 'Ana Empresa', correo: '', telefono: '+34 600 000 000', tipo: 'Corporativo', necesito: 'Presupuesto de la licencia' },
    { id: '3', ...base, quien: 'Fontanero de guardia', correo: '', telefono: '600 111 222', tipo: 'Otro', tipo_otro: 'Servicios', necesito: 'Urgencias de agua' },
];

test('el tipo que se enseña es el elegido o, en «Otro», el que escribió el usuario', () => {
    assert.equal(etiquetaTipo({ tipo: 'Académico', tipo_otro: '' }), 'Académico');
    assert.equal(etiquetaTipo({ tipo: 'Otro', tipo_otro: ' Servicios ' }), 'Servicios');
    assert.equal(etiquetaTipo({ tipo: 'Otro', tipo_otro: '' }), 'Otro');
});

test('validación: quién, teléfono o correo, correo con forma, «Otro» con texto y para qué lo apuntaste', () => {
    assert.equal(errorContacto(base), null);
    assert.match(errorContacto({ ...base, quien: ' ' }), /quién es/);
    assert.match(errorContacto({ ...base, correo: '', telefono: '' }), /teléfono o un correo/);
    assert.equal(errorContacto({ ...base, correo: '', telefono: '+61 2 0000 0000' }), null);
    assert.match(errorContacto({ ...base, correo: 'sin-arroba' }), /correo no parece válido/);
    assert.match(errorContacto({ ...base, tipo: 'Otro', tipo_otro: '  ' }), /En «Otro»/);
    assert.equal(errorContacto({ ...base, tipo: 'Otro', tipo_otro: 'Servicios' }), null);
    assert.match(errorContacto({ ...base, necesito: '' }), /qué necesitas/);
});

test('buscar: todas las palabras, sin tildes ni mayúsculas, en cualquier campo', () => {
    assert.deepEqual(filtrarContactos(LISTA, 'sidney').map(c => c.id), ['1']);              // «Sídney» sin tilde
    assert.deepEqual(filtrarContactos(LISTA, 'EXAMPLE.ORG').map(c => c.id), ['1']);
    assert.deepEqual(filtrarContactos(LISTA, '600 000').map(c => c.id), ['2']);
    assert.deepEqual(filtrarContactos(LISTA, 'licencia presupuesto').map(c => c.id), ['2']);    // el orden de las palabras da igual
    assert.deepEqual(filtrarContactos(LISTA, 'servicios').map(c => c.id), ['3']);             // también busca en el tipo escrito en «Otro»
    assert.deepEqual(filtrarContactos(LISTA, 'intercambio licencia'), []);                  // las dos palabras deben estar en el MISMO contacto
    assert.equal(filtrarContactos(LISTA, '   ').length, 3);
});

test('filtrar por tipo: uno de los tres, «todos» o el texto de un «Otro»', () => {
    assert.deepEqual(filtrarContactos(LISTA, '', 'Académico').map(c => c.id), ['1']);
    assert.deepEqual(filtrarContactos(LISTA, '', 'Corporativo').map(c => c.id), ['2']);
    assert.deepEqual(filtrarContactos(LISTA, '', 'Otro').map(c => c.id), ['3']);
    assert.deepEqual(filtrarContactos(LISTA, '', 'Servicios').map(c => c.id), ['3']);
    assert.equal(filtrarContactos(LISTA, '', 'todos').length, 3);
    assert.deepEqual(filtrarContactos(LISTA, 'ana', 'Académico'), []);                      // búsqueda y tipo se combinan
});
