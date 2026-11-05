# Trabajo pesado del instalador: uv -> Python -> librerías -> Ollama (opcional) -> modelo (opcional).
# Lo lanza el asistente (instalador.nsi) en segundo plano y le cuenta el avance por un archivo de estado de una línea:
#   uv|python|librerías|clasificación|ollama|modelo|estado|mensaje        (cada avance es 0-100, o -1 si esa fase no se hace; estado = trabajando | ok | error)
# El asistente lo lee con un temporizador y dibuja las barras ASCII (mensajes en la página de códigos ANSI). Se cancela creando el archivo -Cancelar.
param(
    [string]$Parametros = '',                   # alternativa a los demás: archivo con líneas clave=valor (el asistente lo usa: la línea de órdenes de NSIS está limitada a 1024 caracteres)
    [string]$Motor = '',                        # carpeta del motor: uv, Python, entorno y caché
    [string]$Backend = '',                      # carpeta de la app con el backend (requirements.txt)
    [string]$Estado = '',
    [string]$Cancelar = '',
    [string]$Config = '',                       # dónde escribir instalacion.json (rutas elegidas, que lee la app)
    [string]$Datos = '',
    [string]$Modelos = '',
    [string]$RutaOllama = '',                   # carpeta donde instalar el programa Ollama (/DIR de su instalador); vacía = la de siempre, %LOCALAPPDATA%\Programs\Ollama
    [int]$Ollama = 0,
    [string]$Modelo = '',
    [int]$Prueba = 0,                           # 1: de Ollama solo se bajan 50 MB (sin instalar ni tocar variables de entorno); 2: igual, aunque Ollama ya esté instalado
    [int]$Actualizar = 0,                       # 1: es una actualización: lo ya instalado se salta y instalacion.json se completa sin pisar lo que había
    [int]$Esquema = 0,                          # estructura de rutas de esta versión (se guarda en instalacion.json)
    [string]$Nuevas = ''                        # «clave=ruta;clave=ruta»: carpetas nuevas elegidas en una actualización
)
if ($Parametros) {
    foreach ($l in Get-Content $Parametros -Encoding Unicode) {
        if ($l -match '^([A-Za-z]+)=(.*)$') { Set-Variable -Name $Matches[1] -Value $Matches[2].Trim() -Scope Script }
    }
    $Ollama = [int]$Ollama; $Prueba = [int]$Prueba; $Actualizar = [int]$Actualizar; $Esquema = [int]$Esquema
}
if ($Actualizar -and $Config -and (Test-Path $Config)) {        # al actualizar mandan las carpetas que ya se eligieron (el asistente solo conoce las de siempre si falta el registro)
    try {
        $previo = Get-Content $Config -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($previo.motor) { $Motor = [string]$previo.motor }
        if ($previo.datos) { $Datos = [string]$previo.datos }
    } catch { }
}
foreach ($obligatorio in 'Motor', 'Backend', 'Estado', 'Cancelar') { if (-not (Get-Variable $obligatorio -ValueOnly)) { Write-Error "Falta el parámetro $obligatorio"; exit 2 } }
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Las mismas versiones y la misma huella que fija src-tauri/src/lib.rs
$UV_VERSION = '0.13.6'
$UV_SHA256 = 'a2a8820d5eea32f08ef467ef3b7f66883a9b076d5737a2fc2fbb5f458d1bb50f'
$PYTHON = '3.13'
$OLLAMA_URL = 'https://ollama.com/download/OllamaSetup.exe'

$avance = [ordered]@{ uv = 0; python = 0; libs = 0; clasif = 0; ollama = $(if ($Ollama) { 0 } else { -1 }); modelo = $(if ($Modelo) { 0 } else { -1 }) }
New-Item -ItemType Directory -Force $Motor | Out-Null
$registro = Join-Path $Motor 'instalacion.log'

function Anotar($texto) { Add-Content -Path $registro -Value ("{0:HH:mm:ss} {1}" -f (Get-Date), $texto) -Encoding UTF8 }

