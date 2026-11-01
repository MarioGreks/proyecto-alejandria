import { useEffect, useState } from 'react';
import { dibujarPilar } from '../utils/pilarAscii';

/** El pilar en ASCII girando: la imagen de «cargando» de la app. */
export default function PilarAscii({ cols = 36, filas = 30, tam = 11 }: { cols?: number; filas?: number; tam?: number }) {
    const [giro, setGiro] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setGiro(g => g + 0.07), 66);       // ~15 fotogramas/s; setInterval y no requestAnimationFrame: sigue con la ventana oculta
        return () => clearInterval(id);
    }, []);
    return (
        <pre aria-label="Proyecto Alejandría" style={{ margin: 0, color: '#00ffaa', fontFamily: 'var(--t-mono)', fontSize: tam, lineHeight: 1.05, textShadow: '0 0 6px rgba(0,255,170,0.35)', userSelect: 'none' }}>
            {dibujarPilar(giro, cols, filas)}
        </pre>
    );
}
