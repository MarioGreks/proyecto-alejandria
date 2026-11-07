import { useDeferredValue, useEffect, useState } from 'react';
import { API } from '../utils/api';
import { errorDe } from '../utils/errorApi';
import { aplicarRevision, erroresEditor, formParaGuardar, hayCambios, TIPOS_NEURONA } from '../utils/neurona';
import type { NeuronaForm, ReferenciaForm, TipoNeurona } from '../utils/neurona';
import { Cabecera, Modal, Seccion, Dialogo } from './terminal';
import { Md } from './Md';

interface Props {
    nodeId: string;
    inicial: NeuronaForm;
    onGuardado: (neurona: any) => void;
    onSalir: () => void;
    onCambios: (hay: boolean) => void;       // el panel lo usa para no perder ediciones al cerrar
}

const etiqueta: React.CSSProperties = { color: 'var(--t-suave)', fontSize: 11, display: 'block', marginBottom: 3, fontFamily: 'var(--t-mono)' };
const area = (alto: number): React.CSSProperties => ({ width: '100%', boxSizing: 'border-box', minHeight: alto, resize: 'vertical', lineHeight: 1.45 });
const fila: React.CSSProperties = { padding: 10, border: '1px dashed var(--t-linea)', display: 'flex', flexDirection: 'column', gap: 8 };

