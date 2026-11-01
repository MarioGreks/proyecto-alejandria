import { opcionesATexto, nuevoControl, textoAOpciones, validarControles, variablesSinControl } from '../utils/labSpec';
import type { ControlParams } from '../utils/labSpec';

interface Props {
    controles: ControlParams[];
    codigo: string;
    onControles: (c: ControlParams[]) => void;
    onCodigo: (s: string) => void;
    onEjecutar: () => void;
    onGuardar: () => void;
    onSalir: () => void;
    guardando: boolean;
    errorGuardar: string | null;
    hayCambios: boolean;
    esNuevo: boolean;
}

const caja: React.CSSProperties = { background: 'var(--t-fondo)', color: 'var(--t-texto)', border: '1px solid var(--t-linea)', borderRadius: 0, padding: '4px 6px', fontSize: 12.5, width: '100%', boxSizing: 'border-box', fontFamily: 'var(--t-mono)' };
const etiqueta: React.CSSProperties = { color: 'var(--t-suave)', fontSize: 11, display: 'block', marginBottom: 2, fontFamily: 'var(--t-mono)' };
const boton = (color: string, activo = true): React.CSSProperties => ({ background: 'transparent', border: `1px solid ${color}`, color, padding: '6px 12px', borderRadius: 0, cursor: activo ? 'pointer' : 'default', fontSize: 13, opacity: activo ? 1 : 0.4, fontFamily: 'var(--t-mono)' });

