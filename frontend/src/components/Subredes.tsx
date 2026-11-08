import { useMemo, useState } from 'react';
import { colorSubred, esMiembro, mismaSubred, normalizarNombre, vecinasDirectas } from '../utils/subredes';
import type { InfoSubred } from '../utils/subredes';
import { Cabecera, Dialogo, Modal } from './terminal';

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Cuadrito con el color de la subred (el mismo que tienen sus neuronas al entrar en ella). */
const Muestra = ({ nombre }: { nombre: string }) => <span style={{ display: 'inline-block', width: 10, height: 10, background: colorSubred(nombre), marginRight: 8, flex: 'none' }} />;

/** Botón de la barra superior: «[ Red: General ▾ ]». Despliega la lista de subredes para cambiar de red. */
export function SelectorSubred({ subredes, activa, calculando, onElegir, onGestionar }: {
    subredes: InfoSubred[]; activa: string | null; calculando: boolean; onElegir: (nombre: string | null) => void; onGestionar: () => void;
}) {
    const [abierto, setAbierto] = useState(false);
    const elegir = (n: string | null) => { setAbierto(false); onElegir(n); };
    return (
        <div style={{ position: 'relative' }}>
            <button className="t-btn" onClick={() => setAbierto(a => !a)} title="Cambiar entre la red general y tus subredes (TFM, Tesis...)"
                style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...(activa ? { borderColor: colorSubred(activa), color: colorSubred(activa) } : null) }}>
                [ Red: {activa ?? 'General'}{calculando ? ' …' : ''} ▾ ]
            </button>
            {abierto && (<>
                <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setAbierto(false)} />
                <div className="t-marco" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, minWidth: 260, maxHeight: 340, overflowY: 'auto', zIndex: 31, fontSize: 12 }}>
                    <div onClick={() => elegir(null)} style={{ padding: '7px 10px', cursor: 'pointer', color: activa === null ? 'var(--t-verde)' : 'var(--t-texto)' }}>
                        {activa === null ? '>' : ' '} General <span style={{ color: 'var(--t-suave)' }}>(todas las neuronas)</span>
                    </div>
                    {subredes.map(s => (
                        <div key={s.nombre} onClick={() => elegir(s.nombre)} style={{ padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                            color: activa && mismaSubred(activa, s.nombre) ? 'var(--t-verde)' : 'var(--t-texto)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                                <span style={{ marginRight: 6 }}>{activa && mismaSubred(activa, s.nombre) ? '>' : ' '}</span><Muestra nombre={s.nombre} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nombre}</span>
                            </span>
                            <span style={{ color: 'var(--t-suave)' }}>{s.neuronas}</span>
                        </div>
                    ))}
                    <div onClick={() => { setAbierto(false); onGestionar(); }} style={{ padding: '7px 10px', cursor: 'pointer', color: 'var(--t-ambar)', borderTop: '1px dashed var(--t-linea)' }}>
                        + gestionar subredes…
                    </div>
                </div>
            </>)}
        </div>
    );
}

