import { useState, useEffect } from 'react';
import { handleOpenExternal } from '../utils/markdown';
import { Md } from './Md';
import EditorNeurona from './EditorNeurona';
import { formDesdeNeurona, normalizarTipo, TIPOS_NEURONA } from '../utils/neurona';
import { promptRevision } from '../utils/prompts';
import LaboratorioWidget from './LaboratorioWidget';
import type { LaboratorioData } from './LaboratorioWidget';
import { API } from '../utils/api';
import { precalentarLaboratorios } from '../labs/labRunner';
import { Dialogo, Seccion } from './terminal';

type Tab = 'teoria' | 'glosario' | 'laboratorio' | 'ejercicios' | 'referencias' | 'sinapsis';

export interface ReferenciaItem {
    titulo: string;
    autores?: string;
    url?: string;
    nota?: string;
}

interface NodeData {
    id: string;
    nombre: string;
    cluster_id?: string;
    cluster?: string;
    tipo?: string;
    teoria: string;
    glosario: { termino: string, definicion: string }[];
    ejercicios: { enunciado: string, solucion: string }[];
    referencias?: (ReferenciaItem | string)[];
    laboratorio?: LaboratorioData;
}

const TABS: Tab[] = ['teoria', 'glosario', 'laboratorio', 'ejercicios', 'referencias', 'sinapsis'];
const TAB_LABELS: Record<Tab, string> = {
    teoria: 'Teoría',
    glosario: 'Glosario',
    laboratorio: 'Laboratorio',
    ejercicios: 'Ejercicios',
    referencias: 'Referencias',
    sinapsis: 'Sinapsis'
};

const MONO = 'var(--t-mono)';

/** Recuadro vacío con guiones: «aquí no hay nada». */
const Vacio = ({ children }: { children: React.ReactNode }) => (
    <div style={{ color: 'var(--t-suave)', fontFamily: MONO, fontSize: 13, padding: '24px 20px', border: '1px dashed var(--t-linea)', textAlign: 'center', lineHeight: 1.6 }}>{children}</div>
);

const Tarjeta = ({ children, color = 'var(--t-linea)' }: { children: React.ReactNode; color?: string }) => (
    <div style={{ padding: 16, border: '1px solid var(--t-linea)', borderLeft: `3px solid ${color}` }}>{children}</div>
);

function EjercicioWidget({ ejercicio }: { ejercicio: { enunciado: string, solucion: string } }) {
    const [mostrar, setMostrar] = useState(false);

    return (
        <div style={{ border: '1px solid var(--t-linea)', padding: 20, marginTop: 20 }}>
            <div style={{ color: 'var(--t-ambar)', fontFamily: MONO, fontSize: 13, marginBottom: 12 }}>## Problema práctico</div>
            <div className="markdown-container" style={{ fontSize: 15, color: 'var(--t-texto)', lineHeight: 1.6 }}>
                <Md texto={ejercicio.enunciado} />
            </div>

            {!mostrar ? (
                <button className="t-btn" onClick={() => setMostrar(true)} style={{ marginTop: 16 }}>[ Mostrar solución ]</button>
            ) : (
                <div style={{ marginTop: 20, borderTop: '1px dashed var(--t-linea)', paddingTop: 16 }}>
                    <div style={{ color: 'var(--t-ambar)', fontFamily: MONO, fontSize: 13, marginBottom: 12 }}>## Solución detallada</div>
                    <div className="markdown-container" style={{ fontSize: 15, color: 'var(--t-texto)', lineHeight: 1.6 }}>
                        <Md texto={ejercicio.solucion} />
                    </div>
                    <button className="t-btn peligro" onClick={() => setMostrar(false)} style={{ marginTop: 16 }}>[ Ocultar solución ]</button>
                </div>
            )}
        </div>
    );
}

