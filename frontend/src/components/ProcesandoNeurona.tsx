import PilarAscii from './PilarAscii';
import { barraAscii } from '../utils/barraAscii';

export interface EstadoProceso {
    fase: 'guardando' | 'conexiones' | 'listo';
    nodo: string;
    hecho: number;
    total: number;
    conexiones: number;
}

const MONO = 'var(--t-mono)';

/** Lo que se ve al asimilar una neurona: el pilar girando mientras se guarda y se buscan sus conexiones (cada una tarda ~1 min). */
export default function ProcesandoNeurona({ p }: { p: EstadoProceso }) {
    const pct = p.total > 0 ? (100 * p.hecho) / p.total : 0;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '6px 0 10px', fontFamily: MONO, color: 'var(--t-verde)' }}>
            <PilarAscii cols={30} filas={22} tam={11} />
            <div style={{ width: '100%', maxWidth: 480, fontSize: 13, lineHeight: 1.6 }}>
                <div style={{ color: p.fase === 'guardando' ? 'var(--t-ambar)' : 'var(--t-suave)' }}>
                    {p.fase === 'guardando' ? '[..]' : '[ok]'} Guardando la neurona y clasificándola
                </div>
                <div style={{ color: p.fase === 'conexiones' ? 'var(--t-ambar)' : p.fase === 'listo' ? 'var(--t-suave)' : 'var(--t-linea)' }}>
                    {p.fase === 'listo' ? '[ok]' : p.fase === 'conexiones' ? '[..]' : '[  ]'} Buscando conexiones con tus otras neuronas
                </div>
                {p.fase === 'conexiones' && (
                    <div style={{ marginLeft: 30, color: 'var(--t-texto)' }}>
                        {barraAscii(pct)}{p.total > 0 ? `  ${p.hecho}/${p.total}` : '  preparando...'}
                    </div>
                )}
                {p.fase === 'listo' && (
                    <div style={{ marginTop: 8, color: 'var(--t-verde)' }}>
                        {p.conexiones > 0
                            ? `> ${p.conexiones} conexión(es) propuesta(s), pendientes de revisar. Reiniciando la matriz...`
                            : '> Sin conexiones nuevas. Reiniciando la matriz...'}
                    </div>
                )}
            </div>
        </div>
    );
}
