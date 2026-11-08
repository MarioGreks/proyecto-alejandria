import { useCallback, useRef, useMemo, useEffect, useLayoutEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Text, Billboard } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { MODOS_PROMPT, conClustersExistentes, guardarModo, modoGuardado, promptExploracion, promptFuentes } from '../utils/prompts';
import type { ModoPrompt } from '../utils/prompts';
import { API } from '../utils/api';
import Ajustes from './Ajustes';
import Agenda from './Agenda';
import Papelera from './Papelera';
import GestionSubredes from './Subredes';
import ProcesandoNeurona from './ProcesandoNeurona';
import Seguro from './Seguro';
import Hud from './Hud';
import { Cabecera, Modal } from './terminal';
import type { EstadoProceso } from './ProcesandoNeurona';
import Tutorial, { tutorialVisto } from './Tutorial';
import { casillasRecordadas, centroDeCasilla, firmaUniverso, posicionesRecordadas, rngDe } from '../utils/disposicion';
import { DURACION_MS, FASE_MAX, avance, hornearEscalares, hornearPosiciones } from '../utils/transicion';
import { asignarSubredes, borrarSubred, colorSubred, esMiembro, guardarSubredActiva, guardarVacias, listarSubredes, mismaSubred, normalizarNombre, renombrarSubred, subredActivaGuardada, vaciasGuardadas } from '../utils/subredes';
import { calcularDisposicion, renombrarDisposicion } from '../utils/layoutSubred';
// Fuente propia para los rótulos de los clústeres (DejaVu Sans Mono Bold, la de matplotlib, con licencia libre y todo el alfabeto latino con tildes):
// sin `font`, troika baja una de un CDN, y con una fuente que no tenga alguna letra (la «Á» de MATEMÁTICAS) baja otra: no funciona sin internet y la CSP lo bloquea.
const fuenteRotulos = `${import.meta.env.BASE_URL}fuentes/DejaVuSansMono-Bold.ttf`;

const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    // Evitar scroll visual o que el usuario lo vea
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
};

const copyToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => fallbackCopyTextToClipboard(text));
    } else {
        fallbackCopyTextToClipboard(text);
    }
};

// Posiciones estables: cada neurona y cada clúster tienen siempre el mismo sitio (ver utils/disposicion.ts). Antes se sorteaban con
// Math.random() en cada recarga y, al añadir un clúster, se repartían todos de nuevo.

// Dibuja una curva de Bézier suave y añade los vértices a los arrays
function addSmoothCurve(
    start: THREE.Vector3, 
    end: THREE.Vector3, 
    control: THREE.Vector3, 
    color1: THREE.Color, 
    color2: THREE.Color, 
    positions: number[], 
    colors: number[], 
    segments: number = 8,
    nodeIndex: number = 0,
    nodeIndices: number[] = []
) {
    const curve = new THREE.QuadraticBezierCurve3(start, control, end);
    const points = curve.getPoints(segments);
    
    for (let i = 0; i < segments; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        positions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
        
        const t1 = i / segments;
        const t2 = (i + 1) / segments;
        const c1 = color1.clone().lerp(color2, t1);
        const c2 = color1.clone().lerp(color2, t2);
        
        colors.push(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b);
        nodeIndices.push(nodeIndex, nodeIndex);
    }
}

// Algoritmo fractal para generar la "Arborización Dendrítica" (ramas que se bifurcan)
function generateDendriteTree(
    start: THREE.Vector3, 
    dir: THREE.Vector3, 
    length: number, 
    depth: number, 
    maxDepth: number,
    baseColor: THREE.Color,
    positions: number[],
    colors: number[],
    nodeIndex: number,
    nodeIndices: number[],
    rnd: () => number             // aleatorio con semilla (el id de la neurona): la misma neurona tiene siempre las mismas ramas
) {
    if (depth > maxDepth) return;
    
    const end = start.clone().add(dir.clone().multiplyScalar(length));
    
    // Curvamos la rama ligeramente hacia un lado
    const control = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    // Usamos un vector ortogonal para hacer una curva natural, no un simple ruido
    const perp = new THREE.Vector3(1,0,0).cross(dir);
    if(perp.lengthSq() < 0.1) perp.set(0,1,0).cross(dir);
    perp.normalize().applyAxisAngle(dir, rnd() * Math.PI * 2);
    control.add(perp.multiplyScalar(length * 0.25));
    
    addSmoothCurve(start, end, control, baseColor, baseColor, positions, colors, 4, nodeIndex, nodeIndices);
    
    // Bifurcación: las dendritas se dividen en ramas más finas y cortas
    if (depth < maxDepth) {
        const numBranches = 1 + Math.floor(rnd() * 2); // 1 o 2 ramas hijas
        for(let i=0; i<numBranches; i++) {
            // Desviamos la dirección hija respecto a la rama madre (apertura en V)
            const branchPerp = new THREE.Vector3(1,0,0).cross(dir);
            if(branchPerp.lengthSq() < 0.1) branchPerp.set(0,1,0).cross(dir);
            branchPerp.normalize().applyAxisAngle(dir, rnd() * Math.PI * 2);
            
            // Mezclamos la dirección original con la desviación
            const newDir = dir.clone().multiplyScalar(0.6).add(branchPerp.multiplyScalar(0.6)).normalize();
            
            // La nueva rama es más corta
            generateDendriteTree(end, newDir, length * 0.7, depth + 1, maxDepth, baseColor, positions, colors, nodeIndex, nodeIndices, rnd);
        }
    }
}

import KnowledgePanel from './KnowledgePanel';

// Al acercarse mucho, cada neurona a la vista lleva su nombre, tenue (más claro cuanto más cerca), para saber cuál es cuál sin pasar el ratón por todas.
const DIST_ROTULO_MAX = 30, DIST_ROTULO_MIN = 10, MAX_ROTULOS = 14;   // el universo mide ~50 de lado: con la cámara a 30 una neurona ya se ve de ~20 px

const RotulosCercanos = ({ nodes, nombres, mascara, grupo, ocultar, pausa }: {
    nodes: THREE.Vector3[], nombres: string[], mascara: Uint8Array, grupo: React.RefObject<THREE.Group | null>, ocultar: number | null, pausa: React.RefObject<boolean>
}) => {
    const { camera } = useThree();
    const [visibles, setVisibles] = useState<{ i: number, a: number }[]>([]);
    const ultimo = useRef(0);
    const firma = useRef('');
    const v = useMemo(() => new THREE.Vector3(), []);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (t - ultimo.current < 0.15 || !grupo.current) return;   // ~7 veces por segundo bastan; el CSS suaviza el resto
        ultimo.current = t;
        const cercanas: { i: number, d: number }[] = [];
        for (let i = 0; i < nodes.length && !pausa.current; i++) {   // mientras las neuronas viajan de una red a otra no hay rótulos
            if (!mascara[i]) continue;                               // las que no están en la red actual no se ven
            v.copy(nodes[i]).applyMatrix4(grupo.current.matrixWorld);   // el grupo gira: hay que comparar en coordenadas del mundo
            const d = v.distanceTo(camera.position);
            if (d > DIST_ROTULO_MAX) continue;
            v.project(camera);
            if (v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1) continue;   // detrás de la cámara o fuera de la pantalla
            cercanas.push({ i, d });
        }
        const elegidas = cercanas.sort((x, y) => x.d - y.d).slice(0, MAX_ROTULOS)
            .map(({ i, d }) => ({ i, a: Math.round(Math.min(1, (DIST_ROTULO_MAX - d) / (DIST_ROTULO_MAX - DIST_ROTULO_MIN)) * 5) / 5 }))
            .map(e => ({ ...e, a: Math.max(e.a, 0.2) }));   // dentro del alcance siempre se lee un poco; la mitad del rango, ya con claridad
        const nueva = elegidas.map(e => `${e.i}:${e.a}`).join();
        if (nueva !== firma.current) { firma.current = nueva; setVisibles(elegidas); }
    });

    return (<>
        {visibles.filter(e => e.i !== ocultar && nombres[e.i]).map(({ i, a }) => (
            <Html key={i} position={nodes[i]} center zIndexRange={[50, 0]} style={{ pointerEvents: 'none' }}>
                <div className="rotulo-neurona" style={{ opacity: 0.2 + a * 0.5 }}>{nombres[i]}</div>
            </Html>
        ))}
    </>);
};

