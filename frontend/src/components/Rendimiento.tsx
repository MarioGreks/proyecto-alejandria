import { useCallback, useEffect, useRef, useState } from 'react';
import { API } from '../utils/api';
import { avisarRendimiento, nombrePerfil, normalizarRendimiento, textoCpu, textoFps, textoRam } from '../utils/rendimiento';
import type { AjustesRendimiento } from '../utils/rendimiento';
import SliderAscii from './SliderAscii';
import { Dialogo } from './terminal';

interface Hardware { ram_total_mb: number; nucleos: number; gpus: string[]; gpu_dedicada: boolean }
interface Info {
    hardware: Hardware;
    perfil_sugerido: string;
    perfiles: Record<string, Partial<AjustesRendimiento>>;
    min_ram_mb: number;
    min_cpu: number;
    pausa: { pausada: boolean; motivo: string };
    limitando: boolean;
    soporta_topes: boolean;
    ajustes: AjustesRendimiento;
    ollama_ajeno: boolean;
    aplicado: { activo: boolean; ollama_adoptado: number; error: string } | null;
}
interface Medicion { cpu_app_pct: number; ram_backend_mb: number; ram_ollama_mb: number; ram_libre_mb: number; ram_total_mb: number }

const PERFILES: { id: 'ligero' | 'equilibrado' | 'maximo'; texto: string }[] = [
    { id: 'ligero', texto: 'Para PCs justos: la IA usa poca CPU y memoria, el 3D va a 30 FPS con calidad baja y las conexiones de una neurona nueva se buscan cuando tú lo pides.' },
    { id: 'equilibrado', texto: 'Término medio: la app usa hasta el 70 % de la CPU y la mitad de la RAM, y el 3D va a 60 FPS con calidad media.' },
    { id: 'maximo', texto: 'Sin límites: aprovecha todo el equipo, como antes de existir el limitador.' },
];

