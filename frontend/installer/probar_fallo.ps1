# Herramienta de desarrollo: prueba la pantalla de error del instalador (/PRUEBA con /FALLAR) y que los botones [ Cerrar ] 
# funcionan de verdad. Hace CLIC en los botones (mensajes de ratón al control), no manda órdenes al asistente. Solo captura la ventana del instalador.
# Uso:  powershell -File installer\probar_fallo.ps1 -Base <carpeta> -Salida <capturas>
param(
    [string]$Instalador = (Join-Path $PSScriptRoot '..\src-tauri\target\release\bundle\Proyecto-Alejandria-Setup.exe'),
    [Parameter(Mandatory)][string]$Base, [Parameter(Mandatory)][string]$Salida
)
Add-Type -AssemblyName System.Drawing
Add-Type -Namespace W -Name F -MemberDefinition @'
public delegate bool EnumProc(System.IntPtr h, System.IntPtr l);
[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool EnumChildWindows(System.IntPtr p, EnumProc cb, System.IntPtr l);
[System.Runtime.InteropServices.DllImport("user32.dll", CharSet=System.Runtime.InteropServices.CharSet.Unicode)] public static extern int GetWindowText(System.IntPtr h, System.Text.StringBuilder s, int n);
[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool PostMessage(System.IntPtr h, uint m, System.IntPtr w, System.IntPtr l);
[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool PrintWindow(System.IntPtr h, System.IntPtr dc, uint flags);
[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool GetWindowRect(System.IntPtr h, out RECT r);
[System.Runtime.InteropServices.StructLayout(System.Runtime.InteropServices.LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
public static System.IntPtr BuscarHijo(System.IntPtr padre, string texto) {
    System.IntPtr hallado = System.IntPtr.Zero;
    EnumChildWindows(padre, (h, l) => { var sb = new System.Text.StringBuilder(256); GetWindowText(h, sb, 256); if (sb.ToString() == texto) { hallado = h; return false; } return true; }, System.IntPtr.Zero);
    return hallado;
}
'@
New-Item -ItemType Directory -Force $Salida | Out-Null
function Capturar($h, $ruta) {
    for ($k = 0; $k -lt 6; $k++) {
        $r = New-Object W.F+RECT; [void][W.F]::GetWindowRect($h, [ref]$r)
        if (($r.R - $r.L) -le 0) { Start-Sleep -Seconds 2; continue }
        $bmp = New-Object System.Drawing.Bitmap ($r.R - $r.L), ($r.B - $r.T)
        $g = [System.Drawing.Graphics]::FromImage($bmp); $dc = $g.GetHdc()
        [void][W.F]::PrintWindow($h, $dc, 2); $g.ReleaseHdc($dc); $g.Dispose(); $bmp.Save($ruta); $bmp.Dispose()
        if ((Get-Item $ruta).Length -gt 12000) { break }
        Start-Sleep -Seconds 2
    }
}
function Clic($h, $texto) {
    $c = [W.F]::BuscarHijo($h, $texto)
    if ($c -eq [IntPtr]::Zero) { return $false }
    [void][W.F]::PostMessage($c, 0x201, [IntPtr]1, [IntPtr](5 + (5 -shl 16))); Start-Sleep -Milliseconds 80
    [void][W.F]::PostMessage($c, 0x202, [IntPtr]0, [IntPtr](5 + (5 -shl 16)))
    return $true
}
function Siguiente($h) { [void][W.F]::PostMessage($h, 0x111, [IntPtr]1, [IntPtr]::Zero) }

$p = Start-Process $Instalador -ArgumentList "/PRUEBA=`"$Base`"", '/FALLAR' -PassThru
$h = [IntPtr]::Zero
for ($i = 0; $i -lt 100; $i++) {
    Start-Sleep -Milliseconds 200; $p.Refresh(); $h = $p.MainWindowHandle
    if ($h -ne [IntPtr]::Zero -and $p.MainWindowTitle -like '*instalaci*') { $r = New-Object W.F+RECT; [void][W.F]::GetWindowRect($h, [ref]$r); if (($r.R - $r.L) -gt 300) { break } }
}
foreach ($n in 1..4) { Start-Sleep -Seconds 3; Siguiente $h }          # hasta «Instalar»
Start-Sleep -Seconds 10                                                # la instalación falla casi enseguida
Capturar $h (Join-Path $Salida 'error.png'); 'capturada error.png'
$ok = Clic $h "[ Cerrar ]"; "clic en Cerrar: $ok"
$p.WaitForExit(8000) | Out-Null
"el instalador se cerró: $($p.HasExited)"
if (-not $p.HasExited) { $p.Kill() }
