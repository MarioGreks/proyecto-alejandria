; Instalación real: copia de la aplicación (aquí, con NSIS) + trabajo pesado en segundo plano (instalar.ps1), cuyo avance se lee de un archivo.
!include WordFunc.nsh
!insertmacro WordFind


; Copia la aplicación, crea el desinstalador, los accesos directos y la entrada de «Aplicaciones instaladas».
Function InstalarApp
  ClearErrors
  CreateDirectory "$RutaApp"
  SetOutPath "$RutaApp"
  File "/oname=${EXE}" "${RAIZ}\src-tauri\target\release\frontend.exe"
  ${If} ${Errors}
    StrCpy $ErrorFatal "No se pudo copiar ${APP}. Si está abierta, ciérrala y vuelve a ejecutar el instalador."
    Return
  ${EndIf}
  SetOutPath "$RutaApp\backend"
  File "${BACKEND}\main.py"
  File "${BACKEND}\database.py"
  File "${BACKEND}\clasificador.py"
  File "${BACKEND}\ollama_service.py"
  File "${BACKEND}\ajustes.py"
  File "${BACKEND}\intercambio.py"
  File "${BACKEND}\vigilante.py"
  File "${BACKEND}\idioma.py"
  File "${BACKEND}\limpieza.py"
  File "${BACKEND}\sincronizacion.py"
  File "${BACKEND}\papelera.py"
  File "${BACKEND}\agenda.py"
  File "${BACKEND}\subredes.py"
  File "${BACKEND}\sugerencias.py"
  File "${BACKEND}\requirements.txt"
  SetOutPath "$RutaApp"
  File "..\..\LICENSE"                       ; licencia del proyecto y avisos de terceros (se generan con `npm run avisos`), junto a la app
  File "..\..\THIRD-PARTY-NOTICES.md"
  WriteUninstaller "$RutaApp\Desinstalar.exe"

  CreateDirectory "$CarpetaMenu"
  CreateShortcut "$CarpetaMenu\${APP}.lnk" "$RutaApp\${EXE}" "" "$RutaApp\${EXE}" 0
  ${If} $EscritorioSi = 1
    CreateDirectory "$CarpetaEscritorio"
    CreateShortcut "$CarpetaEscritorio\${APP}.lnk" "$RutaApp\${EXE}" "" "$RutaApp\${EXE}" 0
  ${EndIf}

  WriteRegStr HKCU "$ClaveDesinst" "DisplayName" "${APP}"
  WriteRegStr HKCU "$ClaveDesinst" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "$ClaveDesinst" "Publisher" "${APP}"
  WriteRegStr HKCU "$ClaveDesinst" "DisplayIcon" "$RutaApp\${EXE}"
  WriteRegStr HKCU "$ClaveDesinst" "InstallLocation" "$RutaApp"
  WriteRegStr HKCU "$ClaveDesinst" "UninstallString" '"$RutaApp\Desinstalar.exe"'
  WriteRegDWORD HKCU "$ClaveDesinst" "NoModify" 1
  WriteRegDWORD HKCU "$ClaveDesinst" "NoRepair" 1
  ; Lo que el desinstalador necesita saber (puede que el usuario eligiera carpetas distintas de las de siempre)
  WriteRegStr HKCU "$ClaveDesinst" "MotorDir" "$RutaMotor"
  WriteRegStr HKCU "$ClaveDesinst" "DatosDir" "$RutaDatos"
  WriteRegStr HKCU "$ClaveDesinst" "ConfigFile" "$RutaConfig"
  WriteRegDWORD HKCU "$ClaveDesinst" "EstimatedSize" 600000
  WriteRegDWORD HKCU "$ClaveDesinst" "Esquema" $EsquemaActual     ; estructura de rutas de esta instalación (ver actualizar.nsh)
FunctionEnd

