import { useEffect, useRef, useState } from 'react';
import { API } from '../utils/api';
import { exportarNeuronas, importarArchivo, importarEjemplos, textoResumen } from '../utils/intercambio';
import type { ResumenImportacion } from '../utils/intercambio';
import { Cabecera, Modal, Seccion } from './terminal';

interface Estado { ia_activa: boolean; modelo: string; version: string; carpeta_datos: string; ollama: boolean; modelos: string[]; neuronas: number }


export default function Ajustes({ onCerrar, onTutorial }: { onCerrar: () => void; onTutorial: () => void }) {
    const [e, setE] = useState<Estado | null>(null);
    const [mensaje, setMensaje] = useState('');
    const archivo = useRef<HTMLInputElement>(null);

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
                                {e.modelos.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </label>
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
                        <button className="t-btn" style={{ marginTop: 10 }} onClick={onTutorial}>Ver el tutorial otra vez</button>
                    </Seccion>
                </>)}
            </div>
        </Modal>
    );
}
