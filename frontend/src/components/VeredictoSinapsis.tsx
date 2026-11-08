import type { ReactNode } from 'react';
import type { RevisionSinapsis, Veredicto } from '../utils/neurona';
import { Seccion } from './terminal';

const MONO = 'var(--t-mono)';
const COLOR: Record<Veredicto, string> = { confirmar: 'var(--t-verde)', cuestionar: 'var(--t-ambar)', quitar: 'var(--t-error)' };
const ETIQUETA: Record<Veredicto, string> = { confirmar: 'confirmar', cuestionar: 'cuestionar', quitar: 'quitar' };

/** Clave de una propuesta en `hechas`: las dos listas pueden tener la misma vecina. */
export const claveVeredicto = (con: string) => `v:${con}`;
export const claveNueva = (con: string) => `n:${con}`;

interface Props {
    revision: RevisionSinapsis;
    hechas: Record<string, boolean>;                      // propuestas ya aplicadas
    ocupado: string;                                      // clave de la que se está aplicando (o '')
    onEstado: (con: string, status: 'aceptada' | 'rechazada') => void;
    onCrear: (con: string, motivo: string) => void;
    onDescartar: () => void;
}

const Fila = ({ color, children, acciones }: { color: string; children: ReactNode; acciones: ReactNode }) => (
    <div style={{ padding: 12, border: '1px solid var(--t-linea)', borderLeft: `3px solid ${color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: '1 1 320px', fontSize: 14, lineHeight: 1.5, color: '#c8d0d0' }}>{children}</div>
        <div style={{ flex: 'none', display: 'flex', gap: 8, alignItems: 'center' }}>{acciones}</div>
    </div>
);

/** Lo que la IA externa opina de las conexiones de la neurona. Solo propone: cada fila se aplica (o no) a mano con los endpoints de aristas. */
export default function VeredictoSinapsis({ revision, hechas, ocupado, onEstado, onCrear, onDescartar }: Props) {
    const { veredictos, nuevas } = revision;
    const hecho = <span style={{ fontFamily: MONO, fontSize: 12, color: 'var(--t-suave)' }}>[ Aplicado ]</span>;
    return (
        <Seccion titulo={`Veredicto de la IA sobre las sinapsis (${veredictos.length + nuevas.length})`} estilo={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ margin: 0, color: 'var(--t-suave)', fontSize: 12, lineHeight: 1.5, fontFamily: MONO }}>
                    Son propuestas: no se ha cambiado ninguna conexión. Cada botón actúa al momento sobre esa conexión (no espera a «Guardar»).
                </p>
                {veredictos.length === 0 && nuevas.length === 0 && <div style={{ color: 'var(--t-suave)', fontFamily: MONO, fontSize: 13 }}>La IA no ha opinado sobre ninguna conexión.</div>}
                {veredictos.map(v => {
                    const clave = claveVeredicto(v.con);
                    // «confirmar» sobre una ya aceptada o «quitar» sobre una ya rechazada no cambian nada: solo se enseñan.
                    const destino = v.veredicto === 'confirmar' ? 'aceptada' : v.veredicto === 'quitar' ? 'rechazada' : null;
                    const util = destino !== null && v.estado !== destino;
                    return (
                        <Fila key={clave} color={COLOR[v.veredicto]} acciones={hechas[clave] ? hecho : util && (
                            <button className={`t-btn${v.veredicto === 'quitar' ? ' peligro' : ''}`} disabled={ocupado !== ''}
                                title={v.veredicto === 'quitar' ? 'Rechazar y eliminar la conexión' : 'Marcar la conexión como aceptada'}
                                onClick={() => onEstado(v.con, destino!)}>{v.veredicto === 'quitar' ? '[ Rechazar ]' : '[ Aceptar ]'}</button>
                        )}>
                            <div><span style={{ color: COLOR[v.veredicto], fontFamily: MONO, fontWeight: 700 }}>{ETIQUETA[v.veredicto]}</span> · <span style={{ color: 'var(--t-verde)' }}>{v.nombre}</span>
                                <span style={{ color: 'var(--t-suave)', fontFamily: MONO, fontSize: 12 }}> (ahora: {v.estado})</span></div>
                            {v.razon ? <div style={{ marginTop: 4 }}>{v.razon}</div> : <div style={{ marginTop: 4, color: 'var(--t-suave)' }}>(sin razón)</div>}
                        </Fila>
                    );
                })}
                {nuevas.map(n => {
                    const clave = claveNueva(n.con);
                    return (
                        <Fila key={clave} color="var(--t-verde)" acciones={hechas[clave] ? hecho : (
                            <button className="t-btn" disabled={ocupado !== ''} title="Crear la conexión (queda aceptada)" onClick={() => onCrear(n.con, n.motivo)}>[ Crear conexión ]</button>
                        )}>
                            <div><span style={{ color: 'var(--t-verde)', fontFamily: MONO, fontWeight: 700 }}>añadir</span> · <span style={{ color: 'var(--t-verde)' }}>{n.nombre}</span></div>
                            {n.motivo ? <div style={{ marginTop: 4 }}>{n.motivo}</div> : <div style={{ marginTop: 4, color: 'var(--t-suave)' }}>(sin motivo)</div>}
                        </Fila>
                    );
                })}
                <button className="t-btn plano" style={{ alignSelf: 'flex-start' }} onClick={onDescartar}>[ Descartar el veredicto ]</button>
            </div>
        </Seccion>
    );
}
