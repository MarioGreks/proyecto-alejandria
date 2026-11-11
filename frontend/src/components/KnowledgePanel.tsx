import { useState, useEffect, useMemo } from 'react';
import { handleOpenExternal } from '../utils/markdown';
import { Md } from './Md';
import EditorNeurona from './EditorNeurona';
import { formDesdeNeurona, leerSinapsis, normalizarTipo, TIPOS_NEURONA } from '../utils/neurona';
import type { RevisionSinapsis, SinapsisActual } from '../utils/neurona';
import { errorDe } from '../utils/errorApi';
import VeredictoSinapsis, { claveNueva, claveVeredicto } from './VeredictoSinapsis';
import { fichaVecina, promptRevision, promptSinapsis } from '../utils/prompts';
import LaboratorioWidget from './LaboratorioWidget';
import type { LaboratorioData } from './LaboratorioWidget';
import { API } from '../utils/api';
import { precalentarLaboratorios } from '../labs/labRunner';
import { Dialogo, Seccion } from './terminal';
import { FilaSubredes } from './Subredes';
import type { InfoSubred } from '../utils/subredes';
import { descartarSugerencia, neuronasEnPapelera, restaurarNeurona, sugerenciasVisibles } from '../utils/sugerencias';
import type { Sugerencia } from '../utils/sugerencias';

type Tab = 'teoria' | 'glosario' | 'laboratorio' | 'ejercicios' | 'referencias' | 'relacionados' | 'sinapsis';

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
    sugerencias?: Sugerencia[];     // temas relacionados que trae la neurona (sin los descartados)
}

