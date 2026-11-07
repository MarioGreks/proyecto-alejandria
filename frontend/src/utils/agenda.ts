// Lógica pura de la agenda de contactos (sin React ni red). El backend (agenda.py) vuelve a validar y es quien guarda.

export type TipoContacto = 'Académico' | 'Corporativo' | 'Otro';
export const TIPOS_CONTACTO: TipoContacto[] = ['Académico', 'Corporativo', 'Otro'];

export interface ContactoForm {
    quien: string;          // quién es / de quién es
    telefono: string;
    correo: string;
    tipo: TipoContacto;
    tipo_otro: string;      // solo con tipo «Otro»
    necesito: string;       // qué necesito de este contacto en el futuro
}
export interface Contacto extends ContactoForm { id: string; creado?: string; modificado?: string }

export const contactoVacio = (): ContactoForm => ({ quien: '', telefono: '', correo: '', tipo: 'Académico', tipo_otro: '', necesito: '' });

/** Lo que se enseña como tipo: «Académico», «Corporativo» o lo que el usuario escribió en «Otro». */
export const etiquetaTipo = (c: Pick<ContactoForm, 'tipo' | 'tipo_otro'>): string => (c.tipo === 'Otro' ? (c.tipo_otro.trim() || 'Otro') : c.tipo);

/** Primer problema que impide guardar (los mismos que exige el backend), o null. */
export function errorContacto(f: ContactoForm): string | null {
    if (!f.quien.trim()) return 'Escribe quién es o de quién es el contacto.';
    if (!f.telefono.trim() && !f.correo.trim()) return 'Pon al menos un teléfono o un correo.';
    if (f.correo.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.correo.trim())) return 'El correo no parece válido.';
    if (f.tipo === 'Otro' && !f.tipo_otro.trim()) return 'En «Otro», escribe qué tipo de contacto es.';
    if (!f.necesito.trim()) return 'Apunta qué necesitas de este contacto en el futuro (es para acordarte de por qué lo guardaste).';
    return null;
}

const plano = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Búsqueda (todas las palabras, sin tildes ni mayúsculas, en cualquier campo) y filtro por tipo. `tipo`: 'todos', un tipo, o el texto de un «Otro». */
export function filtrarContactos(lista: Contacto[], busqueda: string, tipo: string = 'todos'): Contacto[] {
    const palabras = plano(busqueda).split(/\s+/).filter(Boolean);
    return lista.filter(c => {
        if (tipo !== 'todos' && c.tipo !== tipo && etiquetaTipo(c) !== tipo) return false;
        const pajar = plano([c.quien, c.telefono, c.correo, etiquetaTipo(c), c.necesito].join(' \n '));
        return palabras.every(p => pajar.includes(p));
    });
}
