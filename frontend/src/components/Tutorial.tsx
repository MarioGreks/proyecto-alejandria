import { useState } from 'react';
import { importarEjemplos, textoResumen } from '../utils/intercambio';
import PilarAscii from './PilarAscii';
import { Cabecera, Modal } from './terminal';

const CLAVE = 'alejandria_tutorial_visto';
export const tutorialVisto = (): boolean => { try { return localStorage.getItem(CLAVE) === '1'; } catch { return true; } };
const marcarVisto = () => { try { localStorage.setItem(CLAVE, '1'); } catch { /* sin almacenamiento: se volverá a enseñar */ } };

const PASOS = [
    { titulo: 'Bienvenido a Alejandría', texto: 'Tu segundo cerebro. Cada concepto que aprendes es una neurona; las conexiones entre ellas (sinapsis) se descubren solas con una IA que corre en tu propio ordenador. Nada sale de tu equipo.' },
    { titulo: 'Crea tus neuronas', texto: 'Abajo a la izquierda está [ + Inyectar neurona ]. Copia uno de sus prompts, pásaselo a tu IA favorita (ChatGPT, Claude...) con el tema que quieres aprender y pega aquí el JSON que te devuelva.' },
    { titulo: 'Explora el universo', texto: 'Arrastra para girar, rueda para acercarte y haz clic en una neurona para abrir su teoría, glosario, ejercicios y laboratorio. La búsqueda de arriba te lleva directo a cualquiera.' },
    { titulo: 'Laboratorios', texto: 'Cada neurona puede traer una simulación en Python. Se ejecuta en tu ventana, sin internet: mueve los controles y mira cómo cambia el modelo. Puedes editar el código y los controles desde el propio laboratorio.' },
    { titulo: 'Sinapsis a revisar', texto: 'Las conexiones nuevas aparecen como pendientes con la razón que dio la IA. Acéptalas o recházalas: lo que rechaces se recuerda y no se vuelve a proponer.' },
    { titulo: 'Tus datos son tuyos', texto: 'En [ Ajustes ] (arriba a la izquierda) puedes exportar e importar tus neuronas, elegir el modelo de IA o desactivarla. ¿Quieres empezar con algo? Puedes cargar 3 neuronas de ejemplo.' },
];

export default function Tutorial({ onCerrar }: { onCerrar: () => void }) {
    const [i, setI] = useState(0);
    const [aviso, setAviso] = useState('');
    const ultimo = i === PASOS.length - 1;
    const cerrar = () => { marcarVisto(); onCerrar(); };
    const ejemplos = async () => {
        setAviso('Cargando ejemplos...');
        try {
            const r = await importarEjemplos();
            marcarVisto();                                // la página se recarga: que no vuelva a empezar el tutorial
            setAviso(`${textoResumen(r)} Recargando...`);
            setTimeout(() => window.location.reload(), 1200);
        } catch (e: any) { setAviso(`Error: ${e.message}`); }
    };
    return (
        <Modal ancho={580} z={60}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: 'var(--t-verde)' }}><PilarAscii cols={28} filas={20} tam={10} /></div>
            <div style={{ fontSize: 11, color: 'var(--t-suave)', marginBottom: 6 }}>[{i + 1}/{PASOS.length}]</div>
            <Cabecera titulo={PASOS[i].titulo} />
            <p style={{ margin: '12px 0 18px', color: 'var(--t-texto)', fontSize: 14, lineHeight: 1.55 }}>{PASOS[i].texto}</p>
            {ultimo && (
                <button className="t-btn" onClick={ejemplos} style={{ marginBottom: 14, display: 'block' }}>[ Cargar 3 neuronas de ejemplo ]</button>
            )}
            {aviso && <div style={{ fontSize: 12, marginBottom: 12, color: aviso.startsWith('Error') ? 'var(--t-error)' : 'var(--t-verde)' }}>{aviso}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="t-btn plano" onClick={cerrar} style={{ color: 'var(--t-suave)' }}>[ Saltar ]</button>
                <div style={{ display: 'flex', gap: 10 }}>
                    {i > 0 && <button className="t-btn" onClick={() => setI(i - 1)}>[ &lt; Atrás ]</button>}
                    <button className="t-btn principal" onClick={ultimo ? cerrar : () => setI(i + 1)}>{ultimo ? '[ Empezar ]' : '[ Siguiente > ]'}</button>
                </div>
            </div>
        </Modal>
    );
}
