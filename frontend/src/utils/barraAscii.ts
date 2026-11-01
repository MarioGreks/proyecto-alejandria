/** Barra de progreso con caracteres: `[#######.............]  35%` (20 posiciones por defecto). */
export const barraAscii = (porcentaje: number, largo = 20): string => {
    const p = Math.max(0, Math.min(100, Math.round(porcentaje)));
    const llenos = Math.round((p / 100) * largo);
    return `[${'#'.repeat(llenos)}${'.'.repeat(largo - llenos)}] ${String(p).padStart(3)}%`;
};
