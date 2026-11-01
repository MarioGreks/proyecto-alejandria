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
  File "${BACKEND}\requirements.txt"
  SetOutPath "$RutaApp"
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
FunctionEnd

; Parámetros para instalar.ps1 en un archivo clave=valor (UTF-16): la línea de órdenes de NSIS no admite más de 1024 caracteres.
Function LanzarPowerShell
  File "/oname=$PLUGINSDIR\instalar.ps1" "instalar.ps1"
  Delete "$PLUGINSDIR\estado.txt"
  Delete "$PLUGINSDIR\cancelar.flag"
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
  FileWriteUTF16LE $0 "Ollama=$OllamaSi$\r$\n"
  FileWriteUTF16LE $0 "Modelo=$ModeloNombre$\r$\n"
  FileWriteUTF16LE $0 "Prueba=$PruebaNum$\r$\n"
  FileClose $0
  Exec '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "$PLUGINSDIR\instalar.ps1" -Parametros "$PLUGINSDIR\parametros.txt"'
  StrCpy $PsLanzado 1
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