const TABS: Tab[] = ['teoria', 'glosario', 'laboratorio', 'ejercicios', 'referencias', 'relacionados', 'sinapsis'];
const TAB_LABELS: Record<Tab, string> = {
    teoria: 'Teoría',
    glosario: 'Glosario',
    laboratorio: 'Laboratorio',
    ejercicios: 'Ejercicios',
    referencias: 'Referencias',
    relacionados: 'Relacionados',
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
    universeLinks = [],
    todosLosEnlaces = [],
    subredes = [],
    subredActiva = null,
    onSubredes,
    todasLasNeuronas = [],
    onTema,
    onRecargar
}: {
    nodeId: string | null;
    onClose: () => void;
    universeNodes?: any[];           // las neuronas de la red que se está viendo (la general o una subred)
    universeLinks?: any[];
    todosLosEnlaces?: any[];         // las conexiones de la red general: «+vecinas» añade a la subred también las neuronas conectadas fuera de ella
    subredes?: InfoSubred[];
    subredActiva?: string | null;
    onSubredes?: (ids: string[], añadir: string[], quitar: string[]) => Promise<void>;
    todasLasNeuronas?: any[];        // TODAS las neuronas de la red general: lo que ya existe no se sugiere
    onTema?: (nombre: string) => void;     // abre el inyector con ese tema (cuando una sugerencia aún no existe)
    onRecargar?: () => void | Promise<void>;
}) {
    const [activeTab, setActiveTab] = useState<Tab>('teoria');
    const [data, setData] = useState<NodeData | null>(null);
    const [loading, setLoading] = useState(false);

    const [newEdgeTarget, setNewEdgeTarget] = useState<string>('');
    const [newEdgeReason, setNewEdgeReason] = useState<string>('');

    // Diálogos propios (en vez de prompt/confirm/alert del sistema) y mensaje de error de la cabecera
    const [dialogo, setDialogo] = useState<'cluster' | 'borrar' | 'quitar' | 'descartar' | null>(null);
    const [clusterNuevo, setClusterNuevo] = useState('');
    const [aviso, setAviso] = useState('');
    const [info, setInfo] = useState('');                 // mensaje en verde (copiado, guardado...)
    const [editando, setEditando] = useState(false);      // editor de la neurona abierto
    const [editorSucio, setEditorSucio] = useState(false);   // con cambios sin guardar
    const [revisionSinapsis, setRevisionSinapsis] = useState<RevisionSinapsis | null>(null);   // veredicto de la IA externa sobre las conexiones, pendiente de decidir
    const [aplicadas, setAplicadas] = useState<Record<string, boolean>>({});
    const [pegandoSinapsis, setPegandoSinapsis] = useState(false);     // «Pegar respuesta» del prompt de sinapsis
    const [textoSinapsis, setTextoSinapsis] = useState('');
    const [errorSinapsis, setErrorSinapsis] = useState('');
    const [leyendoSinapsis, setLeyendoSinapsis] = useState(false);

    useEffect(() => {
        if (nodeId !== null) {
            precalentarLaboratorios();   // el motor de laboratorios tarda ~3 s en arrancar: que ya esté listo al abrir la pestaña
            setLoading(true);
            setAviso('');
            setInfo('');
            setEditando(false);
            setRevisionSinapsis(null);
            setAplicadas({});
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

    // Temas relacionados sugeridos: solo se enseñan los que aún no son una neurona (y los de la papelera, para restaurarlos).
    const [enPapelera, setEnPapelera] = useState<{ id: string; nombre: string }[]>([]);
    const [ocupado, setOcupado] = useState('');
    const hayPropuestas = (data?.sugerencias?.length ?? 0) > 0;
    useEffect(() => {
        let vivo = true;
        if (hayPropuestas) neuronasEnPapelera().then(l => { if (vivo) setEnPapelera(l); }); else setEnPapelera([]);
        return () => { vivo = false; };
    }, [data?.id, hayPropuestas]);
    const visibles = useMemo(() => sugerenciasVisibles(data?.sugerencias ?? [], todasLasNeuronas, enPapelera, subredActiva), [data?.sugerencias, todasLasNeuronas, enPapelera, subredActiva]);

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
                setNewEdgeTarget(''); setNewEdgeReason('');
                if (onRecargar) await onRecargar(); else window.location.reload();
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

    /** Dentro de una subred, «destruir» solo la saca de esa subred: sigue en la red general. */
    const quitarDeLaSubred = async () => {
        setDialogo(null);
        if (!subredActiva || !onSubredes) return;
        try { await onSubredes([nodeId!], [], [subredActiva]); onClose(); } catch (e: any) { setAviso(`Error: ${e?.message ?? 'no se pudo quitar de la subred.'}`); }
    };

    const neuronasDeLaRed = (todasLasNeuronas.length > 0 ? todasLasNeuronas : universeNodes).map(n => fichaVecina(n));   // con clúster, términos y resumen: la IA externa puede juzgar la relación

    /** Copia al portapapeles el prompt para que una IA externa revise esta neurona (el resultado se pega en el editor). */
    const pedirRevision = async () => {
        if (!data) return;
        // Las sinapsis de la neurona, también las rechazadas (el universo no las trae). Si no se pueden leer, el prompt sale sin esa parte y se avisa.
        let sinapsis: SinapsisActual[] | undefined;
        try { const r = await fetch(`${API}/api/node/${data.id}/sinapsis`); if (r.ok) sinapsis = (await r.json()).sinapsis; } catch { /* se avisa abajo */ }
        const prompt = promptRevision({ id: data.id, nombre: data.nombre, cluster: data.cluster ?? data.cluster_id, tipo: normalizarTipo(data.tipo) ?? 'formal',
            teoria: data.teoria, glosario: data.glosario, ejercicios: data.ejercicios, referencias: data.referencias, sugerencias: data.sugerencias,
            sinapsis, neuronas: sinapsis ? neuronasDeLaRed : undefined });
        if (!await copiar(prompt)) return;
        setAviso('');
        setInfo(`Prompt de revisión copiado (${prompt.length.toLocaleString('es-ES')} caracteres${sinapsis ? `, con ${sinapsis.length} sinapsis` : ''}). Pégalo en tu IA y, con su respuesta, usa [ Editar ] → [ Pegar JSON revisado ].`
            + (sinapsis ? '' : ' Aviso: no se pudieron leer las sinapsis, así que esta revisión no las incluye.'));
    };

    /** Copia un texto al portapapeles (con un campo temporal si no hay permiso). Si falla, avisa y devuelve false. */
    const copiar = async (texto: string): Promise<boolean> => {
        let copiado = false;
        try { await navigator.clipboard.writeText(texto); copiado = true; } catch { /* sin permiso del portapapeles: se prueba con un campo temporal */ }
        if (!copiado) {
            const t = document.createElement('textarea');
            t.value = texto; t.style.position = 'fixed'; t.style.opacity = '0';
            document.body.appendChild(t); t.select();
            try { copiado = document.execCommand('copy'); } catch { copiado = false; }
            t.remove();
        }
        if (!copiado) { setInfo(''); setAviso('Error: no se pudo copiar al portapapeles.'); }
        return copiado;
    };

    /** Copia el prompt que pide a una IA externa SOLO el veredicto sobre las sinapsis de esta neurona (con una ficha de cada neurona de la red). */
    const pedirSinapsis = async () => {
        if (!data) return;
        let actuales: SinapsisActual[];
        try {
            const r = await fetch(`${API}/api/node/${data.id}/sinapsis`);
            if (!r.ok) throw new Error();
            actuales = (await r.json()).sinapsis;
        } catch { setInfo(''); setAviso('Error: no se pudieron leer las sinapsis de la neurona.'); return; }
        const prompt = promptSinapsis({ id: data.id, nombre: data.nombre, cluster: data.cluster ?? data.cluster_id, tipo: normalizarTipo(data.tipo) ?? 'formal',
            teoria: data.teoria, glosario: data.glosario, sinapsis: actuales, neuronas: neuronasDeLaRed });
        if (!await copiar(prompt)) return;
        setAviso('');
        setInfo(`Prompt de sinapsis copiado (${prompt.length.toLocaleString('es-ES')} caracteres, con ${actuales.length} sinapsis). Pégalo en tu IA y, con su respuesta, usa [ Pegar respuesta ].`);
    };

    /** Lee la respuesta de la IA al prompt de sinapsis y enseña su veredicto (no cambia ninguna conexión). */
    const leerRespuestaSinapsis = async () => {
        if (!data) return;
        setLeyendoSinapsis(true); setErrorSinapsis('');
        try {
            const res = await fetch(`${API}/api/json/interpretar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto: textoSinapsis }) });
            if (!res.ok) throw new Error(await errorDe(res));
            const r = await fetch(`${API}/api/node/${data.id}/sinapsis`);
            if (!r.ok) throw new Error('No se pudieron leer las sinapsis de la neurona para cotejar la respuesta.');
            const { revision, avisos } = leerSinapsis((await res.json()).datos, (await r.json()).sinapsis, neuronasDeLaRed, data.id);
            if (revision.veredictos.length + revision.nuevas.length === 0) throw new Error(`La respuesta no trae ningún veredicto válido sobre las sinapsis.${avisos.length ? ' ' + avisos.join(' ') : ''}`);
            setRevisionSinapsis(revision); setAplicadas({});
            setPegandoSinapsis(false); setTextoSinapsis('');
            setAviso(''); setInfo(avisos.length ? `Veredicto leído, con avisos: ${avisos.join(' ')}` : 'Veredicto leído: debajo tienes cada propuesta para aplicarla o no.');
        } catch (e: any) { setErrorSinapsis(e?.message ?? 'No se pudo leer la respuesta.'); }
        setLeyendoSinapsis(false);
    };

    /** Aplica una propuesta del veredicto sobre las conexiones (una a una, al momento) y repinta la red. */
    const aplicarSinapsis = async (clave: string, peticion: () => Promise<Response>) => {
        setOcupado(clave);
        try {
            const res = await peticion();
            if (!res.ok) throw new Error(await errorDe(res));
            setAplicadas(a => ({ ...a, [clave]: true }));
            setAviso('');
            await onRecargar?.();
        } catch (e: any) { setAviso(`Error: ${e?.message ?? 'no se pudo aplicar la propuesta.'}`); }
        setOcupado('');
    };
    const json = (metodo: string, cuerpo: object): RequestInit => ({ method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
    const cambiarEstado = (con: string, status: 'aceptada' | 'rechazada') =>
        aplicarSinapsis(claveVeredicto(con), () => fetch(`${API}/api/arista/status`, json('PUT', { origen_id: data!.id, destino_id: con, status })));
    const crearConexion = (con: string, motivo: string) =>
        aplicarSinapsis(claveNueva(con), () => fetch(`${API}/api/arista`, json('POST', { origen_id: data!.id, destino_id: con, motivo: motivo || 'Propuesta por la revisión de la IA' })));
    const veredictoSinapsis = revisionSinapsis && (
        <VeredictoSinapsis revision={revisionSinapsis} hechas={aplicadas} ocupado={ocupado}
            onEstado={cambiarEstado} onCrear={crearConexion} onDescartar={() => { setRevisionSinapsis(null); setAplicadas({}); }} />
    );

    /** Descarta un tema sugerido para siempre (queda marcado en la neurona) y lo quita de la lista. */
    const descartar = async (s: Sugerencia) => {
        if (!data) return;
        setOcupado(s.nombre);
        try {
            await descartarSugerencia(data.id, s.nombre);
            setData(d => (d ? { ...d, sugerencias: (d.sugerencias ?? []).filter(x => x.nombre !== s.nombre) } : d));
            setAviso('');
        } catch (e: any) { setAviso(`Error: ${e?.message ?? 'no se pudo descartar la sugerencia.'}`); }
        setOcupado('');
    };
    const restaurarSugerida = async (s: Sugerencia, id: string) => {
        setOcupado(s.nombre);
        try {
            await restaurarNeurona(id);
            setEnPapelera(l => l.filter(x => x.id !== id));
            await onRecargar?.();
            setAviso('');
        } catch (e: any) { setAviso(`Error: ${e?.message ?? 'no se pudo restaurar la neurona.'}`); }
        setOcupado('');
    };
    const añadirSugeridaALaSubred = async (s: Sugerencia, id: string) => {
        if (!subredActiva || !onSubredes) return;
        setOcupado(s.nombre);
        try { await onSubredes([id], [subredActiva], []); setAviso(''); } catch (e: any) { setAviso(`Error: ${e?.message ?? 'no se pudo añadir a la subred.'}`); }
        setOcupado('');
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
                    {subredActiva
                        ? <button className="t-btn peligro" title={`Sacar la neurona de «${subredActiva}» (sigue en la red general)`} onClick={() => setDialogo('quitar')}>[ Quitar de la subred ]</button>
                        : <button className="t-btn peligro" title="Mandar la neurona a la papelera (se puede recuperar)" onClick={() => setDialogo('borrar')}>[ A la papelera ]</button>}
                    <button className="t-btn plano" title="Cerrar" onClick={cerrar} style={{ fontSize: 16 }}>[x]</button>
                </div>
            </div>

            {/* Subredes de la neurona */}
            {data && !loading && !editando && onSubredes && (
                <FilaSubredes nodo={universeNodes.find(n => n.id === data.id) ?? data} subredes={subredes} enlaces={todosLosEnlaces} onSubredes={onSubredes} />
            )}

            {/* Pestañas */}
            {!editando && <div style={{ display: 'flex', padding: '0 12px', borderBottom: '1px solid var(--t-linea)' }}>
                {TABS.map(tab => (
                    <button key={tab} className={`t-tab${activeTab === tab ? ' activa' : ''}`} onClick={() => setActiveTab(tab)}>
                        {(() => {
                            const porDecidir = revisionSinapsis ? revisionSinapsis.nuevas.filter(n => !aplicadas[claveNueva(n.con)]).length
                                + revisionSinapsis.veredictos.filter(v => !aplicadas[claveVeredicto(v.con)] && v.veredicto !== 'cuestionar' && v.estado !== (v.veredicto === 'quitar' ? 'rechazada' : 'aceptada')).length : 0;
                            const nombre = tab === 'relacionados' && visibles.length > 0 ? `${TAB_LABELS[tab]} (${visibles.length})`
                                : tab === 'sinapsis' && porDecidir > 0 ? `${TAB_LABELS[tab]} (${porDecidir} ${porDecidir === 1 ? 'propuesta' : 'propuestas'})` : TAB_LABELS[tab];
                            return activeTab === tab ? `[ ${nombre} ]` : nombre;
                        })()}
                    </button>
                ))}
            </div>}

            {/* Contenido Dinámico */}
            <div style={{ flex: 1, padding: 28, overflowY: 'auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {loading && <p style={{ color: 'var(--t-verde)', fontFamily: MONO }}>&gt; Leyendo memoria...</p>}

                {!loading && data && (editando || activeTab === 'sinapsis') && veredictoSinapsis}

                {!loading && data && editando && (
                    <EditorNeurona key={data.id} nodeId={nodeId!} inicial={formDesdeNeurona(data)} onCambios={setEditorSucio} neuronas={neuronasDeLaRed}
                        onSinapsis={r => { setRevisionSinapsis(r); setAplicadas({}); }}
                        onGuardado={n => { setData(n); setEditando(false); setAviso(''); setInfo('Neurona guardada.' + (revisionSinapsis ? ' El veredicto sobre las sinapsis te espera en la pestaña «Sinapsis».' : '')); if (revisionSinapsis) setActiveTab('sinapsis'); }} onSalir={() => setEditando(false)} />
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

                {!loading && data && !editando && activeTab === 'relacionados' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'justify' }}>
                        {visibles.length === 0 && (
                            <Vacio>
                                {(data.sugerencias ?? []).length === 0
                                    ? <>
                                        <div style={{ color: 'var(--t-texto)', marginBottom: 8 }}>[ ] Esta neurona no trae temas relacionados</div>
                                        Las neuronas nuevas los traen al crearlas con el prompt actual. Para esta: [ Pedir revisión ] y, con la respuesta de la IA, [ Editar ] → [ Pegar JSON revisado ].
                                    </>
                                    : 'Todo lo que sugiere esta neurona ya está en tu red.'}
                            </Vacio>
                        )}
                        {visibles.map(({ sugerencia: s, estado }) => (
                            <Tarjeta key={s.nombre} color={estado.tipo === 'nueva' ? 'var(--t-verde)' : 'var(--t-ambar)'}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                                    <div style={{ minWidth: 0, flex: '1 1 320px' }}>
                                        <div style={{ color: 'var(--t-verde)', fontSize: 16, fontWeight: 700 }}>{s.nombre}</div>
                                        {s.motivo && <div style={{ marginTop: 6, fontSize: 14, color: '#c8d0d0', lineHeight: 1.5 }}>{s.motivo}</div>}
                                        {estado.tipo === 'existe' && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--t-ambar)', fontFamily: MONO }}>Ya existe como «{estado.nombre}», pero no está en «{subredActiva}».</div>}
                                        {estado.tipo === 'papelera' && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--t-ambar)', fontFamily: MONO }}>«{estado.nombre}» está en la papelera.</div>}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
                                        {estado.tipo === 'nueva' && <button className="t-btn" disabled={!onTema || ocupado !== ''} title="Abre el sintetizador con este tema para generar su neurona" onClick={() => onTema?.(s.nombre)}>[ Crear neurona ]</button>}
                                        {estado.tipo === 'existe' && <button className="t-btn" disabled={ocupado !== ''} onClick={() => añadirSugeridaALaSubred(s, estado.id)}>[ Añadir a «{subredActiva}» ]</button>}
                                        {estado.tipo === 'papelera' && <button className="t-btn" disabled={ocupado !== ''} title="Saca la neurona de la papelera con sus conexiones" onClick={() => restaurarSugerida(s, estado.id)}>[ Restaurar ]</button>}
                                        <button className="t-btn plano" disabled={ocupado !== ''} title="No volver a sugerir este tema en esta neurona" onClick={() => descartar(s)}>[ × ]</button>
                                    </div>
                                </div>
                            </Tarjeta>
                        ))}
                    </div>
                )}

                {!loading && data && !editando && activeTab === 'sinapsis' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'justify' }}>
                        <Seccion titulo="Revisar con una IA externa">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ color: 'var(--t-suave)', fontSize: 12, lineHeight: 1.5, fontFamily: MONO }}>
                                    Copia un prompt solo de sinapsis (con una ficha de cada neurona de tu red), pégalo en tu IA y trae su respuesta: te propone qué conexiones confirmar, quitar o añadir, y tú decides cada una.
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <button className="t-btn" onClick={pedirSinapsis}>[ Copiar prompt de sinapsis ]</button>
                                    <button className="t-btn" onClick={() => { setPegandoSinapsis(p => !p); setErrorSinapsis(''); }}>[ Pegar respuesta ]</button>
                                </div>
                                {pegandoSinapsis && (
                                    <>
                                        <textarea className="t-campo" spellCheck={false} style={{ minHeight: 160, width: '100%', boxSizing: 'border-box' }} value={textoSinapsis}
                                            onChange={e => setTextoSinapsis(e.target.value)} placeholder="Pega aquí la respuesta de la IA..." />
                                        {errorSinapsis && <div style={{ color: 'var(--t-error)', fontSize: 12 }}>[ERROR] {errorSinapsis}</div>}
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="t-btn" disabled={leyendoSinapsis || !textoSinapsis.trim()} onClick={leerRespuestaSinapsis}>[ Leer respuesta ]</button>
                                            <button className="t-btn plano" disabled={leyendoSinapsis} onClick={() => setPegandoSinapsis(false)}>[ Cancelar ]</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </Seccion>
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
                                        if (res.ok) { if (onRecargar) await onRecargar(); else window.location.reload(); }     // sin recargar la página: se conserva el veredicto de la IA
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
            {dialogo === 'quitar' && (
                <Dialogo titulo="Quitar de la subred" texto={`Esta neurona dejará de formar parte de «${subredActiva}». No se borra: sigue en la red general con todas sus conexiones.`}
                    aceptar="Quitar" peligro onAceptar={quitarDeLaSubred} onCancelar={() => setDialogo(null)} />
            )}
            {dialogo === 'descartar' && (
                <Dialogo titulo="Descartar cambios" texto="Estás editando esta neurona y hay cambios sin guardar. Si cierras ahora se pierden."
                    aceptar="Descartar y cerrar" peligro onAceptar={() => { setDialogo(null); onClose(); }} onCancelar={() => setDialogo(null)} />
            )}
        </div>
    );
}
