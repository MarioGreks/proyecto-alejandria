import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { API } from '../utils/api';
import { exportarNeuronas, importarArchivo, importarEjemplos, textoResumen } from '../utils/intercambio';
import { subredActivaGuardada } from '../utils/subredes';
import type { ResumenImportacion } from '../utils/intercambio';
import { Cabecera, Modal, Seccion } from './terminal';
import SincronizacionPcs from './SincronizacionPcs';
import Rendimiento from './Rendimiento';
import { guardarCache, iguales, leerCache } from '../utils/cacheEstado';

const PESTAÑAS = [['graficos', 'Gráficos'], ['ia', 'IA y Sistema'], ['datos', 'Datos']] as const;
type Pestaña = typeof PESTAÑAS[number][0];
const CLAVE_PESTAÑA = 'alejandria.ajustesPestana';
const pestañaGuardada = (): Pestaña => { try { const v = localStorage.getItem(CLAVE_PESTAÑA); return PESTAÑAS.some(([id]) => id === v) ? v as Pestaña : 'graficos'; } catch { return 'graficos'; } };
const primera = { borderTop: 'none', marginTop: 0, paddingTop: 0 };     // la primera sección de cada pestaña va sin separador

interface Estado { ia_activa: boolean; modelo: string; version: string; carpeta_datos: string; ollama: boolean; ollama_instalado: boolean; modelos: string[]; modelos_restringidos?: string[]; neuronas: number; buscar_actualizaciones: boolean }


