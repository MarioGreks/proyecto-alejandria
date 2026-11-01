import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { MONO } from './terminal';

export const enTauri = () => '__TAURI_INTERNALS__' in window;

const Boton = ({ texto, titulo, onClick, peligro }: { texto: string; titulo: string; onClick: () => void; peligro?: boolean }) => (
    <button
        title={titulo}
        aria-label={titulo}
        onClick={onClick}
        onMouseEnter={e => { e.currentTarget.style.background = peligro ? 'var(--t-error)' : 'rgba(0,255,170,0.14)'; e.currentTarget.style.color = peligro ? '#000' : 'var(--t-verde)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t-suave)'; }}
        style={{ background: 'transparent', border: 'none', color: 'var(--t-suave)', fontFamily: MONO, fontSize: 13, height: '100%', padding: '0 12px', cursor: 'pointer' }}
    >{texto}</button>
);

type Direccion = 'North' | 'South' | 'East' | 'West' | 'NorthEast' | 'NorthWest' | 'SouthEast' | 'SouthWest';
const BORDE = 5, ESQUINA = 12;
// Zonas invisibles en los bordes: sin la decoración de Windows la ventana solo se redimensiona si se las damos (cursor y arrastre nativos).
const ASAS: { d: Direccion; cursor: string; estilo: React.CSSProperties }[] = [
    { d: 'North', cursor: 'ns-resize', estilo: { top: 0, left: ESQUINA, right: ESQUINA, height: BORDE } },
    { d: 'South', cursor: 'ns-resize', estilo: { bottom: 0, left: ESQUINA, right: ESQUINA, height: BORDE } },
    { d: 'West', cursor: 'ew-resize', estilo: { left: 0, top: ESQUINA, bottom: ESQUINA, width: BORDE } },
    { d: 'East', cursor: 'ew-resize', estilo: { right: 0, top: ESQUINA, bottom: ESQUINA, width: BORDE } },
    { d: 'NorthWest', cursor: 'nwse-resize', estilo: { top: 0, left: 0, width: ESQUINA, height: ESQUINA } },
    { d: 'SouthEast', cursor: 'nwse-resize', estilo: { bottom: 0, right: 0, width: ESQUINA, height: ESQUINA } },
    { d: 'NorthEast', cursor: 'nesw-resize', estilo: { top: 0, right: 0, width: ESQUINA, height: ESQUINA } },
    { d: 'SouthWest', cursor: 'nesw-resize', estilo: { bottom: 0, left: 0, width: ESQUINA, height: ESQUINA } },
];

/** Barra de título propia (la ventana de Tauri va sin decoración): arrastrable, con minimizar, maximizar y cerrar. */
export default function BarraTitulo() {
    const [maximizada, setMaximizada] = useState(false);

    useEffect(() => {
        if (!enTauri()) return;
        const ventana = getCurrentWindow();
        const leer = () => ventana.isMaximized().then(setMaximizada).catch(() => {});
        leer();
        const off = ventana.onResized(leer);
        return () => { off.then(f => f()).catch(() => {}); };
    }, []);

    if (!enTauri()) return null;       // en el navegador (desarrollo) ya hay barra del navegador
    const ventana = getCurrentWindow();
    return (<>
        {!maximizada && ASAS.map(a => (
            <div key={a.d} onMouseDown={e => { if (e.button === 0) ventana.startResizeDragging(a.d); }}
                style={{ position: 'fixed', zIndex: 1000, cursor: a.cursor, ...a.estilo }} />
        ))}
        <div data-tauri-drag-region style={{
            height: 28, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 12,
            background: 'var(--t-fondo)', borderBottom: '1px solid var(--t-linea)', fontFamily: MONO, fontSize: 12, userSelect: 'none', zIndex: 100,
        }}>
            <div data-tauri-drag-region style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--t-verde)', overflow: 'hidden' }}>
                <span data-tauri-drag-region>&gt; PROYECTO ALEJANDRÍA</span>
                <span data-tauri-drag-region style={{ color: 'var(--t-linea)', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>{'-'.repeat(200)}</span>
            </div>
            <div style={{ display: 'flex', height: '100%' }}>
                <Boton texto="[_]" titulo="Minimizar" onClick={() => ventana.minimize()} />
                <Boton texto={maximizada ? '[▣]' : '[□]'} titulo={maximizada ? 'Restaurar' : 'Maximizar'} onClick={() => ventana.toggleMaximize()} />
                <Boton texto="[x]" titulo="Cerrar" onClick={() => ventana.close()} peligro />
            </div>
        </div>
    </>);
}
