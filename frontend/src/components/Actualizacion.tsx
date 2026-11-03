import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { API } from '../utils/api';
import { enTauri } from './BarraTitulo';
import { Cabecera, Modal } from './terminal';
import { barraAscii } from '../utils/barraAscii';

interface Novedad { version: string; notas: string }
interface Progreso { recibido: number; total: number | null }

const MB = (bytes: number) => (bytes / 1048576).toFixed(1);

/** Al abrir la app comprueba si hay una versión nueva (firmada con la clave del proyecto) y lo avisa. Al aceptar, descarga e instala sin más preguntas:
 *  la app se cierra sola y el instalador, en modo actualización, la vuelve a abrir. Sin red o sin novedades no se ve nada. */
export default function Actualizacion() {
    const [nueva, setNueva] = useState<Novedad | null>(null);
    const [progreso, setProgreso] = useState<Progreso | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [oculta, setOculta] = useState(false);

    useEffect(() => {
        if (!enTauri()) return;
        let vivo = true;
        // Solo si el usuario no lo ha apagado en Ajustes: es la única vez que la app consulta internet por su cuenta (a github.com, sin enviar nada tuyo).
        fetch(`${API}/api/ajustes`).then(r => r.json())
            .then(a => (a.buscar_actualizaciones === false ? null : invoke<Novedad | null>('buscar_actualizacion')))
            .then(n => { if (vivo) setNueva(n ?? null); })
            .catch(() => {});
        return () => { vivo = false; };
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

    if (!nueva || oculta) return null;
    const descargando = progreso !== null;
    const pct = progreso?.total ? Math.min(100, Math.round((progreso.recibido / progreso.total) * 100)) : 0;
    return (
        <Modal ancho={520} z={90}>
            <Cabecera titulo={`Versión ${nueva.version} disponible`} />
            {nueva.notas && <div style={{ margin: '14px 0', maxHeight: 220, overflowY: 'auto', whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.5, color: 'var(--t-texto)' }}>{nueva.notas}</div>}
            {descargando ? (
                <div style={{ margin: '14px 0', fontSize: 13 }}>
                    <div style={{ color: 'var(--t-verde)', letterSpacing: 1 }}>{barraAscii(pct)}</div>
                    <div style={{ color: 'var(--t-suave)', marginTop: 6 }}>
                        {progreso && progreso.total ? `Descargando ${MB(progreso.recibido)} / ${MB(progreso.total)} MB` : 'Descargando...'}
                        {' '}La app se cerrará sola y volverá a abrirse.
                    </div>
                </div>
            ) : (
                <p style={{ margin: '14px 0', fontSize: 12, color: 'var(--t-suave)' }}>Tus neuronas no se tocan. La app se cerrará un momento y volverá a abrirse.</p>
            )}
            {error && <div style={{ color: 'var(--t-error)', fontSize: 12, marginBottom: 10, whiteSpace: 'pre-wrap' }}>[ERROR] {error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="t-btn plano" disabled={descargando} onClick={() => setOculta(true)}>[ Más tarde ]</button>
                <button className="t-btn principal" disabled={descargando} onClick={actualizar}>[ Actualizar ]</button>
            </div>
        </Modal>
    );
}
