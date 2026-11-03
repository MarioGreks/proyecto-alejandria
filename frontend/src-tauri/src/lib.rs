// Arranque del backend de Alejandría: la primera vez descarga `uv` (verificado con sha256), con él instala Python y las dependencias en la
// carpeta de datos de la app, y después lanza el backend (uvicorn) y lo cierra al salir. Solo Windows: usa curl.exe, tar.exe y certutil,
// que vienen con Windows 10 y 11, para no añadir dependencias de Rust.
use std::fs;
use std::io::{BufRead, BufReader, Read};
use std::io::Write;
use std::net::{SocketAddr, TcpListener, TcpStream};
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, RunEvent, State};
use tauri_plugin_updater::UpdaterExt;

const UV_VERSION: &str = "0.13.6";
const UV_SHA256: &str = "a2a8820d5eea32f08ef467ef3b7f66883a9b076d5737a2fc2fbb5f458d1bb50f";
const PYTHON: &str = "3.13";
const PUERTO_PREFERIDO: u16 = 8000; // el de siempre (y el de `alejandria.bat`); si está ocupado por otro programa se usa uno libre
const SIN_VENTANA: u32 = 0x0800_0000; // CREATE_NO_WINDOW

#[derive(Clone, Serialize)]
struct Aviso {
    fase: &'static str, // uv | python | entorno | dependencias | backend | listo | error
    mensaje: String,
    progreso: u8, // 0-100
}

#[derive(Default)]
struct Estado {
    ocupado: Arc<Mutex<()>>, // una sola preparación a la vez (React puede llamar dos veces)
    hijo: Arc<Mutex<Option<Child>>>,
}

fn avisar(app: &AppHandle, fase: &'static str, mensaje: impl Into<String>, progreso: u8) {
    let _ = app.emit("arranque", Aviso { fase, mensaje: mensaje.into(), progreso });
}

fn linea(app: &AppHandle, texto: &str) {
    let _ = app.emit("arranque-linea", texto.to_string());
}

/// Rutas elegidas en el instalador (instalacion.json, que escribe instalar.ps1): (motor, datos). `ALEJANDRIA_CONFIG` apunta a otro archivo (pruebas).
fn configuracion(app: &AppHandle) -> Option<(PathBuf, PathBuf)> {
    let ruta = std::env::var("ALEJANDRIA_CONFIG").map(PathBuf::from).ok().or_else(|| app.path().app_data_dir().ok().map(|d| d.join("instalacion.json")))?;
    let texto = fs::read_to_string(ruta).ok()?;
    let json: serde_json::Value = serde_json::from_str(texto.trim_start_matches('\u{feff}')).ok()?;
    let ruta_de = |clave: &str| json.get(clave).and_then(|v| v.as_str()).filter(|s| !s.is_empty()).map(PathBuf::from);
    Some((ruta_de("motor")?, ruta_de("datos")?))
}

/// Carpetas de la app: (instalación de Python y entorno, datos del usuario). `ALEJANDRIA_APP_DIR` las mueve a otro sitio (pruebas);
/// si no, las que eligió el instalador; si no, las de siempre.
fn carpetas(app: &AppHandle) -> Result<(PathBuf, PathBuf), String> {
    if let Ok(base) = std::env::var("ALEJANDRIA_APP_DIR") {
        let base = PathBuf::from(base);
        return Ok((base.join("motor"), base.join("datos")));
    }
    if let Some(elegidas) = configuracion(app) {
        return Ok(elegidas);
    }
    let local = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
    let datos = app.path().app_data_dir().map_err(|e| e.to_string())?;
    Ok((local.join("motor"), datos.join("datos")))
}

