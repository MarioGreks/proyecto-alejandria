import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { API } from '../utils/api';
import { barraAscii } from '../utils/barraAscii';
import { hayQueAvisarDeActualizado } from '../utils/versiones';
import { enTauri } from './BarraTitulo';

interface Novedad { version: string; notas: string }
interface Progreso { recibido: number; total: number | null }

const MB = (bytes: number) => (bytes / 1048576).toFixed(1);
const CLAVE_VERSION = 'alejandria.versionVista';

// Un cartel pequeño en la esquina de abajo a la derecha, encima de la barra inferior: sin velo oscuro y sin bloquear la app.
const cartel: CSSProperties = {
    position: 'absolute', right: 14, bottom: 46, width: 300, padding: '10px 12px', fontSize: 12, lineHeight: 1.45, zIndex: 90,
    boxShadow: '0 0 14px rgba(0, 255, 170, 0.12)',
};
const boton: CSSProperties = { fontSize: 12, padding: '3px 9px' };

/** Al abrir la app: si hay una versión nueva (firmada con la clave del proyecto) lo dice en un cartel discreto; al pulsar Actualizar descarga (el cartel se
 *  convierte en una barra), la app se cierra y una ventanita mínima la actualiza y la vuelve a abrir. Después, un aviso de 5 s: «Actualizado a la versión X».
 *  «Luego» solo lo oculta hasta la próxima vez que abras la app. Sin red o sin novedades no se ve nada. */
export default function Actualizacion() {
    const [nueva, setNueva] = useState<Novedad | null>(null);
    const [progreso, setProgreso] = useState<Progreso | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [oculta, setOculta] = useState(false);
    const [verNotas, setVerNotas] = useState(false);
    const [actualizado, setActualizado] = useState<string | null>(null);

    useEffect(() => {
        if (!enTauri()) return;
        let vivo = true;
        let aviso: ReturnType<typeof setTimeout> | undefined;
        // La versión que corre ahora es la de la propia app (no la del backend, que podría ser un proceso antiguo ya abierto); si la última vez que se abrió era
        // otra (más antigua), se acaba de actualizar.
        getVersion().then(version => {
            let vista: string | null = null;
            try { vista = localStorage.getItem(CLAVE_VERSION); localStorage.setItem(CLAVE_VERSION, version); } catch { /* sin almacenamiento: no hay aviso */ }
            if (vivo && hayQueAvisarDeActualizado(vista, version)) {
                setActualizado(version);
                aviso = setTimeout(() => setActualizado(null), 5000);
            }
        }).catch(() => {});
        // Solo si el usuario no lo ha apagado en Ajustes: es la única vez que la app consulta internet por su cuenta (a github.com, sin enviar nada tuyo).
        fetch(`${API}/api/ajustes`).then(r => r.json())
            .then(a => (a.buscar_actualizaciones === false ? null : invoke<Novedad | null>('buscar_actualizacion')))
            .then(n => { if (vivo) setNueva(n ?? null); }).catch(() => {});
        return () => { vivo = false; clearTimeout(aviso); };
    }, []);

    const actualizar = async () => {
        setError(null);
        setProgreso({ recibido: 0, total: null });
        const quitar = await listen<Progreso>('actualizacion-progreso', e => setProgreso(e.payload));
        try {
            await invoke('instalar_actualizacion');       // si todo va bien, la app se cierra aquí mismo
        } catch (e) {
            setError(String(e));
            setProgreso(null);
        } finally {
            quitar();
        }
    };

    if (actualizado) {
        return <div className="t-marco" style={{ ...cartel, color: 'var(--t-verde)' }}>&gt; Actualizado a la versión {actualizado}</div>;
    }
    if (!nueva || oculta) return null;
    const descargando = progreso !== null;
    const pct = progreso?.total ? Math.min(100, Math.round((progreso.recibido / progreso.total) * 100)) : 0;
    return (
        <div className="t-marco" style={cartel} role="status">
            <div style={{ color: 'var(--t-verde)', fontWeight: 700 }}>&gt; Versión {nueva.version} disponible</div>
            {descargando ? (
                <div style={{ marginTop: 8 }}>
                    <div style={{ color: 'var(--t-verde)', letterSpacing: 1 }}>{barraAscii(pct, 22)}</div>
                    <div style={{ color: 'var(--t-suave)', fontSize: 11, marginTop: 4 }}>
                        {progreso && progreso.total ? `${MB(progreso.recibido)} / ${MB(progreso.total)} MB` : 'Descargando...'} · la app se cerrará un momento
                    </div>
                </div>
            ) : (<>
                {nueva.notas && (
                    <div style={{ marginTop: 4 }}>
                        <button className="t-btn plano" style={{ ...boton, padding: 0, border: 'none', color: 'var(--t-suave)' }} onClick={() => setVerNotas(v => !v)}>
                            {verNotas ? '▾' : '▸'} qué hay de nuevo
                        </button>
                        {verNotas && <div style={{ marginTop: 4, maxHeight: 120, overflowY: 'auto', whiteSpace: 'pre-wrap', fontSize: 11, color: 'var(--t-texto)' }}>{nueva.notas}</div>}
                    </div>
                )}
                {error && <div style={{ color: 'var(--t-error)', fontSize: 11, marginTop: 6, whiteSpace: 'pre-wrap' }}>[ERROR] {error}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                    <button className="t-btn plano" style={boton} onClick={() => setOculta(true)}>[ Luego ]</button>
                    <button className="t-btn principal" style={boton} onClick={actualizar}>{error ? '[ Reintentar ]' : '[ Actualizar ]'}</button>
                </div>
            </>)}
        </div>
    );
}
