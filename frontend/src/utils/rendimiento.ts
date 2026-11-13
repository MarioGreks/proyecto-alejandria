// Límites de rendimiento (Ajustes → Gráficos): lo que la interfaz necesita saber para no ir lenta en un PC justo. El backend guarda los ajustes y aplica los topes
// de CPU/RAM; aquí quedan el tope de fotogramas y la calidad del universo 3D, que solo la ventana puede aplicar. Ver backend/recursos.py.
import { API } from './api.ts';

export type Calidad3d = 'alta' | 'media' | 'baja';

export interface AjustesRendimiento {
    perfil: string;            // '' (sin elegir), 'ligero', 'equilibrado', 'maximo' o 'personalizado'
    limite_cpu: number;        // % del total de la CPU para backend + Ollama; 100 = sin tope
    limite_ram_mb: number;     // 0 = sin tope
    fps_max: number;           // 0 = sin tope
    calidad_3d: Calidad3d;
    ia_en_gpu: boolean;
    sinapsis_auto: boolean;
}

export const SIN_LIMITES: AjustesRendimiento = { perfil: '', limite_cpu: 100, limite_ram_mb: 0, fps_max: 0, calidad_3d: 'alta', ia_en_gpu: true, sinapsis_auto: true };

/** Aviso entre Ajustes y el universo: cuando cambia el rendimiento el 3D se adapta al instante, sin recargar. */
export const EVENTO_RENDIMIENTO = 'alejandria:rendimiento';
const CLAVE = 'alejandria.rendimiento';

/** Lo que el 3D dibuja con cada calidad: resolución máxima (relación de píxeles) y efectos de postprocesado, los que más cuestan en una GPU integrada. */
export interface Calidad { dprMax: number; bloom: boolean; vignette: boolean; multisampling: number }

export const calidadDe = (c: Calidad3d): Calidad =>
    c === 'baja' ? { dprMax: 1, bloom: false, vignette: false, multisampling: 0 }
        : c === 'media' ? { dprMax: 1.5, bloom: true, vignette: false, multisampling: 0 }
            : { dprMax: 2, bloom: true, vignette: true, multisampling: 8 };

const num = (v: unknown, min: number, max: number, por: number): number => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : por);

/** Deja una respuesta cualquiera (backend, o lo guardado en el navegador) en unos ajustes válidos: lo que falte o esté mal vale lo de siempre (sin límites). */
export const normalizarRendimiento = (x: unknown): AjustesRendimiento => {
    const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    return {
        perfil: typeof o.perfil === 'string' ? o.perfil : SIN_LIMITES.perfil,
        limite_cpu: num(o.limite_cpu, 1, 100, SIN_LIMITES.limite_cpu),
        limite_ram_mb: num(o.limite_ram_mb, 0, 1_048_576, SIN_LIMITES.limite_ram_mb),
        fps_max: Math.round(num(o.fps_max, 0, 240, SIN_LIMITES.fps_max)),
        calidad_3d: o.calidad_3d === 'media' || o.calidad_3d === 'baja' ? o.calidad_3d : 'alta',
        ia_en_gpu: typeof o.ia_en_gpu === 'boolean' ? o.ia_en_gpu : SIN_LIMITES.ia_en_gpu,
        sinapsis_auto: typeof o.sinapsis_auto === 'boolean' ? o.sinapsis_auto : SIN_LIMITES.sinapsis_auto,
    };
};

/** Lo último que se supo, para que el 3D arranque ya con su calidad sin esperar al backend (que tarda unos segundos en estar listo). */
export const leerRendimientoGuardado = (): AjustesRendimiento => {
    try { return normalizarRendimiento(JSON.parse(localStorage.getItem(CLAVE) ?? 'null')); } catch { return SIN_LIMITES; }
};
const guardarRendimiento = (a: AjustesRendimiento): void => { try { localStorage.setItem(CLAVE, JSON.stringify(a)); } catch { /* sin almacenamiento: no pasa nada */ } };