/** Rótulo «[ CLÚSTER ]» sobre su isla: se desvanece al entrar en una subred (allí no hay islas) y vuelve al regresar a la general. */
const RotuloCluster = ({ posicion, texto, visible }: { posicion: [number, number, number], texto: string, visible: boolean }) => {
    const opacidad = useRef(visible ? 1 : 0);
    const texto3d = useRef<any>(null);
    const grupo = useRef<THREE.Group>(null);
    const asignar = useCallback((t: any) => { texto3d.current = t; if (t) t.fillOpacity = opacidad.current; }, []);
    useFrame((_, dt) => {
        const objetivo = visible ? 1 : 0;
        if (Math.abs(opacidad.current - objetivo) >= 0.004) {
            opacidad.current += (objetivo - opacidad.current) * Math.min(1, dt * 5);
            if (texto3d.current) texto3d.current.fillOpacity = opacidad.current;
        }
        if (grupo.current) grupo.current.visible = opacidad.current > 0.03;     // casi apagado: se oculta del todo (un resto tenue seguía viéndose)
    });
    return (
        <Seguro><Billboard ref={grupo} position={posicion} follow={true}>
            <Text ref={asignar} font={fuenteRotulos} fontSize={0.9} letterSpacing={0.05} color="#5fbf9f" material-toneMapped={false}>[ {texto.toUpperCase()} ]</Text>
        </Billboard></Seguro>
    );
};

// ───────────── Escenas: una disposición completa del universo (red general o una subred) ─────────────
// La geometría (todas las neuronas, sus dendritas y todas las conexiones) tiene SIEMPRE los mismos vértices en el mismo orden; lo que cambia de una red a otra es
// dónde está cada uno, su color y si se ve. Así pasar de una a otra es interpolar vértice a vértice en la GPU (ver `materialLinea` y `materialNucleo`).

export interface Vista { nombre: string | null; layout: Record<string, [number, number, number]> | null; color: string }
export const VISTA_GENERAL: Vista = { nombre: null, layout: null, color: '#ffffff' };

interface Base {
    ids: string[]; indicePorId: Map<string, number>; posGen: THREE.Vector3[]; coloresGen: Float32Array;
    enlaces: [number, number, string, string][];            // índice de origen y de destino, y sus ids
    arcos: Float32Array;                                     // 4 por neurona: desvío en arco al viajar (xyz) y retraso de salida (w)
    clusterCenters: THREE.Vector3[]; clusterKeys: string[];
    nombres: string[]; nombreN: string[]; clusterN: string[]; busqueda: string[];   // nombre, y textos normalizados donde buscar (el nombre, el clúster, y los dos con los términos del glosario)
}

interface Escena {
    pos: THREE.Vector3[]; vis: Uint8Array;                   // dónde está cada neurona y si es de esta red (1) o no (0)
    lineaPos: Float32Array; lineaCol: Float32Array; lineaVis: Float32Array; lineaArco: Float32Array; lineaNodo: Int32Array;
    rangoNodo: Int32Array; rangoEnlace: Int32Array;           // primer y último vértice (sin incluir) de las dendritas de cada neurona y de la curva de cada conexión
}

const COLORES_CLUSTER = ['#33ff00', '#ff3300', '#00ccff', '#ff00aa', '#ffff00', '#ff00ff', '#00ffff'].map(c => new THREE.Color(c));
const normalizarTexto = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function construirBase(realNodes: any[], realLinks: any[]): Base | null {
    if (realNodes.length === 0) return null;
    const clusterMap = new Map<string, any[]>();
    realNodes.forEach(n => {
        const cId = n.cluster_id || "Desconocido";
        if (!clusterMap.has(cId)) clusterMap.set(cId, []);
        clusterMap.get(cId)!.push(n);
    });
    // Orden alfabético (no el de llegada): el mismo universo da siempre los mismos índices.
    const clusterKeys = Array.from(clusterMap.keys()).sort();
    const casillas = casillasRecordadas(clusterKeys);
    // Cada clúster en su casilla fija (el primero, en el centro) y con el color de su casilla.
    const clusterCenters = clusterKeys.map(c => new THREE.Vector3(...centroDeCasilla(casillas[c])));
    // Sitio de cada neurona dentro de su clúster: con distancia mínima y recordado, así una neurona nueva nunca mueve a otra.
    const desplazamientos = posicionesRecordadas(Object.fromEntries(clusterKeys.map(c => [c, clusterMap.get(c)!.map(n => String(n.id))])));
    const posGen: THREE.Vector3[] = [], ids: string[] = [], nombres: string[] = [], nombreN: string[] = [], clusterN: string[] = [], busqueda: string[] = [];
    const coloresGen = new Float32Array(realNodes.length * 3);
    clusterKeys.forEach((cId, idx) => {
        const center = clusterCenters[idx];
        const color = COLORES_CLUSTER[casillas[cId] % COLORES_CLUSTER.length];
        [...clusterMap.get(cId)!].sort((a, b) => String(a.id).localeCompare(String(b.id))).forEach(node => {
            const d = desplazamientos[String(node.id)];
            const i = ids.length;
            posGen.push(new THREE.Vector3(center.x + d[0], center.y + d[1], center.z + d[2]));
            coloresGen.set([color.r, color.g, color.b], i * 3);
            ids.push(node.id);
            nombres.push(String(node.nombre ?? ''));
            nombreN.push(normalizarTexto(String(node.nombre ?? '')));
            clusterN.push(normalizarTexto(String(node.cluster_id ?? '')));
            let glosario = "";
            if (typeof node.glosario === 'string') { try { glosario = JSON.parse(node.glosario).map((g: any) => g.termino).join(" "); } catch { /* glosario ilegible: no se busca en él */ } }
            else if (Array.isArray(node.glosario)) glosario = node.glosario.map((g: any) => g.termino).join(" ");
            busqueda.push(normalizarTexto(`${node.nombre ?? ''} ${node.cluster_id ?? ''} ${glosario}`));   // búsqueda restrictiva: no la teoría gigante
        });
    });
    const indicePorId = new Map(ids.map((id, i) => [id, i]));
    const enlaces: [number, number, string, string][] = [];
    for (const l of realLinks ?? []) {
        const a = indicePorId.get(l.origen_id), b = indicePorId.get(l.destino_id);
        if (a === undefined || b === undefined) { console.warn(`Enlace fallido: ${l.origen_id} (${a}) -> ${l.destino_id} (${b})`); continue; }
        enlaces.push([a, b, l.origen_id, l.destino_id]);
    }
    const arcos = new Float32Array(ids.length * 4);
    ids.forEach((id, i) => {
        const r = rngDe(`a:${id}`);
        const u = r() * 2 - 1, fi = r() * Math.PI * 2, s = Math.sqrt(1 - u * u), mag = 3 + r() * 5;
        arcos.set([s * Math.cos(fi) * mag, u * mag, s * Math.sin(fi) * mag, r()], i * 4);
    });
    return { ids, indicePorId, posGen, coloresGen, enlaces, arcos, clusterCenters, clusterKeys, nombres, nombreN, clusterN, busqueda };
}

