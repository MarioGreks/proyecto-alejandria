import { useRef, useMemo, useEffect, useState } from 'react';
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
import ProcesandoNeurona from './ProcesandoNeurona';
import Seguro from './Seguro';
import Hud from './Hud';
import { Cabecera, Modal } from './terminal';
import type { EstadoProceso } from './ProcesandoNeurona';
import Tutorial, { tutorialVisto } from './Tutorial';
import { casillasRecordadas, centroDeCasilla, firmaUniverso, posicionesRecordadas, rngDe } from '../utils/disposicion';
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

const RotulosCercanos = ({ nodes, nombres, grupo, ocultar }: { nodes: THREE.Vector3[], nombres: string[], grupo: React.RefObject<THREE.Group | null>, ocultar: number | null }) => {
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
        for (let i = 0; i < nodes.length; i++) {
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

const BiologicalWeb = ({ onNodeClick, searchQuery, realNodes, realLinks }: { onNodeClick: (id: string) => void, searchQuery: string, realNodes: any[], realLinks: any[], activeNodeId: string | null, onTargetFound: (pos: THREE.Vector3 | null) => void }) => {
    const baseColors = [
        new THREE.Color('#33ff00'), 
        new THREE.Color('#ff3300'), 
        new THREE.Color('#00ccff'), 
        new THREE.Color('#ff00aa'),
        new THREE.Color('#ffff00'),
        new THREE.Color('#ff00ff'),
        new THREE.Color('#00ffff')
    ];

    const { nodes, lineGeometry, nodeColors, clusterCenters, nodeIds, clusterKeys, totalNodes, originalLineColors, lineNodeIndices } = useMemo(() => {
        if (realNodes.length === 0) {
            return {
                nodes: [], lineGeometry: new THREE.BufferGeometry(),
                nodeColors: new Float32Array(0), clusterCenters: [], nodeIds: [], clusterKeys: [], totalNodes: 0,
                originalLineColors: new Float32Array(0), lineNodeIndices: []
            };
        }

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
        const allNodes: THREE.Vector3[] = [];
        const totalNodes = realNodes.length;
        const colors = new Float32Array(totalNodes * 3);
        const ids: string[] = [];

        let globalIdx = 0;

        clusterKeys.forEach((cId, idx) => {
            const center = clusterCenters[idx];
            const cNodes = [...clusterMap.get(cId)!].sort((a, b) => String(a.id).localeCompare(String(b.id)));
            const color = baseColors[casillas[cId] % baseColors.length];

            cNodes.forEach((node) => {
                const d = desplazamientos[String(node.id)];
                allNodes.push(new THREE.Vector3(center.x + d[0], center.y + d[1], center.z + d[2]));
                colors[globalIdx * 3] = color.r;
                colors[globalIdx * 3 + 1] = color.g;
                colors[globalIdx * 3 + 2] = color.b;
                ids.push(node.id);
                globalIdx++;
            });
        });
        
        const linePositions: number[] = [];
        const lineColors: number[] = [];
        const lineNodeIndices: number[] = [];
        
        for (let i = 0; i < totalNodes; i++) {
            const baseColor = new THREE.Color(colors[i*3], colors[i*3+1], colors[i*3+2]);

            const rnd = rngDe(`d:${ids[i]}`);
            const numPrimaryDendrites = 2 + Math.floor(rnd() * 2);
            for (let d = 0; d < numPrimaryDendrites; d++) {
                const dir = new THREE.Vector3(rnd()-0.5, rnd()-0.5, rnd()-0.5).normalize();
                const initialLength = 0.5 + rnd() * 1.0;
                generateDendriteTree(allNodes[i], dir, initialLength, 0, 2, baseColor, linePositions, lineColors, i, lineNodeIndices, rnd);
            }
        }
        
        // Conexiones Reales (Aristas de la BD RAG)
        if (realLinks && realLinks.length > 0) {
            for (const link of realLinks) {
                const idxA = ids.indexOf(link.origen_id);
                const idxB = ids.indexOf(link.destino_id);
                
                if (idxA === -1 || idxB === -1) {
                    console.warn(`Enlace fallido: ${link.origen_id} (${idxA}) -> ${link.destino_id} (${idxB})`);
                }
                
                if (idxA !== -1 && idxB !== -1) {
                    const baseColor = new THREE.Color(colors[idxA*3], colors[idxA*3+1], colors[idxA*3+2]);
                    const tColor = new THREE.Color(colors[idxB*3], colors[idxB*3+1], colors[idxB*3+2]);
                    
                    const dir = new THREE.Vector3().subVectors(allNodes[idxB], allNodes[idxA]);
                    const dist = dir.length();
                    dir.normalize();
                    
                    const perp = new THREE.Vector3(1,0,0).cross(dir);
                    if(perp.lengthSq() < 0.1) perp.set(0,1,0).cross(dir);
                    perp.normalize();
                    const rnd = rngDe(`l:${link.origen_id}>${link.destino_id}`);   // cada conexión, siempre con la misma curva
                    perp.applyAxisAngle(dir, rnd() * Math.PI * 2);

                    const midPoint = new THREE.Vector3().addVectors(allNodes[idxA], allNodes[idxB]).multiplyScalar(0.5);
                    const arcHeight = dist * (0.2 + rnd() * 0.2);
                    midPoint.add(perp.multiplyScalar(arcHeight));
                    
                    addSmoothCurve(allNodes[idxA], allNodes[idxB], midPoint, baseColor, tColor, linePositions, lineColors, 12, idxA, lineNodeIndices);
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        if (linePositions.length > 0) {
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
        }

        const originalLineColors = new Float32Array(lineColors);

        return { nodes: allNodes, lineGeometry: geometry, nodeColors: colors, clusterCenters, nodeIds: ids, clusterKeys, totalNodes, originalLineColors, lineNodeIndices };
    }, [realNodes, realLinks]);

    const meshRef = useRef<THREE.InstancedMesh>(null);
    const groupRef = useRef<THREE.Group>(null);
    const nombres = useMemo(() => { const porId = new Map(realNodes.map(n => [n.id, String(n.nombre ?? '')])); return nodeIds.map(id => porId.get(id) ?? ''); }, [realNodes, nodeIds]);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    useEffect(() => {
        if (meshRef.current && totalNodes > 0) {
            const dummy = new THREE.Object3D();
            const query = searchQuery ? searchQuery.toLowerCase() : "";
            
            const nodeMatched = new Array(totalNodes).fill(true);

            nodes.forEach((pos, i) => {
                dummy.position.copy(pos);
                const rnd = rngDe(`s:${nodeIds[i]}`);   // tamaño y giro de cada soma: fijos (antes cambiaban con cada letra de la búsqueda)
                let scaleVal = 0.2 + rnd() * 0.1;
                
                const realNode = realNodes.find(n => n.id === nodeIds[i]);
                const nodeName = realNode ? realNode.nombre || "" : "";
                const clusterId = realNode ? realNode.cluster_id || "" : "";

                let glosarioTermsOnly = "";
                if (realNode && typeof realNode.glosario === 'string') {
                    try { glosarioTermsOnly = JSON.parse(realNode.glosario).map((g: any) => g.termino).join(" "); } 
                    catch(e) {}
                } else if (realNode && Array.isArray(realNode.glosario)) {
                    glosarioTermsOnly = realNode.glosario.map((g: any) => g.termino).join(" ");
                }

                // El núcleo siempre es blanco en estado normal (como pidió el usuario)
                let r = 1.0;
                let g = 1.0;
                let b = 1.0;
                
                let isMatch = true;
                
                if (query) {
                    const normalizeStr = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                    const q = normalizeStr(query);
                    
                    if (q.length < 3) {
                        const regex = new RegExp(`\\b${q}`, 'i');
                        isMatch = regex.test(normalizeStr(nodeName)) || regex.test(normalizeStr(clusterId));
                    } else {
                        // Búsqueda profunda pero RESTRICTIVA: solo Título, Categoría, y Términos del Glosario (NO la teoría gigante)
                        const searchStr = normalizeStr(`${nodeName} ${clusterId} ${glosarioTermsOnly}`);
                        isMatch = searchStr.includes(q);
                    }
                    
                    if (!isMatch) {
                        // Neuronas fantasma
                        r = 0.05; g = 0.05; b = 0.05;
                    } else {
                        // Neuronas activas súper brillantes (Bloom blanco)
                        r = 2.5; g = 2.5; b = 2.5;
                    }
                }
                
                nodeMatched[i] = isMatch;
                
                dummy.scale.set(scaleVal, scaleVal, scaleVal);
                dummy.rotation.set(rnd()*Math.PI, rnd()*Math.PI, rnd()*Math.PI);
                dummy.updateMatrix();
                meshRef.current!.setMatrixAt(i, dummy.matrix);
                
                meshRef.current!.setColorAt(i, new THREE.Color(r, g, b));
            });
            meshRef.current.instanceMatrix.needsUpdate = true;
            if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
            
            // Actualizar el color de los bracitos individualmente
            if (lineGeometry && originalLineColors && lineNodeIndices) {
                const colorAttr = lineGeometry.getAttribute('color') as THREE.BufferAttribute;
                if (colorAttr) {
                    const colors = colorAttr.array as Float32Array;
                    for (let v = 0; v < lineNodeIndices.length; v++) {
                        const nIdx = lineNodeIndices[v];
                        if (query && !nodeMatched[nIdx]) {
                            colors[v * 3] = 0.05;
                            colors[v * 3 + 1] = 0.05;
                            colors[v * 3 + 2] = 0.05;
                        } else {
                            colors[v * 3] = originalLineColors[v * 3];
                            colors[v * 3 + 1] = originalLineColors[v * 3 + 1];
                            colors[v * 3 + 2] = originalLineColors[v * 3 + 2];
                        }
                    }
                    colorAttr.needsUpdate = true;
                }
            }
            
            // IMPORTANTE: Recalcular la esfera límite para que funcione el Raycaster y los clicks
            if (meshRef.current.computeBoundingSphere) {
                meshRef.current.computeBoundingSphere();
            } else if (meshRef.current.geometry) {
                meshRef.current.geometry.computeBoundingSphere();
            }
        }
    }, [nodes, nodeColors, searchQuery, totalNodes, realNodes, nodeIds]);

    // Efecto desactivado a petición del usuario: ya no hace zoom al hacer click
    // useEffect(() => {
    //     if (activeNodeId) {
    //         const idx = nodeIds.indexOf(activeNodeId);
    //         if (idx !== -1) {
    //             const pos = nodes[idx].clone();
    //             onTargetFound(pos);
    //         }
    //     }
    // }, [activeNodeId, nodeIds, nodes, onTargetFound]);

    useFrame((state) => {
        if (groupRef.current) {
            const time = state.clock.getElapsedTime();
            groupRef.current.rotation.y = time * 0.03;
            groupRef.current.rotation.x = Math.sin(time * 0.01) * 0.05;
        }
    });

    return (
        <group ref={groupRef}>
            {totalNodes > 0 && (
                <lineSegments geometry={lineGeometry}>
                    <lineBasicMaterial 
                        vertexColors 
                        transparent 
                        opacity={0.4} 
                        blending={THREE.AdditiveBlending} 
                        depthWrite={false}
                    />
                </lineSegments>
            )}

            {totalNodes > 0 && (
                <instancedMesh 
                    ref={meshRef} 
                    args={[undefined, undefined, totalNodes]}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (e.instanceId !== undefined) {
                            const realId = nodeIds[e.instanceId];
                            onNodeClick(realId);
                        }
                    }}
                    onPointerMove={(e) => {
                        e.stopPropagation();
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
                    <meshBasicMaterial 
                        toneMapped={false}
                        transparent
                        opacity={1.0}
                    />
                </instancedMesh>
            )}

            {hoveredIdx !== null && nodes[hoveredIdx] && (
                (() => {
                    const hoveredNode = realNodes.find(n => n.id === nodeIds[hoveredIdx]);
                    if (!hoveredNode) return null;
                    return (
                        <Html position={nodes[hoveredIdx]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
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
                })()
            )}

            {totalNodes > 0 && <RotulosCercanos nodes={nodes} nombres={nombres} grupo={groupRef} ocultar={hoveredIdx} />}

            {totalNodes > 0 && clusterCenters.map((center, idx) => (
                <Seguro key={idx}><Billboard position={[center.x, center.y + 3.5, center.z]} follow={true}>
                    <Text
                        font={fuenteRotulos}
                        fontSize={0.9}
                        letterSpacing={0.05}
                        color="#5fbf9f"
                        material-toneMapped={false}
                    >
                        [ {clusterKeys[idx].toUpperCase()} ]
                    </Text>
                </Billboard></Seguro>
            ))}
        </group>
    );
};

import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

const CameraController = ({ resetFlag, targetPosition }: { resetFlag: number, targetPosition: THREE.Vector3 | null }) => {
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const { camera } = useThree();

    const targetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
    const camTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 75));
    const isAnimating = useRef(false);

    useEffect(() => {
        if (resetFlag > 0) {
            targetRef.current.set(0, 0, 0);
            camTargetRef.current.set(0, 0, 75);
            isAnimating.current = true;
        }
    }, [resetFlag]);

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
    const [targetNodePosition, setTargetNodePosition] = useState<THREE.Vector3 | null>(null);
    
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

    const recargar = () => {
        fetch(`${API}/api/universe?t=${Date.now()}`, { cache: "no-store" })
            .then(res => res.json())
            .then(data => aplicarUniverso(data, true))
            .catch(err => console.error("Error fetching universe:", err));
    };

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

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const normalizeStr = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const q = normalizeStr(searchQuery);
        
        const results = [];
        for (const node of realNodes) {
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
    }, [searchQuery, realNodes]);

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
                    activeNodeId={activeNodeId}
                    onTargetFound={setTargetNodePosition}
                />
                
                <CameraController resetFlag={resetCamera} targetPosition={targetNodePosition} />

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
                nodos={realNodes.length}
                aristas={realLinks.length}
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
                                            body: JSON.stringify({ raw_json: injectionData })
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
            {showTutorial && <Tutorial onCerrar={() => setShowTutorial(false)} />}

            {/* Panel de Conocimiento Desplegable */}
            <KnowledgePanel 
                nodeId={activeNodeId} 
                onClose={() => setActiveNodeId(null)} 
                universeNodes={realNodes}
                universeLinks={realLinks}
            />
        </div>
    );
}