/// Carpeta con el código del backend: la empaquetada con la app, o la del repositorio en desarrollo.
fn carpeta_backend(app: &AppHandle) -> Result<PathBuf, String> {
    if let Ok(p) = std::env::var("ALEJANDRIA_BACKEND_DIR") {
        return Ok(PathBuf::from(p));
    }
    if let Ok(res) = app.path().resource_dir() {
        let p = res.join("backend");
        if p.join("main.py").exists() {
            return Ok(p);
        }
    }
    // El instalador deja `backend\` justo al lado del .exe
    if let Some(p) = std::env::current_exe().ok().and_then(|e| e.parent().map(|d| d.join("backend"))) {
        if p.join("main.py").exists() {
            return Ok(p);
        }
    }
    let dev = Path::new(env!("CARGO_MANIFEST_DIR")).join("..").join("..").join("backend");
    if dev.join("main.py").exists() {
        return Ok(dev);
    }
    Err("No se encuentra el código del backend.".into())
}

/// ¿Responde en ese puerto el backend de Alejandría (y no otro programa)? Su /status devuelve un JSON con la clave "db".
fn es_nuestro(puerto: u16) -> bool {
    let dir: SocketAddr = ([127, 0, 0, 1], puerto).into();
    let Ok(mut s) = TcpStream::connect_timeout(&dir, Duration::from_millis(400)) else { return false };
    let _ = s.set_read_timeout(Some(Duration::from_millis(1500)));
    if s.write_all(b"GET /status HTTP/1.0
Host: localhost

").is_err() {
        return false;
    }
    let mut respuesta = Vec::new();
    let _ = s.read_to_end(&mut respuesta);
    String::from_utf8_lossy(&respuesta).contains("\"db\"")
}

/// El 8000 si es nuestro backend (ya está en marcha) o si está libre; si no, cualquier puerto libre.
fn elegir_puerto() -> u16 {
    if es_nuestro(PUERTO_PREFERIDO) || TcpListener::bind(("127.0.0.1", PUERTO_PREFERIDO)).is_ok() {
        return PUERTO_PREFERIDO;
    }
    TcpListener::bind(("127.0.0.1", 0)).ok().and_then(|l| l.local_addr().ok()).map_or(PUERTO_PREFERIDO, |d| d.port())
}

fn responde(puerto: u16) -> bool {
    let dir: SocketAddr = ([127, 0, 0, 1], puerto).into();
    TcpStream::connect_timeout(&dir, Duration::from_millis(400)).is_ok()
}

/// Ejecuta un programa enseñando su salida línea a línea en la pantalla de arranque.
fn ejecutar(app: &AppHandle, cmd: &mut Command, que: &str) -> Result<(), String> {
    cmd.stdout(Stdio::piped()).stderr(Stdio::piped()).stdin(Stdio::null()).creation_flags(SIN_VENTANA);
    let mut hijo = cmd.spawn().map_err(|e| format!("{que}: no se pudo ejecutar ({e})"))?;
    let leer = |flujo: Box<dyn Read + Send>, app: AppHandle| {
        std::thread::spawn(move || {
            for l in BufReader::new(flujo).split(b'\r').flatten().flat_map(|b| String::from_utf8_lossy(&b).lines().map(String::from).collect::<Vec<_>>()) {
                if !l.trim().is_empty() {
                    linea(&app, l.trim_end());
                }
            }
        })
    };
    let h1 = leer(Box::new(hijo.stdout.take().unwrap()), app.clone());
    let h2 = leer(Box::new(hijo.stderr.take().unwrap()), app.clone());
    let estado = hijo.wait().map_err(|e| format!("{que}: {e}"))?;
    let _ = (h1.join(), h2.join());
    if estado.success() { Ok(()) } else { Err(format!("{que} falló (código {})", estado.code().unwrap_or(-1))) }
}

fn sha256(fichero: &Path) -> Result<String, String> {
    let salida = Command::new("certutil").arg("-hashfile").arg(fichero).arg("SHA256").creation_flags(SIN_VENTANA).output().map_err(|e| e.to_string())?;
    String::from_utf8_lossy(&salida.stdout).lines().nth(1).map(|l| l.replace(' ', "").to_lowercase()).ok_or_else(|| "No se pudo calcular el sha256".to_string())
}

