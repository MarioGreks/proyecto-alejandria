import { useEffect, useRef, useState } from 'react';
import { API } from '../utils/api';
import { MONO } from './terminal';
import { guardarCache } from '../utils/cacheEstado';
import { SelectorSubred } from './Subredes';
import type { InfoSubred } from '../utils/subredes';

interface Resultado { node: { id: string; nombre: string }; type: string }
interface Sinapsis { activo: boolean; nodo: string | null; hecho: number; total: number; ia_pausada?: boolean; motivo_pausa?: string }

interface Props {
    busqueda: string;
    onBusqueda: (q: string) => void;
    resultados: Resultado[];
    onElegir: (id: string) => void;
    nodos: number;
    aristas: number;
    sinapsis: Sinapsis | null;
    aviso: string | null;
    subredes: InfoSubred[];
    subredActiva: string | null;
    calculando: boolean;
    onSubred: (nombre: string | null) => void;
    onGestionar: () => void;
    onAjustes: () => void;
    onAgenda: () => void;
    onPapelera: () => void;
    onRecargar: () => void;
    onInyector: () => void;
    onCentrar: () => void;
    onReorganizar: () => void;
}

const barra: React.CSSProperties = {
    position: 'absolute', left: 0, right: 0, height: 34, display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px',
    background: 'rgba(5,7,13,0.88)', fontFamily: MONO, fontSize: 12, color: 'var(--t-texto)', zIndex: 10,
};

/** Estado de la IA local para la barra inferior (se consulta a menudo: es barato y no depende del universo). */
let arranqueIntentado = false;   // al abrir la app se intenta levantar Ollama una vez; si luego lo cierras tú a propósito, no se vuelve a abrir solo

function useIA() {
    const [texto, setTexto] = useState('IA: ...');
    useEffect(() => {
        let vivo = true;
        let espera: ReturnType<typeof setTimeout> | undefined;
        let reintentando = false;     // mientras se espera a Ollama, la lectura periódica no pisa el aviso
        const leer = (arrancando = 0) => fetch(`${API}/api/ajustes`).then(r => r.json())
            .then(e => {
                if (!vivo) return;
                guardarCache('ajustes', e);
                reintentando = false;
                if (e.ia_activa && !e.ollama && e.ollama_instalado && (arrancando > 0 || !arranqueIntentado)) {
                    if (!arranqueIntentado) { arranqueIntentado = true; fetch(`${API}/api/ollama/arrancar`, { method: 'POST' }).catch(() => {}); }
                    if (arrancando < 10) { reintentando = true; setTexto('IA: arrancando Ollama...'); espera = setTimeout(() => leer(arrancando + 1), 3000); return; }   // hasta ~30 s
                }
                setTexto(!e.ia_activa ? 'IA: apagada' : e.ollama ? `IA: ${e.modelo || 'auto'}` : e.ollama_instalado ? 'IA: Ollama no responde' : 'IA: Ollama no instalado');
            })
            .catch(() => vivo && setTexto('IA: sin servidor'));
        leer();
        const t = setInterval(() => { if (!reintentando) leer(); }, 15000);
        return () => { vivo = false; clearInterval(t); clearTimeout(espera); };
    }, []);
    return texto;
}

/** La sincronización entre PCs corre una vez al abrir la app. Mientras esa vuelta no termina se mira cada 2 s (y solo entonces); si trae neuronas o conexiones
 *  (cambia su «generación») se recarga el universo para que se vean sin pulsar nada. Terminada, o sin carpeta elegida, esto deja de consultar. */
function useSincronizacion(alCambiar: () => void) {
    const accion = useRef(alCambiar);
    accion.current = alCambiar;
    useEffect(() => {
        let vivo = true;
        let base: number | null = null;
        let intentos = 0;
        let espera: ReturnType<typeof setTimeout> | undefined;
        const leer = () => fetch(`${API}/api/sync/estado`).then(r => r.json()).then(e => {
            if (!vivo || typeof e.generacion !== 'number') return;
            guardarCache('sync', e);
            if (base === null) base = e.generacion;
            if (e.generacion !== base) { accion.current(); return; }
            const termino = !e.configurada || !e.auto || (!e.sincronizando && (e.ultima !== null || e.error !== null));
            if (!termino && ++intentos < 60) espera = setTimeout(leer, 2000);       // como mucho unos 2 minutos
        }).catch(() => {});
        leer();
        return () => { vivo = false; clearTimeout(espera); };
    }, []);
}

