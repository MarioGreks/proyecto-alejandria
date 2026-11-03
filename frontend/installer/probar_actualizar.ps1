# Herramienta de desarrollo: prueba el MODO ACTUALIZACIÓN del instalador sobre una instalación de prueba que ya exista (hecha con probar.ps1 y -Base <carpeta>).
# Lanza el instalador con /PRUEBA=<carpeta> /ACTUALIZAR (lo mismo que hace el actualizador de la app, que pasa /P /UPDATE), captura SOLO su ventana,
# espera a que termine solo (en una actualización se cierra él mismo tras reabrir la app) y comprueba: versión nueva, neuronas intactas, app reabierta.
# Uso:  powershell -File installer\probar_actualizar.ps1 -Base <carpeta> -Salida <capturas> [-Instalador <exe>] [-Extra '/ESQUEMA-NUEVO'] [-PaginaNueva] [-Argumentos '/P /UPDATE']
param(
    [string]$Instalador = (Join-Path $PSScriptRoot '..\src-tauri\target\release\bundle\Proyecto-Alejandria-Setup.exe'),
    [Parameter(Mandatory)][string]$Base,
    [Parameter(Mandatory)][string]$Salida,
    [string[]]$Extra = @(),
    [switch]$PaginaNueva,                    # con /ESQUEMA-NUEVO aparece la página de carpetas nuevas: se pulsa Siguiente una vez
    [string]$Argumentos = '/ACTUALIZAR',     # lo que pasa el actualizador de la app es «/P /UPDATE»
    [int]$MinutosMax = 8
)
Add-Type -AssemblyName System.Drawing
Add-Type -Namespace W -Name A -MemberDefinition @'
[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool PostMessage(System.IntPtr h, uint m, System.IntPtr w, System.IntPtr l);
[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool PrintWindow(System.IntPtr h, System.IntPtr dc, uint flags);
[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool GetWindowRect(System.IntPtr h, out RECT r);
[System.Runtime.InteropServices.StructLayout(System.Runtime.InteropServices.LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
'@
New-Item -ItemType Directory -Force $Salida | Out-Null
function Capturar($h, $ruta) {
    for ($k = 0; $k -lt 6; $k++) {
        $r = New-Object W.A+RECT; [void][W.A]::GetWindowRect($h, [ref]$r)
        if (($r.R - $r.L) -le 0) { Start-Sleep -Seconds 1; continue }
        $bmp = New-Object System.Drawing.Bitmap ($r.R - $r.L), ($r.B - $r.T)
        $g = [System.Drawing.Graphics]::FromImage($bmp); $dc = $g.GetHdc()
        [void][W.A]::PrintWindow($h, $dc, 2); $g.ReleaseHdc($dc); $g.Dispose(); $bmp.Save($ruta); $bmp.Dispose()
        if ((Get-Item $ruta).Length -gt 12000) { break }
        Start-Sleep -Seconds 1
    }
}
$clave = 'HKCU:\Software\ProyectoAlejandriaPrueba'
$exeApp = Join-Path $Base 'app\ProyectoAlejandria.exe'
$centinela = Join-Path $Base 'datos\neurona_centinela.txt'
if (-not (Test-Path $exeApp)) { "No hay una instalación de prueba en $Base (hazla antes con probar.ps1)"; exit 1 }
New-Item -ItemType Directory -Force (Split-Path $centinela) | Out-Null
Set-Content $centinela 'estas neuronas no se tocan' -Encoding UTF8
$antes = [pscustomobject]@{
    version = (Get-ItemProperty $clave -ErrorAction SilentlyContinue).DisplayVersion
    esquema = (Get-ItemProperty $clave -ErrorAction SilentlyContinue).Esquema
    exe     = (Get-FileHash $exeApp -Algorithm SHA256).Hash.Substring(0, 12)
    config  = (Get-Content (Join-Path $Base 'config\instalacion.json') -Raw -ErrorAction SilentlyContinue)
}
"antes:   versión=$($antes.version) esquema=$($antes.esquema) exe=$($antes.exe)"

$argumentosInst = @("/PRUEBA=`"$Base`"") + ($Argumentos -split ' ' | Where-Object { $_ }) + $Extra
$p = Start-Process $Instalador -ArgumentList $argumentosInst -PassThru
$h = [IntPtr]::Zero
for ($i = 0; $i -lt 100; $i++) {
    Start-Sleep -Milliseconds 200; $p.Refresh(); $h = $p.MainWindowHandle
    if ($h -ne [IntPtr]::Zero -and $p.MainWindowTitle -like '*instalaci*') {
        $r = New-Object W.A+RECT; [void][W.A]::GetWindowRect($h, [ref]$r)
        if (($r.R - $r.L) -gt 300) { break }
    }
}
if ($h -eq [IntPtr]::Zero) { 'No apareció la ventana del instalador'; exit 1 }
$n = 0
if ($PaginaNueva) {
    Start-Sleep -Seconds 2
    Capturar $h (Join-Path $Salida 'pagina-nueva.png'); 'capturada la página de carpetas nuevas'
    [void][W.A]::PostMessage($h, 0x111, [IntPtr]1, [IntPtr]::Zero)      # Siguiente
}
$limite = (Get-Date).AddMinutes($MinutosMax)
while ((Get-Date) -lt $limite -and -not $p.HasExited) {
    Start-Sleep -Seconds 2
    $n++; if ($n -le 3 -or $n % 5 -eq 0) { Capturar $h (Join-Path $Salida ("actualizando{0:00}.png" -f $n)) }
}
"el instalador terminó solo: $($p.HasExited)$(if ($p.HasExited) { ' (código ' + $p.ExitCode + ')' })"
if (-not $p.HasExited) { $p.Kill() }
Start-Sleep -Seconds 6                                                   # la app reabierta tarda un poco en aparecer
$app = Get-Process ProyectoAlejandria -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$Base\*" }
$despues = [pscustomobject]@{
    version = (Get-ItemProperty $clave -ErrorAction SilentlyContinue).DisplayVersion
    esquema = (Get-ItemProperty $clave -ErrorAction SilentlyContinue).Esquema
    exe     = (Get-FileHash $exeApp -Algorithm SHA256).Hash.Substring(0, 12)
    config  = (Get-Content (Join-Path $Base 'config\instalacion.json') -Raw -ErrorAction SilentlyContinue)
}
"después: versión=$($despues.version) esquema=$($despues.esquema) exe=$($despues.exe)"
"neuronas intactas: $((Test-Path $centinela) -and ((Get-Content $centinela -Raw).Trim() -eq 'estas neuronas no se tocan'))"
"app reabierta: $([bool]$app)"
"instalacion.json:"; $despues.config
$log = Join-Path $Base 'motor\instalacion.log'
if (Test-Path $log) { "--- final del registro:"; Get-Content $log -Tail 6 | ForEach-Object { $_.Substring(0, [Math]::Min(150, $_.Length)) } }
if ($app) { $app | Stop-Process -Force }
Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -like "$Base\*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