/** Lista buscable de las neuronas de la red general con casillas para elegir cuáles van en la subred. */
export function ElegirNeuronas({ subred, nodos, onGuardar, onCerrar }: {
    subred: string; nodos: any[]; onGuardar: (añadir: string[], quitar: string[]) => Promise<void>; onCerrar: () => void;
}) {
    const inicial = useMemo(() => new Set(nodos.filter(n => esMiembro(n, subred)).map(n => String(n.id))), [nodos, subred]);
    const [marcadas, setMarcadas] = useState<Set<string>>(() => new Set(inicial));
    const [busqueda, setBusqueda] = useState('');
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const q = normalizar(busqueda.trim());
    const ordenadas = useMemo(() => [...nodos].sort((a, b) => String(a.nombre ?? '').localeCompare(String(b.nombre ?? ''))), [nodos]);
    const coinciden = useMemo(() => ordenadas.filter(n => !q || normalizar(`${n.nombre ?? ''} ${n.cluster_id ?? ''}`).includes(q)), [ordenadas, q]);
    const alternar = (id: string) => setMarcadas(m => { const s = new Set(m); s.has(id) ? s.delete(id) : s.add(id); return s; });
    const añadir = [...marcadas].filter(id => !inicial.has(id)), quitar = [...inicial].filter(id => !marcadas.has(id));

    const guardar = async () => {
        setGuardando(true); setError('');
        try { await onGuardar(añadir, quitar); onCerrar(); } catch (e: any) { setError(e?.message ?? 'No se pudo guardar.'); setGuardando(false); }
    };

    return (
        <Modal ancho={640} z={65}>
            <Cabecera titulo={`Neuronas de «${subred}»`} onCerrar={onCerrar} />
            <p style={{ margin: '12px 0', color: 'var(--t-suave)', fontSize: 12, lineHeight: 1.5 }}>
                Marca las neuronas que forman parte de esta subred. Siguen estando en la red general: quitarlas de aquí no las borra.
            </p>
            <input className="t-campo" autoFocus style={{ width: '100%', boxSizing: 'border-box' }} placeholder="buscar por nombre o clúster..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, margin: '10px 0', alignItems: 'center', flexWrap: 'wrap', fontSize: 12 }}>
                <button className="t-btn" onClick={() => setMarcadas(m => new Set([...m, ...coinciden.map(n => String(n.id))]))}>[ Marcar las {coinciden.length} que se ven ]</button>
                <button className="t-btn" onClick={() => setMarcadas(m => { const s = new Set(m); coinciden.forEach(n => s.delete(String(n.id))); return s; })}>[ Desmarcar las que se ven ]</button>
                <span style={{ color: 'var(--t-suave)' }}>{marcadas.size} en la subred</span>
            </div>
            <div style={{ border: '1px solid var(--t-linea)', maxHeight: 320, overflowY: 'auto' }}>
                {coinciden.slice(0, 400).map(n => {
                    const id = String(n.id);
                    return (
                        <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', cursor: 'pointer', fontSize: 13, background: marcadas.has(id) ? 'rgba(0,255,170,0.08)' : 'transparent' }}>
                            <input type="checkbox" className="t-check" checked={marcadas.has(id)} onChange={() => alternar(id)} />
                            <span style={{ flex: 1, minWidth: 0 }}>{n.nombre}</span>
                            <span style={{ color: 'var(--t-ambar)', fontSize: 11 }}>{n.cluster_id}</span>
                        </label>
                    );
                })}
                {coinciden.length === 0 && <div style={{ padding: 16, color: 'var(--t-suave)', textAlign: 'center' }}>[ ] Nada coincide</div>}
                {coinciden.length > 400 && <div style={{ padding: 8, color: 'var(--t-suave)', fontSize: 12, textAlign: 'center' }}>Se enseñan 400 de {coinciden.length}: afina la búsqueda.</div>}
            </div>
            {error && <div style={{ marginTop: 10, color: 'var(--t-error)', fontSize: 13 }}>[ERROR] {error}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, gap: 10 }}>
                <span style={{ color: 'var(--t-suave)', fontSize: 12 }}>+{añadir.length} / −{quitar.length}</span>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="t-btn plano" onClick={onCerrar}>[ Cancelar ]</button>
                    <button className="t-btn principal" disabled={guardando || (añadir.length === 0 && quitar.length === 0)} onClick={guardar}>[ Guardar ]</button>
                </div>
            </div>
        </Modal>
    );
}

type Accion = { tipo: 'renombrar' | 'borrar'; subred: InfoSubred } | null;

