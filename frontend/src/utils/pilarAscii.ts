// Un pilar clásico (basa, fuste acanalado, capitel) dibujado con caracteres ASCII y girando sobre sí mismo.
// Se muestrean puntos de su superficie, se giran, se proyectan a la rejilla de texto y se pintan con un z-buffer; el brillo elige el carácter.

export const RAMPA = ' .:-=+*#%@';          // la misma que usa el logo
const ACANALADURAS = 10;
const LUZ = (() => { const v = [0.45, 0.55, 0.7]; const n = Math.hypot(...v); return v.map(c => c / n); })();

type V3 = [number, number, number];
interface Punto { p: V3; n: V3 }

/** Superficie de revolución con acanaladuras: radio(y) entre y0 e y1, `prof` = profundidad relativa de las estrías (0 = lisa). */
function revolucion(y0: number, y1: number, radio: (t: number) => number, prof: number, pasosY: number, pasosA: number): Punto[] {
    const out: Punto[] = [];
    for (let i = 0; i <= pasosY; i++) {
        const t = i / pasosY, y = y0 + (y1 - y0) * t;
        const R = radio(t), dRdy = (radio(Math.min(1, t + 0.01)) - radio(Math.max(0, t - 0.01))) / (0.02 * (y1 - y0));
        for (let j = 0; j < pasosA; j++) {
            const a = (j / pasosA) * 2 * Math.PI;
            const r = R * (1 - prof * (0.5 + 0.5 * Math.cos(ACANALADURAS * a)));
            const drda = R * prof * 0.5 * ACANALADURAS * Math.sin(ACANALADURAS * a);
            // normal de la curva r(a) en el plano: r·r̂ − (dr/da)·â  (más la inclinación del perfil)
            const nx = r * Math.cos(a) + drda * Math.sin(a), nz = r * Math.sin(a) - drda * Math.cos(a);
            const l = Math.hypot(nx, nz) || 1, ny = -dRdy * 0.5;
            const m = Math.hypot(nx / l, ny, nz / l);
            out.push({ p: [r * Math.cos(a), y, r * Math.sin(a)], n: [nx / l / m, ny / m, nz / l / m] });
        }
    }
    return out;
}

/** Bloque cuadrado de semi-anchura h entre y0 e y1 (cuatro caras y la tapa). */
function bloque(h: number, y0: number, y1: number, paso: number): Punto[] {
    const out: Punto[] = [];
    const n = Math.max(2, Math.round(paso));
    for (let i = 0; i <= n; i++) {
        const u = -h + (2 * h * i) / n;
        for (let k = 0; k <= Math.max(2, Math.round(n * (y1 - y0) / (2 * h))); k++) {
            const y = y0 + (y1 - y0) * k / Math.max(2, Math.round(n * (y1 - y0) / (2 * h)));
            out.push({ p: [u, y, h], n: [0, 0, 1] }, { p: [u, y, -h], n: [0, 0, -1] }, { p: [h, y, u], n: [1, 0, 0] }, { p: [-h, y, u], n: [-1, 0, 0] });
        }
        for (let m = 0; m <= n; m++) out.push({ p: [u, y1, -h + (2 * h * m) / n], n: [0, 1, 0] });
    }
    return out;
}

const PILAR: Punto[] = [
    ...bloque(0.27, -1.0, -0.9, 18),                                        // plinto
    ...revolucion(-0.9, -0.74, t => 0.22 - 0.03 * t, 0, 6, 90),            // toro de la basa
    ...revolucion(-0.74, 0.7, t => 0.15 - 0.04 * t, 0.2, 140, 360),        // fuste acanalado, más fino arriba
    ...revolucion(0.7, 0.8, t => 0.13 + 0.07 * t * t, 0, 8, 100),         // equino del capitel
    ...bloque(0.25, 0.8, 0.92, 18),                                         // ábaco
];

/** Un fotograma: texto de `filas` líneas de `cols` caracteres con el pilar girado `giro` radianes. */
export function dibujarPilar(giro: number, cols = 40, filas = 30): string {
    const cy = Math.cos(giro), sy = Math.sin(giro), cp = Math.cos(0.28), sp = Math.sin(0.28);   // giro sobre Y y una ligera vista desde arriba
    const escalaY = filas / 2.35, escalaX = escalaY * 2;                                         // una celda de texto es el doble de alta que ancha
    const prof = new Float32Array(cols * filas).fill(-Infinity), brillo = new Float32Array(cols * filas);
    const girar = (v: V3): V3 => {
        const x = v[0] * cy + v[2] * sy, z = -v[0] * sy + v[2] * cy;
        return [x, v[1] * cp - z * sp, v[1] * sp + z * cp];
    };
    for (const { p, n } of PILAR) {
        const [x, y, z] = girar(p), [nx, ny, nz] = girar(n);
        const cx = Math.round(cols / 2 + x * escalaX), cyy = Math.round(filas / 2 - y * escalaY);
        if (cx < 0 || cx >= cols || cyy < 0 || cyy >= filas) continue;
        const i = cyy * cols + cx;
        if (z > prof[i]) { prof[i] = z; brillo[i] = 0.12 + 0.88 * Math.max(0, nx * LUZ[0] + ny * LUZ[1] + nz * LUZ[2]); }
    }
    const lineas: string[] = [];
    for (let f = 0; f < filas; f++) {
        let l = '';
        for (let c = 0; c < cols; c++) {
            const i = f * cols + c;
            l += prof[i] === -Infinity ? ' ' : RAMPA[Math.min(RAMPA.length - 1, Math.round(brillo[i] * (RAMPA.length - 1)))];
        }
        lineas.push(l);
    }
    return lineas.join('\n');
}
