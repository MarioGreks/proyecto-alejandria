import { useEffect, useRef, useState } from 'react';
import { API } from '../utils/api';
import { exportarNeuronas, importarArchivo, importarEjemplos, textoResumen } from '../utils/intercambio';
import type { ResumenImportacion } from '../utils/intercambio';
import { Cabecera, Modal, Seccion } from './terminal';

interface Estado { ia_activa: boolean; modelo: string; version: string; carpeta_datos: string; ollama: boolean; modelos: string[]; modelos_restringidos?: string[]; neuronas: number }


export default function Ajustes({ onCerrar, onTutorial }: { onCerrar: () => void; onTutorial: () => void }) {
    const [e, setE] = useState<Estado | null>(null);
    const [mensaje, setMensaje] = useState('');
    const archivo = useRef<HTMLInputElement>(null);
    const [avisos, setAvisos] = useState<string | null>(null);   // texto de THIRD-PARTY-NOTICES.md; se carga solo al pedirlo (va en un trozo aparte del paquete)
    const verAvisos = () => import('../../../THIRD-PARTY-NOTICES.md?raw').then(m => setAvisos(m.default)).catch(() => setMensaje('Error: no se pudieron cargar las licencias de terceros.'));

    const cargar = () => fetch(`${API}/api/ajustes`).then(r => r.json()).then(setE).catch(() => setMensaje('Error: no se pudo hablar con el servidor.'));
    useEffect(() => { cargar(); }, []);

    const guardar = async (cambios: Partial<Pick<Estado, 'ia_activa' | 'modelo'>>) => {
        const res = await fetch(`${API}/api/ajustes`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cambios) });
        if (res.ok) cargar(); else setMensaje('Error: no se pudo guardar el ajuste.');
    };

    const tras = (r: ResumenImportacion) => {
        setMensaje(textoResumen(r) + (r.añadidas ? ' Recargando...' : ''));
        if (r.añadidas) setTimeout(() => window.location.reload(), 1200);
    };
    const intentar = async (fn: () => Promise<void>) => { try { await fn(); } catch (err: any) { setMensaje(`Error: ${err.message}`); } };

    return (
        <Modal>
            <Cabecera titulo="Ajustes" onCerrar={onCerrar} />
            <div>

                {!e ? <p>Conectando con el servidor...</p> : (<>
                    <Seccion titulo="IA local (Ollama)">
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                            <input type="checkbox" className="t-check" checked={e.ia_activa} onChange={ev => guardar({ ia_activa: ev.target.checked })} />
                            Usar la IA local para clasificar y buscar conexiones
                        </label>
                        <div style={{ margin: '8px 0', color: e.ollama ? 'var(--t-verde)' : '#ff9e64', fontSize: 12 }}>
                            {e.ollama ? '● Ollama está en marcha' : '○ Ollama no responde (¿está instalado? sin él las conexiones se proponen solo por parecido de textos)'}
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

                    <Seccion titulo={`Tus datos (${e.neuronas} neuronas)`}>
                        <div style={{ fontSize: 12, color: '#7aa', marginBottom: 10, wordBreak: 'break-all' }}>Carpeta: {e.carpeta_datos}</div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button className="t-btn" onClick={() => intentar(async () => { await exportarNeuronas(); setMensaje('Exportadas: mira tu carpeta de Descargas.'); })}>Exportar todo</button>
                            <button className="t-btn" onClick={() => archivo.current?.click()}>Importar archivo...</button>
                            <button className="t-btn" onClick={() => intentar(async () => tras(await importarEjemplos()))}>Cargar ejemplos</button>
                        </div>
                        <input ref={archivo} type="file" accept=".json,application/json" style={{ display: 'none' }}
                            onChange={ev => { const f = ev.target.files?.[0]; ev.target.value = ''; if (f) intentar(async () => tras(await importarArchivo(f))); }} />
                        <div style={{ fontSize: 12, color: '#7aa', marginTop: 8 }}>Importar nunca pisa una neurona que ya tengas con el mismo id.</div>
                    </Seccion>

                    {mensaje && <div style={{ marginTop: 14, color: mensaje.startsWith('Error') ? 'var(--t-error)' : 'var(--t-verde)', fontSize: 13 }}>{mensaje}</div>}

                    <Seccion titulo="Acerca de">
                        <div>Proyecto Alejandría v{e.version} · licencia MIT</div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                            <button className="t-btn" onClick={onTutorial}>Ver el tutorial otra vez</button>
                            <button className="t-btn" onClick={verAvisos}>Licencias de terceros</button>
                        </div>
                    </Seccion>
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
