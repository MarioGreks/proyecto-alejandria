// Dirección del backend. Por defecto el puerto de siempre; si la app tuvo que arrancar el suyo en otro puerto (el 8000 estaba ocupado), `fijarPuerto` lo cambia
// antes de que nada pida datos. `API` es un `export let`: quien lo importa ve siempre el valor actual.
export let API = "http://localhost:8000";
export const fijarPuerto = (puerto: number): void => { API = `http://localhost:${puerto}`; };
