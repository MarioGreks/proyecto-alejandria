import { useEffect, useState } from 'react';
import { API } from '../utils/api';
import { errorDe } from '../utils/errorApi';
import { normalizarTipo, TIPOS_NEURONA } from '../utils/neurona';
import { Cabecera, Dialogo, Modal } from './terminal';

interface Item { id: string; nombre: string; cluster: string; tipo: string; fecha: string; dias_restantes: number; conexiones: number }
type Pendiente = { tipo: 'uno'; item: Item } | { tipo: 'todo' } | null;

/** Papelera de neuronas: restaurar (con sus conexiones) o borrar de verdad, una a una o todas. Las neuronas se borran solas a los `dias` días. */
export default function Papelera({ onCerrar, onCambio }: { onCerrar: () => void; onCambio: () => void }) {
    const [items, setItems] = useState<Item[] | null>(null);
    const [dias, setDias] = useState(7);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [pendiente, setPendiente] = useState<Pendiente>(null);

    const cargar = async () => {
        try {
            const res = await fetch(`${API}/api/papelera`);
            if (!res.ok) throw new Error(await errorDe(res));
            const j = await res.json();
            setItems(j.neuronas);
            setDias(j.dias);
        } catch (e: any) {
            setError(e?.message ?? 'No se pudo leer la papelera.');
            setItems(prev => prev ?? []);
        }
    };
    useEffect(() => { cargar(); }, []);

    const llamar = async (url: string, metodo: 'POST' | 'DELETE', ok: string) => {
        setError(''); setMensaje('');
        try {
            const res = await fetch(`${API}${url}`, { method: metodo });
            if (!res.ok) throw new Error(await errorDe(res));
            setMensaje(ok);
            await cargar();
            onCambio();      // el universo cambia: vuelve la neurona, o se pierde para siempre
        } catch (e: any) {
            setError(e?.message ?? 'No se pudo completar la acción.');
        }
    };

    const confirmar = () => {
        const p = pendiente;
        setPendiente(null);
        if (p?.tipo === 'uno') llamar(`/api/papelera/${p.item.id}`, 'DELETE', `«${p.item.nombre}» borrada para siempre.`);
        if (p?.tipo === 'todo') llamar('/api/papelera', 'DELETE', 'Papelera vaciada.');
    };

    const sigla = (t: string) => TIPOS_NEURONA.find(x => x.id === normalizarTipo(t))?.sigla ?? '?';
    const borrada = (f: string) => { const d = Math.floor((Date.now() - new Date(f).getTime()) / 86400000); return Number.isFinite(d) ? (d <= 0 ? 'hoy' : `hace ${d} d`) : '—'; };

    return (
        <Modal ancho={760} z={55}>
            <Cabecera titulo="Papelera" onCerrar={onCerrar} />
            <p style={{ margin: '12px 0', color: 'var(--t-suave)', fontSize: 12, lineHeight: 1.5 }}>
                Las neuronas que destruyes vienen aquí y se pueden restaurar con sus conexiones. A los {dias} días se borran solas. «Borrar para siempre» no tiene vuelta atrás
                (y, si usas la sincronización entre PCs, también las quita de los demás).
            </p>
            {mensaje && <div style={{ marginBottom: 10, color: 'var(--t-verde)', fontSize: 13 }}>{mensaje}</div>}
            {error && <div style={{ marginBottom: 10, color: 'var(--t-error)', fontSize: 13 }}>[ERROR] {error}</div>}

            {items === null ? <p>Leyendo la papelera...</p> : items.length === 0 ? (
                <div style={{ color: 'var(--t-suave)', padding: '24px 20px', border: '1px dashed var(--t-linea)', textAlign: 'center' }}>[ ] La papelera está vacía</div>
            ) : (<>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {items.map(it => (
                        <div key={it.id} style={{ padding: 12, border: '1px solid var(--t-linea)', borderLeft: '3px solid var(--t-ambar)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ color: 'var(--t-verde)', fontWeight: 700, wordBreak: 'break-word' }}><span title="Tipo de neurona" style={{ color: 'var(--t-ambar)' }}>[{sigla(it.tipo)}]</span> {it.nombre}</div>
                                <div style={{ color: 'var(--t-suave)', fontSize: 12, marginTop: 4 }}>
                                    {it.cluster || 'sin clúster'} · borrada {borrada(it.fecha)} · se borra sola en {it.dias_restantes} d · {it.conexiones} conexión(es) guardada(s)
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="t-btn" onClick={() => llamar(`/api/papelera/${it.id}/restaurar`, 'POST', `«${it.nombre}» restaurada.`)}>[ Restaurar ]</button>
                                <button className="t-btn peligro" onClick={() => setPendiente({ tipo: 'uno', item: it })}>[ Borrar para siempre ]</button>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="t-btn peligro" onClick={() => setPendiente({ tipo: 'todo' })}>[ Vaciar papelera ({items.length}) ]</button>
                </div>
            </>)}

            {pendiente && (
                <Dialogo titulo={pendiente.tipo === 'todo' ? 'Vaciar la papelera' : 'Borrar para siempre'} peligro aceptar={pendiente.tipo === 'todo' ? 'Vaciar' : 'Borrar'}
                    texto={pendiente.tipo === 'todo'
                        ? `Se borrarán de verdad las ${items?.length ?? 0} neuronas de la papelera, con sus conexiones. No se puede deshacer.`
                        : `«${pendiente.item.nombre}» se borrará de verdad, con sus ${pendiente.item.conexiones} conexión(es). No se puede deshacer.`}
                    onAceptar={confirmar} onCancelar={() => setPendiente(null)} />
            )}
        </Modal>
    );
}
