; Modo actualización: el que usa la propia app (tauri-plugin-updater lanza el instalador con «/P /UPDATE») o quien lo ejecute con /ACTUALIZAR.
; Sin bienvenida, rutas, componentes ni resumen: lee lo que se eligió al instalar (registro), cierra la app, copia lo nuevo, deja que instalar.ps1 repase el motor
; (librerías por si cambiaron; lo que ya está se salta) y vuelve a abrir la app. Tus neuronas no se tocan. Si la versión nueva añade carpetas nuevas
; (sube ESQUEMA en instalador.nsi), solo se pregunta por esas.

; Lo que se eligió al instalar. Sin nada instalado no hay qué actualizar: se hace una instalación normal.
Function CargarInstalacion
  ReadRegStr $0 HKCU "$ClaveDesinst" "InstallLocation"
  ${If} $0 == ""
    ; Sin la entrada de «Aplicaciones instaladas» (alguien la limpió): si la app está en su sitio de siempre se actualiza igualmente, con las carpetas de siempre
    ; (instalar.ps1 respeta las que diga instalacion.json). Si no hay nada, es una instalación normal.
    ${If} $ModoPrueba = 0
    ${AndIf} ${FileExists} "$LOCALAPPDATA\Programs\${APP}\${EXE}"
      StrCpy $EsquemaInst 1
      ${If} ${FileExists} "$CarpetaEscritorio\${APP}.lnk"
        StrCpy $EscritorioSi 1
      ${Else}
        StrCpy $EscritorioSi 0
      ${EndIf}
      StrCpy $OllamaSi 0
      StrCpy $ModeloSel 0
      Return                               ; $RutaApp y las demás ya valen las de siempre (.onInit)
    ${EndIf}
    StrCpy $Actualizando 0
    Return
  ${EndIf}
  StrCpy $RutaApp $0
  ReadRegStr $0 HKCU "$ClaveDesinst" "MotorDir"
  ${If} $0 != ""
    StrCpy $RutaMotor $0
  ${EndIf}
  ReadRegStr $0 HKCU "$ClaveDesinst" "DatosDir"
  ${If} $0 != ""
    StrCpy $RutaDatos $0
  ${EndIf}
  ReadRegStr $0 HKCU "$ClaveDesinst" "ConfigFile"
  ${If} $0 != ""
    StrCpy $RutaConfig $0
  ${EndIf}
  ClearErrors
  ReadRegDWORD $EsquemaInst HKCU "$ClaveDesinst" "Esquema"
  ${If} ${Errors}
    StrCpy $EsquemaInst 1                  ; instalaciones anteriores a las actualizaciones: sin el dato, estructura 1
  ${EndIf}
  ${If} ${FileExists} "$CarpetaEscritorio\${APP}.lnk"
    StrCpy $EscritorioSi 1
  ${Else}
    StrCpy $EscritorioSi 0
  ${EndIf}
  StrCpy $OllamaSi 0                       ; Ollama y los modelos no se tocan al actualizar
  StrCpy $ModeloSel 0
FunctionEnd

; Cierra la app y lo que cuelga de ella (el backend de Python del motor): si no, no se puede sobrescribir el .exe ni actualizar las librerías.
; Solo procesos cuyo programa esté DENTRO de las carpetas de esta instalación (en pruebas, las de la prueba): nunca otra copia de la app.
Function CerrarAppEnMarcha
  System::Call 'kernel32::SetEnvironmentVariable(t "AP_RUTA_APP", t "$RutaApp")i.r0'
  System::Call 'kernel32::SetEnvironmentVariable(t "AP_RUTA_MOTOR", t "$RutaMotor")i.r0'
  nsExec::Exec `"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "$$a = $$env:AP_RUTA_APP + '\'; $$m = $$env:AP_RUTA_MOTOR + '\'; Get-CimInstance Win32_Process | Where-Object { $$_.ExecutablePath -and ($$_.ExecutablePath.StartsWith($$a, [StringComparison]::OrdinalIgnoreCase) -or $$_.ExecutablePath.StartsWith($$m, [StringComparison]::OrdinalIgnoreCase)) } | ForEach-Object { Stop-Process -Id $$_.ProcessId -Force -ErrorAction SilentlyContinue }; Start-Sleep -Milliseconds 1200"`
  Pop $0
FunctionEnd