/** Dendritas de una neurona (siempre las mismas: salen de su id): añade sus vértices a los arrays. */
function dendritasDe(base: Base, i: number, pos: THREE.Vector3, color: THREE.Color, lp: number[], lc: number[], nodoDe: number[]) {
    const rnd = rngDe(`d:${base.ids[i]}`);
    const numPrimaryDendrites = 2 + Math.floor(rnd() * 2);
    for (let d = 0; d < numPrimaryDendrites; d++) {
        const dir = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
        const initialLength = 0.5 + rnd() * 1.0;
        generateDendriteTree(pos, dir, initialLength, 0, 2, color, lp, lc, i, nodoDe, rnd);
    }
}

/** Curva de una conexión entre dos neuronas (siempre la misma curva para el mismo par): añade sus vértices a los arrays. */
function curvaDe(enlace: [number, number, string, string], pa: THREE.Vector3, pb: THREE.Vector3, ca: THREE.Color, cb: THREE.Color, lp: number[], lc: number[], nodoDe: number[]) {
    const [a, , origen, destino] = enlace;
    const dir = new THREE.Vector3().subVectors(pb, pa);
    const dist = dir.length();
    dir.normalize();
    const perp = new THREE.Vector3(1, 0, 0).cross(dir);
    if (perp.lengthSq() < 0.1) perp.set(0, 1, 0).cross(dir);
    perp.normalize();
    const rnd = rngDe(`l:${origen}>${destino}`);   // cada conexión, siempre con la misma curva
    perp.applyAxisAngle(dir, rnd() * Math.PI * 2);
    const midPoint = new THREE.Vector3().addVectors(pa, pb).multiplyScalar(0.5);
    midPoint.add(perp.multiplyScalar(dist * (0.2 + rnd() * 0.2)));
    addSmoothCurve(pa, pb, midPoint, ca, cb, lp, lc, SEGMENTOS_ENLACE, a, nodoDe);
}
const SEGMENTOS_ENLACE = 12;

/**
 * Una escena de esa base: la red general (vista sin subred) o la subred (sus neuronas en su disposición compacta y de su color; las demás, invisibles en su sitio).
 * La de una subred parte de la general (`general`): las dendritas y conexiones que no son de la subred se copian tal cual (no se ven) y solo se generan las de sus
 * miembros, así que el coste depende del tamaño de la subred y no del de toda la red.
 */
function construirEscena(base: Base, vista: Vista, general?: Escena): Escena {
    const n = base.ids.length;
    const layout = vista.nombre !== null && vista.layout ? vista.layout : null;
    const colorSub = new THREE.Color(vista.color);
    const pos = base.posGen.map((p, i) => { const l = layout?.[base.ids[i]]; return l ? new THREE.Vector3(l[0], l[1], l[2]) : p; });
    const vis = new Uint8Array(n);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
        const miembro = !layout || !!layout[base.ids[i]];
        vis[i] = miembro ? 1 : 0;
        if (layout && miembro) col.set([colorSub.r, colorSub.g, colorSub.b], i * 3); else col.set(base.coloresGen.subarray(i * 3, i * 3 + 3), i * 3);
    }
    const color = (i: number) => new THREE.Color(col[i * 3], col[i * 3 + 1], col[i * 3 + 2]);

    if (layout && general) {
        const lineaPos = general.lineaPos.slice(), lineaCol = general.lineaCol.slice(), lineaVis = new Float32Array(general.lineaVis.length);
        const rangoNodo = general.rangoNodo, rangoEnlace = general.rangoEnlace;
        const volcar = (lp: number[], lc: number[], ini: number, fin: number) => {
            if (lp.length / 3 !== fin - ini) throw new Error('la geometría de la subred no coincide con la de la red general');
            lineaPos.set(lp, ini * 3); lineaCol.set(lc, ini * 3); lineaVis.fill(1, ini, fin);
        };
        for (let i = 0; i < n; i++) {
            if (!vis[i]) continue;
            const lp: number[] = [], lc: number[] = [], nodoDe: number[] = [];
            dendritasDe(base, i, pos[i], color(i), lp, lc, nodoDe);
            volcar(lp, lc, rangoNodo[i * 2], rangoNodo[i * 2 + 1]);
        }
        base.enlaces.forEach((enlace, k) => {
            const [a, b] = enlace;
            if (!vis[a] || !vis[b]) return;
            const lp: number[] = [], lc: number[] = [], nodoDe: number[] = [];
            curvaDe(enlace, pos[a], pos[b], color(a), color(b), lp, lc, nodoDe);
            volcar(lp, lc, rangoEnlace[k * 2], rangoEnlace[k * 2 + 1]);
        });
        return { pos, vis, lineaPos, lineaCol, lineaVis, lineaArco: general.lineaArco, lineaNodo: general.lineaNodo, rangoNodo, rangoEnlace };
    }

    const lp: number[] = [], lc: number[] = [], nodoDe: number[] = [];
    const lineaVis: number[] = [], lineaArco: number[] = [];
    const rangoNodo = new Int32Array(n * 2), rangoEnlace = new Int32Array(base.enlaces.length * 2);
    const cerrarTramo = (desde: number, a: number, b: number) => {     // vértices añadidos desde `desde`: su visibilidad y su arco/retraso
        const nuevos = lp.length / 3 - desde;
        for (let k = 0; k < nuevos; k++) {
            const t = b < 0 ? 0 : Math.floor(k / 2 + (k % 2)) / SEGMENTOS_ENLACE;     // dentro de una conexión, de un extremo (0) al otro (1)
            lineaVis.push(b < 0 ? vis[a] : Math.min(vis[a], vis[b]));
            for (let q = 0; q < 4; q++) lineaArco.push(b < 0 ? base.arcos[a * 4 + q] : base.arcos[a * 4 + q] * (1 - t) + base.arcos[b * 4 + q] * t);
        }
    };
    for (let i = 0; i < n; i++) {
        const desde = lp.length / 3;
        dendritasDe(base, i, pos[i], color(i), lp, lc, nodoDe);
        rangoNodo.set([desde, lp.length / 3], i * 2);
        cerrarTramo(desde, i, -1);
    }
    // Conexiones reales (aristas de la BD): se dibujan todas, también las que no son de esta red (invisibles), para que la geometría sea siempre la misma
    base.enlaces.forEach((enlace, k) => {
        const [a, b] = enlace;
        const desde = lp.length / 3;
        curvaDe(enlace, pos[a], pos[b], color(a), color(b), lp, lc, nodoDe);
        rangoEnlace.set([desde, lp.length / 3], k * 2);
        cerrarTramo(desde, a, b);
    });
    return { pos, vis, lineaPos: new Float32Array(lp), lineaCol: new Float32Array(lc), lineaVis: new Float32Array(lineaVis), lineaArco: new Float32Array(lineaArco), lineaNodo: new Int32Array(nodoDe), rangoNodo, rangoEnlace };
}