/** Crear, renombrar, borrar y rellenar subredes. Borrar una subred solo quita la etiqueta: las neuronas siguen en la red general. */
export default function GestionSubredes({ subredes, nodos, onCrear, onRenombrar, onBorrar, onGuardarMiembros, onCerrar }: {
    subredes: InfoSubred[]; nodos: any[];
    onCrear: (nombre: string) => void;
    onRenombrar: (viejo: string, nuevo: string) => Promise<void>;
    onBorrar: (nombre: string) => Promise<void>;
    onGuardarMiembros: (subred: string, añadir: string[], quitar: string[]) => Promise<void>;
    onCerrar: () => void;
}) {
    const [nueva, setNueva] = useState('');
    const [accion, setAccion] = useState<Accion>(null);
    const [nombreNuevo, setNombreNuevo] = useState('');
    const [rellenando, setRellenando] = useState<string | null>(null);
    const [error, setError] = useState('');

    const crear = () => {
        const n = normalizarNombre(nueva);
        if (!n) { setError('Escribe un nombre para la subred.'); return; }
        setError(''); setNueva('');
        onCrear(n);
        setRellenando(subredes.find(s => mismaSubred(s.nombre, n))?.nombre ?? n);      // recién creada: lo normal es rellenarla ya
    };
    const confirmar = async () => {
        const a = accion; setAccion(null);
        if (!a) return;
        setError('');
        try {
            if (a.tipo === 'renombrar') await onRenombrar(a.subred.nombre, nombreNuevo);
            else await onBorrar(a.subred.nombre);
        } catch (e: any) { setError(e?.message ?? 'No se pudo completar la acción.'); }
    };

    return (
        <Modal ancho={680} z={60}>
            <Cabecera titulo="Subredes" onCerrar={onCerrar} />
            <p style={{ margin: '12px 0', color: 'var(--t-suave)', fontSize: 12, lineHeight: 1.5 }}>
                Una subred es un grupo de neuronas de la red general (tu TFM, tu tesis, un trabajo...). Todas siguen estando en la general; borrar una subred solo quita la etiqueta.
                Se sincronizan con tus otros PCs. Una subred vacía solo existe en este PC hasta que tenga alguna neurona.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
                <input className="t-campo" style={{ flex: 1 }} placeholder="nombre de la subred nueva (p. ej. TFM)" value={nueva} maxLength={60}
                    onChange={e => setNueva(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') crear(); }} />
                <button className="t-btn principal" onClick={crear}>[ Crear ]</button>
            </div>
            {error && <div style={{ marginTop: 10, color: 'var(--t-error)', fontSize: 13 }}>[ERROR] {error}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                {subredes.length === 0 && <div style={{ color: 'var(--t-suave)', padding: '20px', border: '1px dashed var(--t-linea)', textAlign: 'center' }}>[ ] Aún no tienes subredes</div>}
                {subredes.map(s => (
                    <div key={s.nombre} style={{ padding: 10, border: '1px solid var(--t-linea)', borderLeft: `3px solid ${colorSubred(s.nombre)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ color: 'var(--t-verde)', fontWeight: 700, wordBreak: 'break-word' }}>{s.nombre}</div>
                            <div style={{ color: 'var(--t-suave)', fontSize: 12 }}>{s.neuronas} neurona(s)</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button className="t-btn" onClick={() => setRellenando(s.nombre)}>[ Neuronas ]</button>
                            <button className="t-btn" onClick={() => { setNombreNuevo(s.nombre); setAccion({ tipo: 'renombrar', subred: s }); }}>[ Renombrar ]</button>
                            <button className="t-btn peligro" onClick={() => setAccion({ tipo: 'borrar', subred: s })}>[ Borrar ]</button>
                        </div>
                    </div>
                ))}
            </div>

            {rellenando && <ElegirNeuronas subred={rellenando} nodos={nodos} onCerrar={() => setRellenando(null)} onGuardar={(a, q) => onGuardarMiembros(rellenando, a, q)} />}
            {accion?.tipo === 'renombrar' && (
                <Dialogo titulo="Renombrar subred" aceptar="Renombrar" texto={`Nuevo nombre para «${accion.subred.nombre}». Si ya existe una con ese nombre, se fusionan.`}
                    campo={{ valor: nombreNuevo, onCambio: setNombreNuevo }} onAceptar={confirmar} onCancelar={() => setAccion(null)} />
            )}
            {accion?.tipo === 'borrar' && (
                <Dialogo titulo="Borrar subred" peligro aceptar="Borrar" texto={`Se quitará la subred «${accion.subred.nombre}» de sus ${accion.subred.neuronas} neurona(s). Las neuronas NO se borran: siguen en la red general.`}
                    onAceptar={confirmar} onCancelar={() => setAccion(null)} />
            )}
        </Modal>
    );
}

/** Fila del panel de una neurona: a qué subredes pertenece (casillas), con «+vecinas» para añadir también las neuronas conectadas con ella, y «+ nueva…». */
export function FilaSubredes({ nodo, subredes, enlaces, onSubredes }: {
    nodo: any; subredes: InfoSubred[]; enlaces: { origen_id: string; destino_id: string }[];
    onSubredes: (ids: string[], añadir: string[], quitar: string[]) => Promise<void>;
}) {
    const [nueva, setNueva] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [trabajando, setTrabajando] = useState(false);
    const vecinas = useMemo(() => vecinasDirectas(String(nodo.id), enlaces), [nodo.id, enlaces]);
    const ejecutar = async (ids: string[], añadir: string[], quitar: string[]) => {
        setError(''); setTrabajando(true);
        try { await onSubredes(ids, añadir, quitar); } catch (e: any) { setError(e?.message ?? 'No se pudo cambiar la subred.'); } finally { setTrabajando(false); }
    };
    const crear = () => {
        const n = normalizarNombre(nueva);
        setNueva(null);
        if (n) ejecutar([String(nodo.id)], [n], []);
    };
    return (
        <div style={{ padding: '8px 20px', borderBottom: '1px dashed var(--t-linea)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ color: 'var(--t-ambar)' }}>## subredes</span>
            {subredes.length === 0 && <span style={{ color: 'var(--t-suave)' }}>aún no tienes ninguna</span>}
            {subredes.map(s => {
                const dentro = esMiembro(nodo, s.nombre);
                return (
                    <span key={s.nombre} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <button className="t-btn" disabled={trabajando} onClick={() => ejecutar([String(nodo.id)], dentro ? [] : [s.nombre], dentro ? [s.nombre] : [])}
                            title={dentro ? `Quitar esta neurona de «${s.nombre}» (sigue en la red general)` : `Incluir esta neurona en «${s.nombre}»`}
                            style={{ padding: '3px 8px', fontSize: 12, borderColor: colorSubred(s.nombre), color: dentro ? '#000' : colorSubred(s.nombre), background: dentro ? colorSubred(s.nombre) : 'transparent' }}>
                            [{dentro ? 'x' : ' '}] {s.nombre}
                        </button>
                        {dentro && vecinas.length > 0 && (
                            <button className="t-btn plano" disabled={trabajando} onClick={() => ejecutar([String(nodo.id), ...vecinas], [s.nombre], [])}
                                title={`Añadir también a «${s.nombre}» las ${vecinas.length} neurona(s) conectadas directamente con esta`} style={{ padding: '3px 4px', fontSize: 12, color: 'var(--t-suave)' }}>
                                +{vecinas.length} vecinas
                            </button>
                        )}
                    </span>
                );
            })}
            <button className="t-btn plano" disabled={trabajando} onClick={() => setNueva('')} style={{ padding: '3px 6px', fontSize: 12 }}>[ + nueva… ]</button>
            {error && <span style={{ color: 'var(--t-error)' }}>[ERROR] {error}</span>}
            {nueva !== null && (
                <Dialogo titulo="Nueva subred" aceptar="Crear e incluir" texto="Nombre de la subred (p. ej. TFM, Tesis, Trabajo 1). Esta neurona entrará en ella y seguirá en la red general."
                    campo={{ valor: nueva, onCambio: setNueva, placeholder: 'Nombre...' }} onAceptar={crear} onCancelar={() => setNueva(null)} />
            )}
        </div>
    );
}
