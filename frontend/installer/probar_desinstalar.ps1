# Herramienta de desarrollo: ejecuta el desinstalador de una instalación hecha con probar.ps1 (/PRUEBA=<Base>), captura SOLO su ventana y avanza.
# `_?=` hace que el desinstalador se ejecute en su sitio (sin copiarse a TEMP y salir), para poder esperarle y verlo.
# Uso:  powershell -File installer\probar_desinstalar.ps1 -Base <carpeta> -Salida <capturas> [-BorrarDatos]
param([Parameter(Mandatory)][string]$Base, [Parameter(Mandatory)][string]$Salida, [switch]$BorrarDatos)
Add-Type -AssemblyName System.Drawing
Add-Type -Namespace W -Name D -MemberDefinition @'
[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool PostMessage(System.IntPtr h, uint m, System.IntPtr w, System.IntPtr l);
[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool PrintWindow(System.IntPtr h, System.IntPtr dc, uint flags);
[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool GetWindowRect(System.IntPtr h, out RECT r);
[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
[System.Runtime.InteropServices.StructLayout(System.Runtime.InteropServices.LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
'@
New-Item -ItemType Directory -Force $Salida | Out-Null
function Capturar($h, $ruta) {
    for ($k = 0; $k -lt 6; $k++) {
        $r = New-Object W.D+RECT; [void][W.D]::GetWindowRect($h, [ref]$r)
        if (($r.R - $r.L) -le 0) { Start-Sleep -Seconds 2; continue }
        $bmp = New-Object System.Drawing.Bitmap ($r.R - $r.L), ($r.B - $r.T)
        $g = [System.Drawing.Graphics]::FromImage($bmp); $dc = $g.GetHdc()
        [void][W.D]::PrintWindow($h, $dc, 2); $g.ReleaseHdc($dc); $g.Dispose(); $bmp.Save($ruta); $bmp.Dispose()
        if ((Get-Item $ruta).Length -gt 9000) { break }
        Start-Sleep -Seconds 2
    }
}
$app = Join-Path $Base 'app'
$argumentos = @("/PRUEBA=`"$Base`""); if ($BorrarDatos) { $argumentos += "/BORRAR-DATOS" }; $argumentos += "_?=$app"      # _?= debe ser SIEMPRE el último parámetro
$p = Start-Process (Join-Path $app "Desinstalar.exe") -ArgumentList $argumentos -PassThru
$h = [IntPtr]::Zero
# se espera a la ventana real (título de desinstalación y tamaño de ventana), no a un manejador provisional
for ($i = 0; $i -lt 100; $i++) {
    Start-Sleep -Milliseconds 200; $p.Refresh(); $h = $p.MainWindowHandle
    if ($h -ne [IntPtr]::Zero -and $p.MainWindowTitle -like '*desinstal*') {
        $r = New-Object W.D+RECT; [void][W.D]::GetWindowRect($h, [ref]$r)
        if (($r.R - $r.L) -gt 300) { break }
    }
}
if ($h -eq [IntPtr]::Zero) { 'No apareció la ventana del desinstalador'; exit 1 }
Start-Sleep -Seconds 7; Capturar $h (Join-Path $Salida 'desinstalar1.png'); 'capturada desinstalar1'
if ($BorrarDatos) { 'no se puede marcar la casilla desde fuera: prueba solo con los datos conservados'; }
[void][W.D]::PostMessage($h, 0x111, [IntPtr]1, [IntPtr]::Zero)                  # Desinstalar
Start-Sleep -Seconds 5; Capturar $h (Join-Path $Salida 'desinstalar2.png'); 'capturada desinstalar2'
[void][W.D]::PostMessage($h, 0x111, [IntPtr]1, [IntPtr]::Zero)                  # Cerrar
$p.WaitForExit(10000) | Out-Null
"desinstalador cerrado: $($p.HasExited)"