export default function KnowledgePanel({
    nodeId,
    onClose,
    universeNodes = [],
    universeLinks = []
}: {
    nodeId: string | null;
    onClose: () => void;
    universeNodes?: any[];
    universeLinks?: any[];
}) {
    const [activeTab, setActiveTab] = useState<Tab>('teoria');
    const [data, setData] = useState<NodeData | null>(null);
    const [loading, setLoading] = useState(false);

    const [newEdgeTarget, setNewEdgeTarget] = useState<string>('');
    const [newEdgeReason, setNewEdgeReason] = useState<string>('');

    // Diálogos propios (en vez de prompt/confirm/alert del sistema) y mensaje de error de la cabecera
    const [dialogo, setDialogo] = useState<'cluster' | 'borrar' | 'descartar' | null>(null);
    const [clusterNuevo, setClusterNuevo] = useState('');
    const [aviso, setAviso] = useState('');
    const [info, setInfo] = useState('');                 // mensaje en verde (copiado, guardado...)
    const [editando, setEditando] = useState(false);      // editor de la neurona abierto
    const [editorSucio, setEditorSucio] = useState(false);   // con cambios sin guardar

    useEffect(() => {
        if (nodeId !== null) {
            precalentarLaboratorios();   // el motor de laboratorios tarda ~3 s en arrancar: que ya esté listo al abrir la pestaña
            setLoading(true);
            setAviso('');
            setInfo('');
            setEditando(false);
            // Hacemos la llamada real a nuestro Backend de Python (Fase 1)
            fetch(`${API}/node/${nodeId}`)
                .then(res => res.json())
                .then(json => {
                    setData(json);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error al conectar con el backend de Python:", err);
                    setLoading(false);
                });
        }
    }, [nodeId]);

    if (nodeId === null) return null;

    const handleCreateManualEdge = async () => {
        if (!newEdgeTarget) return;
        try {
            const res = await fetch(`${API}/api/arista`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    origen_id: data!.id,
                    destino_id: newEdgeTarget,
                    motivo: newEdgeReason || 'Conexión manual creada por el usuario'
                })
            });
            if (res.ok) {
                window.location.reload();
            } else {
                setAviso('Error: no se pudo crear la conexión.');
            }
        } catch (e) {
            console.error(e);
            setAviso('Error de conexión con el núcleo.');
        }
    };

    const cambiarCluster = async () => {
        const nuevo = clusterNuevo.trim();
        if (!nuevo) return;
        setDialogo(null);
        try {
            const res = await fetch(`${API}/api/node/${nodeId}/cluster`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nuevo_cluster: nuevo })
            });
            if (res.ok) window.location.reload();
            else setAviso(`Error: ${(await res.json()).detail}`);
        } catch {
            setAviso('Error de red al intentar actualizar el clúster.');
        }
    };

    const destruir = async () => {
        setDialogo(null);
        try {
            const res = await fetch(`${API}/api/node/${nodeId}`, { method: 'DELETE' });
            if (res.ok) window.location.reload();
            else setAviso(`Error: ${(await res.json()).detail}`);
        } catch {
            setAviso('Error de conexión con el núcleo al intentar destruir la neurona.');
        }
    };

    /** Copia al portapapeles el prompt para que una IA externa revise esta neurona (el resultado se pega en el editor). */
    const pedirRevision = async () => {
        if (!data) return;
        const prompt = promptRevision({ id: data.id, nombre: data.nombre, cluster: data.cluster ?? data.cluster_id, tipo: normalizarTipo(data.tipo) ?? 'formal',
            teoria: data.teoria, glosario: data.glosario, ejercicios: data.ejercicios, referencias: data.referencias });
        let copiado = false;
        try { await navigator.clipboard.writeText(prompt); copiado = true; } catch { /* sin permiso del portapapeles: se prueba con un campo temporal */ }
        if (!copiado) {
            const t = document.createElement('textarea');
            t.value = prompt; t.style.position = 'fixed'; t.style.opacity = '0';
            document.body.appendChild(t); t.select();
            try { copiado = document.execCommand('copy'); } catch { copiado = false; }
            t.remove();
        }
        if (!copiado) { setInfo(''); setAviso('Error: no se pudo copiar al portapapeles.'); return; }
        setAviso('');
        setInfo(`Prompt de revisión copiado (${prompt.length.toLocaleString('es-ES')} caracteres). Pégalo en tu IA y, con su respuesta, usa [ Editar ] → [ Pegar JSON revisado ].`);
    };

    const cerrar = () => (editando && editorSucio ? setDialogo('descartar') : onClose());
    const tipoInfo = data ? TIPOS_NEURONA.find(t => t.id === (normalizarTipo(data.tipo) ?? 'formal')) : undefined;
    const title = loading || !data ? 'Estableciendo conexión sináptica...' : data.nombre;
    const enlaces = data ? universeLinks.filter(l => l.origen_id === data.id || l.destino_id === data.id) : [];

    return (
        <div className="t-marco" style={{
            position: 'absolute',
            top: 48,
            bottom: 48,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '92%',
            maxWidth: 1000,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 20,
            overflow: 'hidden'
        }}>
            {/* Cabecera */}
            <div style={{ padding: '16px 20px', borderBottom: '1px dashed var(--t-linea)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--t-ambar)', marginBottom: 6 }}>
                        ## neurona{data && !loading ? ` | cluster: ${data.cluster_id ?? universeNodes.find(n => n.id === data.id)?.cluster_id ?? '—'}` : ''}
                        {data && !loading && tipoInfo && <span title={`Tipo: ${tipoInfo.etiqueta}. ${tipoInfo.ayuda}`} style={{ color: 'var(--t-suave)' }}> | tipo: [{tipoInfo.sigla}] {tipoInfo.etiqueta.toLowerCase()}</span>}
                    </div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--t-verde)', fontFamily: MONO }}>&gt; {title}</h2>
                    {aviso && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--t-error)' }}>{aviso}</div>}
                    {info && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--t-verde)', lineHeight: 1.5 }}>{info}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 'none' }}>
                    <button className="t-btn" title="Editar el nombre, la teoría, el glosario, los ejercicios y las referencias" disabled={loading || !data || editando} onClick={() => { setInfo(''); setAviso(''); setEditando(true); }}>[ Editar ]</button>
                    <button className="t-btn" title="Copiar un prompt para que una IA externa revise esta neurona" disabled={loading || !data} onClick={pedirRevision}>[ Pedir revisión ]</button>
                    <button className="t-btn" title="Corregir el clúster a mano" onClick={() => { setClusterNuevo(''); setDialogo('cluster'); }}>[ Editar clúster ]</button>
                    <button className="t-btn peligro" title="Mandar la neurona a la papelera (se puede recuperar)" onClick={() => setDialogo('borrar')}>[ A la papelera ]</button>
                    <button className="t-btn plano" title="Cerrar" onClick={cerrar} style={{ fontSize: 16 }}>[x]</button>
                </div>
            </div>

            {/* Pestañas */}
            {!editando && <div style={{ display: 'flex', padding: '0 12px', borderBottom: '1px solid var(--t-linea)' }}>
                {TABS.map(tab => (
                    <button key={tab} className={`t-tab${activeTab === tab ? ' activa' : ''}`} onClick={() => setActiveTab(tab)}>
                        {activeTab === tab ? `[ ${TAB_LABELS[tab]} ]` : TAB_LABELS[tab]}
                    </button>
                ))}
            </div>}

            {/* Contenido Dinámico */}
            <div style={{ flex: 1, padding: 28, overflowY: 'auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {loading && <p style={{ color: 'var(--t-verde)', fontFamily: MONO }}>&gt; Leyendo memoria...</p>}

                {!loading && data && editando && (
                    <EditorNeurona key={data.id} nodeId={nodeId!} inicial={formDesdeNeurona(data)} onCambios={setEditorSucio}
                        onGuardado={n => { setData(n); setEditando(false); setAviso(''); setInfo('Neurona guardada.'); }} onSalir={() => setEditando(false)} />
                )}

                {!loading && data && !editando && activeTab === 'teoria' && (
                    <div className="markdown-container" style={{ lineHeight: 1.6, fontSize: 16, textAlign: 'justify', color: '#e0e0e0' }}>
                        <Md texto={data.teoria} />
                    </div>
                )}

                {!loading && data && !editando && activeTab === 'glosario' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'justify' }}>
                        {(data.glosario ?? []).length === 0 && <Vacio>[ ] Este concepto no tiene glosario</Vacio>}
                        {(data.glosario ?? []).map((g, idx) => (
                            <Tarjeta key={idx} color="var(--t-ambar)">
                                <div style={{ margin: '0 0 8px 0', color: 'var(--t-verde)', fontSize: 17, fontWeight: 700 }}>
                                    <Md texto={g.termino} enLinea />
                                </div>
                                <div style={{ fontSize: 15, color: '#c8d0d0' }}>
                                    <Md texto={g.definicion} />
                                </div>
                            </Tarjeta>
                        ))}
                    </div>
                )}

                {!loading && data && !editando && activeTab === 'laboratorio' && (
                    <div style={{ marginTop: 6 }}>
                        <LaboratorioWidget
                            key={nodeId}
                            data={data.laboratorio ?? null}
                            nodeId={nodeId!}
                            onGuardado={lab => setData(d => (d ? { ...d, laboratorio: lab } : d))}
                        />
                    </div>
                )}

                {!loading && data && !editando && activeTab === 'ejercicios' && (
                    <div style={{ textAlign: 'justify' }}>
                        {(data.ejercicios ?? []).length === 0 && <Vacio>[ ] Este concepto no tiene ejercicios (es histórico o conceptual, o no se generaron)</Vacio>}
                        {(data.ejercicios ?? []).map((ej, idx) => (
                            <EjercicioWidget key={idx} ejercicio={ej} />
                        ))}
                    </div>
                )}

                {!loading && data && !editando && activeTab === 'referencias' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'justify' }}>
                        {(!data.referencias || data.referencias.length === 0) ? (
                            <Vacio>
                                <div style={{ color: 'var(--t-texto)', marginBottom: 8 }}>[ ] No hay referencias bibliográficas indexadas en este nodo</div>
                                Las nuevas neuronas generadas con el Prompt Maestro incluirán sus fuentes académicas con enlaces y las deducciones extraídas de cada una.
                            </Vacio>
                        ) : (
                            data.referencias.map((ref, idx) => {
                                const isString = typeof ref === 'string';
                                const titulo = isString ? ref : ref.titulo;
                                const autores = isString ? undefined : ref.autores;
                                const url = isString ? undefined : ref.url;
                                const nota = isString ? undefined : ref.nota;

                                return (
                                    <Tarjeta key={idx} color="var(--t-verde)">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                                            <div style={{ flex: 1, minWidth: 240 }}>
                                                <h3 style={{ margin: '0 0 6px 0', fontSize: 16, color: '#fff', fontWeight: 700, lineHeight: 1.4 }}>
                                                    {url ? (
                                                        <a href={url} onClick={(e) => handleOpenExternal(e, url)} target="_blank" rel="noopener noreferrer"
                                                            style={{ color: 'var(--t-verde)', textDecoration: 'none' }}
                                                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--t-ambar)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--t-verde)'}>
                                                            {titulo}
                                                        </a>
                                                    ) : titulo}
                                                </h3>
                                                {autores && <div style={{ fontSize: 13, color: 'var(--t-suave)', fontStyle: 'italic' }}>{autores}</div>}
                                            </div>
                                            {url && (
                                                <a className="t-btn" href={url} onClick={(e) => handleOpenExternal(e, url)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>
                                                    [ Ver fuente oficial ]
                                                </a>
                                            )}
                                        </div>

                                        {nota && (
                                            <div style={{ marginTop: 14, border: '1px dashed var(--t-linea)', padding: '12px 16px' }}>
                                                <div style={{ color: 'var(--t-ambar)', fontFamily: MONO, fontSize: 12, marginBottom: 6 }}>## Conceptos y deducciones extraídas</div>
                                                <div className="markdown-container" style={{ color: '#d0d7de', fontSize: 14, lineHeight: 1.6 }}>
                                                    <Md texto={nota} />
                                                </div>
                                            </div>
                                        )}
                                    </Tarjeta>
                                );
                            })
                        )}
                    </div>
                )}

                {!loading && data && !editando && activeTab === 'sinapsis' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'justify' }}>
                        {enlaces.length === 0 ? (
                            <Vacio>Esta neurona aún no ha formado conexiones sinápticas con otras.</Vacio>
                        ) : (
                            enlaces.map((link, idx) => {
                                const isOrigen = link.origen_id === data.id;
                                const otherId = isOrigen ? link.destino_id : link.origen_id;
                                const otherNode = universeNodes.find(n => n.id === otherId);
                                const otherName = otherNode ? otherNode.nombre : otherId;

                                const handleFeedback = async (origen_id: string, destino_id: string, status: string) => {
                                    try {
                                        const res = await fetch(`${API}/api/arista/status`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ origen_id, destino_id, status })
                                        });
                                        if (res.ok) window.location.reload();
                                        else setAviso('Error: no se pudo actualizar el estado de la conexión.');
                                    } catch (e) {
                                        console.error(e);
                                        setAviso('Error de conexión con el núcleo.');
                                    }
                                };

                                return (
                                    <Tarjeta key={idx} color="var(--t-verde)">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, margin: '0 0 12px 0', flexWrap: 'wrap' }}>
                                            <div style={{ color: 'var(--t-verde)', fontSize: 16, fontWeight: 700, fontFamily: MONO }}>&lt;&gt; Conexión con: {otherName}</div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                {link.estado !== 'aceptada' ? (
                                                    <button className="t-btn" title="Validar la conexión (correcta)" onClick={() => handleFeedback(link.origen_id, link.destino_id, 'aceptada')}>[ Aceptar ]</button>
                                                ) : (
                                                    <span title="Sinapsis consolidada" style={{ fontFamily: MONO, fontSize: 13, color: 'var(--t-suave)', alignSelf: 'center' }}>[ Consolidada ]</span>
                                                )}
                                                <button className="t-btn peligro" title="Rechazar y eliminar la conexión" onClick={() => handleFeedback(link.origen_id, link.destino_id, 'rechazada')}>[ Rechazar ]</button>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 15, color: '#ddd', lineHeight: 1.6 }}>
                                            <span style={{ color: 'var(--t-ambar)', fontFamily: MONO, fontSize: 12, display: 'block', marginBottom: 4 }}>
                                                {link.estado === 'aceptada' && (link.motivo || '').includes('creada por el usuario') ? '## Conexión manual' : '## Razonamiento del motor lógico'}
                                            </span>
                                            {link.motivo}
                                        </div>
                                    </Tarjeta>
                                );
                            })
                        )}

                        <Seccion titulo="Establecer nueva conexión manual" estilo={{ marginTop: 14 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <select className="t-campo" value={newEdgeTarget} onChange={(e) => setNewEdgeTarget(e.target.value)}>
                                    <option value="">Selecciona una neurona destino...</option>
                                    {universeNodes.filter(n => n.id !== data.id).map(n => (
                                        <option key={n.id} value={n.id}>{n.nombre}</option>
                                    ))}
                                </select>
                                <input className="t-campo" type="text" placeholder="Motivo (opcional)..." value={newEdgeReason} onChange={(e) => setNewEdgeReason(e.target.value)} />
                                <button className="t-btn principal" onClick={handleCreateManualEdge} disabled={!newEdgeTarget} style={{ alignSelf: 'flex-start' }}>
                                    [ Fusionar neuronas ]
                                </button>
                            </div>
                        </Seccion>
                    </div>
                )}
            </div>

            {dialogo === 'cluster' && (
                <Dialogo titulo="Editar clúster" texto="Escribe la categoría correcta para esta neurona (por ejemplo: Física, Matemáticas, Economía). Se usará para aprender de la corrección."
                    aceptar="Guardar" campo={{ valor: clusterNuevo, onCambio: setClusterNuevo, placeholder: 'Categoría...' }}
                    onAceptar={cambiarCluster} onCancelar={() => setDialogo(null)} />
            )}
            {dialogo === 'borrar' && (
                <Dialogo titulo="Mandar a la papelera" texto="Esta neurona irá a la papelera y desaparecerá del universo. Durante 7 días podrás recuperarla, con sus conexiones, desde [ Papelera ] en la barra superior; pasado ese tiempo se borra sola. Recargará la red."
                    aceptar="A la papelera" peligro onAceptar={destruir} onCancelar={() => setDialogo(null)} />
            )}
            {dialogo === 'descartar' && (
                <Dialogo titulo="Descartar cambios" texto="Estás editando esta neurona y hay cambios sin guardar. Si cierras ahora se pierden."
                    aceptar="Descartar y cerrar" peligro onAceptar={() => { setDialogo(null); onClose(); }} onCancelar={() => setDialogo(null)} />
            )}
        </div>
    );
}
