# Herramienta de desarrollo: recorre el instalador entero en MODO PRUEBA (todo en una carpeta temporal y una clave de registro de prueba),
# capturando SOLO su ventana (PrintWindow: nunca el escritorio) en cada página, y espera a que termine la instalación.
# Uso:  powershell -File installer\probar.ps1 -Base <carpeta> -Salida <carpeta de capturas> [-OllamaForzar] [-MinutosMax 12]
param(
    [string]$Instalador = (Join-Path $PSScriptRoot '..\src-tauri\target\release\bundle\Proyecto-Alejandria-Setup.exe'),
    [Parameter(Mandatory)][string]$Base,
    [Parameter(Mandatory)][string]$Salida,
    [switch]$OllamaForzar,
    [int]$MinutosMax = 12
)
Add-Type -AssemblyName System.Drawing
Add-Type -Namespace W -Name N -MemberDefinition @'
[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool PostMessage(System.IntPtr h, uint m, System.IntPtr w, System.IntPtr l);
[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool PrintWindow(System.IntPtr h, System.IntPtr dc, uint flags);
[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool GetWindowRect(System.IntPtr h, out RECT r);
[System.Runtime.InteropServices.StructLayout(System.Runtime.InteropServices.LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
'@
New-Item -ItemType Directory -Force $Salida | Out-Null
function Capturar($h, $ruta) {
    for ($k = 0; $k -lt 6; $k++) {    # PrintWindow devuelve una imagen casi vacía si la página aún no se ha pintado: se reintenta
        $r = New-Object W.N+RECT; [void][W.N]::GetWindowRect($h, [ref]$r)
        if (($r.R - $r.L) -le 0) { Start-Sleep -Seconds 2; continue }
        $bmp = New-Object System.Drawing.Bitmap ($r.R - $r.L), ($r.B - $r.T)
        $g = [System.Drawing.Graphics]::FromImage($bmp); $dc = $g.GetHdc()
        [void][W.N]::PrintWindow($h, $dc, 2); $g.ReleaseHdc($dc); $g.Dispose()
        $bmp.Save($ruta); $bmp.Dispose()
        if ((Get-Item $ruta).Length -gt 12000) { break }
        Start-Sleep -Seconds 2
    }
}
function Siguiente($h) { [void][W.N]::PostMessage($h, 0x111, [IntPtr]1, [IntPtr]::Zero) }   # WM_COMMAND 1 = Siguiente

$args2 = @("/PRUEBA=`"$Base`"")
if ($OllamaForzar) { $args2 += '/OLLAMA-FORZAR' }
$p = Start-Process $Instalador -ArgumentList $args2 -PassThru
$h = [IntPtr]::Zero
# se espera a la ventana real (título del asistente y tamaño de ventana), no a un manejador provisional
for ($i = 0; $i -lt 100; $i++) {
    Start-Sleep -Milliseconds 200; $p.Refresh(); $h = $p.MainWindowHandle
    if ($h -ne [IntPtr]::Zero -and $p.MainWindowTitle -like '*instalaci*') {
        $r = New-Object W.N+RECT; [void][W.N]::GetWindowRect($h, [ref]$r)
        if (($r.R - $r.L) -gt 300) { break }
    }
}
if ($h -eq [IntPtr]::Zero) { 'No apareció la ventana del instalador'; exit 1 }

foreach ($n in 1..4) {            # bienvenida, rutas, componentes, resumen
    Start-Sleep -Seconds 3
    Capturar $h (Join-Path $Salida "pagina$n.png"); "capturada pagina$n"
    Siguiente $h
}
$fin = Join-Path $Base 'config\instalacion.json'
$limite = (Get-Date).AddMinutes($MinutosMax); $k = 0
while ((Get-Date) -lt $limite -and -not (Test-Path $fin) -and -not $p.HasExited) {
    Start-Sleep -Seconds 4
    $k++; if ($k % 3 -eq 1) { Capturar $h (Join-Path $Salida ("instalando{0:00}.png" -f $k)) }
}
"instalación terminada: $(Test-Path $fin)"
Start-Sleep -Seconds 3
Capturar $h (Join-Path $Salida 'instalando_final.png')
Siguiente $h; Start-Sleep -Seconds 3
Capturar $h (Join-Path $Salida 'fin.png')
Siguiente $h; Start-Sleep -Seconds 6                     # Finalizar (con «abrir al terminar» marcada, la app instalada debe arrancar)
$abierta = Get-Process ProyectoAlejandria -ErrorAction SilentlyContinue
"la app se abrió al terminar: $([bool]$abierta)"
if ($abierta) { $abierta | Stop-Process -Force }
if (-not $p.HasExited) { [void][W.N]::PostMessage($h, 0x111, [IntPtr]2, [IntPtr]::Zero); Start-Sleep 1; if (-not $p.HasExited) { $p.Kill() } }
"instalador cerrado (código $($p.ExitCode))"