// ───────────── Shaders de la transición ─────────────
// Mismas fórmulas que utils/transicion.ts (marcadas GLSL allí): cada vértice sale de `aAnt` (dónde estaba), llega a su sitio de ahora con un retraso propio
// (aArco.w) y un desvío en arco (aArco.xyz), y su visibilidad/color pasa de `aVisAnt`/`aColAnt` a `aVis`/`color`.
const GLSL_COMUN = `
attribute vec3 aAnt; attribute float aVis; attribute float aVisAnt; attribute vec4 aArco; uniform float uT;
float avanceT(float w) { float e = clamp((uT - w * ${FASE_MAX.toFixed(2)}) / ${(1 - FASE_MAX).toFixed(2)}, 0.0, 1.0); return e * e * e * (e * (e * 6.0 - 15.0) + 10.0); }
`;

function materialLinea(uniformes: { uT: { value: number } }) {
    const m = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
    m.onBeforeCompile = shader => {
        shader.uniforms.uT = uniformes.uT;
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', `#include <common>\n${GLSL_COMUN}\nattribute vec3 aColAnt;`)
            .replace('#include <color_vertex>', `float e_ = avanceT(aArco.w);\n${THREE.ShaderChunk.color_vertex.replace('vColor.rgb *= color;', 'vColor.rgb *= mix(aColAnt, color, e_) * mix(aVisAnt, aVis, e_);')}`)
            .replace('#include <begin_vertex>', 'vec3 transformed = mix(aAnt, position, e_) + aArco.xyz * sin(3.14159265 * e_);');
    };
    m.customProgramCacheKey = () => 'alejandria-linea';
    return m;
}

function materialNucleo(uniformes: { uT: { value: number } }) {
    const m = new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, opacity: 1.0 });
    m.onBeforeCompile = shader => {
        shader.uniforms.uT = uniformes.uT;
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', `#include <common>\n${GLSL_COMUN}`)
            .replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat e_ = avanceT(aArco.w);\ntransformed *= mix(aVisAnt, aVis, e_);')
            .replace('#include <project_vertex>', THREE.ShaderChunk.project_vertex.replace('mvPosition = modelViewMatrix * mvPosition;',
                'mvPosition.xyz += (1.0 - e_) * (aAnt - instanceMatrix[3].xyz) + aArco.xyz * sin(3.14159265 * e_);\nmvPosition = modelViewMatrix * mvPosition;'));
    };
    m.customProgramCacheKey = () => 'alejandria-nucleo';
    return m;
}

const reducirMovimiento = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const atributo = (g: THREE.BufferGeometry, nombre: string) => g.getAttribute(nombre) as THREE.BufferAttribute | undefined;
const dinamico = <T extends THREE.BufferAttribute>(a: T): T => { a.setUsage(THREE.DynamicDrawUsage); return a; };

