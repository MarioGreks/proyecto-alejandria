import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { API } from '../utils/api';
import { enTauri } from './BarraTitulo';
import { guardarCache, iguales, leerCache } from '../utils/cacheEstado';

interface Resumen { enviadas: number; recibidas: number; borradas: number; conflictos: string[]; avisos: string[]; cuando: string }
interface Estado {
    configurada: boolean; carpeta: string; auto: boolean; sincronizando: boolean; error: string | null;
    pc: string | null; ultima: Resumen | null; generacion: number; pcs: { id: string; nombre: string; ultima: string }[];
}

/** «hace 3 min» a partir de una fecha ISO. */
const hace = (iso: string): string => {
    const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (!isFinite(s)) return '';
    if (s < 60) return 'hace unos segundos';
    if (s < 3600) return `hace ${Math.round(s / 60)} min`;
    if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
    return `hace ${Math.round(s / 86400)} d`;
};
const nombreDe = (clave: string) => clave.replace(/^[nc]\//, '').replace('@', ' → ');

/** Ajustes → Sincronización entre PCs: eliges una carpeta que ya sincronice tu nube (OneDrive, Dropbox...) y cada PC deja ahí sus neuronas y conexiones y lee las de los demás. */
export default function SincronizacionPcs() {
    const [s, setS] = useState<Estado | null>(() => leerCache<Estado>('sync'));
    const [ruta, setRuta] = useState(() => leerCache<Estado>('sync')?.carpeta ?? '');
    const [mensaje, setMensaje] = useState('');
    const [ocupado, setOcupado] = useState(false);

    const cargar = () => fetch(`${API}/api/sync/estado`).then(r => r.json()).then((e: Estado) => { guardarCache('sync', e); setS(prev => (prev && iguales(prev, e) ? prev : e)); setRuta(r => r || e.carpeta); }).catch(() => {});
    useEffect(() => { cargar(); const t = setInterval(() => { if (!document.hidden) cargar(); }, 5000); return () => clearInterval(t); }, []);

    const guardar = async (cambios: Record<string, unknown>) => {
        const res = await fetch(`${API}/api/ajustes`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cambios) });
        if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            setMensaje(`Error: ${j.detail ?? 'no se pudo guardar el ajuste.'}`);
            return false;
        }
        setMensaje('');
        cargar();
        return true;
    };
    const examinar = async () => {
        try {
            const elegida = await invoke<string | null>('elegir_carpeta', { inicial: s?.carpeta || ruta });
            if (elegida) { setRuta(elegida); await guardar({ carpeta_sincronizacion: elegida }); }
        } catch (e) { setMensaje(`Error: ${String(e)}`); }
    };
    const ahora = async () => {
        setOcupado(true);
        try {
            const e: Estado = await fetch(`${API}/api/sync/ahora`, { method: 'POST' }).then(r => r.json());
            setS(e);
            if (e.ultima && (e.ultima.recibidas || e.ultima.borradas)) window.location.reload();     // llegaron cambios: se recarga para verlos
        } catch { setMensaje('Error: no se pudo hablar con el servidor.'); }
        setOcupado(false);
    };

    if (!s) return <p style={{ fontSize: 12, color: '#7aa' }}>Cargando...</p>;
    const u = s.ultima;
    return (<>
        <div style={{ fontSize: 12, color: '#7aa', lineHeight: 1.5, marginBottom: 10 }}>
            Para tener tus neuronas en dos ordenadores: elige en los dos una carpeta que ya sincronice tu nube (OneDrive, Dropbox, Google Drive, Syncthing...).
            Cada PC deja ahí lo suyo y lee lo de los demás; las ediciones, las neuronas nuevas, los borrados y qué conexiones aceptaste o rechazaste viajan solos.
            No se sincronizan los ajustes. Los datos pasan por la nube que elijas: la app no sube nada por su cuenta.
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input className="t-campo" style={{ flex: 1, minWidth: 220, padding: 6 }} value={ruta} placeholder="C:\Users\tú\OneDrive\Alejandria"
                onChange={ev => setRuta(ev.target.value)} />
            {enTauri() && <button className="t-btn" onClick={examinar}>[ Examinar ]</button>}
            <button className="t-btn" disabled={!ruta.trim() || ruta.trim() === s.carpeta} onClick={() => guardar({ carpeta_sincronizacion: ruta.trim() })}>[ Usar esta carpeta ]</button>
            {s.configurada && <button className="t-btn plano" onClick={() => { setRuta(''); guardar({ carpeta_sincronizacion: '' }); }}>[ Dejar de sincronizar ]</button>}
        </div>
        {s.configurada && (<div style={{ marginTop: 12, fontSize: 12, lineHeight: 1.6 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', marginBottom: 8 }}>
                <input type="checkbox" className="t-check" checked={s.auto} onChange={ev => guardar({ sincronizar_auto: ev.target.checked })} />
                Sincronizar al abrir la app
            </label>
            <div style={{ color: s.error ? 'var(--t-error)' : 'var(--t-verde)' }}>
                {s.error ? `○ No se pudo sincronizar: ${s.error}` : s.sincronizando ? '● Sincronizando...' : u ? `● Última sincronización ${hace(u.cuando)}: ${u.enviadas} enviadas, ${u.recibidas} recibidas${u.borradas ? `, ${u.borradas} borradas` : ''}` : '○ Aún no se ha sincronizado'}
            </div>
            {s.pcs.length > 0 && <div style={{ color: '#7aa' }}>Otros PCs en esta carpeta: {s.pcs.map(p => `${p.nombre}${p.ultima ? ` (${hace(p.ultima)})` : ''}`).join(', ')}</div>}
            {s.pcs.length === 0 && u && !s.error && <div style={{ color: '#7aa' }}>Todavía no hay ningún otro PC en esta carpeta: repite esto en el otro.</div>}
            {u && u.conflictos.length > 0 && (
                <div style={{ color: 'var(--t-ambar)' }}>
                    [!] Editado en dos PCs a la vez: {u.conflictos.map(nombreDe).join(', ')}. Se conservó la edición más reciente y la otra está en la carpeta «conflictos» de tus datos.
                </div>
            )}
            {u && u.avisos.map((a, i) => <div key={i} style={{ color: 'var(--t-ambar)' }}>[!] {a}</div>)}
            <div style={{ marginTop: 8 }}><button className="t-btn" disabled={ocupado || s.sincronizando} onClick={ahora}>[ Sincronizar ahora ]</button>
                <span style={{ color: '#7aa', marginLeft: 10 }}>Se sincroniza al abrir la app y cuando pulsas este botón.</span></div>
        </div>)}
        {mensaje && <div style={{ marginTop: 10, color: 'var(--t-error)', fontSize: 12 }}>{mensaje}</div>}
    </>);
}
