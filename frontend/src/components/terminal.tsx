// Piezas comunes de la estética terminal (ASCII). Los colores y las clases (.t-btn, .t-marco, .t-input) están en App.css.
import type { CSSProperties, ReactNode } from 'react';

export const MONO = 'var(--t-mono)';

/** Pantalla completa con velo oscuro y un marco terminal centrado (Ajustes, tutorial, inyector...). */
export const Modal = ({ ancho = 560, children, z = 55 }: { ancho?: number; children: ReactNode; z?: number }) => (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: z }}>
        <div className="t-marco" style={{ width: ancho, maxWidth: '92%', maxHeight: '90%', overflowY: 'auto', padding: 26, fontSize: 14 }}>{children}</div>
    </div>
);

/** Diálogo corto (sustituye a prompt/confirm/alert del sistema): texto, campo opcional y dos botones. */
export const Dialogo = ({ titulo, texto, aceptar = 'Aceptar', peligro, campo, onAceptar, onCancelar }: {
    titulo: string; texto: string; aceptar?: string; peligro?: boolean;
    campo?: { valor: string; onCambio: (v: string) => void; placeholder?: string };
    onAceptar: () => void; onCancelar?: () => void;
}) => (
    <Modal ancho={460} z={80}>
        <Cabecera titulo={titulo} />
        <p style={{ margin: '14px 0', color: 'var(--t-texto)', lineHeight: 1.5, fontSize: 13 }}>{texto}</p>
        {campo && <input className="t-campo" autoFocus style={{ width: '100%', marginBottom: 14 }} value={campo.valor} placeholder={campo.placeholder}
            onChange={e => campo.onCambio(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onAceptar(); if (e.key === 'Escape') onCancelar?.(); }} />}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            {onCancelar && <button className="t-btn plano" onClick={onCancelar}>[ Cancelar ]</button>}
            <button className={`t-btn ${peligro ? 'peligro' : 'principal'}`} onClick={onAceptar}>[ {aceptar} ]</button>
        </div>
    </Modal>
);

/** Cabecera de un marco: «> Título» y «[x]» para cerrar. */
export const Cabecera = ({ titulo, onCerrar }: { titulo: string; onCerrar?: () => void }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--t-verde)' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontFamily: MONO, fontWeight: 700 }}>&gt; {titulo}</h2>
        {onCerrar && <button className="t-btn plano" onClick={onCerrar} style={{ fontSize: 16 }}>[x]</button>}
    </div>
);

/** Sección con separador de guiones y título «## Título» en ámbar. */
export const Seccion = ({ titulo, children, estilo }: { titulo: string; children: ReactNode; estilo?: CSSProperties }) => (
    <section style={{ borderTop: '1px dashed var(--t-linea)', paddingTop: 14, marginTop: 14, ...estilo }}>
        <div style={{ color: 'var(--t-ambar)', fontSize: 13, marginBottom: 10 }}>## {titulo}</div>
        {children}
    </section>
);