const fila = { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' } as const;
const etiqueta = { minWidth: 120 } as const;
const nota = { fontSize: 12, color: '#7aa', lineHeight: 1.5 } as const;

/** Sección «Rendimiento» de Ajustes: perfil, topes de CPU y RAM, GPU/3D y un medidor en vivo (solo mientras Ajustes está abierto). */
export default function Rendimiento() {
    const [info, setInfo] = useState<Info | null>(null);
    const [medicion, setMedicion] = useState<Medicion | null>(null);
    const [borrador, setBorrador] = useState<Partial<AjustesRendimiento>>({});     // lo que se está moviendo y aún no se ha enviado
    const [mensaje, setMensaje] = useState('');
    const [confirmarReinicio, setConfirmarReinicio] = useState(false);
    const temporizador = useRef<number | undefined>(undefined);
    const pendiente = useRef<Partial<AjustesRendimiento>>({});

    const recibir = useCallback((r: Info) => { setInfo(r); avisarRendimiento(normalizarRendimiento(r.ajustes)); }, []);

    const cargar = useCallback(() => fetch(`${API}/api/recursos`).then(r => r.json()).then((r: Info) => setInfo(r)).catch(() => setMensaje('Error: no se pudo hablar con el servidor.')), []);
    // El medidor y el estado se leen solo mientras esta sección está en pantalla (Ajustes abierto y ventana visible): no hay nada midiendo el resto del tiempo.
    useEffect(() => {
        void cargar();
        const medir = () => { if (!document.hidden) fetch(`${API}/api/recursos/medicion`).then(r => r.json()).then(setMedicion).catch(() => { /* el backend aún arranca */ }); };
        medir();
        const t = window.setInterval(() => { medir(); if (!document.hidden) void cargar(); }, 2000);
        return () => { window.clearInterval(t); window.clearTimeout(temporizador.current); };
    }, [cargar]);

    const enviar = async (cuerpo: object) => {
        try {
            const res = await fetch(`${API}/api/recursos`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
            if (!res.ok) { setMensaje(`Error: ${(await res.json().catch(() => ({}))).detail?.[0]?.msg ?? 'no se pudo guardar el ajuste.'}`); return; }
            const r: Info = await res.json();
            recibir(r);
            setMensaje(r.aplicado?.error ? `Error: ${r.aplicado.error}` : '');
        } catch { setMensaje('Error: no se pudo hablar con el servidor.'); }
    };

    const elegirPerfil = async (perfil: string) => { window.clearTimeout(temporizador.current); pendiente.current = {}; setBorrador({}); await enviar({ perfil }); };

    /** Un ajuste suelto: se ve al instante y se envía 400 ms después del último movimiento (un deslizable lanzaría decenas de peticiones). */
    const cambiar = (c: Partial<AjustesRendimiento>) => {
        pendiente.current = { ...pendiente.current, ...c };
        setBorrador(b => ({ ...b, ...c }));
        window.clearTimeout(temporizador.current);
        temporizador.current = window.setTimeout(async () => {
            const envio = pendiente.current;
            pendiente.current = {};
            await enviar(envio);
            setBorrador(b => Object.fromEntries(Object.entries(b).filter(([k]) => !(k in envio))) as Partial<AjustesRendimiento>);
        }, 400);
    };

    if (!info) return <p>Midiendo tu equipo...</p>;
    const a: AjustesRendimiento = { ...info.ajustes, ...borrador };
    const hw = info.hardware;
    const totalGb = hw.ram_total_mb / 1024;
    const minGb = info.min_ram_mb / 1024;
    const maxGb = Math.max(minGb, Math.floor(totalGb));
    const ramLimitada = a.limite_ram_mb > 0;
    const fpsLimitados = a.fps_max > 0;
    const gpuTexto = hw.gpus.length === 0 ? 'GPU no detectada' : `${hw.gpus.join(', ')} (${hw.gpu_dedicada ? 'dedicada' : 'integrada'})`;
    const reiniciarOllama = async () => {
        setConfirmarReinicio(false);
        try {
            const res = await fetch(`${API}/api/recursos/reiniciar-ollama`, { method: 'POST' });
            setMensaje(res.ok ? 'Reiniciando Ollama con tus límites... puede tardar unos segundos.' : `Error: ${(await res.json().catch(() => ({}))).detail ?? 'no se pudo reiniciar Ollama.'}`);
        } catch { setMensaje('Error: no se pudo hablar con el servidor.'); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={nota}>
                Tu equipo: {totalGb.toLocaleString('es-ES', { maximumFractionDigits: 1 })} GB de RAM · {hw.nucleos} núcleos · {gpuTexto}.
                Aquí limitas lo que la app (su motor y la IA local) puede gastar para que tu PC siga fluido.
            </div>

            {a.perfil === '' && info.perfil_sugerido !== 'maximo' && (
                <div style={{ color: 'var(--t-ambar)', fontSize: 13 }}>
                    [!] Aún no has elegido perfil. Para este equipo recomendamos «{nombrePerfil(info.perfil_sugerido)}».
                    <button className="t-btn principal" style={{ marginLeft: 10 }} onClick={() => elegirPerfil(info.perfil_sugerido)}>[ Aplicar {nombrePerfil(info.perfil_sugerido)} ]</button>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PERFILES.map(p => (
                    <div key={p.id} style={{ ...fila, alignItems: 'flex-start' }}>
                        <button className={`t-btn${a.perfil === p.id ? ' principal' : ''}`} style={{ minWidth: 140 }} onClick={() => elegirPerfil(p.id)}>
                            [ {a.perfil === p.id ? 'x' : ' '} {nombrePerfil(p.id)} ]
                        </button>
                        <div style={{ ...nota, flex: '1 1 260px' }}>{p.texto}{info.perfil_sugerido === p.id ? ' (recomendado para tu equipo)' : ''}</div>
                    </div>
                ))}
                {a.perfil === 'personalizado' && <div style={{ ...nota, color: 'var(--t-ambar)' }}>Perfil personalizado: has ajustado valores a mano.</div>}
            </div>

            <div style={{ borderTop: '1px dashed var(--t-linea)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                    <div style={fila}><span style={etiqueta}>CPU máxima</span><strong>{textoCpu(a.limite_cpu)}</strong></div>
                    <SliderAscii min={info.min_cpu} max={100} step={5} value={Math.max(info.min_cpu, Math.min(100, a.limite_cpu))} decimales={0} etiqueta="CPU máxima" onChange={v => cambiar({ limite_cpu: v })} />
                    <div style={nota}>Porcentaje del total de la CPU para el motor y la IA juntos (tope duro de Windows). Con menos, la IA tarda más pero el resto del PC no se atasca.</div>
                </div>

                <div>
                    <label style={{ ...fila, cursor: 'pointer' }}>
                        <input type="checkbox" className="t-check" checked={ramLimitada} onChange={ev => cambiar({ limite_ram_mb: ev.target.checked ? Math.min(maxGb, Math.max(minGb, Math.round(totalGb * 0.4 * 2) / 2)) * 1024 : 0 })} />
                        <span style={etiqueta}>Limitar la RAM</span><strong>{textoRam(a.limite_ram_mb)}</strong>
                    </label>
                    {ramLimitada && <SliderAscii min={minGb} max={maxGb} step={0.5} value={Math.max(minGb, Math.min(maxGb, a.limite_ram_mb / 1024))} decimales={1} etiqueta="RAM máxima" onChange={v => cambiar({ limite_ram_mb: Math.round(v * 1024) })} />}
                    <div style={nota}>Memoria para el motor y la IA juntos. No baja de {minGb} GB: con menos no cabe el motor. Si Windows se queda sin memoria libre, la IA se pausa sola y retoma al volver.</div>
                </div>

                <div>
                    <label style={{ ...fila, cursor: 'pointer' }}>
                        <input type="checkbox" className="t-check" checked={fpsLimitados} onChange={ev => cambiar({ fps_max: ev.target.checked ? 30 : 0 })} />
                        <span style={etiqueta}>Limitar los FPS</span><strong>{textoFps(a.fps_max)}</strong>
                    </label>
                    {fpsLimitados && <SliderAscii min={15} max={60} step={5} value={Math.max(15, Math.min(60, a.fps_max))} decimales={0} etiqueta="FPS máximos" onChange={v => cambiar({ fps_max: v })} />}
                    <div style={nota}>Fotogramas por segundo del universo 3D. Menos FPS gastan menos GPU y batería sin cambiar cómo se ve.</div>
                </div>

                <label style={fila}>
                    <span style={etiqueta}>Calidad del 3D</span>
                    <select value={a.calidad_3d} className="t-campo" style={{ padding: 5 }} onChange={ev => cambiar({ calidad_3d: ev.target.value as AjustesRendimiento['calidad_3d'] })}>
                        <option value="alta">Alta (brillo y viñeta, como siempre)</option>
                        <option value="media">Media (solo brillo, menos resolución)</option>
                        <option value="baja">Baja (sin efectos, lo más ligero)</option>
                    </select>
                </label>

                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                    <input type="checkbox" className="t-check" style={{ flex: "none", whiteSpace: "nowrap" }} checked={a.ia_en_gpu} onChange={ev => cambiar({ ia_en_gpu: ev.target.checked })} />
                    <span>Dejar que la IA local use la GPU {!hw.gpu_dedicada && <span style={nota}>(tu GPU es integrada: suele ir mejor desmarcado)</span>}</span>
                </label>

                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                    <input type="checkbox" className="t-check" style={{ flex: "none", whiteSpace: "nowrap" }} checked={a.sinapsis_auto} onChange={ev => cambiar({ sinapsis_auto: ev.target.checked })} />
                    <span>Buscar las conexiones de una neurona nueva automáticamente <span style={nota}>(desmarcado: se piden en la pestaña Red de cada neurona)</span></span>
                </label>
            </div>

            {!info.soporta_topes && <div style={{ ...nota, color: 'var(--t-ambar)' }}>[!] Los topes de CPU y RAM solo funcionan en Windows; el resto (FPS, calidad, IA) sí se aplica.</div>}
            {info.pausa.pausada && <div style={{ color: 'var(--t-ambar)', fontSize: 13 }}>[!] {info.pausa.motivo}</div>}

            {info.limitando && info.ollama_ajeno && (
                <div style={{ color: 'var(--t-ambar)', fontSize: 13, lineHeight: 1.5 }}>
                    [!] Ollama está corriendo por su cuenta (icono de la bandeja de Windows). Los topes de CPU y RAM ya se le aplican, pero no que atienda una sola petición a la vez.
                    <button className="t-btn" style={{ marginLeft: 10 }} onClick={() => setConfirmarReinicio(true)}>[ Reiniciar Ollama con mis límites ]</button>
                </div>
            )}

            <div style={{ borderTop: '1px dashed var(--t-linea)', paddingTop: 12, fontSize: 13 }}>
                {medicion ? (<>
                    <div>CPU de la app (motor + IA): <strong>{medicion.cpu_app_pct.toLocaleString('es-ES', { maximumFractionDigits: 1 })} %</strong> del equipo{info.limitando && a.limite_cpu < 100 ? ` (tope ${a.limite_cpu} %)` : ''}</div>
                    <div>RAM: motor {textoRam(medicion.ram_backend_mb)} + IA {textoRam(medicion.ram_ollama_mb)} · libre en el equipo {textoRam(medicion.ram_libre_mb)} de {textoRam(medicion.ram_total_mb)}</div>
                    <div style={nota}>No incluye la ventana del universo 3D (la dibuja el navegador integrado): para verla, mira el Administrador de tareas. Esta medición solo se hace con Ajustes abierto.</div>
                </>) : <div style={nota}>Midiendo...</div>}
            </div>

            <div style={nota}>Los FPS y la calidad se aplican al instante. Los hilos del modelo de clasificación solo cambian al reabrir la app.</div>
            {mensaje && <div style={{ color: mensaje.startsWith('Error') ? 'var(--t-error)' : 'var(--t-verde)', fontSize: 13 }}>{mensaje}</div>}

            {confirmarReinicio && (
                <Dialogo titulo="Reiniciar Ollama" aceptar="Reiniciar" onAceptar={reiniciarOllama} onCancelar={() => setConfirmarReinicio(false)}
                    texto="Se cerrará Ollama (y su icono de la bandeja) y la app lo volverá a abrir con tus límites. Si estaba generando algo, se corta. Tus modelos no se tocan. ¿Continuar?" />
            )}
        </div>
    );
}