function Publicar($situacion, $mensaje) {
    $linea = '{0}|{1}|{2}|{3}|{4}|{5}|{6}|{7}' -f $avance.uv, $avance.python, $avance.libs, $avance.clasif, $avance.ollama, $avance.modelo, $situacion, ($mensaje -replace '[|\r\n]', ' ')
    # Se escribe directamente en el archivo (sin pasar por un temporal que luego se renombra): en un equipo el renombrado fallaba siempre, seguramente porque algo
    # del sistema retenía el temporal, y el asistente no recibía ningún estado. Si el asistente lo tiene abierto justo en ese instante, se reintenta.
    # El estado es solo cosmético: tras unos intentos se ignora en vez de abortar la instalación.
    for ($i = 0; $i -lt 8; $i++) {
        try {
            [IO.File]::WriteAllText($Estado, $linea, [Text.Encoding]::Default)     # página de códigos ANSI del sistema: es lo que lee FileRead de NSIS (acentos incluidos)
            return
        } catch { $ultimo = $_.Exception.Message; Start-Sleep -Milliseconds 150 }
    }
    if (-not $script:avisoEstado) { $script:avisoEstado = $true; Anotar "AVISO: no se pudo escribir el estado en $Estado ($ultimo); el final se avisa por instalacion.ok / instalacion.error" }
}

# El final también se deja en dos archivos de la carpeta del motor (que sí se sabe escribible: ahí va el registro): si el archivo de estado no llega
# (antivirus, bloqueos...), el asistente sigue enterándose de que ha terminado o ha fallado y no se queda esperando.
function Marcar([string]$nombre, [string]$texto) { try { Set-Content -Path (Join-Path $Motor $nombre) -Value $texto -Encoding Default } catch { } }

function Comprobar { if (Test-Path $Cancelar) { throw 'Instalación cancelada.' } }

# ---- Visual C++ de Microsoft ---------------------------------------------------------------------------------------------------------------------------
# onnxruntime (que usa la app) se cae sin mensaje (código 0xC0000005) si el msvcp140.dll del sistema es antiguo. Se mira la versión REAL del archivo y no la del
# registro: en un equipo el paquete nuevo figuraba como instalado y el archivo de System32 seguía siendo el de 2020.
$VC_MINIMO = [version]'14.40'
$AYUDA_VC = 'Instala el Visual C++ actual de Microsoft (https://learn.microsoft.com/cpp/windows/latest-supported-vc-redist) o, si ya figura instalado, repáralo en Configuración > Aplicaciones > «Microsoft Visual C++ v14 Redistributable (x64)» > Modificar > Reparar y reinicia.'
function VersionVC {
    if ($Prueba -eq 4) { return [version]'14.26.28720.3' }          # prueba: Visual C++ antiguo simulado
    $f = Join-Path $env:SystemRoot 'System32\msvcp140.dll'
    if (-not (Test-Path $f)) { return $null }
    $v = (Get-Item $f).VersionInfo
    return [version]('{0}.{1}.{2}.{3}' -f $v.FileMajorPart, $v.FileMinorPart, $v.FileBuildPart, $v.FilePrivatePart)
}
function ExplicarCodigo([int]$codigo) {
    if ($codigo -eq -1073741819) { return " Es un fallo del propio programa al cargar una biblioteca nativa (acceso inválido a memoria), casi siempre por un Visual C++ antiguo. $AYUDA_VC" }
    return ''
}

# Datos del equipo en el registro, para poder diagnosticar sin ir y venir (versión de Windows, procesador, Visual C++, disco, rutas con acentos).
function Diagnostico {
    try {
        $so = Get-CimInstance Win32_OperatingSystem
        $cpu = (Get-CimInstance Win32_Processor | Select-Object -First 1).Name
        Anotar ("Equipo: {0} (compilación {1}); {2}" -f $so.Caption, $so.BuildNumber, $cpu)
        Anotar ("Visual C++ (msvcp140.dll de System32): {0}" -f (VersionVC))
        $fs = try { (Get-Volume -DriveLetter $Motor.Substring(0, 1) -ErrorAction Stop).FileSystemType } catch { '?' }
        Anotar "Carpeta del motor: $Motor (sistema de archivos: $fs); TEMP: $env:TEMP"
        if ("$Motor$env:TEMP$env:USERPROFILE" -match '[^\x00-\x7F]') { Anotar 'Aviso: alguna de esas rutas lleva caracteres no ASCII (acentos...)' }
    } catch { Anotar "Diagnóstico incompleto: $($_.Exception.Message)" }
}

function Porcentaje([double]$hecho, [double]$total) {
    if ($total -le 0) { return 0 }
    return [int][Math]::Max(0, [Math]::Min(99, [Math]::Floor(100 * $hecho / $total)))
}

