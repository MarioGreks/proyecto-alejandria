import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { segundosDeAvance } from '../utils/rendimiento';

/** Tope de fotogramas por segundo del universo. Va dentro de un <Canvas frameloop="never">: en vez de dibujar a cada refresco de la pantalla (60-144 Hz),
 *  dibuja solo cuando toca según `fps`. En un PC justo ahorra GPU y CPU sin cambiar cómo se ve (las animaciones usan el tiempo real, no el nº de fotogramas).
 *  OJO: con frameloop="never", `advance` recibe el tiempo en SEGUNDOS (se escribe tal cual en clock.elapsedTime); ver segundosDeAvance. */
export default function LimitadorFps({ fps }: { fps: number }) {
    const advance = useThree(s => s.advance);
    const reloj = useThree(s => s.clock);
    useEffect(() => {
        const paso = 1000 / fps;
        const base = reloj.elapsedTime;                         // el tiempo de la escena en este momento: se sigue desde aquí (también al cambiar de FPS)
        let raf = 0;
        let inicio = -1;
        let ultimo = -Infinity;
        const bucle = (t: number) => {
            raf = requestAnimationFrame(bucle);                 // con la ventana oculta el navegador no llama a esto: no se gasta nada
            if (inicio < 0) inicio = t;
            if (t - ultimo >= paso - 2) {                       // -2 ms: con un refresco de 60 Hz (16,7 ms) un tope de 60 no debe saltarse fotogramas por redondeo
                ultimo = t;
                advance(segundosDeAvance(base, inicio, t));
            }
        };
        raf = requestAnimationFrame(bucle);
        return () => cancelAnimationFrame(raf);
    }, [fps, advance, reloj]);
    return null;
}
