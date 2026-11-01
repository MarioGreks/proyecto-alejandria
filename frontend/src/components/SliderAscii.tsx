import { useEffect, useRef, useState } from 'react';

const TAM = 13;                  // tamaño de letra en px
const ANCHO_CAR = TAM * 0.602;   // ancho de un carácter de DejaVu Sans Mono

interface Props {
    min: number;
    max: number;
    step: number;
    value: number;
    decimales: number;
    etiqueta: string;
    onChange: (v: number) => void;
}

/** Barra ASCII arrastrable: [#######-----]. Ratón, táctil y teclado (flechas, RePág/AvPág, Inicio/Fin) con role="slider". */
export default function SliderAscii({ min, max, step, value, decimales, etiqueta, onChange }: Props) {
    const caja = useRef<HTMLDivElement>(null);
    const [celdas, setCeldas] = useState(24);
    const arrastrando = useRef(false);

    useEffect(() => {
        const el = caja.current;
        if (!el) return;
        const medir = () => setCeldas(Math.max(8, Math.floor(el.clientWidth / ANCHO_CAR) - 2));
        medir();
        const ro = new ResizeObserver(medir);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const rango = max - min;
    const ajustar = (v: number) => {
        const pasos = Math.round((Math.min(max, Math.max(min, v)) - min) / step);
        return Math.min(max, Math.max(min, Number((min + pasos * step).toFixed(Math.max(decimales, 6)))));
    };
    const fraccion = rango > 0 ? Math.min(1, Math.max(0, (value - min) / rango)) : 0;
    const llenas = Math.round(fraccion * celdas);

    const desdePuntero = (x: number) => {
        const r = caja.current!.getBoundingClientRect();
        const f = (x - r.left - ANCHO_CAR) / (celdas * ANCHO_CAR);        // los corchetes ocupan un carácter a cada lado
        const nuevo = ajustar(min + Math.min(1, Math.max(0, f)) * rango);
        if (nuevo !== value) onChange(nuevo);
    };

    return (
        <div
            ref={caja}
            role="slider"
            tabIndex={0}
            aria-label={etiqueta}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            onPointerDown={e => { arrastrando.current = true; e.currentTarget.setPointerCapture(e.pointerId); e.currentTarget.focus(); desdePuntero(e.clientX); }}
            onPointerMove={e => { if (arrastrando.current) desdePuntero(e.clientX); }}
            onPointerUp={e => { arrastrando.current = false; e.currentTarget.releasePointerCapture(e.pointerId); }}
            onKeyDown={e => {
                const paso = e.key === 'PageUp' || e.key === 'PageDown' ? step * 10 : step;
                let nuevo: number | null = null;
                if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'PageUp') nuevo = value + paso;
                else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'PageDown') nuevo = value - paso;
                else if (e.key === 'Home') nuevo = min;
                else if (e.key === 'End') nuevo = max;
                if (nuevo !== null) { e.preventDefault(); onChange(ajustar(nuevo)); }
            }}
            style={{ fontFamily: 'var(--t-mono)', fontSize: TAM, lineHeight: 1.3, whiteSpace: 'pre', cursor: 'pointer', userSelect: 'none', touchAction: 'none', width: '100%', overflow: 'hidden' }}
        >
            <span style={{ color: 'var(--t-suave)' }}>[</span>
            <span style={{ color: 'var(--t-verde)' }}>{'#'.repeat(llenas)}</span>
            <span style={{ color: 'var(--t-linea)' }}>{'-'.repeat(celdas - llenas)}</span>
            <span style={{ color: 'var(--t-suave)' }}>]</span>
        </div>
    );
}