; Parámetros para instalar.ps1 en un archivo clave=valor (UTF-16): la línea de órdenes de NSIS no admite más de 1024 caracteres.
Function LanzarPowerShell
  File "/oname=$PLUGINSDIR\instalar.ps1" "instalar.ps1"
  Delete "$PLUGINSDIR\estado.txt"
  Delete "$PLUGINSDIR\cancelar.flag"
  Delete "$RutaMotor\instalacion.ok"
  Delete "$RutaMotor\instalacion.error"
  ${If} $ModeloSel = 1
    StrCpy $ModeloNombre "qwen2.5:1.5b"
  ${ElseIf} $ModeloSel = 2
    StrCpy $ModeloNombre "phi3:mini"
  ${Else}
    StrCpy $ModeloNombre ""
  ${EndIf}
  FileOpen $0 "$PLUGINSDIR\parametros.txt" w
  FileWriteUTF16LE /BOM $0 "Motor=$RutaMotor$\r$\n"
  FileWriteUTF16LE $0 "Backend=$RutaApp\backend$\r$\n"
  FileWriteUTF16LE $0 "Estado=$PLUGINSDIR\estado.txt$\r$\n"
  FileWriteUTF16LE $0 "Cancelar=$PLUGINSDIR\cancelar.flag$\r$\n"
  FileWriteUTF16LE $0 "Config=$RutaConfig$\r$\n"
  FileWriteUTF16LE $0 "Datos=$RutaDatos$\r$\n"
  FileWriteUTF16LE $0 "Modelos=$RutaModelos$\r$\n"
  FileWriteUTF16LE $0 "RutaOllama=$RutaOllama$\r$\n"
  FileWriteUTF16LE $0 "Ollama=$OllamaSi$\r$\n"
  FileWriteUTF16LE $0 "Modelo=$ModeloNombre$\r$\n"
  FileWriteUTF16LE $0 "Prueba=$PruebaNum$\r$\n"
  FileWriteUTF16LE $0 "Actualizar=$Actualizando$\r$\n"
  FileWriteUTF16LE $0 "Esquema=$EsquemaActual$\r$\n"
  FileWriteUTF16LE $0 "Nuevas=$NuevasRutas$\r$\n"
  FileClose $0
  ; Sin ventana de consola desde el primer instante (CREATE_NO_WINDOW): con `Exec`, Windows 11 con Terminal como consola predeterminada abre una pestaña de Terminal
  ; (y un botón en la barra de tareas) aunque PowerShell se oculte después. Si CreateProcess fallara, se usa el arranque de siempre.
  Push $1
  Push $2
  Push $3
  Push $4
  StrCpy $3 '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "$PLUGINSDIR\instalar.ps1" -Parametros "$PLUGINSDIR\parametros.txt"'
  System::Alloc 68                         ; STARTUPINFO (a ceros; cb = 68)
  Pop $1
  System::Call '*$1(i 68)'
  System::Alloc 16                         ; PROCESS_INFORMATION
  Pop $2
  System::Call 'kernel32::CreateProcess(p 0, t r3, p 0, p 0, i 0, i 0x08000000, p 0, p 0, p r1, p r2)i .r0'      ; (con `t n` NSIS pasaría la letra «n» como nombre: error 123)
  ${If} $0 = 0
    Exec $3
  ${Else}
    System::Call '*$2(p .r3, p .r4)'       ; hProcess, hThread: ya no hacen falta
    System::Call 'kernel32::CloseHandle(p r3)'
    System::Call 'kernel32::CloseHandle(p r4)'
  ${EndIf}
  System::Free $1
  System::Free $2
  Pop $4
  Pop $3
  Pop $2
  Pop $1
  StrCpy $PsLanzado 1
FunctionEnd

; Respaldo del archivo de estado: instalar.ps1 deja además instalacion.ok / instalacion.error en la carpeta del motor al terminar. Si el archivo de estado
; no llega (antivirus, bloqueos, rutas raras), el asistente se entera igualmente del final en vez de quedarse esperando.
Function ComprobarFinPs
  ${If} $EstadoPs == "ok"
  ${OrIf} $EstadoPs == "error"
    Return
  ${EndIf}
  ${If} ${FileExists} "$RutaMotor\instalacion.ok"
    StrCpy $EstadoPs "ok"
    ${If} $FasePct2 <> -1
      StrCpy $FasePct2 100
    ${EndIf}
    ${If} $FasePct3 <> -1
      StrCpy $FasePct3 100
    ${EndIf}
    ${If} $FasePct4 <> -1
      StrCpy $FasePct4 100
    ${EndIf}
    ${If} $FasePct5 <> -1
      StrCpy $FasePct5 100
    ${EndIf}
    ${If} $FasePct6 <> -1
      StrCpy $FasePct6 100
    ${EndIf}
    ${If} $FasePct7 <> -1
      StrCpy $FasePct7 100
    ${EndIf}
  ${ElseIf} ${FileExists} "$RutaMotor\instalacion.error"
    StrCpy $MensajePs "La instalación falló"
    ClearErrors
    FileOpen $0 "$RutaMotor\instalacion.error" r
    ${IfNot} ${Errors}
      FileRead $0 $MensajePs
      FileClose $0
    ${EndIf}
    StrCpy $EstadoPs "error"
  ${EndIf}
FunctionEnd

; Lee la línea de estado «uv|python|librerías|ollama|modelo|estado|mensaje» que deja instalar.ps1
Function LeerEstadoPs
  ClearErrors
  FileOpen $0 "$PLUGINSDIR\estado.txt" r
  ${If} ${Errors}
    Return
  ${EndIf}
  FileRead $0 $1
  FileClose $0
  ${If} $1 == ""
    Return
  ${EndIf}
  ${WordFind} $1 "|" "+1" $FasePct2
  ${WordFind} $1 "|" "+2" $FasePct3
  ${WordFind} $1 "|" "+3" $FasePct4
  ${WordFind} $1 "|" "+4" $FasePct5
  ${WordFind} $1 "|" "+5" $FasePct6
  ${WordFind} $1 "|" "+6" $FasePct7
  ${WordFind} $1 "|" "+7" $EstadoPs
  ${WordFind} $1 "|" "+8" $MensajePs
FunctionEnd
