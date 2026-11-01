// Cliente del worker de laboratorios: una cola simple, con tiempo máximo (si se pasa, se mata el worker y se arranca otro).

export interface ResultadoLab {
    resultado: any;            // { modo: 'datos', figuras, stdout } | { modo: 'imagen', motivo, imagenes?, error?, stdout }
    ms: number;                // tiempo dentro del worker (descarga de paquetes incluida)
    msPaquetes: number;        // parte de ese tiempo dedicada a cargar paquetes (>0 solo la primera vez que se importan)
}

interface Pendiente { ok: (r: ResultadoLab) => void; fallo: (e: Error) => void; ejecutando: () => void }

export class LabRunner {
    private worker!: Worker;
    private pendientes = new Map<number, Pendiente>();
    private contador = 0;
    listo!: Promise<Record<string, number>>;

    constructor() { this.arrancar(); }

    private arrancar() {
        this.worker = new Worker(new URL('./labWorker.ts', import.meta.url), { type: 'module' });
        this.listo = new Promise((ok, fallo) => {
            this.worker.onmessage = (e: MessageEvent) => {
                const m = e.data;
                if (m.tipo === 'listo') ok(m.tiempos);
                else if (m.tipo === 'ejecutando') this.pendientes.get(m.id)?.ejecutando();
                else if (m.tipo === 'resultado') { this.pendientes.get(m.id)?.ok(m); this.pendientes.delete(m.id); }
                else if (m.tipo === 'error') {
                    const e2 = new Error(m.mensaje);
                    if (m.id === undefined) fallo(e2); else { this.pendientes.get(m.id)?.fallo(e2); this.pendientes.delete(m.id); }
                }
            };
            this.worker.onerror = ev => fallo(new Error(ev.message));
        });
        this.listo.catch(() => { /* se informa en ejecutar(); aquí solo se evita el aviso de promesa sin tratar */ });
        this.worker.postMessage({ tipo: 'iniciar' });
    }

    /**
     * Ejecuta un laboratorio. El tiempo máximo `maxMs` empieza a contar cuando el código ya se está ejecutando (bajar scipy la primera vez no
     * cuenta, hasta `maxCargaMs`); si se pasa, se mata el worker (lo único que corta un bucle infinito de verdad) y se rechaza.
     */
    async ejecutar(codigo: string, maxMs = 3000, maxCargaMs = 60000): Promise<ResultadoLab> {
        try { await this.listo; } catch { this.reiniciar(); await this.listo; }      // un arranque fallido (sin red...) se reintenta una vez
        const id = ++this.contador;
        return new Promise<ResultadoLab>((ok, fallo) => {
            let temporizador: ReturnType<typeof setTimeout>;
            const armar = (ms: number, mensaje: string) => {
                clearTimeout(temporizador);
                temporizador = setTimeout(() => { this.pendientes.delete(id); this.reiniciar(); fallo(new Error(mensaje)); }, ms);
            };
            armar(maxCargaMs, `No se pudieron cargar las librerías del laboratorio en ${maxCargaMs / 1000} s.`);
            this.pendientes.set(id, {
                ok: r => { clearTimeout(temporizador); ok(r); },
                fallo: e => { clearTimeout(temporizador); fallo(e); },
                ejecutando: () => armar(maxMs, `El laboratorio tardó más de ${maxMs / 1000} s y se detuvo.`),
            });
            this.worker.postMessage({ tipo: 'ejecutar', id, codigo });
        });
    }

    reiniciar() {
        this.worker.terminate();
        this.pendientes.forEach(p => p.fallo(new Error('Worker reiniciado')));
        this.pendientes.clear();
        this.arrancar();
    }
}

// Un único motor para toda la app: Pyodide tarda ~3 s en arrancar y ocupa memoria, así que se crea una vez y se comparte.
let compartido: LabRunner | null = null;
export const obtenerRunner = (): LabRunner => (compartido ??= new LabRunner());

/** Arranca el motor en segundo plano (p. ej. al abrir un nodo) para que el laboratorio esté listo cuando se pida. */
export const precalentarLaboratorios = (): void => { obtenerRunner(); };