/** Editor de una neurona: nombre, tipo, teoría (Markdown con vista previa KaTeX), glosario, ejercicios y referencias. No toca clúster ni laboratorio. */
export default function EditorNeurona({ nodeId, inicial, onGuardado, onSalir, onCambios }: Props) {
    const [form, setForm] = useState<NeuronaForm>(inicial);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [avisos, setAvisos] = useState<string[]>([]);
    const [pegando, setPegando] = useState(false);
    const [texto, setTexto] = useState('');
    const [errorPegar, setErrorPegar] = useState('');
    const [leyendo, setLeyendo] = useState(false);
    const [confirmarSalir, setConfirmarSalir] = useState(false);
    const vistaTeoria = useDeferredValue(form.teoria);       // escribir no espera a que KaTeX repinte la vista previa

    const cambios = hayCambios(inicial, form);
    useEffect(() => { onCambios(cambios); return () => onCambios(false); }, [cambios]);

    const set = (parcial: Partial<NeuronaForm>) => setForm(f => ({ ...f, ...parcial }));
    const cambiarItem = <K extends 'glosario' | 'ejercicios' | 'referencias'>(campo: K, i: number, parcial: Partial<NeuronaForm[K][number]>) =>
        set({ [campo]: form[campo].map((x, j) => (j === i ? { ...x, ...parcial } : x)) } as Partial<NeuronaForm>);
    const quitar = (campo: 'glosario' | 'ejercicios' | 'referencias', i: number) => set({ [campo]: form[campo].filter((_, j) => j !== i) } as Partial<NeuronaForm>);

    const limpio = formParaGuardar(form);
    const errores = erroresEditor(limpio);

    const guardar = async () => {
        setGuardando(true);
        setError('');
        try {
            const res = await fetch(`${API}/api/node/${nodeId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(limpio) });
            if (!res.ok) throw new Error(await errorDe(res));
            onGuardado(await res.json());
        } catch (e: any) {
            setError(e?.message ?? 'No se pudo guardar.');
        } finally {
            setGuardando(false);
        }
    };

    const aplicarPegado = async () => {
        setLeyendo(true);
        setErrorPegar('');
        try {
            const res = await fetch(`${API}/api/json/interpretar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto }) });
            if (!res.ok) throw new Error(await errorDe(res));
            const { form: nuevo, avisos: av } = aplicarRevision(form, (await res.json()).datos, nodeId);
            setForm(nuevo);
            setAvisos(['Revisión aplicada al formulario. Compruébala y pulsa «Guardar» (todavía no se ha guardado nada).', ...av]);
            setPegando(false);
            setTexto('');
        } catch (e: any) {
            setErrorPegar(e?.message ?? 'No se pudo leer el JSON.');
        } finally {
            setLeyendo(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ color: 'var(--t-ambar)', fontSize: 14, fontFamily: 'var(--t-mono)', fontWeight: 700 }}>## Editando la neurona</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="t-btn" title="Pega la respuesta de la IA a «Pedir revisión»" onClick={() => { setErrorPegar(''); setPegando(true); }}>[ Pegar JSON revisado ]</button>
                    <button className="t-btn principal" disabled={guardando || errores.length > 0 || !cambios} onClick={guardar}>{guardando ? '[ Guardando... ]' : '[ Guardar ]'}</button>
                    <button className="t-btn plano" onClick={() => (cambios ? setConfirmarSalir(true) : onSalir())}>{cambios ? '[ Descartar y salir ]' : '[ Salir ]'}</button>
                </div>
            </div>
            <p style={{ margin: '10px 0 0', color: 'var(--t-suave)', fontSize: 12, lineHeight: 1.5, fontFamily: 'var(--t-mono)' }}>
                Aquí se edita el texto de la neurona. El clúster y el laboratorio tienen sus propios botones. Si cambias el nombre o la teoría, la neurona se vuelve a analizar al guardar.
            </p>

            {avisos.length > 0 && (
                <ul style={{ margin: '10px 0 0', padding: '8px 8px 8px 24px', border: '1px solid var(--t-ambar)', color: 'var(--t-ambar)', fontSize: 12, fontFamily: 'var(--t-mono)', lineHeight: 1.5 }}>
                    {avisos.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
            )}
            {(errores.length > 0 || error) && (
                <ul style={{ margin: '10px 0 0', padding: '8px 8px 8px 24px', border: '1px solid var(--t-error)', color: 'var(--t-error)', fontSize: 12, fontFamily: 'var(--t-mono)' }}>
                    {[...errores, ...(error ? [error] : [])].map((e, i) => <li key={i}>{e}</li>)}
                </ul>
            )}

            <Seccion titulo="Nombre y tipo">
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 3fr) minmax(160px, 1fr)', gap: 10 }}>
                    <div><label style={etiqueta}>Nombre</label><input className="t-campo" style={{ width: '100%', boxSizing: 'border-box' }} value={form.nombre} onChange={e => set({ nombre: e.target.value })} /></div>
                    <div>
                        <label style={etiqueta}>Tipo</label>
                        <select className="t-campo" style={{ width: '100%', boxSizing: 'border-box' }} value={form.tipo} onChange={e => set({ tipo: e.target.value as TipoNeurona })}
                            title={TIPOS_NEURONA.find(t => t.id === form.tipo)?.ayuda}>
                            {TIPOS_NEURONA.map(t => <option key={t.id} value={t.id}>[{t.sigla}] {t.etiqueta}</option>)}
                        </select>
                    </div>
                </div>
            </Seccion>

            <Seccion titulo="Teoría (Markdown y fórmulas $...$ / $$...$$)">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
                    <div>
                        <label style={etiqueta}>Texto</label>
                        <textarea className="t-campo" spellCheck={false} style={area(420)} value={form.teoria} onChange={e => set({ teoria: e.target.value })} />
                    </div>
                    <div>
                        <label style={etiqueta}>Vista previa</label>
                        <div className="markdown-container" style={{ border: '1px solid var(--t-linea)', padding: 12, minHeight: 420, maxHeight: 520, overflowY: 'auto', fontSize: 14, lineHeight: 1.6, color: 'var(--t-texto)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                            <Md texto={vistaTeoria} />
                        </div>
                    </div>
                </div>
            </Seccion>

            <Seccion titulo={`Glosario (${form.glosario.length})`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {form.glosario.map((g, i) => (
                        <div key={i} style={fila}>
                            <div><label style={etiqueta}>Término</label><input className="t-campo" style={{ width: '100%', boxSizing: 'border-box' }} value={g.termino} onChange={e => cambiarItem('glosario', i, { termino: e.target.value })} /></div>
                            <div><label style={etiqueta}>Definición</label><textarea className="t-campo" spellCheck={false} style={area(60)} value={g.definicion} onChange={e => cambiarItem('glosario', i, { definicion: e.target.value })} /></div>
                            <button className="t-btn peligro" style={{ alignSelf: 'flex-start' }} onClick={() => quitar('glosario', i)}>[ Quitar ]</button>
                        </div>
                    ))}
                    <button className="t-btn" style={{ alignSelf: 'flex-start' }} onClick={() => set({ glosario: [...form.glosario, { termino: '', definicion: '' }] })}>[ + Añadir término ]</button>
                </div>
            </Seccion>

            <Seccion titulo={`Ejercicios (${form.ejercicios.length})`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {form.ejercicios.map((e, i) => (
                        <div key={i} style={fila}>
                            <div><label style={etiqueta}>Enunciado</label><textarea className="t-campo" spellCheck={false} style={area(80)} value={e.enunciado} onChange={ev => cambiarItem('ejercicios', i, { enunciado: ev.target.value })} /></div>
                            <div><label style={etiqueta}>Solución</label><textarea className="t-campo" spellCheck={false} style={area(100)} value={e.solucion} onChange={ev => cambiarItem('ejercicios', i, { solucion: ev.target.value })} /></div>
                            <button className="t-btn peligro" style={{ alignSelf: 'flex-start' }} onClick={() => quitar('ejercicios', i)}>[ Quitar ]</button>
                        </div>
                    ))}
                    <button className="t-btn" style={{ alignSelf: 'flex-start' }} onClick={() => set({ ejercicios: [...form.ejercicios, { enunciado: '', solucion: '' }] })}>[ + Añadir ejercicio ]</button>
                </div>
            </Seccion>

            <Seccion titulo={`Referencias (${form.referencias.length})`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {form.referencias.map((r: ReferenciaForm, i) => (
                        <div key={i} style={fila}>
                            <div><label style={etiqueta}>Título</label><input className="t-campo" style={{ width: '100%', boxSizing: 'border-box' }} value={r.titulo} onChange={e => cambiarItem('referencias', i, { titulo: e.target.value })} /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                                <div><label style={etiqueta}>Autores y año</label><input className="t-campo" style={{ width: '100%', boxSizing: 'border-box' }} value={r.autores} onChange={e => cambiarItem('referencias', i, { autores: e.target.value })} /></div>
                                <div><label style={etiqueta}>Enlace (https://...)</label><input className="t-campo" style={{ width: '100%', boxSizing: 'border-box' }} value={r.url} onChange={e => cambiarItem('referencias', i, { url: e.target.value })} /></div>
                            </div>
                            <div><label style={etiqueta}>Nota (qué se tomó de esta fuente)</label><textarea className="t-campo" spellCheck={false} style={area(60)} value={r.nota} onChange={e => cambiarItem('referencias', i, { nota: e.target.value })} /></div>
                            <button className="t-btn peligro" style={{ alignSelf: 'flex-start' }} onClick={() => quitar('referencias', i)}>[ Quitar ]</button>
                        </div>
                    ))}
                    <button className="t-btn" style={{ alignSelf: 'flex-start' }} onClick={() => set({ referencias: [...form.referencias, { titulo: '', autores: '', url: '', nota: '' }] })}>[ + Añadir referencia ]</button>
                </div>
            </Seccion>

            {pegando && (
                <Modal ancho={720} z={70}>
                    <Cabecera titulo="Pegar JSON revisado" onCerrar={leyendo ? undefined : () => setPegando(false)} />
                    <p style={{ margin: '12px 0', color: 'var(--t-texto)', fontSize: 13, lineHeight: 1.5 }}>
                        Pega la respuesta completa de la IA (vale con el texto de antes y el bloque ```json). Se leerá con las mismas tolerancias que el Sintetizador y se
                        aplicará solo al formulario: nombre, tipo, teoría, glosario, ejercicios y referencias. No se guarda nada hasta que pulses «Guardar».
                    </p>
                    <textarea className="t-campo" autoFocus spellCheck={false} style={area(260)} value={texto} onChange={e => setTexto(e.target.value)} placeholder="Pega aquí la respuesta de la IA..." />
                    {errorPegar && <div style={{ marginTop: 10, color: 'var(--t-error)', fontSize: 12 }}>[ERROR] {errorPegar}</div>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                        <button className="t-btn plano" disabled={leyendo} onClick={() => setPegando(false)}>[ Cancelar ]</button>
                        <button className="t-btn principal" disabled={leyendo || !texto.trim()} onClick={aplicarPegado}>{leyendo ? '[ Leyendo... ]' : '[ Aplicar al formulario ]'}</button>
                    </div>
                </Modal>
            )}
            {confirmarSalir && (
                <Dialogo titulo="Descartar cambios" texto="Hay cambios sin guardar en esta neurona. Si sales ahora se pierden."
                    aceptar="Descartar" peligro onAceptar={onSalir} onCancelar={() => setConfirmarSalir(false)} />
            )}
        </div>
    );
}