export default function Hud(p: Props) {
    const [enfocado, setEnfocado] = useState(false);
    const ia = useIA();
    useSincronizacion(p.onRecargar);
    const [seleccion, setSeleccion] = useState(0);
    useEffect(() => setSeleccion(0), [p.busqueda]);
    const abierto = enfocado && p.busqueda.trim() !== '' && p.resultados.length > 0;
    const elegir = (id: string) => { p.onElegir(id); p.onBusqueda(''); };

    return (<>
        {/* Barra superior: dónde estás (red), búsqueda y herramientas */}
        <div style={{ ...barra, top: 0, borderBottom: '1px solid var(--t-linea)' }}>
            <SelectorSubred subredes={p.subredes} activa={p.subredActiva} calculando={p.calculando} onElegir={p.onSubred} onGestionar={p.onGestionar} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>
                <div style={{ position: 'relative', width: 'min(520px, 100%)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--t-linea)', padding: '4px 10px', background: 'var(--t-fondo)' }}>
                        <span style={{ color: 'var(--t-verde)' }}>&gt;</span>
                        <input
                            className="t-input" style={{ flex: 1, fontSize: 12 }} placeholder="buscar concepto..." value={p.busqueda}
                            onChange={e => { setEnfocado(true); p.onBusqueda(e.target.value); }}
                            onFocus={() => setEnfocado(true)}
                            onBlur={() => setTimeout(() => setEnfocado(false), 200)}
                            onKeyDown={e => {
                                if (e.key === 'ArrowDown') { e.preventDefault(); setSeleccion(s => Math.min(s + 1, p.resultados.length - 1)); }
                                else if (e.key === 'ArrowUp') { e.preventDefault(); setSeleccion(s => Math.max(s - 1, 0)); }
                                else if (e.key === 'Enter' && p.resultados[seleccion]) elegir(p.resultados[seleccion].node.id);
                                else if (e.key === 'Escape') p.onBusqueda('');
                            }}
                        />
                    </label>
                    {abierto && (
                        <div className="t-marco" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, maxHeight: 300, overflowY: 'auto', fontSize: 12 }}>
                            {p.resultados.map((r, i) => (
                                <div key={r.node.id + i} onMouseDown={() => elegir(r.node.id)} onMouseEnter={() => setSeleccion(i)}
                                    style={{ padding: '7px 10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 12, background: i === seleccion ? 'rgba(0,255,170,0.14)' : 'transparent' }}>
                                    <span><span style={{ color: 'var(--t-verde)' }}>{i === seleccion ? '>' : ' '}</span> {r.node.nombre}</span>
                                    <span style={{ color: 'var(--t-ambar)' }}>[{r.type}]</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <button className="t-btn" onClick={p.onAgenda} title="Contactos privados y para qué los guardaste">[ Agenda ]</button>
            <button className="t-btn" onClick={p.onPapelera} title="Neuronas destruidas, recuperables unos días">[ Papelera ]</button>
            <button className="t-btn" onClick={p.onAjustes}>[ Ajustes ]</button>
        </div>

        {/* Barra inferior: crear, estado y acciones sobre la vista */}
        <div style={{ ...barra, bottom: 0, borderTop: '1px solid var(--t-linea)' }}>
            <button className="t-btn" onClick={p.onInyector}>[ + Inyectar neurona ]</button>
            <div style={{ flex: 1, textAlign: 'center', color: 'var(--t-suave)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {p.subredActiva ? `«${p.subredActiva}»: ` : ''}{p.nodos} nodos | {p.aristas} aristas | {ia}
                {p.sinapsis?.activo && <span style={{ color: 'var(--t-ambar)' }}> | buscando conexiones de «{p.sinapsis.nodo}»{p.sinapsis.total > 0 ? ` ${p.sinapsis.hecho}/${p.sinapsis.total}` : '...'}</span>}
                {p.sinapsis?.ia_pausada && <span style={{ color: 'var(--t-ambar)' }} title={p.sinapsis.motivo_pausa}> | IA en pausa: poca memoria libre</span>}
                {!p.sinapsis?.activo && p.aviso && <span style={{ color: 'var(--t-verde)' }}> | {p.aviso}</span>}
            </div>
            <button className="t-btn" onClick={p.onRecargar} title="Vuelve a leer las neuronas del disco">[ Recargar ]</button>
            <button className="t-btn" onClick={p.onReorganizar} title="Vuelve a colocar cada neurona dentro de su clúster según sus conexiones (con animación); los clústeres no se mueven">[ Reorganizar ]</button>
            <button className="t-btn" onClick={p.onCentrar}>[ Centrar vista ]</button>
        </div>
    </>);
}
