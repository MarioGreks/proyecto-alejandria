import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

/** Tope de fotogramas por segundo del universo. Va dentro de un <Canvas frameloop="never">: en vez de dibujar a cada refresco de la pantalla (60-144 Hz),
 *  dibuja solo cuando toca según `fps`. En un PC justo ahorra GPU y CPU sin cambiar cómo se ve (las animaciones usan el tiempo real, no el nº de fotogramas). */
export default function LimitadorFps({ fps }: { fps: number }) {
    const advance = useThree(s => s.advance);
    useEffect(() => {
        const paso = 1000 / fps;
        let raf = 0;
        let ultimo = -Infinity;
        const bucle = (t: number) => {
            raf = requestAnimationFrame(bucle);                 // con la ventana oculta el navegador no llama a esto: no se gasta nada
            if (t - ultimo >= paso - 2) {                       // -2 ms: con un refresco de 60 Hz (16,7 ms) un tope de 60 no debe saltarse fotogramas por redondeo
                ultimo = t;
                advance(t);
            }
        };
        raf = requestAnimationFrame(bucle);
        return () => cancelAnimationFrame(raf);
    }, [fps, advance]);
    return null;
}
