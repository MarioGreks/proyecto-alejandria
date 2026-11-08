// Web Worker: calcula la disposición de una subred fuera del hilo principal (con unos miles de neuronas tarda 1-2 s y la interfaz no debe notarlo).
import { disponerSubred } from './distribucionSubred.ts';
import type { Vec3 } from './distribucionSubred.ts';

self.onmessage = (e: MessageEvent<{ id: number; ids: string[]; aristas: [string, string][]; previas: Record<string, Vec3> }>) => {
    const { id, ids, aristas, previas } = e.data;
    (self as unknown as Worker).postMessage({ id, res: disponerSubred(ids, aristas, previas) });
};