export default function Ajustes({ onCerrar, onTutorial }: { onCerrar: () => void; onTutorial: () => void }) {
    const [e, setE] = useState<Estado | null>(() => leerCache<Estado>('ajustes'));      // con lo último que se supo: se abre al instante
    const [mensaje, setMensaje] = useState('');
    const [pestaña, setPestaña] = useState<Pestaña>(pestañaGuardada);
    const elegir = (p: Pestaña) => { setPestaña(p); try { localStorage.setItem(CLAVE_PESTAÑA, p); } catch { /* sin almacenamiento: no se recuerda */ } };
    const teclado = (ev: KeyboardEvent) => {     // flechas arriba/abajo: de un apartado al siguiente (y se enfoca su botón)
        const d = ev.key === 'ArrowDown' ? 1 : ev.key === 'ArrowUp' ? -1 : 0;
        if (!d) return;
        ev.preventDefault();
        const i = (PESTAÑAS.findIndex(([id]) => id === pestaña) + d + PESTAÑAS.length) % PESTAÑAS.length;
        elegir(PESTAÑAS[i][0]);
        (ev.currentTarget.querySelectorAll('button')[i] as HTMLButtonElement | undefined)?.focus();
    };
    const archivo = useRef<HTMLInputElement>(null);
    const subredActiva = subredActivaGuardada();     // la red en la que estás: exportar e importar pueden trabajar solo con ella
    const [avisos, setAvisos] = useState<string | null>(null);   // texto de THIRD-PARTY-NOTICES.md; se carga solo al pedirlo (va en un trozo aparte del paquete)
    const verAvisos = () => import('../../../THIRD-PARTY-NOTICES.md?raw').then(m => setAvisos(m.default)).catch(() => setMensaje('Error: no se pudieron cargar las licencias de terceros.'));

    const cargar = () => fetch(`${API}/api/ajustes`).then(r => r.json()).then((x: Estado) => { guardarCache('ajustes', x); setE(prev => (prev && iguales(prev, x) ? prev : x)); if (x.ollama) setMensaje(m => m === 'Arrancando Ollama...' ? '' : m); }).catch(() => setMensaje('Error: no se pudo hablar con el servidor.'));
    useEffect(() => { cargar(); const t = setInterval(() => { if (!document.hidden) cargar(); }, 5000); return () => clearInterval(t); }, []);     // el estado de Ollama cambia fuera de la app: se refresca solo
    const arrancarOllama = () => fetch(`${API}/api/ollama/arrancar`, { method: 'POST' }).then(() => setMensaje('Arrancando Ollama...')).catch(() => setMensaje('Error: no se pudo hablar con el servidor.'));

    const guardar = async (cambios: Partial<Pick<Estado, 'ia_activa' | 'modelo' | 'buscar_actualizaciones'>>) => {
        const res = await fetch(`${API}/api/ajustes`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cambios) });
        if (res.ok) cargar(); else setMensaje('Error: no se pudo guardar el ajuste.');
    };

    const tras = (r: ResumenImportacion) => {
        setMensaje(textoResumen(r) + (r.añadidas ? ' Recargando...' : ''));
        if (r.añadidas) setTimeout(() => window.location.reload(), 1200);
    };
    const intentar = async (fn: () => Promise<void>) => { try { await fn(); } catch (err: any) { setMensaje(`Error: ${err.message}`); } };

    return (
        <Modal ancho={860}>
            <Cabecera titulo="Ajustes" onCerrar={onCerrar} />
            <div>

                {!e ? <p>Conectando con el servidor...</p> : (<>
                    <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 14 }}>
                        <div role="tablist" aria-orientation="vertical" onKeyDown={teclado} style={{ flex: '0 0 170px', display: 'flex', flexDirection: 'column', gap: 6, position: 'sticky', top: 0 }}>
                            {PESTAÑAS.map(([id, nombre]) => (
                                <button key={id} role="tab" aria-selected={pestaña === id} tabIndex={pestaña === id ? 0 : -1} className={`t-btn${pestaña === id ? ' principal' : ''}`}
                                    style={{ textAlign: 'left' }} onClick={() => elegir(id)}>[ {pestaña === id ? '>' : ' '} {nombre} ]</button>
                            ))}
                        </div>
                        <div role="tabpanel" style={{ flex: '1 1 380px', minWidth: 0, minHeight: 420 }}>
                            {pestaña === 'graficos' && (<>
                    <Seccion titulo="Rendimiento" estilo={primera}>
                        <Rendimiento />
                    </Seccion>

                            </>)}
                            {pestaña === 'ia' && (<>
                    <Seccion titulo="IA local (Ollama)" estilo={primera}>
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                            <input type="checkbox" className="t-check" checked={e.ia_activa} onChange={ev => guardar({ ia_activa: ev.target.checked })} />
                            Usar la IA local para clasificar y buscar conexiones
                        </label>
                        <div style={{ margin: '8px 0', color: e.ollama ? 'var(--t-verde)' : '#ff9e64', fontSize: 12 }}>
                            {e.ollama ? '● Ollama está en marcha' : e.ollama_instalado ? '○ Ollama está parado (sin él las conexiones se proponen solo por parecido de textos)' : '○ Ollama no está instalado (sin él las conexiones se proponen solo por parecido de textos)'}
                            {!e.ollama && e.ollama_instalado && e.ia_activa && <button className="t-btn" style={{ marginLeft: 10 }} onClick={arrancarOllama}>[ Arrancar Ollama ]</button>}
                        </div>
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            Modelo:
                            <select value={e.modelo} disabled={!e.ia_activa || e.modelos.length === 0} onChange={ev => guardar({ modelo: ev.target.value })}
                                className="t-campo" style={{ padding: 5 }}>
                                <option value="">Automático (el mejor instalado)</option>
                                {e.modelos.map(m => <option key={m} value={m}>{m}{e.modelos_restringidos?.includes(m) ? ' (licencia restringida)' : ''}</option>)}
                            </select>
                        </label>
                        {e.ia_activa && e.modelos_restringidos?.includes(e.modelo) && (
                            <div style={{ marginTop: 8, color: 'var(--t-ambar)', fontSize: 12, lineHeight: 1.5 }}>
                                [!] Este modelo tiene una licencia no comercial o con condiciones propias. Revísala antes de un uso comercial.
                            </div>
                        )}
                    </Seccion>

                    <Seccion titulo={`Actualizaciones (versión ${e.version})`}>
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                            <input type="checkbox" className="t-check" checked={e.buscar_actualizaciones} onChange={ev => guardar({ buscar_actualizaciones: ev.target.checked })} />
                            Avisarme de las versiones nuevas al abrir la app
                        </label>
                        <div style={{ fontSize: 12, color: '#7aa', marginTop: 8 }}>
                            Es lo único que la app consulta por internet por su cuenta: pregunta a github.com si hay una versión nueva y no envía nada tuyo. Solo instala lo que esté firmado por el proyecto, y solo si tú pulsas Actualizar.
                        </div>
                    </Seccion>

                            </>)}
                            {pestaña === 'datos' && (<>
                    <Seccion titulo={`Tus datos (${e.neuronas} neuronas)`} estilo={primera}>
                        <div style={{ fontSize: 12, color: '#7aa', marginBottom: 10, wordBreak: 'break-all' }}>Carpeta: {e.carpeta_datos}</div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button className="t-btn" onClick={() => intentar(async () => { await exportarNeuronas(); setMensaje('Exportadas: mira tu carpeta de Descargas.'); })}>Exportar todo</button>
                            {subredActiva && <button className="t-btn" onClick={() => intentar(async () => { await exportarNeuronas(subredActiva); setMensaje(`Exportada la subred «${subredActiva}»: mira tu carpeta de Descargas.`); })}>Exportar solo «{subredActiva}»</button>}
                            <button className="t-btn" onClick={() => archivo.current?.click()}>Importar archivo...</button>
                            <button className="t-btn" onClick={() => intentar(async () => tras(await importarEjemplos()))}>Cargar ejemplos</button>
                        </div>
                        <input ref={archivo} type="file" accept=".json,application/json" style={{ display: 'none' }}
                            onChange={ev => { const f = ev.target.files?.[0]; ev.target.value = ''; if (f) intentar(async () => tras(await importarArchivo(f, subredActiva))); }} />
                        <div style={{ fontSize: 12, color: '#7aa', marginTop: 8 }}>Importar nunca pisa una neurona que ya tengas con el mismo id.{subredActiva && ` Estás en la subred «${subredActiva}»: lo que importes entrará también en ella.`}</div>
                    </Seccion>

                    <Seccion titulo="Sincronización entre PCs">
                        <SincronizacionPcs />
                    </Seccion>

                    <Seccion titulo="Acerca de">
                        <div>Proyecto Alejandría v{e.version} · licencia MIT</div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                            <button className="t-btn" onClick={onTutorial}>Ver el tutorial otra vez</button>
                            <button className="t-btn" onClick={verAvisos}>Licencias de terceros</button>
                        </div>
                    </Seccion>
                            </>)}
                        </div>
                    </div>
                    {mensaje && <div style={{ marginTop: 14, color: mensaje.startsWith('Error') ? 'var(--t-error)' : 'var(--t-verde)', fontSize: 13 }}>{mensaje}</div>}

                </>)}
            </div>
            {avisos !== null && (
                <Modal ancho={920} z={70}>
                    <Cabecera titulo="Licencias de terceros" onCerrar={() => setAvisos(null)} />
                    <pre style={{ margin: '14px 0 0', maxHeight: '68vh', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'var(--t-mono)', fontSize: 11.5, lineHeight: 1.45, color: 'var(--t-texto)', border: '1px solid var(--t-linea)', padding: 12 }}>{avisos}</pre>
                </Modal>
            )}
        </Modal>
    );
}