; La ventana del instalador en una actualización: 380x112, abajo a la derecha del área de trabajo, siempre visible, sin barra de título y sin botón en la barra
; de tareas (que no parezca un instalador). Si algo se atasca, a los 60 s sin noticias aparece [ Cerrar ] (no hay otra forma de cerrarla).
Function PrepararVentanaMini
  Call PrepararVentana                     ; oscura y sin los botones de Windows
  System::Alloc 16
  Pop $1
  System::Call 'user32::SystemParametersInfo(i 48, i 0, i r1, i 0)'      ; SPI_GETWORKAREA
  System::Call '*$1(i .r2, i .r3, i .r4, i .r5)'
  System::Free $1
  IntOp $6 $4 - 396                        ; derecha - 380 - 16
  IntOp $7 $5 - 128                        ; abajo - 112 - 16
  System::Call 'user32::GetWindowLong(i $HWNDPARENT, i -16)i .r0'
  IntOp $0 $0 & 0xFF3FFFFF                 ; sin WS_CAPTION
  System::Call 'user32::SetWindowLong(i $HWNDPARENT, i -16, i r0)'
  System::Call 'user32::GetWindowLong(i $HWNDPARENT, i -20)i .r0'
  IntOp $0 $0 & 0xFFFBFFFF                 ; sin WS_EX_APPWINDOW...
  IntOp $0 $0 | 0x80                       ; ...y como ventana de herramientas: no sale en la barra de tareas
  System::Call 'user32::SetWindowLong(i $HWNDPARENT, i -20, i r0)'
  System::Call 'user32::SetWindowPos(i $HWNDPARENT, i -1, i r6, i r7, i 380, i 112, i 0x30)'      ; HWND_TOPMOST, sin activar, recalcula el marco
  GetDlgItem $2 $HWNDPARENT 1018
  System::Call 'user32::SetWindowPos(i r2, i 0, i 0, i 0, i 380, i 112, i 0x14)'
FunctionEnd

; Al terminar la actualización: vuelve a abrir la app (con la configuración de prueba si es una prueba) y cierra el instalador.
Function LanzarAppActualizada
  ${If} $ModoPrueba = 1
    System::Call 'kernel32::SetEnvironmentVariable(t "ALEJANDRIA_CONFIG", t "$RutaConfig")i.r0'
  ${EndIf}
  SetOutPath "$RutaApp"
  Exec '"$RutaApp\${EXE}"'
FunctionEnd

; ---------------------------------------------------------------- Carpetas nuevas de una versión (solo si cambia la estructura de rutas)
; Hoy no hay ninguna: con /ESQUEMA-NUEVO (solo pruebas) se finge que la versión trae una carpeta nueva, para ver esta pantalla y su efecto.
Var EdNueva

Function ExaminarNueva
  Pop $Tmp
  ${NSD_GetText} $EdNueva $0
  nsDialogs::SelectFolderDialog "Carpeta nueva" "$0"
  Pop $0
  ${If} $0 != error
    ${NSD_SetText} $EdNueva $0
  ${EndIf}
FunctionEnd

Function PgRutasNuevas
  ${If} $Actualizando = 0
    Abort
  ${EndIf}
  ${If} $EsquemaInst >= $EsquemaActual
    Abort
  ${EndIf}
  !insertmacro NuevaPagina "NOVEDAD: CARPETA NUEVA"
  !insertmacro Texto $0 30 78 640 36 "Esta versión necesita una carpeta que la anterior no usaba.$\r$\nElige dónde quieres que esté (puedes dejar la propuesta)." ${C_SUAVE} $Mono
  !insertmacro Texto $0 30 142 640 18 "Carpeta nueva (prueba)" ${C_BLANCO} $Mono
  !insertmacro Campo $EdNueva 30 164 520 24 "$RutaDatos\Nueva"
  !insertmacro BotonSuave $0 560 164 110 24 "[ Examinar ]" ExaminarNueva
  !insertmacro PieFin "[ Actualizar > ]"
  nsDialogs::Show
FunctionEnd

Function PgRutasNuevasSalir
  ${NSD_GetText} $EdNueva $0
  StrCpy $1 $0 2 1
  ${If} $1 != ":\"
    MessageBox MB_OK|MB_ICONEXCLAMATION "Carpeta nueva: escribe una ruta completa, por ejemplo C:\Carpeta."
    Abort
  ${EndIf}
  StrCpy $NuevasRutas "carpeta_nueva_prueba=$0"
  Call PrepararVentanaMini                 ; ya elegida: el resto de la actualización va en la ventanita
FunctionEnd