fn asegurar_uv(app: &AppHandle, motor: &Path) -> Result<PathBuf, String> {
    let uv = motor.join("uv").join("uv.exe");
    if uv.exists() {
        return Ok(uv);
    }
    avisar(app, "uv", format!("Descargando uv {UV_VERSION} (15 MB, una sola vez)"), 5);
    let carpeta = motor.join("uv");
    fs::create_dir_all(&carpeta).map_err(|e| e.to_string())?;
    let zip = carpeta.join("uv.zip");
    let url = format!("https://github.com/astral-sh/uv/releases/download/{UV_VERSION}/uv-x86_64-pc-windows-msvc.zip");
    ejecutar(app, Command::new("curl.exe").args(["-L", "--fail", "--silent", "--show-error", "-o"]).arg(&zip).arg(&url), "Descarga de uv")?;
    if sha256(&zip)? != UV_SHA256 {
        let _ = fs::remove_file(&zip);
        return Err("La descarga de uv no coincide con el sha256 esperado: se ha descartado por seguridad.".into());
    }
    avisar(app, "uv", "Descarga verificada (sha256 correcto)", 12);
    ejecutar(app, Command::new("tar.exe").arg("-xf").arg(&zip).arg("-C").arg(&carpeta), "Descompresión de uv")?;
    let _ = fs::remove_file(&zip);
    if uv.exists() { Ok(uv) } else { Err("uv.exe no apareció tras descomprimir.".into()) }
}

fn preparar(app: &AppHandle) -> Result<(PathBuf, PathBuf, PathBuf), String> {
    let (motor, datos) = carpetas(app)?;
    let backend = carpeta_backend(app)?;
    fs::create_dir_all(&datos).map_err(|e| e.to_string())?;
    let uv = asegurar_uv(app, &motor)?;
    let python_dir = motor.join("python");
    let entorno = motor.join("entorno");
    let python = entorno.join("Scripts").join("python.exe");
    let comun = |c: &mut Command| {
        c.env("UV_PYTHON_INSTALL_DIR", &python_dir).env("UV_CACHE_DIR", motor.join("cache")).env("UV_NO_CONFIG", "1").env("UV_NO_PROGRESS", "1");
    };

    // Un entorno sin pyvenv.cfg está roto (uv lo tomaría por el Python base y no instalaría nada): se rehace entero.
    if !python.exists() || !entorno.join("pyvenv.cfg").exists() {
        let _ = fs::remove_dir_all(&entorno);
        avisar(app, "python", format!("Instalando Python {PYTHON} (22 MB, una sola vez)"), 20);
        let mut c = Command::new(&uv);
        c.args(["python", "install", PYTHON, "--managed-python", "--no-bin"]);
        comun(&mut c);
        ejecutar(app, &mut c, "Instalación de Python")?;
        avisar(app, "entorno", "Creando el entorno aislado", 35);
        let mut c = Command::new(&uv);
        c.arg("venv").arg(&entorno).args(["--python", PYTHON, "--managed-python"]);
        comun(&mut c);
        ejecutar(app, &mut c, "Creación del entorno")?;
    }

    // Las dependencias se reinstalan solo si requirements.txt cambió desde la última vez (se compara con una copia).
    let pedidas = backend.join("requirements.txt");
    let instaladas = entorno.join("requirements.instalado.txt");
    let al_dia = fs::read(&instaladas).ok().zip(fs::read(&pedidas).ok()).map_or(false, |(a, b)| a == b);
    if !al_dia {
        avisar(app, "dependencias", "Instalando librerías (~200 MB, una sola vez)", 45);
        let mut c = Command::new(&uv);
        c.args(["pip", "install", "--python"]).arg(&python).arg("-r").arg(&pedidas);
        comun(&mut c);
        ejecutar(app, &mut c, "Instalación de librerías")?;
        fs::copy(&pedidas, &instaladas).map_err(|e| e.to_string())?;
    }
    // Modelo de clasificación (fastembed): si no se baja ahora, la primera neurona importada lo baja en silencio y la app parece colgada minutos.
    let modelos = motor.join("modelos");
    if tamano_carpeta(&modelos) < 150 * 1024 * 1024 {
        avisar(app, "modelo", "Descargando el modelo de clasificación (230 MB, una sola vez)", 75);
        let guion = motor.join("precargar_modelo.py");
        fs::write(&guion, "from fastembed import TextEmbedding\nTextEmbedding(model_name='sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')\n").map_err(|e| e.to_string())?;
        let resultado = ejecutar(app, Command::new(&python).arg(&guion).env("FASTEMBED_CACHE_PATH", &modelos).env("PYTHONUTF8", "1"), "Descarga del modelo");
        let _ = fs::remove_file(&guion);
        resultado?;
    }
    Ok((python, backend, datos))
}

