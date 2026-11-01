import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { API, fijarPuerto } from '../utils/api';
import PilarAscii from './PilarAscii';
import { barraAscii } from '../utils/barraAscii';

interface Aviso { fase: string; mensaje: string; progreso: number }

const MONO = 'var(--t-mono)';
const enTauri = () => '__TAURI_INTERNALS__' in window;
// Con tiempo máximo (otro programa puede aceptar la conexión y no contestar) y comprobando que es nuestro backend: su /status trae la clave "db".
const responde = () => fetch(`${API}/status`, { cache: 'no-store', signal: AbortSignal.timeout(2500) }).then(r => r.json()).then(j => j && 'db' in j, () => false);

/** Pantalla de primera ejecución: espera al backend y, si no está, le pide a Tauri que lo prepare (uv, Python, librerías) y lo arranque. */
export default function Arranque({ onListo }: { onListo: () => void }) {
    const [aviso, setAviso] = useState<Aviso>({ fase: 'comprobando', mensaje: 'Comprobando el motor...', progreso: 0 });
    const [lineas, setLineas] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [intento, setIntento] = useState(0);

    useEffect(() => {
        let vivo = true;
        const quitar: (() => void)[] = [];
        const escuchar = async <T,>(evento: string, fn: (v: T) => void) => {
            const off = await listen<T>(evento, e => vivo && fn(e.payload));
            if (vivo) quitar.push(off); else off();      // el efecto ya se limpió (StrictMode): no dejar el oyente colgado
        };
        (async () => {
            if (await responde()) { if (vivo) onListo(); return; }       // desarrollo, o un backend que ya estaba en marcha
            if (!enTauri()) { setError('No se puede contactar con el servidor local. Arráncalo con alejandria.bat y recarga la página.'); return; }
            await escuchar<Aviso>('arranque', setAviso);
            await escuchar<string>('arranque-linea', l => setLineas(prev => [...prev.slice(-6), l.slice(0, 110)]));
            try {
                fijarPuerto(await invoke<number>('arrancar_backend'));       // el puerto puede no ser el 8000 si estaba ocupado
                if (vivo) onListo();
            } catch (e) { if (vivo) setError(String(e)); }
        })();
        return () => { vivo = false; quitar.forEach(f => f()); };
    }, [intento]);

    return (
        <div style={{ position: 'absolute', inset: 0, background: '#05070d', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, fontFamily: MONO, color: '#00ffaa' }}>
            <PilarAscii />
            <div style={{ fontSize: 18 }}>&gt; PROYECTO ALEJANDRÍA</div>
            <div style={{ width: 560, maxWidth: '92%', border: '1px solid #1f5a47', padding: 16, fontSize: 13 }}>
                {error ? (<>
                    <div style={{ color: '#ff6b6b', marginBottom: 12, whiteSpace: 'pre-wrap' }}>[ERROR] {error}</div>
                    <button onClick={() => { setError(null); setLineas([]); setIntento(n => n + 1); }}
                        style={{ background: 'transparent', color: '#00ffaa', border: '1px solid #00ffaa', padding: '7px 16px', cursor: 'pointer', fontFamily: MONO }}>Reintentar</button>
                </>) : (<>
                    <div style={{ color: '#cfeee3' }}>{aviso.mensaje}</div>
                    <div style={{ margin: '8px 0 12px', letterSpacing: 1 }}>{barraAscii(aviso.progreso)}</div>
                    <div style={{ color: '#4a8', fontSize: 11, minHeight: 7 * 15, overflow: 'hidden' }}>
                        {lineas.map((l, i) => <div key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l}</div>)}
                    </div>
                    {aviso.fase !== 'comprobando' && <div style={{ color: '#7aa', fontSize: 11, marginTop: 10 }}>La primera vez tarda unos minutos; las siguientes arranca en segundos.</div>}
                </>)}
            </div>
        </div>
    );
}