const BiologicalWeb = ({ onNodeClick, searchQuery, realNodes, realLinks, vista }: { onNodeClick: (id: string) => void, searchQuery: string, realNodes: any[], realLinks: any[], vista: Vista }) => {
    const base = useMemo(() => construirBase(realNodes, realLinks), [realNodes, realLinks]);
    const cacheGeneral = useRef<{ base: Base, escena: Escena } | null>(null);
    // La escena a la que se va. La de la red general se recuerda mientras no cambie el universo (volver a ella no cuesta nada) y la de una subred parte de ella.
    const destino = useMemo(() => {
        if (!base) return null;
        if (cacheGeneral.current?.base !== base) cacheGeneral.current = { base, escena: construirEscena(base, VISTA_GENERAL) };
        const general = cacheGeneral.current.escena;
        return vista.nombre !== null && vista.layout ? construirEscena(base, vista, general) : general;
    }, [base, vista]);
    const totalNodes = base?.ids.length ?? 0;

    const meshRef = useRef<THREE.InstancedMesh>(null);
    const groupRef = useRef<THREE.Group>(null);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const uniformes = useMemo(() => ({ uT: { value: 1 } }), []);
    const matLinea = useMemo(() => materialLinea(uniformes), [uniformes]);
    const matNucleo = useMemo(() => materialNucleo(uniformes), [uniformes]);
    const lineGeometry = useMemo(() => new THREE.BufferGeometry(), [base]);   // eslint-disable-line react-hooks/exhaustive-deps
    const marcha = useRef({ t: 1, t0: 0, dur: 0 });                              // avance de la transición (1 = en reposo)
    const aplicado = useRef<{ base: Base, destino: Escena, geometria: THREE.BufferGeometry } | null>(null);
    const moviendose = useRef(false);

    // Cada vez que cambia la escena de destino: la geometría pasa a ella. Si es la misma base (solo cambió de red), se anima desde donde estaba; si la base cambió
    // (hay neuronas o conexiones nuevas) se dibuja directamente.
    useLayoutEffect(() => {
        const mesh = meshRef.current;
        if (!mesh || !base || !destino) return;
        if (aplicado.current?.base === base && aplicado.current.destino === destino && aplicado.current.geometria === lineGeometry && atributo(lineGeometry, 'position')) return;   // ya aplicado (StrictMode repite los efectos)
        aplicado.current = { base, destino, geometria: lineGeometry };
        const nGeo = mesh.geometry, n = totalNodes, nv = destino.lineaPos.length / 3;
        const pos = atributo(lineGeometry, 'position');
        const primera = !pos || pos.count !== nv || atributo(nGeo, 'aAnt')?.count !== n;
        const dur = reducirMovimiento() ? 0 : DURACION_MS;
        const animar = !primera && dur > 0;
        const nodoVis = Float32Array.from(destino.vis);

        if (primera) {
            const colAnt = new Float32Array(destino.lineaCol.length);
            for (let v = 0; v < nv; v++) for (let k = 0; k < 3; k++) colAnt[v * 3 + k] = destino.lineaCol[v * 3 + k] * destino.lineaVis[v];
            lineGeometry.setAttribute('position', dinamico(new THREE.BufferAttribute(destino.lineaPos.slice(), 3)));
            lineGeometry.setAttribute('color', dinamico(new THREE.BufferAttribute(destino.lineaCol.slice(), 3)));
            lineGeometry.setAttribute('aAnt', dinamico(new THREE.BufferAttribute(destino.lineaPos.slice(), 3)));
            lineGeometry.setAttribute('aColAnt', dinamico(new THREE.BufferAttribute(colAnt, 3)));
            lineGeometry.setAttribute('aVis', dinamico(new THREE.BufferAttribute(destino.lineaVis.slice(), 1)));
            lineGeometry.setAttribute('aVisAnt', dinamico(new THREE.BufferAttribute(new Float32Array(nv).fill(1), 1)));
            lineGeometry.setAttribute('aArco', new THREE.BufferAttribute(destino.lineaArco.slice(), 4));
            nGeo.setAttribute('aAnt', dinamico(new THREE.InstancedBufferAttribute(Float32Array.from(destino.pos.flatMap(p => [p.x, p.y, p.z])), 3)));
            nGeo.setAttribute('aVis', dinamico(new THREE.InstancedBufferAttribute(nodoVis.slice(), 1)));
            nGeo.setAttribute('aVisAnt', dinamico(new THREE.InstancedBufferAttribute(nodoVis.slice(), 1)));
            nGeo.setAttribute('aArco', new THREE.InstancedBufferAttribute(base.arcos.slice(), 4));
        } else {
            // 1) lo que se ve AHORA (puede ser a mitad de una transición anterior) pasa a ser el punto de partida
            const t = marcha.current.t;
            const g = (nombre: string) => atributo(lineGeometry, nombre)!;
            const lAnt = g('aAnt').array as Float32Array, lPos = g('position').array as Float32Array, lArco = g('aArco').array as Float32Array;
            const lColAnt = g('aColAnt').array as Float32Array, lCol = g('color').array as Float32Array, lVis = g('aVis').array as Float32Array, lVisAnt = g('aVisAnt').array as Float32Array;
            if (t < 1) {
                for (let v = 0; v < nv; v++) {
                    const e = avance(t, lArco[v * 4 + 3]);
                    const visAhora = lVisAnt[v] + (lVis[v] - lVisAnt[v]) * e;
                    for (let k = 0; k < 3; k++) lColAnt[v * 3 + k] = (lColAnt[v * 3 + k] + (lCol[v * 3 + k] - lColAnt[v * 3 + k]) * e) * visAhora;
                }
                hornearPosiciones(lAnt, lPos, lArco, t, lAnt);
            } else {
                for (let v = 0; v < nv; v++) for (let k = 0; k < 3; k++) lColAnt[v * 3 + k] = lCol[v * 3 + k] * lVis[v];
                lAnt.set(lPos);
            }
            lVisAnt.fill(1);
            const m = (nombre: string) => atributo(nGeo, nombre)!;
            const nAnt = m('aAnt').array as Float32Array, nArco = m('aArco').array as Float32Array, nVis = m('aVis').array as Float32Array, nVisAnt = m('aVisAnt').array as Float32Array;
            const nPosActual = new Float32Array(n * 3);
            for (let i = 0; i < n; i++) { const p = new THREE.Matrix4().fromArray(mesh.instanceMatrix.array as Float32Array, i * 16); nPosActual[i * 3] = p.elements[12]; nPosActual[i * 3 + 1] = p.elements[13]; nPosActual[i * 3 + 2] = p.elements[14]; }
            if (t < 1) { hornearPosiciones(nAnt, nPosActual, nArco, t, nAnt); hornearEscalares(nVisAnt, nVis, nArco, t, nVisAnt); }
            else { nAnt.set(nPosActual); nVisAnt.set(nVis); }
            // 2) y los vértices pasan a su sitio de destino
            lPos.set(destino.lineaPos); lCol.set(destino.lineaCol); lVis.set(destino.lineaVis); nVis.set(nodoVis);
            for (const nombre of ['position', 'color', 'aAnt', 'aColAnt', 'aVis', 'aVisAnt']) g(nombre).needsUpdate = true;
            for (const nombre of ['aAnt', 'aVis', 'aVisAnt']) m(nombre).needsUpdate = true;
        }

        const dummy = new THREE.Object3D();
        destino.pos.forEach((p, i) => {
            const rnd = rngDe(`s:${base.ids[i]}`);   // tamaño y giro de cada soma: fijos (antes cambiaban con cada letra de la búsqueda)
            dummy.position.copy(p);
            dummy.scale.setScalar(0.2 + rnd() * 0.1);
            dummy.rotation.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();      // IMPORTANTE: sin ella el Raycaster no encuentra las neuronas y no funcionan los clics
        marcha.current = { t: animar ? 0 : 1, t0: performance.now(), dur };
        uniformes.uT.value = animar ? 0 : 1;
        moviendose.current = animar;
        if (animar) setHoveredIdx(null);
    }, [base, destino]);   // eslint-disable-line react-hooks/exhaustive-deps

    // Búsqueda: las que no coinciden se apagan y las que sí brillan (solo cambia el color; la posición y el tamaño no se tocan)
    useEffect(() => {
        const mesh = meshRef.current;
        if (!mesh || !base || !destino) return;
        const q = normalizarTexto(searchQuery.trim());
        const coincide = base.busqueda.map((texto, i) => {
            if (!q) return true;
            if (q.length < 3) { const inicio = new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`); return inicio.test(base.nombreN[i]) || inicio.test(base.clusterN[i]); }   // 1-2 letras: al principio de palabra, solo en nombre y clúster
            return texto.includes(q);
        });
        const color = new THREE.Color();
        for (let i = 0; i < totalNodes; i++) {
            const v = !q ? 1.0 : coincide[i] ? 2.5 : 0.05;     // el núcleo es blanco; con búsqueda, fantasma (apagado) o súper brillante (bloom)
            mesh.setColorAt(i, color.setRGB(v, v, v));
        }
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        const colAttr = atributo(lineGeometry, 'color');
        if (colAttr) {
            const arr = colAttr.array as Float32Array;
            for (let v = 0; v < destino.lineaNodo.length; v++) {
                const apagada = q && !coincide[destino.lineaNodo[v]];
                for (let k = 0; k < 3; k++) arr[v * 3 + k] = apagada ? 0.05 : destino.lineaCol[v * 3 + k];
            }
            colAttr.needsUpdate = true;
        }
    }, [base, destino, searchQuery, totalNodes, lineGeometry]);

    // En reposo, solo se pueden tocar las neuronas de la red actual (las demás siguen en la geometría, pero encogidas a nada)
    const raycastDeLaRed = useMemo(() => function (this: THREE.InstancedMesh, rc: THREE.Raycaster, hits: THREE.Intersection[]) {
        const todas: THREE.Intersection[] = [];
        THREE.InstancedMesh.prototype.raycast.call(this, rc, todas);
        for (const h of todas) if (h.instanceId !== undefined && destino?.vis[h.instanceId]) hits.push(h);
    }, [destino]);

    useFrame((state) => {
        if (groupRef.current) {
            const time = state.clock.getElapsedTime();
            groupRef.current.rotation.y = time * 0.03;
            groupRef.current.rotation.x = Math.sin(time * 0.01) * 0.05;
        }
        const m = marcha.current;
        if (m.t < 1) {
            m.t = m.dur > 0 ? Math.min(1, (performance.now() - m.t0) / m.dur) : 1;
            uniformes.uT.value = m.t;
            if (m.t >= 1) moviendose.current = false;
        }
    });

    return (
        <group ref={groupRef}>
            {totalNodes > 0 && <lineSegments geometry={lineGeometry} material={matLinea} frustumCulled={false} />}

            {totalNodes > 0 && (
                <instancedMesh
                    ref={meshRef}
                    args={[undefined, undefined, totalNodes]}
                    frustumCulled={false}
                    raycast={raycastDeLaRed}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (moviendose.current) return;
                        if (e.instanceId !== undefined) onNodeClick(base!.ids[e.instanceId]);
                    }}
                    onPointerMove={(e) => {
                        e.stopPropagation();
                        if (moviendose.current) return;
                        if (e.instanceId !== undefined && e.instanceId !== hoveredIdx) {
                            setHoveredIdx(e.instanceId);
                            document.body.style.cursor = 'pointer';
                        }
                    }}
                    onPointerOut={(e) => {
                        e.stopPropagation();
                        setHoveredIdx(null);
                        document.body.style.cursor = 'auto';
                    }}
                >
                    <icosahedronGeometry args={[1, 0]} />
                    <primitive object={matNucleo} attach="material" />
                </instancedMesh>
            )}

            {base && destino && hoveredIdx !== null && destino.pos[hoveredIdx] && (() => {
                const hoveredNode = realNodes.find(n => n.id === base.ids[hoveredIdx]);
                if (!hoveredNode) return null;
                return (
                    <Html position={destino.pos[hoveredIdx]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
                        <div className="t-marco" style={{
                            padding: '8px 12px',
                            whiteSpace: 'nowrap',
                            transform: 'translateY(-40px)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px',
                            fontSize: 12,
                        }}>
                            <span style={{ color: 'var(--t-verde)' }}>&gt; {hoveredNode.nombre}</span>
                            <span style={{ color: 'var(--t-ambar)' }}>cluster: {hoveredNode.cluster_id}</span>
                        </div>
                    </Html>
                );
            })()}

            {base && destino && <RotulosCercanos nodes={destino.pos} nombres={base.nombres} mascara={destino.vis} grupo={groupRef} ocultar={hoveredIdx} pausa={moviendose} />}

            {base && base.clusterCenters.map((center, idx) => (
                <RotuloCluster key={base.clusterKeys[idx]} posicion={[center.x, center.y + 3.5, center.z]} texto={base.clusterKeys[idx]} visible={vista.nombre === null} />
            ))}
        </group>
    );
};

import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

const CameraController = ({ resetFlag, targetPosition, distancia }: { resetFlag: number, targetPosition: THREE.Vector3 | null, distancia: number }) => {
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const { camera } = useThree();

    const targetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
    const camTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 75));
    const isAnimating = useRef(false);

    useEffect(() => {
        if (resetFlag > 0) {
            targetRef.current.set(0, 0, 0);
            camTargetRef.current.set(0, 0, distancia);
            isAnimating.current = true;
        }
    }, [resetFlag]);   // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (targetPosition) {
            targetRef.current.copy(targetPosition);
            // Acercar la cámara a la posición (un poco alejado en el eje Z respecto al nodo)
            camTargetRef.current.copy(targetPosition).add(new THREE.Vector3(0, 0, 15));
            isAnimating.current = true;
        }
    }, [targetPosition]);

    useFrame((_, delta) => {
        if (isAnimating.current && controlsRef.current) {
            controlsRef.current.target.lerp(targetRef.current, delta * 4);
            camera.position.lerp(camTargetRef.current, delta * 4);
            controlsRef.current.update();
            
            // Detener animación si ya estamos cerca (el lerp es exponencial: con 0.1 tarda segundos en "llegar" sin que se note)
            if (controlsRef.current.target.distanceTo(targetRef.current) < 0.5 && camera.position.distanceTo(camTargetRef.current) < 0.5) {
                isAnimating.current = false;
            }
        }
    });

    return (
        <OrbitControls 
            ref={controlsRef}
            onStart={() => { isAnimating.current = false; }} // si el usuario toca la cámara, manda él: se cancela el recentrado
            enablePan={true}
            enableZoom={true} 
            enableRotate={true}
            maxDistance={250}
            minDistance={0.5}
        />
    );
};

export default function Universe() {
    const [resetCamera, setResetCamera] = useState(0);
    // Tipo de concepto del Prompt Maestro (automático, formal, histórico o teórico): se recuerda en este ordenador.
    const [modoPrompt, setModoPrompt] = useState<ModoPrompt>(() => modoGuardado());
    const cambiarModoPrompt = (m: ModoPrompt) => { setModoPrompt(m); guardarModo(m); };
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [realNodes, setRealNodes] = useState<any[]>([]);
    const [realLinks, setRealLinks] = useState<any[]>([]);
    
    // Estados para el Inyector Neuronal
    const [showInjector, setShowInjector] = useState(false);
    const [showAjustes, setShowAjustes] = useState(false);
    const [showAgenda, setShowAgenda] = useState(false);
    const [showPapelera, setShowPapelera] = useState(false);
    const [showTutorial, setShowTutorial] = useState(() => !tutorialVisto());   // la primera vez que se abre la app
    const [injectionData, setInjectionData] = useState('');
    const [injectionStatus, setInjectionStatus] = useState('');
    const [procesando, setProcesando] = useState<EstadoProceso | null>(null);   // asimilando una neurona: se enseña el pilar girando

    const cerrarInyector = () => { setShowInjector(false); setInjectionStatus(''); setInjectionData(''); };

    // Solo se actualiza el estado si cambió algo que se dibuja (ids, clústeres, nombres, conexiones y su estado), para que React
    // Three Fiber no recalcule la geometría cada 5 s. Antes se comparaba solo el NÚMERO de neuronas y conexiones: cambiar de clúster
    // una neurona, aceptar/rechazar una conexión o recibir de otro PC una neurona a la vez que se borraba otra no se veía hasta pulsar Recargar.
    const firmaActual = useRef('');
    const aplicarUniverso = (data: any, forzar = false) => {
        const nodos = Array.isArray(data?.nodes) ? data.nodes : null, aristas = Array.isArray(data?.links) ? data.links : null;
        if (!nodos || !aristas) return;
        const firma = firmaUniverso(nodos, aristas);
        if (!forzar && firma === firmaActual.current) return;
        firmaActual.current = firma;
        setRealNodes(nodos);
        setRealLinks(aristas);
    };
    const loadData = () => {
        fetch(`${API}/api/universe?t=${Date.now()}`, { cache: "no-store" })
            .then(res => res.json())
            .then(data => aplicarUniverso(data))
            .catch(err => console.error("Error fetching universe:", err));
    };

    const recargar = (): Promise<void> =>
        fetch(`${API}/api/universe?t=${Date.now()}`, { cache: "no-store" })
            .then(res => res.json())
            .then(data => aplicarUniverso(data, true))
            .catch(err => console.error("Error fetching universe:", err));

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    // Búsqueda de conexiones de una neurona nueva: tarda ~1 min en segundo plano, así que se enseña el avance y el resultado.
    const [sinapsis, setSinapsis] = useState<{ activo: boolean; nodo: string | null; hecho: number; total: number } | null>(null);
    const [avisoSinapsis, setAvisoSinapsis] = useState<string | null>(null);
    const sinapsisActiva = useRef(false);
    useEffect(() => {
        let avisoTimer: number | undefined;
        const consultar = () => fetch(`${API}/api/sinapsis/estado`)
            .then(res => res.json())
            .then(e => {
                setSinapsis(e);
                if (sinapsisActiva.current && !e.activo) {
                    loadData();
                    setAvisoSinapsis(e.conexiones > 0
                        ? `✓ ${e.nodo}: ${e.conexiones} conexión(es) propuesta(s), pendientes de revisar`
                        : `${e.nodo}: sin conexiones nuevas`);
                    window.clearTimeout(avisoTimer);
                    avisoTimer = window.setTimeout(() => setAvisoSinapsis(null), 12000);
                }
                sinapsisActiva.current = e.activo;
            })
            .catch(() => { /* backend aún arrancando: se reintenta en el siguiente ciclo */ });
        consultar();
        const interval = setInterval(consultar, 2500);
        return () => { clearInterval(interval); window.clearTimeout(avisoTimer); };
    }, []);

    const clustersExistentes = useMemo(
        () => [...new Set<string>(realNodes.map(n => n.cluster_id).filter(c => c && c !== "Desconocido"))],
        [realNodes]
    );

    // ───── Subredes: etiquetas dentro de cada neurona; todas siguen en la red general (ver backend/subredes.py) ─────
    const [subredActiva, setSubredActiva] = useState<string | null>(() => subredActivaGuardada());
    const [vacias, setVacias] = useState<string[]>(() => vaciasGuardadas());     // las que acabas de crear y aún no tienen neuronas: solo existen en este PC
    const [vista, setVista] = useState<Vista>(VISTA_GENERAL);                      // lo que se dibuja: la general o una subred con su disposición ya calculada
    const [calculando, setCalculando] = useState(false);
    const [showSubredes, setShowSubredes] = useState(false);
    const subredes = useMemo(() => listarSubredes(realNodes, vacias), [realNodes, vacias]);
    const nodosVisibles = useMemo(() => (subredActiva ? realNodes.filter(n => esMiembro(n, subredActiva)) : realNodes), [realNodes, subredActiva]);
    const enlacesVisibles = useMemo(() => {
        if (!subredActiva) return realLinks;
        const ids = new Set(nodosVisibles.map(n => n.id));
        return realLinks.filter(l => ids.has(l.origen_id) && ids.has(l.destino_id));
    }, [realLinks, nodosVisibles, subredActiva]);
    const firmaRed = useMemo(() => (subredActiva ? JSON.stringify([nodosVisibles.map(n => n.id).sort(), enlacesVisibles.map(l => [l.origen_id, l.destino_id]).sort()]) : ''), [nodosVisibles, enlacesVisibles, subredActiva]);

    const elegirSubred = (nombre: string | null) => {
        setSubredActiva(nombre);
        guardarSubredActiva(nombre);
        const abierta = realNodes.find(n => n.id === activeNodeId);
        if (nombre && abierta && !esMiembro(abierta, nombre)) setActiveNodeId(null);   // la neurona abierta no está en la red a la que vas
    };

    // Una subred que ya no existe (la borraste desde otro PC) devuelve a la general; si cambió la grafía (renombrada a una ya existente), se adopta la que hay
    useEffect(() => {
        if (!subredActiva || realNodes.length === 0) return;
        const real = subredes.find(s => mismaSubred(s.nombre, subredActiva));
        if (!real) elegirSubred(null);
        else if (real.nombre !== subredActiva) { setSubredActiva(real.nombre); guardarSubredActiva(real.nombre); }
    }, [subredes, subredActiva, realNodes.length === 0]);   // eslint-disable-line react-hooks/exhaustive-deps

    // La disposición de la subred se calcula fuera del hilo principal; hasta que está lista se sigue viendo la red anterior
    useEffect(() => {
        if (!subredActiva) { setVista(v => (v.nombre === null ? v : VISTA_GENERAL)); setCalculando(false); return; }
        if (realNodes.length === 0) return;
        let vigente = true;
        const poner = (layout: Vista['layout']) => { if (vigente) { setVista({ nombre: subredActiva, layout, color: colorSubred(subredActiva) }); setCalculando(false); } };
        const ids = nodosVisibles.map(n => String(n.id));
        if (ids.length === 0) { poner({}); return () => { vigente = false; }; }
        setCalculando(true);
        calcularDisposicion(subredActiva, ids, enlacesVisibles.map(l => [l.origen_id, l.destino_id] as [string, string]))
            .then(poner).catch(() => { if (vigente) setCalculando(false); });
        return () => { vigente = false; };
    }, [subredActiva, firmaRed, realNodes.length === 0]);   // eslint-disable-line react-hooks/exhaustive-deps

    // Al cambiar de red la cámara se recoloca para encuadrarla (el centro es siempre el origen: el universo gira alrededor de él)
    const distanciaCamara = useMemo(() => {
        if (!vista.layout || vista.nombre === null) return 75;
        const radio = Math.max(0, ...Object.values(vista.layout).map(p => Math.hypot(p[0], p[1], p[2])));
        return Math.max(25, radio * 2.4 + 12);
    }, [vista]);
    const primeraVista = useRef(true);
    useEffect(() => {
        if (primeraVista.current) { primeraVista.current = false; return; }
        setResetCamera(prev => prev + 1);
    }, [vista]);

    const crearSubred = (nombre: string) => {
        const n = normalizarNombre(nombre);
        if (!n || subredes.some(s => mismaSubred(s.nombre, n))) return;
        const v = [...vacias, n];
        setVacias(v); guardarVacias(v);
    };
    const renombrar = async (viejo: string, nuevo: string) => {
        const n = normalizarNombre(nuevo);
        if (!n) throw new Error('El nombre de la subred no puede estar vacío.');
        await renombrarSubred(viejo, n);
        renombrarDisposicion(viejo, n);
        const v = vacias.map(x => (mismaSubred(x, viejo) ? n : x));
        setVacias(v); guardarVacias(v);
        if (subredActiva && mismaSubred(subredActiva, viejo)) elegirSubred(n);
        await recargar();
    };
    const borrarSubredes = async (nombre: string) => {
        await borrarSubred(nombre);
        const v = vacias.filter(x => !mismaSubred(x, nombre));
        setVacias(v); guardarVacias(v);
        if (subredActiva && mismaSubred(subredActiva, nombre)) elegirSubred(null);
        await recargar();
    };
    /** Añade `añadir` y quita `quitar` (nombres de subred) a esas neuronas, y repinta. */
    const cambiarSubredes = async (ids: string[], añadir: string[], quitar: string[]) => {
        if (ids.length && (añadir.length || quitar.length)) await asignarSubredes(ids, añadir, quitar);
        await recargar();
    };
    const guardarMiembros = async (subred: string, añadir: string[], quitar: string[]) => {
        if (añadir.length) await asignarSubredes(añadir, [subred], []);
        if (quitar.length) await asignarSubredes(quitar, [], [subred]);
        await recargar();
    };

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const normalizeStr = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const q = normalizeStr(searchQuery);
        
        const results = [];
        for (const node of nodosVisibles) {
            const name = normalizeStr(node.nombre || "");
            const cluster = normalizeStr(node.cluster_id || "");
            
            if (name.includes(q)) {
                results.push({ node, type: 'Exacto', score: 100 });
                continue;
            }
            if (cluster.includes(q)) {
                results.push({ node, type: 'Relacionado', score: 50 });
                continue;
            }
            
            let glosarioTermsOnly = "";
            if (typeof node.glosario === 'string') {
                try { glosarioTermsOnly = JSON.parse(node.glosario).map((g: any) => g.termino).join(" "); } catch(e) {}
            } else if (Array.isArray(node.glosario)) { glosarioTermsOnly = node.glosario.map((g: any) => g.termino).join(" "); }
            
            if (normalizeStr(glosarioTermsOnly).includes(q)) {
                results.push({ node, type: 'En Glosario', score: 10 });
            }
        }
        return results.sort((a, b) => b.score - a.score).slice(0, 8);
    }, [searchQuery, nodosVisibles]);

    return (
        <div style={{ position: 'absolute', inset: 0, background: '#000000', overflow: 'hidden' }}>
            <Canvas camera={{ position: [0, 0, 75], fov: 50 }}>
                <color attach="background" args={['#020005']} />
                <fog attach="fog" args={['#020005', 30, 150]} />
                
                <ambientLight intensity={0.5} />
                
                <BiologicalWeb
                    onNodeClick={setActiveNodeId}
                    searchQuery={searchQuery}
                    realNodes={realNodes}
                    realLinks={realLinks}
                    vista={vista}
                />

                <CameraController resetFlag={resetCamera} targetPosition={null} distancia={distanciaCamara} />

                <EffectComposer>
                    {/* Bloom sutil para que imite la fluorescencia del microscopio */}
                    <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.2} mipmapBlur />
                    <Vignette eskil={false} offset={0.1} darkness={1.1} />
                </EffectComposer>
            </Canvas>

            <Hud
                busqueda={searchQuery}
                onBusqueda={setSearchQuery}
                resultados={searchResults}
                onElegir={setActiveNodeId}
                nodos={nodosVisibles.length}
                aristas={enlacesVisibles.length}
                subredes={subredes}
                subredActiva={subredActiva}
                calculando={calculando}
                onSubred={elegirSubred}
                onGestionar={() => setShowSubredes(true)}
                sinapsis={sinapsis}
                aviso={avisoSinapsis}
                onAjustes={() => setShowAjustes(true)}
                onAgenda={() => setShowAgenda(true)}
                onPapelera={() => setShowPapelera(true)}
                onRecargar={() => {
                    fetch(`${API}/api/universe?t=${Date.now()}`, { cache: "no-store" })
                        .then(res => res.json())
                        .then(data => aplicarUniverso(data, true))   // [ Recargar ] repinta siempre (las posiciones no cambian)
                        .catch(err => console.error("Error fetching universe:", err));
                }}
                onInyector={() => setShowInjector(true)}
                onCentrar={() => setResetCamera(prev => prev + 1)}
            />

            {/* Modal de Inyección de Neuronas */}
            {showInjector && (
                <Modal ancho={660} z={50}>
                    <Cabecera titulo="Sintetizador de nodos" onCerrar={procesando ? undefined : cerrarInyector} />
                    {procesando && <ProcesandoNeurona p={procesando} />}
                    {/* Mientras se procesa solo se ve el pilar: el formulario se oculta */}
                    <div style={{ display: procesando ? 'none' : 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--t-suave)', fontSize: 13 }}>
                            <span>Tipo de concepto del prompt:</span>
                            <select className="t-campo" value={modoPrompt} onChange={(e) => cambiarModoPrompt(e.target.value as ModoPrompt)} style={{ padding: 5 }}>
                                {MODOS_PROMPT.map(m => <option key={m.id} value={m.id}>{m.etiqueta}</option>)}
                            </select>
                            <span style={{ lineHeight: 1.5 }}>{MODOS_PROMPT.find(m => m.id === modoPrompt)?.ayuda}</span>
                        </label>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button
                                className="t-btn"
                                onClick={(e) => {
                                    const btn = e.currentTarget;
                                    copyToClipboard(conClustersExistentes(promptFuentes(modoPrompt), clustersExistentes));
                                    const originalText = btn.innerText;
                                    btn.innerText = "[ ¡Copiado! ]";
                                    setTimeout(() => { btn.innerText = originalText; }, 2000);
                                }}
                            >
                                [ Copiar: Fuentes (doctorado) ]
                            </button>
                            <button
                                className="t-btn"
                                onClick={(e) => {
                                    const btn = e.currentTarget;
                                    copyToClipboard(conClustersExistentes(promptExploracion(modoPrompt), clustersExistentes));
                                    const originalText = btn.innerText;
                                    btn.innerText = "[ ¡Copiado! ]";
                                    setTimeout(() => { btn.innerText = originalText; }, 2000);
                                }}
                            >
                                [ Copiar: Exploración libre ]
                            </button>
                        </div>

                        <p style={{ color: 'var(--t-suave)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                            Pega aquí la respuesta cruda en JSON (o bloque markdown) generada por tu Prompt Maestro. El núcleo lo asimilará y reconfigurará la red neuronal.
                        </p>

                        {subredActiva && <p style={{ margin: 0, fontSize: 12, color: 'var(--t-ambar)' }}>Estás en la subred «{subredActiva}»: la neurona nueva entrará en ella y en la red general.</p>}

                        <textarea
                            className="t-input"
                            value={injectionData}
                            onChange={(e) => setInjectionData(e.target.value)}
                            placeholder='{"id": "nuevo_concepto", "nombre": "...", "teoria": "..."}'
                            style={{ width: '100%', height: 300, border: '1px solid var(--t-linea)', background: 'rgba(0,0,0,0.5)', color: 'var(--t-verde)', padding: 14, resize: 'none' }}
                        />

                        {injectionStatus && (
                            <div style={{ color: injectionStatus.includes('Error') ? 'var(--t-error)' : 'var(--t-verde)', fontSize: 13 }}>
                                {injectionStatus}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button className="t-btn plano" onClick={cerrarInyector}>
                                [ Cancelar ]
                            </button>
                            <button 
                                onClick={async () => {
                                    setInjectionStatus('');
                                    setProcesando({ fase: 'guardando', nodo: '', hecho: 0, total: 0, conexiones: 0 });
                                    try {
                                        const res = await fetch(`${API}/api/node`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ raw_json: injectionData, subred: subredActiva })
                                        });
                                        const result = await res.json();
                                        if (!res.ok) {
                                            setProcesando(null);
                                            setInjectionStatus(`Error: ${result.detail}`);
                                            return;
                                        }
                                        // Las conexiones se buscan en segundo plano (~1 min por neurona): se enseña el avance hasta que acaben.
                                        const consultar = () => fetch(`${API}/api/sinapsis/estado`).then(r => r.json()).catch(() => null);
                                        const limite = Date.now() + 10 * 60 * 1000;
                                        let e = await consultar();
                                        while (e?.activo && Date.now() < limite) {
                                            setProcesando({ fase: 'conexiones', nodo: e.nodo ?? '', hecho: e.hecho, total: e.total, conexiones: 0 });
                                            await new Promise(r => setTimeout(r, 700));
                                            e = await consultar() ?? e;
                                        }
                                        setProcesando({ fase: 'listo', nodo: e?.nodo ?? '', hecho: e?.total ?? 0, total: e?.total ?? 0, conexiones: e?.conexiones ?? 0 });
                                        setTimeout(() => window.location.reload(), 2200);
                                    } catch (e: any) {
                                        setProcesando(null);
                                        setInjectionStatus(`Error de conexión: ${e.message}`);
                                    }
                                }}
                                className="t-btn principal"
                            >
                                [ Asimilar neurona ]
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {showAjustes && <Ajustes onCerrar={() => setShowAjustes(false)} onTutorial={() => { setShowAjustes(false); setShowTutorial(true); }} />}
            {showAgenda && <Agenda onCerrar={() => setShowAgenda(false)} />}
            {showPapelera && <Papelera onCerrar={() => setShowPapelera(false)} onCambio={recargar} />}
            {showSubredes && <GestionSubredes subredes={subredes} nodos={realNodes} onCrear={crearSubred} onRenombrar={renombrar} onBorrar={borrarSubredes}
                onGuardarMiembros={guardarMiembros} onCerrar={() => setShowSubredes(false)} />}
            {showTutorial && <Tutorial onCerrar={() => setShowTutorial(false)} />}

            {subredActiva && !calculando && realNodes.length > 0 && nodosVisibles.length === 0 && (
                <div className="t-marco" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', padding: '18px 24px', maxWidth: 420, textAlign: 'center', lineHeight: 1.6, fontSize: 13, zIndex: 5 }}>
                    <div style={{ color: 'var(--t-verde)' }}>&gt; «{subredActiva}» está vacía</div>
                    <div style={{ color: 'var(--t-suave)', marginTop: 6 }}>Vuelve a la red general y, en el panel de una neurona, márcala en «Subredes»; o usa «gestionar subredes…» → [ Neuronas ] para elegir varias a la vez.</div>
                </div>
            )}

            {/* Panel de Conocimiento Desplegable */}
            <KnowledgePanel 
                nodeId={activeNodeId} 
                onClose={() => setActiveNodeId(null)} 
                universeNodes={nodosVisibles}
                universeLinks={enlacesVisibles}
                todosLosEnlaces={realLinks}
                subredes={subredes}
                subredActiva={subredActiva}
                onSubredes={cambiarSubredes}
            />
        </div>
    );
}