export default function LabEditor({ controles, codigo, onControles, onCodigo, onEjecutar, onGuardar, onSalir, guardando, errorGuardar, hayCambios, esNuevo }: Props) {
    const errores = validarControles(controles);
    const sinControl = variablesSinControl(codigo, controles);
    const cambiar = (i: number, parcial: Partial<ControlParams>) => onControles(controles.map((c, j) => (j === i ? { ...c, ...parcial } : c)));
    const num = (v: number | undefined) => (typeof v === 'number' && Number.isFinite(v) ? v : '');
    const leer = (s: string) => (s === '' ? NaN : parseFloat(s));

    const cambiarTipo = (i: number, tipo: NonNullable<ControlParams['tipo']>) => {
        const c = controles[i];
        if (tipo === 'slider') cambiar(i, { tipo, min: c.min ?? 0, max: c.max ?? 10, step: c.step ?? 0.1, default: typeof c.default === 'number' ? c.default : 1, opciones: undefined });
        else if (tipo === 'checkbox') cambiar(i, { tipo, default: false, opciones: undefined });
        else cambiar(i, { tipo, opciones: c.opciones?.length ? c.opciones : ['a', 'b'], default: 'a' });
    };

    return (
        <div className="t-marco" style={{ marginTop: 16, padding: 16, borderColor: 'var(--t-ambar)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <div style={{ color: 'var(--t-ambar)', fontSize: 14, fontFamily: 'var(--t-mono)', fontWeight: 700 }}>
                    ## {esNuevo ? 'Nuevo laboratorio' : 'Editor del laboratorio'}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={onEjecutar} style={boton('var(--t-verde)')} title="Ctrl+Enter">[ Ejecutar ]</button>
                    <button onClick={onGuardar} disabled={guardando || errores.length > 0 || !hayCambios} style={boton('var(--t-ambar)', !guardando && errores.length === 0 && hayCambios)}>
                        {guardando ? '[ Guardando... ]' : '[ Guardar en el nodo ]'}
                    </button>
                    <button onClick={onSalir} style={boton('var(--t-suave)')}>{hayCambios ? '[ Descartar y salir ]' : '[ Salir del editor ]'}</button>
                </div>
            </div>

            <p style={{ margin: '0 0 12px 0', color: 'var(--t-suave)', fontSize: 12, lineHeight: 1.5, fontFamily: 'var(--t-mono)' }}>
                Cada variable es un control: en el código escribe <code style={{ color: 'var(--t-ambar)' }}>{'{nombre}'}</code> donde quieras su valor
                (por ejemplo <code style={{ color: 'var(--t-ambar)' }}>{'a = {a}'}</code>). Puedes tener las que necesite el modelo y cambiar sus rangos.
                Lo que pruebes aquí no se guarda hasta que pulses «Guardar en el nodo».
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {controles.map((c, i) => {
                    const tipo = c.tipo ?? 'slider';
                    const valores = (c.opciones ?? []).map(o => (typeof o === 'object' ? o.valor : o));
                    return (
                        <div key={i} style={{ padding: 10, border: '1px dashed var(--t-linea)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, alignItems: 'end' }}>
                                <div><label style={etiqueta}>Variable</label><input style={{ ...caja, }} value={c.variable} onChange={e => cambiar(i, { variable: e.target.value })} /></div>
                                <div><label style={etiqueta}>Etiqueta</label><input style={caja} value={c.label} onChange={e => cambiar(i, { label: e.target.value })} /></div>
                                <div>
                                    <label style={etiqueta}>Tipo</label>
                                    <select style={caja} value={tipo} onChange={e => cambiarTipo(i, e.target.value as NonNullable<ControlParams['tipo']>)}>
                                        <option value="slider">Deslizable</option><option value="checkbox">Casilla (sí/no)</option><option value="select">Desplegable</option>
                                    </select>
                                </div>
                                <div><label style={etiqueta}>Grupo (opcional)</label><input style={caja} value={c.grupo ?? ''} onChange={e => cambiar(i, { grupo: e.target.value || undefined })} /></div>
                                {tipo === 'slider' && (<>
                                    <div><label style={etiqueta}>Mínimo</label><input style={caja} type="number" value={num(c.min)} onChange={e => cambiar(i, { min: leer(e.target.value) })} /></div>
                                    <div><label style={etiqueta}>Máximo</label><input style={caja} type="number" value={num(c.max)} onChange={e => cambiar(i, { max: leer(e.target.value) })} /></div>
                                    <div><label style={etiqueta}>Paso</label><input style={caja} type="number" value={num(c.step)} onChange={e => cambiar(i, { step: leer(e.target.value) })} /></div>
                                    <div><label style={etiqueta}>Inicial</label><input style={caja} type="number" value={num(c.default as number)} onChange={e => cambiar(i, { default: leer(e.target.value) })} /></div>
                                </>)}
                                {tipo === 'checkbox' && (
                                    <div><label style={etiqueta}>Inicial</label>
                                        <label style={{ color: 'var(--t-texto)', fontSize: 12.5, fontFamily: 'var(--t-mono)' }}><input type="checkbox" className="t-check" checked={c.default === true} onChange={e => cambiar(i, { default: e.target.checked })} /> activada</label>
                                    </div>
                                )}
                                {tipo === 'select' && (<>
                                    <div style={{ gridColumn: 'span 2' }}><label style={etiqueta}>Opciones (separadas por comas)</label>
                                        <input style={caja} defaultValue={opcionesATexto(c)} key={`op-${i}`} onBlur={e => { const o = textoAOpciones(e.target.value); cambiar(i, { opciones: o, default: o.some(v => String(v) === String(c.default)) ? c.default : o[0] }); }} />
                                    </div>
                                    <div><label style={etiqueta}>Inicial</label>
                                        <select style={caja} value={String(c.default)} onChange={e => cambiar(i, { default: valores.find(v => String(v) === e.target.value) ?? e.target.value })}>
                                            {valores.map(v => <option key={String(v)} value={String(v)}>{String(v)}</option>)}
                                        </select>
                                    </div>
                                </>)}
                                <div><button onClick={() => onControles(controles.filter((_, j) => j !== i))} style={{ ...boton('var(--t-error)'), padding: '4px 10px' }} title="Quitar esta variable">[ Quitar ]</button></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
                <button onClick={() => onControles([...controles, nuevoControl(controles)])} style={boton('var(--t-verde)')}>[ + Añadir variable ]</button>
                {sinControl.map(v => (
                    <button key={v} onClick={() => onControles([...controles, nuevoControl(controles, v)])} style={{ ...boton('var(--t-ambar)'), padding: '3px 8px', fontSize: 12 }}
                        title="Aparece como {nombre} en el código pero no tiene control. Si es una variable normal de Python (p. ej. dentro de un f-string), ignóralo.">
                        {`[ {${v}} sin control: crear ]`}
                    </button>
                ))}
            </div>

            {errores.length > 0 && (
                <ul style={{ margin: '10px 0 0 0', padding: '8px 8px 8px 24px', border: '1px solid var(--t-error)', color: 'var(--t-error)', fontSize: 12, fontFamily: 'var(--t-mono)' }}>
                    {errores.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
            )}

            <label style={{ ...etiqueta, marginTop: 14, fontSize: 12 }}>Código Python (Ctrl+Enter para ejecutar)</label>
            <textarea
                value={codigo}
                onChange={e => onCodigo(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onEjecutar(); }
                    if (e.key === 'Tab') {   // sangría en vez de saltar de campo
                        e.preventDefault();
                        const t = e.currentTarget, ini = t.selectionStart, fin = t.selectionEnd;
                        onCodigo(codigo.slice(0, ini) + '    ' + codigo.slice(fin));
                        requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = ini + 4; });
                    }
                }}
                spellCheck={false}
                style={{ width: '100%', boxSizing: 'border-box', minHeight: 280, resize: 'vertical', background: 'rgba(0,0,0,0.5)', color: 'var(--t-texto)', border: '1px solid var(--t-linea)', borderRadius: 0, padding: 12, fontSize: 13, fontFamily: 'var(--t-mono)', lineHeight: 1.45, whiteSpace: 'pre', overflow: 'auto' }}
            />

            {errorGuardar && <div style={{ marginTop: 10, color: 'var(--t-error)', fontSize: 12.5, fontFamily: 'var(--t-mono)' }}>[ERROR] {errorGuardar}</div>}
        </div>
    );
}