fn tamano_carpeta(ruta: &Path) -> u64 {
    fs::read_dir(ruta).map(|it| it.flatten().map(|e| match e.metadata() { Ok(m) if m.is_dir() => tamano_carpeta(&e.path()), Ok(m) => m.len(), Err(_) => 0 }).sum()).unwrap_or(0)
}

fn lanzar(app: &AppHandle, guardado: &Mutex<Option<Child>>, python: &Path, backend: &Path, datos: &Path, motor: &Path, puerto: u16) -> Result<(), String> {
    if es_nuestro(puerto) {
        return Ok(()); // ya hay un backend (desarrollo, o una sesión anterior que no se cerró)
    }
    avisar(app, "backend", "Arrancando el backend", 90);
    let mut c = Command::new(python);
    c.args(["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", &puerto.to_string()])
        .current_dir(backend)
        .env("ALEJANDRIA_DATA_DIR", datos)
        .env("FASTEMBED_CACHE_PATH", motor.join("modelos")) // por defecto iría a la carpeta TEMP, que Windows puede vaciar
        .env("ALEJANDRIA_PADRE", std::process::id().to_string()) // el backend se cierra solo si esta app muere sin avisar
        .env("PYTHONUTF8", "1")
        .env("PYTHONDONTWRITEBYTECODE", "1") // la carpeta de instalación puede no ser escribible
        .stdin(Stdio::null()).creation_flags(SIN_VENTANA);
    // La salida del backend va a un archivo (backend.log, junto al motor): si se cae al arrancar, ahí queda el porqué (antes se tiraba).
    let registro = motor.join("backend.log");
    let (salida, errores) = match fs::File::create(&registro).and_then(|f| f.try_clone().map(|g| (f, g))) {
        Ok((a, b)) => (Stdio::from(a), Stdio::from(b)),
        Err(_) => (Stdio::null(), Stdio::null()),
    };
    c.stdout(salida).stderr(errores);
    let hijo = c.spawn().map_err(|e| format!("No se pudo arrancar el backend: {e}"))?;
    *guardado.lock().unwrap() = Some(hijo);
    let limite = Instant::now() + Duration::from_secs(90);
    while Instant::now() < limite {
        if responde(puerto) {
            return Ok(());
        }
        if let Some(h) = guardado.lock().unwrap().as_mut() {
            if let Ok(Some(codigo)) = h.try_wait() {
                let c = codigo.code().unwrap_or(-1);
                let pista = if c == -1073741819 { " Es un fallo del propio programa al cargar una biblioteca nativa (acceso inválido a memoria), casi siempre por un Visual C++ de Microsoft antiguo: actualízalo o repáralo (Configuración > Aplicaciones > Microsoft Visual C++ v14 Redistributable) y reinicia." } else { "" };
                return Err(format!("El backend se cerró nada más arrancar (código {c}).{pista} Registro: {}", registro.display()));
            }
        }
        std::thread::sleep(Duration::from_millis(300));
    }
    Err("El backend no respondió en 90 s.".into())
}

