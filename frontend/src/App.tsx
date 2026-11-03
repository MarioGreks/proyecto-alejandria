import { useEffect, useState } from 'react';
import './App.css';
import Universe from './components/Universe';
import Arranque from './components/Arranque';
import Actualizacion from './components/Actualizacion';
import BarraTitulo from './components/BarraTitulo';
import { openUrl } from '@tauri-apps/plugin-opener';

function App() {
  const [listo, setListo] = useState(false);

  useEffect(() => {
    // Interceptor global para que cualquier enlace externo (http/https)
    // se abra siempre en el navegador predeterminado del sistema operativo
    // en lugar de navegar dentro de la ventana de la aplicación.
    const handleGlobalClick = async (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (target && target.href && (target.href.startsWith('http://') || target.href.startsWith('https://'))) {
        e.preventDefault();
        try {
          await openUrl(target.href);
        } catch {
          window.open(target.href, '_blank', 'noopener,noreferrer');
        }
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <main className="container">
      <BarraTitulo />
      <div className="contenido">
        {/* Hasta que el backend responda se enseña la pantalla de arranque (la primera vez prepara Python y las librerías) */}
        {listo ? <><Universe /><Actualizacion /></> : <Arranque onListo={() => setListo(true)} />}
      </div>
    </main>
  );
}

export default App;
