; Desinstalador con el mismo aspecto oscuro. Sabe qué carpetas son de la instalación por los valores que el instalador dejó en su clave de registro.
; Con /PRUEBA=<carpeta> (la misma del instalador) usa la clave y los accesos directos de prueba.

Function un.onInit
  InitPluginsDir
  StrCpy $BorrarDatos 0
  ${un.GetParameters} $R0
  ${un.GetOptions} $R0 "/PRUEBA=" $R1
  ${IfNot} ${Errors}
    StrCpy $ModoPrueba 1
    StrCpy $BasePrueba $R1
    StrCpy $ClaveDesinst "Software\ProyectoAlejandriaPrueba"
    ${un.GetOptions} $R0 "/BORRAR-DATOS" $R2        ; solo en pruebas: marca la casilla (el arnés de pruebas no puede hacer clic)
    ${IfNot} ${Errors}
      StrCpy $BorrarDatos 1
    ${EndIf}
    StrCpy $CarpetaMenu "$R1\accesos\menu"
    StrCpy $CarpetaEscritorio "$R1\accesos\escritorio"
  ${Else}
    StrCpy $ModoPrueba 0
    StrCpy $ClaveDesinst "${UNINSTKEY}"
    StrCpy $CarpetaMenu "$SMPROGRAMS"
    StrCpy $CarpetaEscritorio "$DESKTOP"
  ${EndIf}
  StrCpy $RutaApp "$INSTDIR"
  ReadRegStr $RutaMotor HKCU "$ClaveDesinst" "MotorDir"
  ReadRegStr $RutaDatos HKCU "$ClaveDesinst" "DatosDir"
  ReadRegStr $RutaConfig HKCU "$ClaveDesinst" "ConfigFile"
  Call un.PrepararFuente
FunctionEnd

Function un.onGUIInit
  Call un.PrepararVentana
FunctionEnd

Function un.AlternarDatos
  Pop $Tmp
  ${If} $BorrarDatos = 1
    StrCpy $BorrarDatos 0
    ${NSD_SetText} $LblDatosUn "[ ] Borrar también mis neuronas y ajustes"
  ${Else}
    StrCpy $BorrarDatos 1
    ${NSD_SetText} $LblDatosUn "[x] Borrar también mis neuronas y ajustes"
  ${EndIf}
FunctionEnd

Function un.PgConfirmar
  !insertmacro NuevaPagina "DESINSTALAR"
  !insertmacro Texto $0 30 90 640 22 "Se va a desinstalar ${APP} de este equipo." ${C_BLANCO} $Mono
  !insertmacro Texto $0 30 130 640 18 "Se borrará:" ${C_SUAVE} $Mono
  !insertmacro Texto $0 50 156 150 18 "· la aplicación" ${C_VERDE} $Mono
  !insertmacro TextoRuta $0 210 156 460 18 "$RutaApp" ${C_BLANCO} $Mono
  !insertmacro Texto $0 50 182 150 18 "· el motor" ${C_VERDE} $Mono
  !insertmacro TextoRuta $0 210 182 460 18 "$RutaMotor" ${C_BLANCO} $Mono
  !insertmacro Texto $0 210 204 460 18 "(Python y librerías: se puede regenerar)" ${C_TENUE} $Mono
  !insertmacro Casilla $LblDatosUn 30 240 640 22 0 "" un.AlternarDatos
  ${If} $BorrarDatos = 1
    ${NSD_SetText} $LblDatosUn "[x] Borrar también mis neuronas y ajustes"
  ${Else}
    ${NSD_SetText} $LblDatosUn "[ ] Borrar también mis neuronas y ajustes"
  ${EndIf}
  !insertmacro Texto $0 30 280 640 18 "Tus neuronas están en:" ${C_SUAVE} $Mono
  !insertmacro TextoRuta $0 50 302 620 18 "$RutaDatos" ${C_BLANCO} $Mono
  !insertmacro Texto $0 30 328 640 18 "Por defecto se conservan, por si vuelves a instalar." ${C_SUAVE} $Mono
  !insertmacro Texto $0 30 380 640 40 "Ollama y sus modelos no se tocan: se desinstalan desde «Aplicaciones instaladas» de Windows." ${C_TENUE} $Mono
  !insertmacro BotonSuave $0 30 505 110 26 "[ Cancelar ]" un.IrCancelar
  !insertmacro Boton $0 560 505 110 26 "[ Desinstalar ]" un.IrSiguiente
  nsDialogs::Show
FunctionEnd

Function un.PgConfirmarSalir
FunctionEnd

