import { memo, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { API } from '../utils/api';
import { forceBlockMath, markdownComponents } from '../utils/markdown';
import { aprobarLaboratorio, inyectar, laboratorioAprobado, PLANTILLA_LABORATORIO, sha256Hex, sincronizarValores, validarControles } from '../utils/labSpec';
import type { ControlParams, Figura, LaboratorioData, OpcionControl, Valor } from '../utils/labSpec';
import LabChart from './LabChart';
import LabEditor from './LabEditor';
import SliderAscii from './SliderAscii';
import { adaptarResultado, esJsonXY } from '../labs/adaptar';
import { obtenerRunner } from '../labs/labRunner';

export type { ControlParams, LaboratorioData, OpcionControl } from '../utils/labSpec';

type Valores = Record<string, Valor>;
interface Borrador { controles: ControlParams[]; codigo: string }

interface Resultado {
    modo: 'datos' | 'imagen';
    figuras: Figura[];
    outputs: { type: string; content: string }[];
    ms: number;
}

const tipoDe = (c: ControlParams) => c.tipo ?? 'slider';
const opcionDe = (o: number | string | OpcionControl): OpcionControl => (typeof o === 'object' ? o : { valor: o });
const decimales = (step: number) => (String(step).split('.')[1] ?? '').length;
const porDefecto = (controles: ControlParams[] = []): Valores => Object.fromEntries(controles.map(c => [c.variable, c.default]));

// Memoizada: parsear markdown + KaTeX en cada cambio de slider costaba más que calcular la gráfica.
const Explicacion = memo(function Explicacion({ texto }: { texto: string }) {
    return (
        <div className="markdown-container" style={{ marginBottom: '20px', color: '#c8d0d0', fontSize: '15px', lineHeight: '1.6', textAlign: 'justify', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[[rehypeKatex, { strict: false }]]}
                components={markdownComponents}
            >
                {forceBlockMath(texto)}
            </ReactMarkdown>
        </div>
    );
});

// Mensaje legible de un error del backend (422 trae una lista de problemas de validación).
const mensajeError = (res: any): string => Array.isArray(res?.detail)
    ? res.detail.map((d: any) => String(d.msg ?? '').replace(/^Value error, /, '')).join(' · ')
    : String(res?.detail ?? 'Error desconocido');

export default function LaboratorioWidget({ data, nodeId, onGuardado }: { data: LaboratorioData | null; nodeId: string; onGuardado?: (lab: LaboratorioData) => void }) {
    // lo guardado en el nodo; un nodo sin laboratorio llega como {} (sin código), no como null
    const [lab, setLab] = useState<LaboratorioData | null>(data?.codigo ? data : null);
    const [borrador, setBorrador] = useState<Borrador | null>(null);       // lo que se está editando (null = no se edita)
    const [guardando, setGuardando] = useState(false);
    const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

    const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [resultado, setResultado] = useState<Resultado | null>(null);
    const [valores, setValores] = useState<Valores>(() => porDefecto(data?.codigo ? data.controles : []));
    const [mostrarCodigo, setMostrarCodigo] = useState(false);
    const [motorListo, setMotorListo] = useState(false);
    useEffect(() => { obtenerRunner().listo.then(() => setMotorListo(true), () => { /* el error sale al ejecutar */ }); }, []);

    const controles = borrador ? borrador.controles : lab?.controles ?? [];
    const codigo = borrador ? borrador.codigo : lab?.codigo ?? '';
    const codigoRef = useRef(codigo);
    codigoRef.current = codigo;
    const valoresRef = useRef<Valores>(valores);          // último valor aunque React aún no haya re-renderizado
    const isFetching = useRef(false);
    const pendiente = useRef<{ vals: Valores; codigo: string } | null>(null);   // si se mueve algo mientras se calcula, solo importa lo último

    const ejecutar = async (vals: Valores, cod: string = codigoRef.current) => {
        isFetching.current = true;
        setStatus('running');
        setErrorMsg(null);
        const t0 = performance.now();
        try {
            // El código corre en esta misma ventana (Python en WebAssembly, en un worker): sin viaje al backend y sin acceso a tus archivos.
            const { resultado: r } = await obtenerRunner().ejecutar(inyectar(cod, vals));
            const { modo, figuras, outputs } = adaptarResultado(r);
            setResultado({ modo, figuras, outputs: outputs.filter(o => !esJsonXY(o)), ms: performance.now() - t0 });
            setStatus('done');
        } catch (e: any) {
            setErrorMsg(e instanceof Error ? e.message : String(e));
            setStatus('error');
        } finally {
            isFetching.current = false;
            if (pendiente.current) {
                const siguiente = pendiente.current;
                pendiente.current = null;
                ejecutar(siguiente.vals, siguiente.codigo);
            }
        }
    };

    // El código de un JSON pegado (a menudo de una IA) se ejecuta con tus permisos: la primera vez que se abre cada código
    // se enseña y hay que aprobarlo. El que escribes tú en el editor no lo necesita. null = comprobando.
    const [hash, setHash] = useState<string | null>(null);
    const [aprobado, setAprobado] = useState<boolean | null>(null);
    const aprobadoPorMi = useRef<string | null>(null);   // código que acabo de guardar desde el editor
    useEffect(() => {
        let vigente = true;
        if (!lab) { setAprobado(true); return; }
        if (lab.codigo === aprobadoPorMi.current) return;
        setAprobado(null);
        sha256Hex(lab.codigo).then(h => { if (vigente) { setHash(h); setAprobado(laboratorioAprobado(h)); } });
        return () => { vigente = false; };
    }, [lab?.codigo]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (aprobado && lab && !borrador) ejecutar(valoresRef.current, lab.codigo);
    }, [aprobado, lab?.codigo]); // eslint-disable-line react-hooks/exhaustive-deps

    const poner = (nuevos: Valores) => { valoresRef.current = nuevos; setValores(nuevos); };
    const cambiar = (nuevos: Valores) => {
        poner(nuevos);
        if (isFetching.current) pendiente.current = { vals: nuevos, codigo: codigoRef.current }; else ejecutar(nuevos);
    };
    const cambiarUno = (variable: string, v: Valor) => cambiar({ ...valoresRef.current, [variable]: v });
    const cambiaron = controles.some(c => valores[c.variable] !== c.default);

    // --- edición ---------------------------------------------------------------------------------------------------
    const empezarEdicion = () => {
        const inicial = lab ? { controles: structuredClone(lab.controles ?? []), codigo: lab.codigo } : structuredClone({ controles: PLANTILLA_LABORATORIO.controles ?? [], codigo: PLANTILLA_LABORATORIO.codigo });
        setBorrador(inicial);
        setErrorGuardar(null);
        const vals = sincronizarValores(inicial.controles, valoresRef.current);
        poner(vals);
        if (!lab) { codigoRef.current = inicial.codigo; ejecutar(vals, inicial.codigo); }
    };
    const cambiarControles = (nuevos: ControlParams[]) => {
        if (!borrador) return;
        setBorrador({ ...borrador, controles: nuevos });
        const vals = sincronizarValores(nuevos, valoresRef.current);
        for (const c of nuevos) {   // si cambias el valor inicial de una variable, el control salta a él
            const antes = borrador.controles.find(p => p.variable === c.variable);
            if (antes && antes.default !== c.default) vals[c.variable] = c.default;
        }
        poner(vals);
        if (validarControles(nuevos).length === 0) {   // con un rango roto no tiene sentido calcular
            if (isFetching.current) pendiente.current = { vals, codigo: codigoRef.current }; else ejecutar(vals);
        }
    };
    const hayCambios = !!borrador && (!lab || JSON.stringify(borrador) !== JSON.stringify({ controles: lab.controles ?? [], codigo: lab.codigo }));

    const salirEdicion = () => {
        setBorrador(null);
        setErrorGuardar(null);
        if (lab) {
            const vals = sincronizarValores(lab.controles ?? [], valoresRef.current);
            poner(vals);
            ejecutar(vals, lab.codigo);   // el resultado en pantalla era del borrador
        } else setResultado(null);
    };

    const guardar = async () => {
        if (!borrador || validarControles(borrador.controles).length) return;
        setGuardando(true);
        setErrorGuardar(null);
        try {
            const resp = await fetch(`${API}/api/node/${encodeURIComponent(nodeId)}/laboratorio`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ controles: borrador.controles, codigo: borrador.codigo })
            });
            const res = await resp.json();
            if (!resp.ok) { setErrorGuardar(mensajeError(res)); return; }
            aprobarLaboratorio(await sha256Hex(res.laboratorio.codigo));   // lo escribiste tú: no vuelve a preguntar
            aprobadoPorMi.current = res.laboratorio.codigo;
            setAprobado(true);
            setLab(res.laboratorio);
            onGuardado?.(res.laboratorio);
            setBorrador(null);
            poner(sincronizarValores(res.laboratorio.controles ?? [], valoresRef.current));
        } catch (e: any) {
            setErrorGuardar(`No se pudo guardar: ${e}`);
        } finally {
            setGuardando(false);
        }
    };

    // --- controles ---------------------------------------------------------------------------------------------------
    const campoNumero = (c: ControlParams) => {
        const min = c.min ?? 0, max = c.max ?? 1, step = c.step ?? 1;
        const v = valores[c.variable] as number;
        return (
            <>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--t-texto)', fontSize: 13, marginBottom: 6, gap: 8, fontFamily: 'var(--t-mono)' }}>
                    <span>{c.label}</span>
                    <input
                        className="t-campo"
                        type="number" min={min} max={max} step={step}
                        value={Number.isFinite(v) ? Number(v.toFixed(Math.max(decimales(step), 6))) : ''}
                        onChange={e => {
                            const n = parseFloat(e.target.value);
                            if (Number.isFinite(n)) cambiarUno(c.variable, Math.min(max, Math.max(min, n)));
                        }}
                        style={{ width: 90, padding: '2px 6px', textAlign: 'right', color: 'var(--t-verde)', fontWeight: 700 }}
                    />
                </label>
                <SliderAscii min={min} max={max} step={step} value={v} decimales={decimales(step)} etiqueta={c.label} onChange={n => cambiarUno(c.variable, n)} />
            </>
        );
    };

    const campo = (c: ControlParams) => {
        switch (tipoDe(c)) {
            case 'checkbox':
                return (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--t-texto)', fontSize: 13, cursor: 'pointer', minHeight: 48, fontFamily: 'var(--t-mono)' }}>
                        <input type="checkbox" className="t-check" checked={!!valores[c.variable]} onChange={e => cambiarUno(c.variable, e.target.checked)} />
                        <span>{c.label}</span>
                    </label>
                );
            case 'select':
                return (
                    <>
                        <label style={{ display: 'block', color: 'var(--t-texto)', fontSize: 13, marginBottom: 6, fontFamily: 'var(--t-mono)' }}>{c.label}</label>
                        <select
                            className="t-campo"
                            value={String(valores[c.variable])}
                            onChange={e => {
                                const op = (c.opciones ?? []).map(opcionDe).find(o => String(o.valor) === e.target.value);
                                if (op) cambiarUno(c.variable, op.valor);
                            }}
                            style={{ width: '100%', color: 'var(--t-verde)', padding: '6px 8px' }}
                        >
                            {(c.opciones ?? []).map(opcionDe).map(o => <option key={String(o.valor)} value={String(o.valor)}>{o.label ?? String(o.valor)}</option>)}
                        </select>
                    </>
                );
            default:
                return campoNumero(c);
        }
    };

    // Controles agrupados por su campo `grupo` (en orden de aparición); los que no tienen grupo van sin título.
    const grupos = [...controles.reduce((m, c) => {
        const g = c.grupo ?? '';
        m.set(g, [...(m.get(g) ?? []), c]);
        return m;
    }, new Map<string, ControlParams[]>())];

    const salidas = (resultado?.outputs ?? []).filter(o => resultado?.modo === 'imagen' || o.type !== 'image/png');

    if (aprobado === null) return <div style={{ color: 'var(--t-verde)', fontFamily: 'var(--t-mono)', fontSize: 14, padding: 20 }}>&gt; Comprobando...</div>;
    if (!lab && !borrador) {
        return (
            <div style={{ color: 'var(--t-suave)', fontFamily: 'var(--t-mono)', padding: 20, border: '1px dashed var(--t-linea)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 12px 0' }}>Este concepto no dispone de una simulación interactiva en su archivo.</p>
                <button className="t-btn" onClick={empezarEdicion} style={{ color: 'var(--t-ambar)', borderColor: 'var(--t-ambar)' }}>
                    [ + Crear un laboratorio ]
                </button>
            </div>
        );
    }
    if (!aprobado && !borrador) {
        return (
            <div className="t-marco" style={{ padding: 20, borderColor: 'var(--t-ambar)' }}>
                <div style={{ margin: '0 0 8px 0', color: 'var(--t-ambar)', fontSize: 14, fontWeight: 700 }}>[!] Este laboratorio ejecuta código Python en tu equipo</div>
                <p style={{ margin: '0 0 12px 0', color: 'var(--t-suave)', fontSize: 13, lineHeight: 1.5 }}>
                    El código viene del JSON del nodo y corre con tus permisos. Léelo antes de aprobarlo: se recordará solo para este código exacto,
                    y si cambia volverá a preguntar.
                </p>
                <pre style={{ margin: '0 0 14px 0', maxHeight: 280, overflow: 'auto', background: 'rgba(0,0,0,0.5)', color: 'var(--t-texto)', padding: 14, border: '1px solid var(--t-linea)', fontSize: 12.5, fontFamily: 'var(--t-mono)', lineHeight: 1.4 }}>
                    {lab?.codigo}
                </pre>
                <button className="t-btn principal" onClick={() => { if (hash) aprobarLaboratorio(hash); setAprobado(true); }}>
                    [ &gt; He leído el código: ejecutar el laboratorio ]
                </button>
            </div>
        );
    }

    return (
        <div>

            {lab?.explicacion && <Explicacion texto={lab.explicacion} />}

            {controles.length > 0 && (
                <div style={{ marginBottom: 20, padding: 16, border: '1px dashed var(--t-linea)', fontFamily: 'var(--t-mono)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 16px 0' }}>
                        <div style={{ color: 'var(--t-ambar)', fontSize: 13 }}>## Controles paramétricos</div>
                        <button className="t-btn" onClick={() => cambiar(porDefecto(controles))} disabled={!cambiaron} style={{ fontSize: 12, padding: '3px 10px' }}>
                            [ Restablecer ]
                        </button>
                    </div>

                    {grupos.map(([nombre, cs]) => (
                        <div key={nombre} style={{ marginBottom: 14 }}>
                            {nombre && <div style={{ color: 'var(--t-suave)', fontSize: 12, margin: '0 0 8px 0', borderBottom: '1px dashed var(--t-linea)', paddingBottom: 4 }}>### {nombre}</div>}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                                {cs.map((c, i) => <div key={`${c.variable}-${i}`}>{campo(c)}</div>)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ position: 'relative', minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--t-fondo)', border: '1px solid var(--t-linea)', overflow: 'hidden', padding: 16 }}>
                {status === 'running' && !resultado && <div style={{ color: 'var(--t-verde)', fontSize: 14, fontFamily: 'var(--t-mono)' }}>&gt; {motorListo ? 'Calculando...' : 'Preparando el motor de laboratorios (solo la primera vez)...'}</div>}

                {status === 'error' && (
                    <div style={{ padding: 16, color: 'var(--t-error)', fontSize: 12, fontFamily: 'var(--t-mono)', whiteSpace: 'pre-wrap' }}>[ERROR] {errorMsg}</div>
                )}

                {resultado && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {resultado.modo === 'datos' && <LabChart figuras={resultado.figuras} />}
                        {salidas.map((out, idx) => {
                            if (out.type === 'image/png') {
                                return <img key={idx} src={`data:image/png;base64,${out.content}`} style={{ maxWidth: '100%', background: '#fff' }} alt="Output plot" />;
                            }
                            const color = out.type === 'error' ? 'var(--t-error)' : 'var(--t-texto)';
                            return (
                                <pre key={idx} style={{ margin: '8px 0', width: '100%', color, fontSize: '12px', fontFamily: 'var(--t-mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--t-linea)', padding: 12 }}>
                                    {out.content}
                                </pre>
                            );
                        })}
                        <div style={{ alignSelf: 'flex-end', marginTop: 6, color: 'var(--t-suave)', fontSize: 11, fontFamily: 'var(--t-mono)' }} title={resultado.modo === 'datos' ? 'Dibujado en el navegador' : 'Imagen de matplotlib (este laboratorio usa algo que no se puede dibujar en el navegador)'}>
                            {resultado.modo === 'datos' ? '[en vivo]' : '[imagen]'} {Math.round(resultado.ms)} ms
                        </div>
                    </div>
                )}
            </div>

            {borrador ? (
                <LabEditor
                    controles={borrador.controles}
                    codigo={borrador.codigo}
                    onControles={cambiarControles}
                    onCodigo={s => setBorrador({ ...borrador, codigo: s })}
                    onEjecutar={() => ejecutar(valoresRef.current, borrador.codigo)}
                    onGuardar={guardar}
                    onSalir={salirEdicion}
                    guardando={guardando}
                    errorGuardar={errorGuardar}
                    hayCambios={hayCambios}
                    esNuevo={!lab}
                />
            ) : (
                <div style={{ marginTop: '20px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="t-btn" onClick={() => setMostrarCodigo(!mostrarCodigo)}>
                        {mostrarCodigo ? '[ Ocultar código Python ]' : '[ Ver código Python ]'}
                    </button>
                    <button className="t-btn" onClick={empezarEdicion} style={{ color: 'var(--t-ambar)', borderColor: 'var(--t-ambar)' }}
                        title="Añadir o quitar variables, cambiar rangos y editar el código">
                        [ Editar laboratorio ]
                    </button>
                </div>
            )}

            {!borrador && mostrarCodigo && lab && (
                <div style={{ marginTop: 12, background: 'rgba(0,0,0,0.5)', padding: 16, border: '1px solid var(--t-linea)' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <pre style={{ margin: 0, color: 'var(--t-texto)', fontSize: 13, fontFamily: 'var(--t-mono)', lineHeight: 1.4 }}>
                            {inyectar(lab.codigo || '', valores)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