$script:ultimoTamano = 0
function Tamano([string]$ruta) {
    # uv crea y borra ficheros mientras se mide: un error al enumerar no debe tumbar la instalación (se devuelve la última medida buena)
    try {
        if (-not (Test-Path $ruta)) { return 0 }
        $s = (Get-ChildItem $ruta -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
        if ($s) { $script:ultimoTamano = [long]$s }
    } catch { }
    return $script:ultimoTamano
}

# Espera a un proceso llamando cada ~0,4 s a $alAvanzar (progreso) y atendiendo la cancelación.
function Esperar($proceso, [scriptblock]$alAvanzar) {
    $null = $proceso.Handle      # sin esto ExitCode a veces llega vacío
    while (-not $proceso.HasExited) {
        Start-Sleep -Milliseconds 400
        if (Test-Path $Cancelar) { try { $proceso.Kill() } catch {}; throw 'Instalación cancelada.' }
        & $alAvanzar
    }
}

function Ejecutar([string]$exe, [string[]]$argumentos, [scriptblock]$alAvanzar, [string]$que) {
    $salida = Join-Path $Motor 'salida.tmp'
    # -NoNewWindow: el hijo usa la consola (oculta) de este script; con -WindowStyle Hidden crearía una consola nueva y, con Terminal como predeterminada, se vería un instante.
    $p = Start-Process -FilePath $exe -ArgumentList $argumentos -PassThru -NoNewWindow -RedirectStandardOutput $salida -RedirectStandardError "$salida.err"
    Esperar $p $alAvanzar
    foreach ($f in $salida, "$salida.err") { if (Test-Path $f) { Get-Content $f -ErrorAction SilentlyContinue | ForEach-Object { Anotar "  $_" }; Remove-Item $f -Force -ErrorAction SilentlyContinue } }
    if ($p.ExitCode -ne 0) { throw ("$que falló (código $($p.ExitCode)); mira $registro." + (ExplicarCodigo $p.ExitCode)) }
}

# El Python del motor solo se fía de los certificados que trae (certifi). Un antivirus o un proxy que inspecciona HTTPS firma con su propia raíz, que Windows sí conoce:
# sin ella la descarga del modelo falla a ratos con CERTIFICATE_VERIFY_FAILED. Devuelve un .pem con los de certifi más los de Windows, o $null si no se pudo.
function CertificadosConWindows([string]$python, [string]$destino) {
    try {
        $certifi = (& $python -I -c 'import certifi; print(certifi.where())') | Select-Object -First 1
        if (-not $certifi -or -not (Test-Path $certifi)) { return $null }
        $sb = New-Object Text.StringBuilder
        [void]$sb.AppendLine((Get-Content $certifi -Raw))
        $n = 0
        foreach ($almacen in 'Cert:\CurrentUser\Root', 'Cert:\LocalMachine\Root') {
            foreach ($c in (Get-ChildItem $almacen -ErrorAction SilentlyContinue)) {
                [void]$sb.AppendLine('-----BEGIN CERTIFICATE-----')
                [void]$sb.AppendLine([Convert]::ToBase64String($c.RawData, 'InsertLineBreaks'))
                [void]$sb.AppendLine('-----END CERTIFICATE-----')
                $n++
            }
        }
        [IO.File]::WriteAllText($destino, $sb.ToString(), [Text.Encoding]::ASCII)
        Anotar "Certificados de Windows añadidos a los de Python: $n"
        return $destino
    } catch {
        Anotar "AVISO: no se pudieron reunir los certificados de Windows ($($_.Exception.Message))"
        return $null
    }
}

# Descarga con curl.exe (viene con Windows 10/11) midiendo el archivo parcial frente al tamaño total que anuncia el servidor.
function Bajar([string]$url, [string]$destino, [string]$fase, [string]$texto, [string]$rango = '') {
    $cabeceras = & curl.exe -sIL $url
    $total = 0
    foreach ($l in $cabeceras) { if ($l -match '^(?i)content-length:\s*(\d+)') { $total = [long]$Matches[1] } }
    if ($rango) { $partes = $rango.Split('-'); $total = [long]$partes[1] - [long]$partes[0] + 1 }
    $a = @('-L', '--fail', '--silent', '--show-error', '-o', "`"$destino`"")
    if ($rango) { $a = @('-r', $rango) + $a }
    $a += "`"$url`""
    $p = Start-Process -FilePath curl.exe -ArgumentList $a -PassThru -NoNewWindow -RedirectStandardError "$destino.err"
    $mb = { param($b) [Math]::Round($b / 1MB) }
    Esperar $p {
        $hecho = if (Test-Path $destino) { (Get-Item $destino).Length } else { 0 }
        $avance[$fase] = Porcentaje $hecho $total
        Publicar 'trabajando' ("$texto ({0} / {1} MB)" -f (& $mb $hecho), (& $mb $total))
    }
    if ($p.ExitCode -ne 0) { throw "${texto}: la descarga falló (curl $($p.ExitCode)): $(Get-Content "$destino.err" -ErrorAction SilentlyContinue)" }
    Remove-Item "$destino.err" -Force -ErrorAction SilentlyContinue
}

try {
    Anotar "=== instalación: motor=$Motor ollama=$Ollama modelo=$Modelo prueba=$Prueba"
    Publicar 'trabajando' 'Empezando...'
    Diagnostico
    $vc = VersionVC
    if (-not $vc -or $vc -lt $VC_MINIMO) {      # antes de descargar nada: no tiene sentido bajar 500 MB para que luego el motor no arranque
        throw ("Falta actualizar el Visual C++ de Microsoft: el msvcp140.dll de este equipo es la versión {0} y hace falta la {1} o posterior. {2}" -f $(if ($vc) { $vc } else { 'inexistente' }), $VC_MINIMO, $AYUDA_VC)
    }

    # ---------------------------------------------------------------- uv
    $uv = Join-Path $Motor 'uv\uv.exe'
    if (Test-Path $uv) {
        $avance.uv = 100
    } else {
        $carpeta = Join-Path $Motor 'uv'
        New-Item -ItemType Directory -Force $carpeta | Out-Null
        $zip = Join-Path $carpeta 'uv.zip'
        Bajar "https://github.com/astral-sh/uv/releases/download/$UV_VERSION/uv-x86_64-pc-windows-msvc.zip" $zip 'uv' "Descargando uv $UV_VERSION"
        $huella = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
        if ($huella -ne $UV_SHA256) { Remove-Item $zip -Force; throw 'La descarga de uv no coincide con la huella sha256 esperada: se ha descartado por seguridad.' }
        Publicar 'trabajando' 'uv verificado (sha256 correcto), descomprimiendo...'
        & tar.exe -xf $zip -C $carpeta
        Remove-Item $zip -Force
        if (-not (Test-Path $uv)) { throw 'uv.exe no apareció tras descomprimir.' }
        $avance.uv = 100
    }
    Publicar 'trabajando' 'uv listo'
    if ($Prueba -eq 3) { throw 'Error simulado para probar la pantalla de error y el botón Cerrar.' }

    # ---------------------------------------------------------------- Python + entorno + librerías (uv, sin escribir fuera del motor)
    $env:UV_PYTHON_INSTALL_DIR = Join-Path $Motor 'python'
    $env:UV_CACHE_DIR = Join-Path $Motor 'cache'
    $env:UV_NO_CONFIG = '1'
    $env:UV_NO_PROGRESS = '1'
    $entorno = Join-Path $Motor 'entorno'
    $pythonExe = Join-Path $entorno 'Scripts\python.exe'
    # Un entorno sin pyvenv.cfg está roto (p. ej. un desinstalado interrumpido): uv lo tomaría por el Python base y se negaría a instalar en él. Se rehace.
    $entornoValido = (Test-Path $pythonExe) -and (Test-Path (Join-Path $entorno 'pyvenv.cfg'))
    if (-not $entornoValido) {
        if (Test-Path $entorno) {
            Publicar 'trabajando' 'El entorno estaba incompleto: rehaciéndolo...'
            Remove-Item $entorno -Recurse -Force -ErrorAction SilentlyContinue
            if (Test-Path $entorno) {                          # rutas largas o archivos a medias: robocopy los vacía
                $vacio = Join-Path $Motor 'vacio.tmp'; New-Item -ItemType Directory -Force $vacio | Out-Null
                & robocopy.exe $vacio $entorno /MIR /NFL /NDL /NJH /NJS /NP /R:1 /W:1 | Out-Null
                Remove-Item $vacio, $entorno -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
        $antes = Tamano $Motor
        Ejecutar $uv @('python', 'install', $PYTHON, '--managed-python', '--no-bin') {
            $avance.python = Porcentaje ((Tamano $Motor) - $antes) 90MB
            Publicar 'trabajando' "Instalando Python $PYTHON (se descarga una sola vez)"
        } 'La instalación de Python'
        Ejecutar $uv @('venv', "`"$entorno`"", '--python', $PYTHON, '--managed-python') { Publicar 'trabajando' 'Creando el entorno aislado' } 'La creación del entorno'
    }
    $avance.python = 100

    $pedidas = Join-Path $Backend 'requirements.txt'
    $instaladas = Join-Path $entorno 'requirements.instalado.txt'
    $alDia = (Test-Path $instaladas) -and ((Get-FileHash $pedidas).Hash -eq (Get-FileHash $instaladas).Hash)
    if (-not $alDia) {
        $antes = Tamano $Motor
        Ejecutar $uv @('pip', 'install', '--python', "`"$pythonExe`"", '-r', "`"$pedidas`"") {
            $avance.libs = Porcentaje ((Tamano $Motor) - $antes) 330MB
            Publicar 'trabajando' 'Instalando librerías (pandas, numpy, fastembed...)'
        } 'La instalación de librerías'
        Copy-Item -Force $pedidas $instaladas
    }
    $avance.libs = 100

    # ---------------------------------------------------------------- Prueba del motor: se importa lo que usa la app, antes de bajar el modelo (240 MB)
    # Una caída nativa (0xC0000005 por un Visual C++ antiguo, un antivirus, una CPU sin ciertas instrucciones...) no deja mensaje de Python: así se detecta
    # aquí, con una explicación, y no como un error de «descarga del modelo».
    Publicar 'trabajando' 'Comprobando que el motor arranca...'
    $codigoPrueba = if ($Prueba -eq 5) { 'import os; os._exit(-1073741819)' } else { 'import numpy, pandas, pyarrow, onnxruntime, fastembed' }    # 5: caída simulada
    $salidaPrueba = Join-Path $Motor 'prueba_motor.tmp'
    $pp = Start-Process -FilePath $pythonExe -ArgumentList @('-X', 'faulthandler', '-c', "`"$codigoPrueba`"") -PassThru -NoNewWindow -RedirectStandardOutput $salidaPrueba -RedirectStandardError "$salidaPrueba.err"
    Esperar $pp { Publicar 'trabajando' 'Comprobando que el motor arranca...' }
    foreach ($f in $salidaPrueba, "$salidaPrueba.err") { if (Test-Path $f) { Get-Content $f -ErrorAction SilentlyContinue | ForEach-Object { Anotar "  $_" }; Remove-Item $f -Force -ErrorAction SilentlyContinue } }
    if ($pp.ExitCode -ne 0) { throw ("El motor no arranca en este equipo (código {0}).{1}" -f $pp.ExitCode, (ExplicarCodigo $pp.ExitCode)) }
    Anotar 'Prueba del motor: correcta'

    # ---------------------------------------------------------------- Modelo de clasificación (embeddings de fastembed, ~230 MB de HuggingFace)
    # Si no se baja aquí, la primera neurona que se importe lo baja en silencio y la app parece colgada durante minutos.
    $modelos = Join-Path $Motor 'modelos'
    $env:FASTEMBED_CACHE_PATH = $modelos
    if ((Tamano $modelos) -gt 150MB) {
        $avance.clasif = 100
    } else {
        $guion = Join-Path $Motor 'precargar_modelo.py'
        Set-Content -Path $guion -Encoding UTF8 -Value "from fastembed import TextEmbedding`nTextEmbedding(model_name='sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')"
        $antes = Tamano $modelos
        $certificados = CertificadosConWindows $pythonExe (Join-Path $Motor 'certificados.pem')
        if ($certificados) { $env:SSL_CERT_FILE = $certificados; $env:REQUESTS_CA_BUNDLE = $certificados }     # solo durante esta descarga
        for ($intento = 1; $intento -le 3; $intento++) {      # HuggingFace falla a veces por red (certificados, cortes): fastembed reanuda lo ya bajado
            try {
                Ejecutar $pythonExe @("`"$guion`"") {
                    $avance.clasif = Porcentaje ((Tamano $modelos) - $antes) 230MB
                    Publicar 'trabajando' 'Descargando el modelo de clasificación (una sola vez)'
                } 'La descarga del modelo de clasificación'
                break
            } catch {
                # solo se reintenta lo que puede ser la red (Python sale con el código 1 ante una excepción); una caída nativa o cualquier otro código se repetiría igual
                if ($intento -eq 3 -or $_.Exception.Message -notmatch 'código 1\)') { throw }
                Publicar 'trabajando' "Fallo de red; reintentando ($intento/3)"
                Start-Sleep -Seconds 5
            }
        }
        Remove-Item $guion -Force -ErrorAction SilentlyContinue
        Remove-Item Env:SSL_CERT_FILE, Env:REQUESTS_CA_BUNDLE -ErrorAction SilentlyContinue
        $avance.clasif = 100
    }

    # ---------------------------------------------------------------- Ollama (opcional)
    $ollamaPorDefecto = Join-Path $env:LOCALAPPDATA 'Programs\Ollama'
    if ($RutaOllama) {                                   # una carpeta elegida por el usuario: ruta completa y sin caracteres que rompan la línea de órdenes del instalador de Ollama
        if ($RutaOllama -notmatch '^[A-Za-z]:\\' -or $RutaOllama -match '["<>|*?\r\n]') { throw "La carpeta de Ollama no es válida: $RutaOllama" }
        $RutaOllama = $RutaOllama.TrimEnd('\')
        if ($RutaOllama -notmatch '^[A-Za-z]:\\.') { throw "Elige una carpeta para Ollama, no la raíz de una unidad: $RutaOllama" }
    }
    $carpetaOllama = if ($RutaOllama) { $RutaOllama } else { $ollamaPorDefecto }
    $ollamaExe = Join-Path $carpetaOllama 'ollama.exe'
    if (-not (Test-Path $ollamaExe)) { $ollamaExe = Join-Path $ollamaPorDefecto 'ollama.exe' }
    if (-not (Test-Path $ollamaExe)) { $c = Get-Command ollama.exe -ErrorAction SilentlyContinue; if ($c) { $ollamaExe = $c.Source } }
    if ($Ollama) {
        if ((Test-Path $ollamaExe) -and $Prueba -lt 2) {      # -Prueba 2: se ignora el Ollama que ya hay para ver la descarga
            $avance.ollama = 100
            Publicar 'trabajando' 'Ollama ya estaba instalado'
        } else {
            $descarga = Join-Path $Motor 'OllamaSetup.exe'
            if ($Prueba) {
                Bajar $OLLAMA_URL $descarga 'ollama' 'Prueba: descargando 50 MB de Ollama' '0-52428799'
                Remove-Item $descarga -Force
                $avance.ollama = 100
                Publicar 'trabajando' 'Prueba: Ollama no se instala'
            } else {
                Bajar $OLLAMA_URL $descarga 'ollama' 'Descargando Ollama'
                $firma = Get-AuthenticodeSignature $descarga
                if ($firma.Status -ne 'Valid' -or $firma.SignerCertificate.Subject -notmatch 'Ollama') { Remove-Item $descarga -Force; throw 'El instalador de Ollama no tiene una firma válida de Ollama: se ha descartado por seguridad.' }
                if ($Modelos) { [Environment]::SetEnvironmentVariable('OLLAMA_MODELS', $Modelos, 'User'); $env:OLLAMA_MODELS = $Modelos }
                Publicar 'trabajando' 'Firma verificada; instalando Ollama...'
                $argumentosOllama = @('/SILENT', '/NORESTART')
                if ($RutaOllama -and $RutaOllama -ne $ollamaPorDefecto) { $argumentosOllama += "/DIR=`"$RutaOllama`"" }      # /DIR: el instalador de Ollama lo documenta; sin él va a la carpeta de siempre
                Anotar "Instalando Ollama con: $($argumentosOllama -join ' ')"
                $p = Start-Process -FilePath $descarga -ArgumentList $argumentosOllama -PassThru
                Esperar $p { $avance.ollama = 99 }
                Remove-Item $descarga -Force
                $ollamaExe = Join-Path $carpetaOllama 'ollama.exe'
                if (-not (Test-Path $ollamaExe)) { throw "Ollama no apareció tras instalarlo en $carpetaOllama." }
                $avance.ollama = 100
            }
        }
    }

    # ---------------------------------------------------------------- Modelo de IA (opcional): se descarga con la API de Ollama, que da bytes reales
    if ($Modelo) {
        if (-not (Test-Path $ollamaExe)) { throw "No se puede descargar el modelo $Modelo porque Ollama no está instalado." }
        $vivo = { try { (Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2).StatusCode -eq 200 } catch { $false } }
        if (-not (& $vivo)) {
            Publicar 'trabajando' 'Arrancando Ollama...'
            $inicio = New-Object Diagnostics.ProcessStartInfo $ollamaExe, 'serve'      # sin consola (CREATE_NO_WINDOW): sigue vivo cuando acaba el instalador
            $inicio.UseShellExecute = $false; $inicio.CreateNoWindow = $true
            [void][Diagnostics.Process]::Start($inicio)
            for ($i = 0; $i -lt 40 -and -not (& $vivo); $i++) { Start-Sleep -Milliseconds 500; Comprobar }
            if (-not (& $vivo)) { throw 'Ollama no respondió al arrancar.' }
        }
        $req = [Net.HttpWebRequest]::Create('http://127.0.0.1:11434/api/pull')
        $req.Method = 'POST'; $req.ContentType = 'application/json'; $req.Timeout = 3600000; $req.ReadWriteTimeout = 600000
        $cuerpo = [Text.Encoding]::UTF8.GetBytes((@{ model = $Modelo; stream = $true } | ConvertTo-Json -Compress))
        $flujo = $req.GetRequestStream(); $flujo.Write($cuerpo, 0, $cuerpo.Length); $flujo.Close()
        $lector = New-Object IO.StreamReader($req.GetResponse().GetResponseStream())
        $mayor = 0
        while (-not $lector.EndOfStream) {
            Comprobar
            $j = $lector.ReadLine() | ConvertFrom-Json
            if ($j.error) { throw "Ollama no pudo descargar $Modelo`: $($j.error)" }
            if ($j.total -and [long]$j.total -ge $mayor) {       # la capa grande es el modelo; las pequeñas se ignoran
                $mayor = [long]$j.total
                $avance.modelo = Porcentaje ([long]$j.completed) $mayor
                Publicar 'trabajando' ("Descargando $Modelo ({0} / {1} MB)" -f [Math]::Round([long]$j.completed / 1MB), [Math]::Round($mayor / 1MB))
            } else { Publicar 'trabajando' "Modelo $Modelo`: $($j.status)" }
        }
        $lector.Close()
        $avance.modelo = 100
    }

    # ---------------------------------------------------------------- lo elegido, para que la app lo lea
    if ($Config) {
        New-Item -ItemType Directory -Force (Split-Path $Config) | Out-Null
        $cfg = [ordered]@{}
        if ($Actualizar -and (Test-Path $Config)) {          # al actualizar se conserva lo que ya había (p. ej. la carpeta de modelos de Ollama)
            try { foreach ($p in (Get-Content $Config -Raw -Encoding UTF8 | ConvertFrom-Json).PSObject.Properties) { $cfg[$p.Name] = $p.Value } } catch { Anotar "AVISO: no se pudo leer $Config ($($_.Exception.Message)); se reescribe" }
        }
        $cfg['motor'] = $Motor; $cfg['datos'] = $Datos
        if (-not $Actualizar -or -not $cfg.Contains('modelos_ollama')) { $cfg['modelos_ollama'] = $Modelos }
        # carpeta de Ollama (la que usará la app aunque no esté en el PATH de este proceso); al actualizar se conserva la que ya había
        if ((Test-Path $ollamaExe) -and (-not $Actualizar -or -not $cfg.Contains('ruta_ollama'))) { $cfg['ruta_ollama'] = (Split-Path $ollamaExe) }
        if ($Esquema -gt 0) { $cfg['esquema'] = $Esquema }
        foreach ($par in ($Nuevas -split ';')) { if ($par -match '^([^=]+)=(.+)$') { $cfg[$Matches[1]] = $Matches[2] } }
        $cfg | ConvertTo-Json | Set-Content -Path $Config -Encoding UTF8
    }
    Anotar 'instalación terminada'
    Marcar 'instalacion.ok' 'ok'
    Publicar 'ok' 'Todo listo.'
} catch {
    Anotar "ERROR: $($_.Exception.Message)"
    Marcar 'instalacion.error' $_.Exception.Message
    Publicar 'error' $_.Exception.Message
    exit 1
}
