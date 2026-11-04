import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { zorderDe, limitesAuto, marcasDe, pasoDe, cadaCuantas, formatoMarca, partirMath, puntoCercano, puntosDe, textoPlano } from '../utils/labSpec';
import type { Eje, Figura, Serie } from '../utils/labSpec';

const FONT = '"DejaVu Sans Mono", Consolas, monospace';
const DASH: Record<string, number[]> = { '--': [3.7, 1.6], ':': [1, 1.65], '-.': [6.4, 1.6, 1, 1.6] };

// Los $...$ de títulos y etiquetas se pintan con KaTeX (HTML); el canvas solo dibuja la gráfica.
const MathText = memo(function MathText({ texto }: { texto: string }) {
    const partes = useMemo(() => partirMath(texto).map(p => p.math
        ? { math: true, valor: katex.renderToString(p.texto, { throwOnError: false, strict: false }) }
        : { math: false, valor: p.texto }), [texto]);
    return <>{partes.map((p, i) => p.math
        ? <span key={i} dangerouslySetInnerHTML={{ __html: p.valor }} />
        : <span key={i}>{p.valor}</span>)}</>;
});

function trazarMarcador(ctx: CanvasRenderingContext2D, tipo: string, x: number, y: number, r: number): 'relleno' | 'linea' {
    ctx.beginPath();
    switch (tipo) {
        case 's': ctx.rect(x - r, y - r, 2 * r, 2 * r); return 'relleno';
        case '^': ctx.moveTo(x, y - r); ctx.lineTo(x + r, y + r); ctx.lineTo(x - r, y + r); ctx.closePath(); return 'relleno';
        case 'v': ctx.moveTo(x, y + r); ctx.lineTo(x + r, y - r); ctx.lineTo(x - r, y - r); ctx.closePath(); return 'relleno';
        case '<': ctx.moveTo(x - r, y); ctx.lineTo(x + r, y - r); ctx.lineTo(x + r, y + r); ctx.closePath(); return 'relleno';
        case '>': ctx.moveTo(x + r, y); ctx.lineTo(x - r, y - r); ctx.lineTo(x - r, y + r); ctx.closePath(); return 'relleno';
        case 'D': case 'd': ctx.moveTo(x, y - r * 1.2); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r * 1.2); ctx.lineTo(x - r, y); ctx.closePath(); return 'relleno';
        case '+': ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); return 'linea';
        case 'x': ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); return 'linea';
        case '|': ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); return 'linea';
        case '_': ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); return 'linea';
        case '.': ctx.arc(x, y, r * 0.4, 0, 2 * Math.PI); return 'relleno';
        default: ctx.arc(x, y, r, 0, 2 * Math.PI); return 'relleno';
    }
}

const POS_LEYENDA: Record<string, [number, number]> = {
    'upper right': [1, 0], 'best': [1, 0], 'upper left': [0, 0], 'lower left': [0, 1], 'lower right': [1, 1],
    'right': [1, 0.5], 'center left': [0, 0.5], 'center right': [1, 0.5], 'lower center': [0.5, 1], 'upper center': [0.5, 0], 'center': [0.5, 0.5],
};

// Los píxeles de una imagen (imshow) se decodifican una vez por serie: al pasar el ratón se redibuja el eje y no hace falta repetirlo.
const lienzos = new WeakMap<object, HTMLCanvasElement | null>();
function lienzoDe(serie: Extract<Serie, { tipo: 'imagen' }>): HTMLCanvasElement | null {
    if (lienzos.has(serie)) return lienzos.get(serie)!;
    let lienzo: HTMLCanvasElement | null = null;
    try {
        const bin = atob(serie.rgba);
        if (bin.length === serie.ancho * serie.alto * 4) {
            const datos = new Uint8ClampedArray(bin.length);
            for (let i = 0; i < bin.length; i++) datos[i] = bin.charCodeAt(i);
            lienzo = document.createElement('canvas');
            lienzo.width = serie.ancho; lienzo.height = serie.alto;
            lienzo.getContext('2d')!.putImageData(new ImageData(datos, serie.ancho, serie.alto), 0, 0);
        }
    } catch { lienzo = null; }
    lienzos.set(serie, lienzo);
    return lienzo;
}

