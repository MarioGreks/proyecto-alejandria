import { useEffect, useMemo, useRef, useState } from 'react';
import { API } from '../utils/api';
import { errorDe } from '../utils/errorApi';
import { contactoVacio, errorContacto, etiquetaTipo, filtrarContactos, TIPOS_CONTACTO } from '../utils/agenda';
import type { Contacto, ContactoForm, TipoContacto } from '../utils/agenda';
import { Cabecera, Dialogo, Modal } from './terminal';

const etiqueta: React.CSSProperties = { color: 'var(--t-suave)', fontSize: 11, display: 'block', marginBottom: 3, fontFamily: 'var(--t-mono)' };
const ancho: React.CSSProperties = { width: '100%', boxSizing: 'border-box' };
const hoy = () => new Date().toISOString().slice(0, 10);

/** Agenda de contactos: a quién apuntaste y, sobre todo, para qué. Datos locales y privados (backend/agenda.py): no se sincronizan entre PCs. */
export default function Agenda({ onCerrar }: { onCerrar: () => void }) {
    const [contactos, setContactos] = useState<Contacto[] | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [tipo, setTipo] = useState('todos');
    const [editando, setEditando] = useState<{ id: string | null; datos: ContactoForm } | null>(null);
    const [errorForm, setErrorForm] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [borrar, setBorrar] = useState<Contacto | null>(null);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const archivo = useRef<HTMLInputElement>(null);

    const cargar = async () => {
        try {
            const res = await fetch(`${API}/api/agenda`);
            if (!res.ok) throw new Error(await errorDe(res));
            setContactos((await res.json()).contactos);
            setError('');
        } catch (e: any) {
            setError(e?.message ?? 'No se pudo leer la agenda.');
            setContactos(prev => prev ?? []);
        }
    };
    useEffect(() => { cargar(); }, []);

    const tiposOtros = useMemo(() => [...new Set((contactos ?? []).filter(c => c.tipo === 'Otro' && c.tipo_otro.trim()).map(c => c.tipo_otro.trim()))].sort(), [contactos]);
    const visibles = useMemo(() => filtrarContactos(contactos ?? [], busqueda, tipo), [contactos, busqueda, tipo]);

    const guardar = async () => {
        if (!editando) return;
        const e = errorContacto(editando.datos);
        if (e) { setErrorForm(e); return; }
        setGuardando(true);
        setErrorForm('');
        try {
            const res = await fetch(`${API}/api/agenda${editando.id ? `/${editando.id}` : ''}`, {
                method: editando.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editando.datos),
            });
            if (!res.ok) throw new Error(await errorDe(res));
            setEditando(null);
            setMensaje(editando.id ? 'Contacto actualizado.' : 'Contacto guardado.');
            await cargar();
        } catch (err: any) {
            setErrorForm(err?.message ?? 'No se pudo guardar.');
        } finally {
            setGuardando(false);
        }
    };

    const borrarContacto = async () => {
        const c = borrar;
        setBorrar(null);
        if (!c) return;
        try {
            const res = await fetch(`${API}/api/agenda/${c.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await errorDe(res));
            setMensaje(`«${c.quien}» borrado de la agenda.`);
            await cargar();
        } catch (e: any) {
            setError(e?.message ?? 'No se pudo borrar.');
        }
    };

    const exportar = async () => {
        setError(''); setMensaje('');
        try {
            const res = await fetch(`${API}/api/agenda/exportar`);
            if (!res.ok) throw new Error(await errorDe(res));
            const url = URL.createObjectURL(new Blob([JSON.stringify(await res.json(), null, 1)], { type: 'application/json' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `alejandria-agenda-${hoy()}.json`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
            setMensaje('Exportada: mira tu carpeta de Descargas. Contiene datos personales: guárdala con cuidado.');
        } catch (e: any) {
            setError(e?.message ?? 'No se pudo exportar.');
        }
    };

    const importar = async (f: File) => {
        setError(''); setMensaje('');
        try {
            let contenido: unknown;
            try { contenido = JSON.parse(await f.text()); } catch { throw new Error('El archivo no es un JSON válido.'); }
            const res = await fetch(`${API}/api/agenda/importar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contenido }) });
            if (!res.ok) throw new Error(await errorDe(res));
            const r = await res.json();
            setMensaje(`Añadidos ${r['añadidos']}${r.omitidos ? `, ya los tenías ${r.omitidos}` : ''}${r.invalidos ? `, ${r.invalidos} no válido(s) omitido(s)` : ''}.`);
            await cargar();
        } catch (e: any) {
            setError(e?.message ?? 'No se pudo importar.');
        }
    };

    const campo = (parcial: Partial<ContactoForm>) => setEditando(ed => (ed ? { ...ed, datos: { ...ed.datos, ...parcial } } : ed));

    return (
        <Modal ancho={860} z={55}>
            <Cabecera titulo="Agenda" onCerrar={onCerrar} />
            <p style={{ margin: '12px 0', color: 'var(--t-suave)', fontSize: 12, lineHeight: 1.5 }}>
                Tus contactos y, sobre todo, <span style={{ color: 'var(--t-ambar)' }}>para qué los guardaste</span>. Es privada: vive solo en este PC, no se sincroniza ni se sube a ningún sitio.
            </p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="t-btn principal" onClick={() => { setErrorForm(''); setEditando({ id: null, datos: contactoVacio() }); }}>[ + Nuevo contacto ]</button>
                <input className="t-campo" style={{ flex: 1, minWidth: 180 }} placeholder="buscar nombre, correo, teléfono, motivo..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                <select className="t-campo" value={tipo} onChange={e => setTipo(e.target.value)} title="Filtrar por tipo">
                    <option value="todos">Todos los tipos</option>
                    {TIPOS_CONTACTO.map(t => <option key={t} value={t}>{t}</option>)}
                    {tiposOtros.map(t => <option key={t} value={t}>Otro: {t}</option>)}
                </select>
            </div>
            {mensaje && <div style={{ marginTop: 10, color: 'var(--t-verde)', fontSize: 13 }}>{mensaje}</div>}
            {error && <div style={{ marginTop: 10, color: 'var(--t-error)', fontSize: 13 }}>[ERROR] {error}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                {contactos === null && <p>Leyendo la agenda...</p>}
                {contactos !== null && contactos.length === 0 && !error && (
                    <div style={{ color: 'var(--t-suave)', padding: '24px 20px', border: '1px dashed var(--t-linea)', textAlign: 'center', lineHeight: 1.6 }}>
                        [ ] La agenda está vacía<br />Apunta a alguien con «Nuevo contacto» y no olvides qué necesitas de esa persona.
                    </div>
                )}
                {contactos !== null && contactos.length > 0 && visibles.length === 0 && (
                    <div style={{ color: 'var(--t-suave)', padding: '18px 20px', border: '1px dashed var(--t-linea)', textAlign: 'center' }}>Ningún contacto coincide con la búsqueda.</div>
                )}
                {visibles.map(c => (
                    <div key={c.id} style={{ padding: 14, border: '1px solid var(--t-linea)', borderLeft: '3px solid var(--t-verde)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ color: 'var(--t-verde)', fontWeight: 700, fontSize: 15, wordBreak: 'break-word' }}>{c.quien}</div>
                                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--t-suave)', wordBreak: 'break-all' }}>
                                    <span style={{ color: 'var(--t-ambar)' }}>[{etiquetaTipo(c)}]</span>
                                    {c.correo && <> · {c.correo}</>}
                                    {c.telefono && <> · {c.telefono}</>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="t-btn" onClick={() => { setErrorForm(''); setEditando({ id: c.id, datos: { quien: c.quien, telefono: c.telefono, correo: c.correo, tipo: c.tipo, tipo_otro: c.tipo_otro, necesito: c.necesito } }); }}>[ Editar ]</button>
                                <button className="t-btn peligro" onClick={() => setBorrar(c)}>[ Borrar ]</button>
                            </div>
                        </div>
                        <div style={{ marginTop: 10, borderTop: '1px dashed var(--t-linea)', paddingTop: 8, fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            <span style={{ color: 'var(--t-ambar)', fontSize: 12 }}>## Qué necesito de este contacto: </span>{c.necesito}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px dashed var(--t-linea)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="t-btn" onClick={exportar}>[ Exportar agenda ]</button>
                <button className="t-btn" onClick={() => archivo.current?.click()}>[ Importar agenda... ]</button>
                <input ref={archivo} type="file" accept=".json,application/json" style={{ display: 'none' }}
                    onChange={ev => { const f = ev.target.files?.[0]; ev.target.value = ''; if (f) importar(f); }} />
                <span style={{ fontSize: 12, color: 'var(--t-suave)' }}>Importar solo añade los contactos que no tengas; nunca pisa los tuyos.</span>
            </div>

            {editando && (
                <Modal ancho={640} z={70}>
                    <Cabecera titulo={editando.id ? 'Editar contacto' : 'Nuevo contacto'} onCerrar={guardando ? undefined : () => setEditando(null)} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
                        <div><label style={etiqueta}>Quién es / de quién es *</label>
                            <input className="t-campo" autoFocus style={ancho} value={editando.datos.quien} placeholder="p. ej. Profesora X, Universidad Y (Australia)" onChange={e => campo({ quien: e.target.value })} /></div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                            <div><label style={etiqueta}>Correo</label><input className="t-campo" style={ancho} value={editando.datos.correo} onChange={e => campo({ correo: e.target.value })} /></div>
                            <div><label style={etiqueta}>Teléfono (con el correo basta con uno de los dos)</label><input className="t-campo" style={ancho} value={editando.datos.telefono} onChange={e => campo({ telefono: e.target.value })} /></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                            <div><label style={etiqueta}>Tipo</label>
                                <select className="t-campo" style={ancho} value={editando.datos.tipo} onChange={e => campo({ tipo: e.target.value as TipoContacto })}>
                                    {TIPOS_CONTACTO.map(t => <option key={t} value={t}>{t}</option>)}
                                </select></div>
                            {editando.datos.tipo === 'Otro' && (
                                <div><label style={etiqueta}>¿Qué tipo? *</label><input className="t-campo" style={ancho} value={editando.datos.tipo_otro} placeholder="p. ej. Servicios, Familia..." onChange={e => campo({ tipo_otro: e.target.value })} /></div>
                            )}
                        </div>
                        <div><label style={etiqueta}>Qué necesito de este contacto en el futuro * (para acordarte de por qué lo guardaste)</label>
                            <textarea className="t-campo" style={{ ...ancho, minHeight: 90, resize: 'vertical', lineHeight: 1.45 }} value={editando.datos.necesito} onChange={e => campo({ necesito: e.target.value })} /></div>
                    </div>
                    {errorForm && <div style={{ marginTop: 12, color: 'var(--t-error)', fontSize: 12 }}>[ERROR] {errorForm}</div>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                        <button className="t-btn plano" disabled={guardando} onClick={() => setEditando(null)}>[ Cancelar ]</button>
                        <button className="t-btn principal" disabled={guardando} onClick={guardar}>{guardando ? '[ Guardando... ]' : '[ Guardar ]'}</button>
                    </div>
                </Modal>
            )}
            {borrar && (
                <Dialogo titulo="Borrar contacto" peligro aceptar="Borrar" texto={`«${borrar.quien}» se borrará de la agenda. No se puede deshacer.`}
                    onAceptar={borrarContacto} onCancelar={() => setBorrar(null)} />
            )}
        </Modal>
    );
}