#[tauri::command]
/// Prepara y arranca el backend (si hace falta) y devuelve el puerto en el que escucha.
async fn arrancar_backend(app: AppHandle, estado: State<'_, Estado>) -> Result<u16, String> {
    let (ocupado, hijo) = (estado.ocupado.clone(), estado.hijo.clone());
    tauri::async_runtime::spawn_blocking(move || {
        let _uno_a_la_vez = ocupado.lock().unwrap();
        let resultado = (|| {
            let (motor, _) = carpetas(&app)?;
            let (python, backend, datos) = preparar(&app)?;
            let puerto = elegir_puerto();
            lanzar(&app, &hijo, &python, &backend, &datos, &motor, puerto).map(|_| puerto)
        })();
        match &resultado {
            Ok(_) => avisar(&app, "listo", "Todo listo", 100),
            Err(e) => avisar(&app, "error", e.clone(), 0),
        }
        resultado
    })
    .await
    .map_err(|e| e.to_string())?
}

#[derive(Clone, Serialize)]
struct Novedad {
    version: String,
    notas: String,
}

#[derive(Clone, Serialize)]
struct Progreso {
    recibido: u64,
    total: Option<u64>,
}

/// El actualizador (tauri-plugin-updater): la dirección y la clave PÚBLICA salen de tauri.conf.json, y solo se instala lo que esté firmado con la clave privada
/// del proyecto. `ALEJANDRIA_ACTUALIZACIONES` solo se admite para probar en local (https://127.0.0.1 o localhost, con certificado propio): la firma se sigue comprobando igual.
/// `hijo`: el backend lanzado por esta app; el plugin termina el proceso con `exit(0)` (sin pasar por RunEvent::Exit), así que se cierra antes.
fn actualizador(app: &AppHandle, hijo: Option<Arc<Mutex<Option<Child>>>>) -> Result<tauri_plugin_updater::Updater, String> {
    let mut b = app.updater_builder().restart_after_install(false); // el instalador reabre la app él mismo
    if let Some(hijo) = hijo {
        b = b.on_before_exit(move || {
            if let Some(mut h) = hijo.lock().unwrap().take() {
                let _ = h.kill();
            }
        });
    }
    if let Ok(url) = std::env::var("ALEJANDRIA_ACTUALIZACIONES") {
        if url.starts_with("https://127.0.0.1") || url.starts_with("https://localhost") {
            b = b
                .endpoints(vec![url.parse().map_err(|e| format!("Dirección de prueba no válida: {e}"))?])
                .map_err(|e| e.to_string())?
                .configure_client(|c| c.danger_accept_invalid_certs(true));
        }
    }
    b.build().map_err(|e| e.to_string())
}

#[tauri::command]
/// ¿Hay una versión más nueva y firmada? Devuelve su número y sus novedades; `None` si ya está al día.
async fn buscar_actualizacion(app: AppHandle) -> Result<Option<Novedad>, String> {
    let actualizacion = actualizador(&app, None)?.check().await.map_err(|e| e.to_string())?;
    Ok(actualizacion.map(|u| Novedad { version: u.version.clone(), notas: u.body.clone().unwrap_or_default() }))
}

#[tauri::command]
/// Descarga la versión nueva (comprobando su firma), cierra la app y lanza el instalador en modo actualización; el instalador la vuelve a abrir.
async fn instalar_actualizacion(app: AppHandle, estado: State<'_, Estado>) -> Result<(), String> {
    let Some(u) = actualizador(&app, Some(estado.hijo.clone()))?.check().await.map_err(|e| e.to_string())? else {
        return Err("Ya no hay ninguna actualización disponible.".into());
    };
    let (avisos, mut recibido) = (app.clone(), 0u64);
    u.download_and_install(
        move |trozo, total| {
            recibido += trozo as u64;
            let _ = avisos.emit("actualizacion-progreso", Progreso { recibido, total });
        },
        || {},
    )
    .await
    .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(Estado::default())
        .invoke_handler(tauri::generate_handler![arrancar_backend, buscar_actualizacion, instalar_actualizacion])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");
    app.run(|app, evento| {
        if let RunEvent::Exit = evento {
            if let Some(mut h) = app.state::<Estado>().hijo.lock().unwrap().take() {
                let _ = h.kill(); // el backend que lanzó la app se cierra con ella
            }
        }
    });
}