/** Pide los ajustes al backend, los recuerda y avisa al universo. null si el backend no responde (se queda lo último que se supo). */
export const cargarRendimiento = async (): Promise<AjustesRendimiento | null> => {
    try {
        const res = await fetch(`${API}/api/recursos`);
        if (!res.ok) return null;
        const a = normalizarRendimiento((await res.json()).ajustes);
        guardarRendimiento(a);
        avisarRendimiento(a);
        return a;
    } catch { return null; }
};

/** Perfil que la app propone según el equipo (el backend mira RAM y núcleos), para la pregunta de la primera vez. */
export interface Sugerencia { perfil: string; ramGb: number; nucleos: number }

const CLAVE_VISTO = 'alejandria.rendimiento.visto';

/** ¿Hay que proponer un perfil? Solo si aún no se ha elegido ninguno, el equipo pide recortar (no «máximo») y no se ha dicho ya «ahora no». */
export const debeProponer = (ajustes: AjustesRendimiento, sugerido: string, visto: boolean): boolean => ajustes.perfil === '' && sugerido !== 'maximo' && !visto && sugerido !== '';

export const marcarSugerenciaVista = (): void => { try { localStorage.setItem(CLAVE_VISTO, '1'); } catch { /* sin almacenamiento: se volverá a preguntar */ } };
const sugerenciaVista = (): boolean => { try { return localStorage.getItem(CLAVE_VISTO) === '1'; } catch { return false; } };

/** La propuesta de perfil para este equipo, o null si no procede (ya eligió, el equipo va sobrado, ya dijo «ahora no» o el backend no responde). */
export const leerSugerencia = async (): Promise<Sugerencia | null> => {
    try {
        const res = await fetch(`${API}/api/recursos`);
        if (!res.ok) return null;
        const r = await res.json();
        const sugerido = typeof r.perfil_sugerido === 'string' ? r.perfil_sugerido : '';
        if (!debeProponer(normalizarRendimiento(r.ajustes), sugerido, sugerenciaVista())) return null;
        return { perfil: sugerido, ramGb: Math.round((Number(r.hardware?.ram_total_mb) || 0) / 1024), nucleos: Number(r.hardware?.nucleos) || 0 };
    } catch { return null; }
};

/** Aplica un perfil entero (lo hace el backend) y adapta el 3D al instante. false si no se pudo. */
export const aplicarPerfil = async (perfil: string): Promise<boolean> => {
    try {
        const res = await fetch(`${API}/api/recursos`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ perfil }) });
        if (!res.ok) return false;
        avisarRendimiento(normalizarRendimiento((await res.json()).ajustes));
        return true;
    } catch { return false; }
};

export const avisarRendimiento = (a: AjustesRendimiento): void => {
    guardarRendimiento(a);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<AjustesRendimiento>(EVENTO_RENDIMIENTO, { detail: a }));
};

/** Tiempo que hay que pasarle a `advance` de react-three-fiber con `frameloop="never"`: en SEGUNDOS y continuando desde el reloj de la escena (`base`).
 *  La 0.8.0 le pasaba milisegundos y las animaciones iban ~1000 veces más rápido (el universo giraba como una peonza con el límite de FPS activo).
 *  `inicioMs` y `ahoraMs` son marcas de requestAnimationFrame: el primer fotograma cae justo en `base`, sin salto. */
export const segundosDeAvance = (base: number, inicioMs: number, ahoraMs: number): number => base + (ahoraMs - inicioMs) / 1000;

/** «2,5 GB» o «Sin tope». */
export const textoRam = (mb: number): string => (mb <= 0 ? 'Sin tope' : `${(mb / 1024).toLocaleString('es-ES', { maximumFractionDigits: 1 })} GB`);
export const textoFps = (fps: number): string => (fps <= 0 ? 'Sin tope' : `${fps} FPS`);
export const textoCpu = (pct: number): string => (pct >= 100 ? 'Sin tope' : `${pct} %`);

/** Nombre del perfil para mostrarlo. */
export const nombrePerfil = (p: string): string => (({ ligero: 'Ligero', equilibrado: 'Equilibrado', maximo: 'Máximo', personalizado: 'Personalizado' } as Record<string, string>)[p] ?? 'Sin elegir');