function dibujarEje(ctx: CanvasRenderingContext2D, eje: Eje, W: number, H: number, s: number, cursor: { x: number; y: number } | null) {
    const px = (pt: number) => Math.max(10, pt * s);        // tamaños de fuente legibles
    const lw = (pt: number) => Math.max(1, pt * s);         // grosores
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    let { xmin, xmax, ymin, ymax } = limitesAuto(eje);

    // Zona de dibujo: el margen izquierdo depende de lo ancho que salgan las marcas del eje Y.
    ctx.font = `${px(10)}px ${FONT}`;
    const ylog = eje.yscale === 'log', xlog = eje.xscale === 'log';
    const yt0 = marcasDe(eje.yticks, ymin, ymax, 6, ylog);
    const pasoY0 = pasoDe(yt0.pos);
    const anchoY = Math.max(...yt0.pos.map((v, i) => ctx.measureText(yt0.labels?.[i] ?? formatoMarca(v, pasoY0)).width), 8);
    const L = anchoY + 10, R = 12, T = 8, B = px(10) + 12;
    const w = Math.max(10, W - L - R), h = Math.max(10, H - T - B);

    if (eje.aspecto_igual && !xlog && !ylog) {
        // Un eje puede ir invertido (imshow: la fila 0 arriba): se conserva el sentido de cada uno.
        const sx = Math.sign(xmax - xmin) || 1, sy = Math.sign(ymax - ymin) || 1;
        const ux = w / Math.abs(xmax - xmin), uy = h / Math.abs(ymax - ymin), u = Math.min(ux, uy);
        const cx = (xmin + xmax) / 2, cy = (ymin + ymax) / 2;
        xmin = cx - sx * w / u / 2; xmax = cx + sx * w / u / 2; ymin = cy - sy * h / u / 2; ymax = cy + sy * h / u / 2;
    }
    // En escala logarítmica la posición es proporcional al exponente; un valor ≤ 0 no tiene posición (sale como NaN y el lienzo lo ignora).
    const lx = xlog ? Math.log10 : (v: number) => v, ly = ylog ? Math.log10 : (v: number) => v;
    const X = (v: number) => L + (lx(v) - lx(xmin)) / (lx(xmax) - lx(xmin)) * w;
    const Y = (v: number) => T + (1 - (ly(v) - ly(ymin)) / (ly(ymax) - ly(ymin))) * h;
    const Yb = (v: number) => (ylog && !(v > 0) ? T + h : Y(v));              // el pie de una barra en escala log (0) cae al borde inferior
    const categorico = eje.categorias.length > 0;
    const xm = categorico ? { pos: eje.categorias.map((_, i) => i), labels: eje.categorias } : marcasDe(eje.xticks, xmin, xmax, 7, xlog);
    const ym = marcasDe(eje.yticks, ymin, ymax, 6, ylog);
    const xt = xm.pos, yt = ym.pos;
    const pasoX = pasoDe(xt), pasoY = pasoDe(yt);

    // Rejilla
    if (eje.grid) {
        ctx.strokeStyle = `rgba(176,176,176,${eje.grid.alpha})`;
        ctx.lineWidth = lw(0.8);
        ctx.beginPath();
        if (eje.grid.eje !== 'y') xt.forEach(v => { ctx.moveTo(X(v), T); ctx.lineTo(X(v), T + h); });
        if (eje.grid.eje !== 'x') yt.forEach(v => { ctx.moveTo(L, Y(v)); ctx.lineTo(L + w, Y(v)); });
        ctx.stroke();
    }

    // Series (recortadas a la zona de dibujo), por zorder
    ctx.save();
    ctx.beginPath(); ctx.rect(L, T, w, h); ctx.clip();
    const orden = eje.series.map((serie, i) => [serie, i] as const).sort((a, b) => zorderDe(a[0]) - zorderDe(b[0]) || a[1] - b[1]);
    const textos: Serie[] = [];
    for (const [serie] of orden) {
        ctx.globalAlpha = 'alpha' in serie ? serie.alpha : 1;
        switch (serie.tipo) {
            case 'linea': {
                ctx.strokeStyle = serie.color; ctx.lineWidth = lw(serie.ancho);
                ctx.setLineDash((DASH[serie.estilo] ?? []).map(d => d * lw(serie.ancho)));
                if (serie.estilo !== '') {
                    ctx.beginPath();
                    let levantada = true;
                    for (let i = 0; i < serie.x.length; i++) {
                        const xv = serie.x[i], yv = serie.y[i];
                        if (xv == null || yv == null) { levantada = true; continue; }
                        if (levantada) ctx.moveTo(X(xv), Y(yv)); else ctx.lineTo(X(xv), Y(yv));
                        levantada = false;
                    }
                    ctx.stroke();
                }
                ctx.setLineDash([]);
                if (serie.marcador) {
                    ctx.fillStyle = serie.color;
                    for (let i = 0; i < serie.x.length; i++) {
                        const xv = serie.x[i], yv = serie.y[i];
                        if (xv == null || yv == null) continue;
                        if (trazarMarcador(ctx, serie.marcador, X(xv), Y(yv), serie.ms * s / 2) === 'relleno') ctx.fill(); else ctx.stroke();
                    }
                }
                break;
            }
            case 'dispersion': {
                ctx.fillStyle = serie.color; ctx.strokeStyle = serie.borde ?? serie.color; ctx.lineWidth = lw(1);
                for (let i = 0; i < serie.x.length; i++) {
                    const xv = serie.x[i], yv = serie.y[i];
                    if (xv == null || yv == null) continue;
                    if (trazarMarcador(ctx, serie.marcador, X(xv), Y(yv), serie.ms * s / 2) === 'relleno') { ctx.fill(); if (serie.borde) ctx.stroke(); } else ctx.stroke();
                }
                break;
            }
            case 'barras': {
                ctx.strokeStyle = serie.borde ?? serie.color; ctx.lineWidth = lw(1);
                for (let i = 0; i < serie.x.length; i++) {
                    const xv = serie.x[i], hv = serie.alto[i];
                    if (xv == null || hv == null) continue;
                    ctx.fillStyle = serie.colores?.[i] ?? serie.color;
                    const piso = serie.base?.[i] ?? 0;
                    const x0 = X(xv - serie.ancho / 2), x1 = X(xv + serie.ancho / 2), y0 = Yb(piso), y1 = Y(piso + hv);
                    ctx.fillRect(x0, Math.min(y0, y1), x1 - x0, Math.abs(y1 - y0));
                    if (serie.borde) ctx.strokeRect(x0, Math.min(y0, y1), x1 - x0, Math.abs(y1 - y0));
                }
                break;
            }
            case 'area': {
                ctx.fillStyle = serie.color;
                ctx.beginPath();
                const idx = serie.x.map((v, i) => (v != null && serie.y1[i] != null && serie.y2[i] != null ? i : -1)).filter(i => i >= 0);
                if (idx.length > 1) {
                    idx.forEach((i, k) => k === 0 ? ctx.moveTo(X(serie.x[i]!), Y(serie.y1[i]!)) : ctx.lineTo(X(serie.x[i]!), Y(serie.y1[i]!)));
                    [...idx].reverse().forEach(i => ctx.lineTo(X(serie.x[i]!), Y(serie.y2[i]!)));
                    ctx.closePath(); ctx.fill();
                }
                break;
            }
            case 'vline': case 'hline': {
                ctx.strokeStyle = serie.color; ctx.lineWidth = lw(serie.ancho);
                ctx.setLineDash((DASH[serie.estilo] ?? []).map(d => d * lw(serie.ancho)));
                ctx.beginPath();
                if (serie.tipo === 'vline') { ctx.moveTo(X(serie.pos), T); ctx.lineTo(X(serie.pos), T + h); }
                else { ctx.moveTo(L, Y(serie.pos)); ctx.lineTo(L + w, Y(serie.pos)); }
                ctx.stroke(); ctx.setLineDash([]);
                break;
            }
            case 'banda_x': case 'banda_y': {
                ctx.fillStyle = serie.color;
                if (serie.tipo === 'banda_x') ctx.fillRect(X(serie.desde), T, X(serie.hasta) - X(serie.desde), h);
                else ctx.fillRect(L, Y(serie.hasta), w, Y(serie.desde) - Y(serie.hasta));
                break;
            }
            case 'texto': textos.push(serie); break;
            case 'imagen': {
                const lienzo = lienzoDe(serie);
                if (!lienzo) break;
                const [izq, der, abajo, arriba] = serie.extent;
                // La fila 0 del array está en `arriba` si origen = 'upper' (lo normal en imshow) y en `abajo` si 'lower'.
                const x0 = X(izq), x1 = X(der);
                const y0 = Y(serie.origen === 'upper' ? arriba : abajo), y1 = Y(serie.origen === 'upper' ? abajo : arriba);
                ctx.save();
                ctx.imageSmoothingEnabled = false;            // como matplotlib: píxeles nítidos al ampliar
                ctx.translate(x0, y0);
                ctx.scale(Math.sign(x1 - x0) || 1, Math.sign(y1 - y0) || 1);
                ctx.drawImage(lienzo, 0, 0, Math.abs(x1 - x0), Math.abs(y1 - y0));
                ctx.restore();
                break;
            }
        }
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // Marco y marcas
    ctx.strokeStyle = '#000'; ctx.lineWidth = lw(0.8); ctx.strokeRect(L, T, w, h);
    ctx.fillStyle = '#000'; ctx.font = `${px(10)}px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.beginPath();
    xt.forEach(v => { ctx.moveTo(X(v), T + h); ctx.lineTo(X(v), T + h + 4); });
    yt.forEach(v => { ctx.moveTo(L, Y(v)); ctx.lineTo(L - 4, Y(v)); });
    ctx.stroke();
    // Si las etiquetas no caben una al lado de otra, se escribe solo una de cada n (las marcas se dejan todas).
    const etX = xt.map((v, i) => xm.labels?.[i] ?? formatoMarca(v, pasoX)), etY = yt.map((v, i) => ym.labels?.[i] ?? formatoMarca(v, pasoY));
    const cadaX = cadaCuantas(etX.map(t => ctx.measureText(t).width), pasoDe(xt) / Math.abs(xmax - xmin) * w);
    const cadaY = cadaCuantas(etY.map(() => px(10) * 1.3), pasoDe(yt) / Math.abs(ymax - ymin) * h);
    etX.forEach((t, i) => { if (i % cadaX === 0) ctx.fillText(t, X(xt[i]), T + h + 6); });
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    etY.forEach((t, i) => { if (i % cadaY === 0) ctx.fillText(t, L - 7, Y(yt[i])); });

    // Textos y anotaciones (encima de todo)
    for (const t of textos) {
        if (t.tipo !== 'texto') continue;
        const tx = t.ejes ? L + t.x * w : X(t.x), ty = t.ejes ? T + (1 - t.y) * h : Y(t.y);
        if (t.flecha) {
            const fx = t.ejes ? L + t.flecha.x * w : X(t.flecha.x), fy = t.ejes ? T + (1 - t.flecha.y) * h : Y(t.flecha.y);
            const ang = Math.atan2(fy - ty, fx - tx), cab = lw(5);
            ctx.strokeStyle = '#000'; ctx.fillStyle = '#000'; ctx.lineWidth = lw(1);
            ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(fx, fy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(fx, fy);
            ctx.lineTo(fx - cab * Math.cos(ang - 0.4), fy - cab * Math.sin(ang - 0.4));
            ctx.lineTo(fx - cab * Math.cos(ang + 0.4), fy - cab * Math.sin(ang + 0.4));
            ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = t.color;
        ctx.font = `${t.negrita ? 'bold ' : ''}${px(t.tam)}px ${FONT}`;
        ctx.textAlign = t.ha === 'center' ? 'center' : t.ha === 'right' ? 'right' : 'left';
        ctx.textBaseline = t.va === 'bottom' ? 'bottom' : t.va === 'top' ? 'top' : t.va === 'center' ? 'middle' : 'alphabetic';
        textoPlano(t.texto).split('\n').forEach((linea, i) => ctx.fillText(linea, tx, ty + i * px(t.tam) * 1.2));
    }

    // Leyenda
    if (eje.leyenda !== null) {
        const entradas = eje.series.filter((x): x is Exclude<Serie, { tipo: 'texto' | 'imagen' }> => x.tipo !== 'texto' && x.tipo !== 'imagen' && !!x.label && !x.label.startsWith('_'));
        if (entradas.length) {
            const fs = px(10);
            ctx.font = `${fs}px ${FONT}`;
            const ancho = Math.max(...entradas.map(e => ctx.measureText(textoPlano(e.label!)).width)) + 36;
            const alto = entradas.length * fs * 1.4 + 8;
            const caja = (ax: number, ay: number) => ({ bx: L + 8 + ax * (w - ancho - 16), by: T + 8 + ay * (h - alto - 16) });
            let [ax, ay] = POS_LEYENDA[eje.leyenda] ?? POS_LEYENDA['best'];
            if (eje.leyenda === 'best') {  // como matplotlib: la esquina donde tapa menos puntos de datos
                let menos = Infinity;
                for (const [cx, cy] of [[1, 0], [0, 0], [0, 1], [1, 1]]) {
                    const { bx, by } = caja(cx, cy);
                    let tapados = 0;
                    for (const serie of eje.series) {
                        if (serie.tipo !== 'linea' && serie.tipo !== 'dispersion') continue;
                        for (let i = 0; i < serie.x.length; i++) {
                            const xv = serie.x[i], yv = serie.y[i];
                            if (xv == null || yv == null) continue;
                            const sx = X(xv), sy = Y(yv);
                            if (sx >= bx && sx <= bx + ancho && sy >= by && sy <= by + alto) tapados++;
                        }
                    }
                    if (tapados < menos) { menos = tapados; [ax, ay] = [cx, cy]; }
                }
            }
            const { bx, by } = caja(ax, ay);
            ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
            ctx.fillRect(bx, by, ancho, alto); ctx.strokeRect(bx, by, ancho, alto);
            entradas.forEach((e, i) => {
                const cy = by + 4 + fs * 0.7 + i * fs * 1.4;
                ctx.globalAlpha = e.alpha;
                ctx.strokeStyle = e.color; ctx.fillStyle = e.color;
                if (e.tipo === 'linea' || e.tipo === 'vline' || e.tipo === 'hline') {
                    ctx.lineWidth = lw(e.ancho); ctx.setLineDash((DASH[e.estilo] ?? []).map(d => d * lw(e.ancho)));
                    if (e.tipo !== 'linea' || e.estilo !== '') { ctx.beginPath(); ctx.moveTo(bx + 6, cy); ctx.lineTo(bx + 26, cy); ctx.stroke(); }
                    ctx.setLineDash([]);
                    if (e.tipo === 'linea' && e.marcador && trazarMarcador(ctx, e.marcador, bx + 16, cy, e.ms * s / 2) === 'relleno') ctx.fill();
                } else if (e.tipo === 'dispersion') {
                    if (trazarMarcador(ctx, e.marcador, bx + 16, cy, e.ms * s / 2) === 'relleno') ctx.fill(); else ctx.stroke();
                } else ctx.fillRect(bx + 6, cy - fs * 0.35, 20, fs * 0.7);
                ctx.globalAlpha = 1;
                ctx.fillStyle = '#000'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                ctx.fillText(textoPlano(e.label!), bx + 32, cy);
            });
        }
    }

    // Valor del punto más cercano al cursor
    const cerca = cursor && cursor.x >= L && cursor.x <= L + w && cursor.y >= T && cursor.y <= T + h
        ? puntoCercano(puntosDe(eje), cursor.x, cursor.y, (x, y) => [X(x), Y(y)]) : null;
    if (cerca) {
        const px0 = X(cerca.x), py0 = Y(cerca.y), fs = px(10);
        ctx.strokeStyle = '#000'; ctx.fillStyle = '#fff'; ctx.lineWidth = lw(1.5);
        ctx.beginPath(); ctx.arc(px0, py0, lw(3.5), 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
        ctx.font = `${fs}px ${FONT}`;
        const ancho = ctx.measureText(cerca.texto).width + 12, alto = fs + 10;
        const bx = Math.min(Math.max(2, px0 + 10), W - ancho - 2), by = Math.min(Math.max(2, py0 - alto - 8), H - alto - 2);
        ctx.fillStyle = 'rgba(20,20,30,0.92)'; ctx.fillRect(bx, by, ancho, alto);
        ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(cerca.texto, bx + 6, by + alto / 2);
    }
}

function CanvasEje({ eje, ancho, alto, escala }: { eje: Eje; ancho: number; alto: number; escala: number }) {
    const ref = useRef<HTMLCanvasElement>(null);
    const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
    useLayoutEffect(() => {
        const c = ref.current;
        const ctx = c?.getContext('2d');
        if (!c || !ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const pw = Math.round(ancho * dpr), ph = Math.round(alto * dpr);
        if (c.width !== pw || c.height !== ph) { c.width = pw; c.height = ph; }  // asignar el tamaño borra: solo si cambió
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        dibujarEje(ctx, eje, ancho, alto, escala, cursor);
    }, [eje, ancho, alto, escala, cursor]);
    return (
        <canvas
            ref={ref}
            style={{ width: ancho, height: alto, display: 'block' }}
            onPointerMove={e => { const r = e.currentTarget.getBoundingClientRect(); setCursor({ x: e.clientX - r.left, y: e.clientY - r.top }); }}
            onPointerLeave={() => setCursor(null)}
        />
    );
}

function FiguraVista({ figura }: { figura: Figura }) {
    const cont = useRef<HTMLDivElement>(null);
    const [ancho, setAncho] = useState(0);
    useLayoutEffect(() => {
        const el = cont.current;
        if (!el) return;
        setAncho(el.clientWidth);
        const ro = new ResizeObserver(() => setAncho(el.clientWidth));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const filas = Math.max(1, ...figura.ejes.map(e => e.filas)), cols = Math.max(1, ...figura.ejes.map(e => e.cols));
    const [fw, fh] = figura.tam;
    const hueco = 12, relleno = 8;
    const escala = ancho > 0 ? ancho / (fw * 72) : 1;               // puntos de matplotlib -> píxeles
    const anchoPanel = Math.max(120, (ancho - relleno * 2 - hueco * (cols - 1)) / cols);
    const altoTotal = (ancho * fh) / fw;
    const altoPanel = Math.max(150, altoTotal / filas - 44);
    const fuente = (pt: number) => Math.max(11, pt * escala);

    return (
        <div ref={cont} className="lab-chart" style={{ width: '100%', background: '#fff', color: '#111', border: '1px solid var(--t-linea)', padding: relleno, fontFamily: 'var(--t-mono)', boxSizing: 'border-box' }}>
            {figura.titulo && <div style={{ textAlign: 'center', fontWeight: 600, fontSize: fuente(12), marginBottom: 4 }}><MathText texto={figura.titulo} /></div>}
            {ancho > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${anchoPanel}px)`, gap: hueco }}>
                    {figura.ejes.map((eje, i) => (
                        <div key={i} style={{ gridRow: eje.fila + 1, gridColumn: eje.col + 1, display: 'flex', flexDirection: 'column' }}>
                            {eje.titulo && <div style={{ textAlign: 'center', fontSize: fuente(12), marginBottom: 2 }}><MathText texto={eje.titulo} /></div>}
                            <div style={{ display: 'flex' }}>
                                {eje.ylabel && <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: fuente(10), textAlign: 'center', padding: '0 3px' }}><MathText texto={eje.ylabel} /></div>}
                                <CanvasEje eje={eje} ancho={anchoPanel - (eje.ylabel ? fuente(10) + 8 : 0)} alto={altoPanel} escala={escala} />
                            </div>
                            {eje.xlabel && <div style={{ textAlign: 'center', fontSize: fuente(10), marginTop: 2 }}><MathText texto={eje.xlabel} /></div>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function LabChart({ figuras }: { figuras: Figura[] }) {
    return <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>{figuras.map((f, i) => <FiguraVista key={i} figura={f} />)}</div>;
}
