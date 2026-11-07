// Mensaje legible de una respuesta de error del backend. FastAPI devuelve `detail` como texto (nuestros HTTPException) o como lista de errores de validación
// de pydantic (422): de esa lista se enseñan los mensajes, sin el «Value error, » que antepone pydantic a los de nuestros validadores.
export async function errorDe(res: { status: number; json: () => Promise<any> }): Promise<string> {
    const cuerpo = await res.json().catch(() => null);
    const d = cuerpo?.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d) && d.length) {
        return d.map((e: any) => {
            const campo = Array.isArray(e?.loc) ? e.loc.filter((x: unknown) => x !== 'body').join('.') : '';
            const msg = String(e?.msg ?? '').replace(/^Value error, /, '');
            return campo && !/^Value error/.test(String(e?.msg ?? '')) ? `${campo}: ${msg}` : msg;
        }).join(' ');
    }
    return `El servidor respondió ${res.status}`;
}