; Vacía y quita una carpeta con robocopy, que admite rutas de más de 260 caracteres (la caché de uv las tiene) donde RMDir /r falla a medias.
; Entrada: $R0 = carpeta. Solo se llama con rutas que el instalador anotó y tras comprobar que son suyas.
Function un.BorrarCarpeta
  StrLen $R2 $R0
  ${If} $R2 < 8
    Return                      ; nunca una raíz de disco ni una ruta vacía
  ${EndIf}
  CreateDirectory "$PLUGINSDIR\vacio"
  nsExec::Exec '"$SYSDIR\robocopy.exe" "$PLUGINSDIR\vacio" "$R0" /MIR /NFL /NDL /NJH /NJS /NP /R:1 /W:1'
  Pop $R1
  RMDir "$R0"
FunctionEnd

; Borra solo lo que reconoce como suyo: no se vacía una carpeta cualquiera que alguien eligiera.
Function un.HacerBorrado
  ${NSD_KillTimer} un.HacerBorrado
  ; Si el backend de la app sigue vivo (su Python está dentro del motor), bloquea los archivos y el borrado quedaría a medias dejando el entorno roto.
  ${If} $RutaMotor != ""
    nsExec::Exec `"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -Command "Get-Process | Where-Object { $$_.Path -and $$_.Path.StartsWith('$RutaMotor\') } | Stop-Process -Force"`
    Pop $R0
  ${EndIf}
  StrCpy $R9 ""
  StrCpy $R8 ""
  ClearErrors
  Delete "$RutaApp\${EXE}"
  ${If} ${Errors}
    StrCpy $R9 "No se pudo borrar ${EXE}: ¿está abierto? Ciérralo y vuelve a desinstalar."
  ${EndIf}
  ${If} $R9 == ""
    RMDir /r "$RutaApp\backend"
    Delete "$RutaApp\Desinstalar.exe"
    RMDir "$RutaApp"
    Delete "$CarpetaMenu\${APP}.lnk"
    Delete "$CarpetaEscritorio\${APP}.lnk"
    DeleteRegKey HKCU "$ClaveDesinst"
    ${If} ${FileExists} "$RutaMotor\instalacion.log"
      StrCpy $R0 $RutaMotor
      Call un.BorrarCarpeta
      ${If} ${FileExists} "$RutaMotor"
        StrCpy $R8 "No se pudo borrar todo el motor: $RutaMotor"
      ${EndIf}
    ${EndIf}
    Delete "$RutaConfig"
    ${If} $ModoPrueba = 0
      ; lo que la app guarda por su cuenta junto al motor (la caché de su ventana, EBWebView) también es suyo; la carpeta de neuronas es otra (Roaming)
      StrCpy $R0 "$LOCALAPPDATA\${ID}"
      Call un.BorrarCarpeta
      RMDir "$APPDATA\${ID}"                      ; solo se quita si quedó vacía: si tienes neuronas ahí, se queda
    ${EndIf}
    ${If} $BorrarDatos = 1
      ${If} ${FileExists} "$RutaDatos\nodos.parquet"
      ${OrIf} ${FileExists} "$RutaDatos\ajustes.json"
        StrCpy $R0 $RutaDatos
        Call un.BorrarCarpeta
      ${EndIf}
    ${EndIf}
  ${EndIf}
  ${If} $R9 != ""
    SetCtlColors $LblEstadoUn ${C_ROJO} ${C_FONDO}
    ${NSD_SetText} $LblEstadoUn "[ERROR] $R9"
  ${Else}
    ${If} $R8 != ""
      StrCpy $R7 "[!!] $R8$\r$\n[ok] La aplicación sí se borró."
    ${Else}
      StrCpy $R7 "[ok] Aplicación y motor borrados."
    ${EndIf}
    ${If} $BorrarDatos = 1
      StrCpy $R7 "$R7$\r$\n[ok] Tus neuronas y ajustes también."
    ${Else}
      StrCpy $R7 "$R7$\r$\n[--] Tus neuronas se conservan en:$\r$\n     $RutaDatos"
    ${EndIf}
    ${NSD_SetText} $LblEstadoUn "$R7$\r$\n$\r$\nOllama sigue instalado."
  ${EndIf}
  ShowWindow $BtnCerrarUn ${SW_SHOW}
FunctionEnd

Function un.PgBorrando
  !insertmacro NuevaPagina "DESINSTALANDO"
  !insertmacro Texto $LblEstadoUn 30 90 640 200 "Borrando..." ${C_BLANCO} $Mono
  !insertmacro Boton $BtnCerrarUn 560 505 110 26 "[ Cerrar ]" un.IrSiguiente
  ShowWindow $BtnCerrarUn ${SW_HIDE}
  ${NSD_CreateTimer} un.HacerBorrado 200
  nsDialogs::Show
FunctionEnd

Function un.PgBorrandoSalir
FunctionEnd
