; Instalador de Proyecto Alejandría: asistente propio, oscuro y en ASCII (páginas de nsDialogs; no usa las pantallas blancas de Windows).
; Se compila con installer/construir.mjs (npm run instalador). Las fuentes llevan BOM UTF-8: NSIS lo necesita para leer los acentos.
; Para probarlo sin tocar tu sistema:  Proyecto-Alejandria-Setup.exe /PRUEBA=C:\carpeta\de\prueba   (ver .onInit)
Unicode true
SetCompressor /SOLID lzma
RequestExecutionLevel user
ManifestDPIAware notset              ; Windows escala la ventana entera: un poco borrosa a >100 %, pero la maquetación no se descuadra

!include LogicLib.nsh
!include nsDialogs.nsh
!include WinMessages.nsh
!include FileFunc.nsh
!insertmacro GetParameters
!insertmacro GetOptions
!insertmacro un.GetParameters
!insertmacro un.GetOptions

!define APP "Proyecto Alejandría"
!define EXE "ProyectoAlejandria.exe"
!define VERSION "0.7.5"
!define ID "dev.alejandria.app"      ; el mismo que tauri.conf.json: de él salen las carpetas de datos de la app
!define UNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP}"
!define WEBVIEW2 "{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
!define ESQUEMA 1                    ; estructura de rutas de instalacion.json: súbela cuando una versión añada una carpeta nueva (ver actualizar.nsh)
!define RAIZ ".."                    ; frontend/
!define BACKEND "..\..\backend"

Name "${APP}"
Caption "${APP} · instalación"
UninstallCaption "${APP} · desinstalación"
; Solo para probar el actualizador de extremo a extremo: `makensis /DPRUEBA_BASE=C:\carpeta instalador.nsi` fabrica un instalador que actúa como si le hubieran
; pasado /PRUEBA=C:\carpeta, para que la actualización que lanza la app no toque la instalación real del usuario. El instalador que se publica NO lleva esto.
!ifdef PRUEBA_BASE
  OutFile "${RAIZ}\src-tauri\target\release\bundle\Proyecto-Alejandria-Setup-PRUEBA.exe"
!else
  OutFile "${RAIZ}\src-tauri\target\release\bundle\Proyecto-Alejandria-Setup.exe"
!endif
InstallDir "$LOCALAPPDATA\Programs\${APP}"
Icon "${RAIZ}\src-tauri\icons\icon.ico"
UninstallIcon "${RAIZ}\src-tauri\icons\icon.ico"
BrandingText " "

VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "${APP}"
VIAddVersionKey "FileDescription" "Instalador de ${APP}"
VIAddVersionKey "LegalCopyright" "MIT License"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"

!include "ui.nsh"
!include "pilar.nsh"
!include "rutas.nsh"
!include "actualizar.nsh"
!include "paginas.nsh"
!include "instalacion.nsh"
!include "desinstalador.nsh"

Page custom PgBienvenida PgBienvenidaSalir
Page custom PgRutas PgRutasSalir
Page custom PgComponentes PgComponentesSalir
Page custom PgResumen PgResumenSalir
Page custom PgRutasNuevas PgRutasNuevasSalir
Page custom PgInstalar PgInstalarSalir
Page custom PgFin PgFinSalir

UninstPage custom un.PgConfirmar un.PgConfirmarSalir
UninstPage custom un.PgBorrando un.PgBorrandoSalir

Function .onInit
  ${GetParameters} $R0
  !ifdef PRUEBA_BASE
    StrCpy $R0 `$R0 /PRUEBA="${PRUEBA_BASE}"`
  !endif
  StrCpy $EsquemaActual ${ESQUEMA}
  ${GetOptions} $R0 "/PRUEBA=" $R1
  ${IfNot} ${Errors}
    ; Modo prueba: todo dentro de la carpeta indicada y una clave de registro propia; no se abre la app ni se toca nada más.
    StrCpy $ModoPrueba 1
    StrCpy $PruebaNum 1
    StrCpy $BasePrueba $R1
    StrCpy $RutaApp "$R1\app"
    StrCpy $RutaMotor "$R1\motor"
    StrCpy $RutaDatos "$R1\datos"
    StrCpy $RutaModelos "$R1\modelos"
    StrCpy $RutaOllama "$R1\ollama"
    StrCpy $RutaConfig "$R1\config\instalacion.json"
    StrCpy $CarpetaMenu "$R1\accesos\menu"
    StrCpy $CarpetaEscritorio "$R1\accesos\escritorio"
    StrCpy $ClaveDesinst "Software\ProyectoAlejandriaPrueba"
    ${GetOptions} $R0 "/FALLAR" $R2
    ${IfNot} ${Errors}
      StrCpy $PruebaNum 3        ; la instalación de fondo falla a propósito, para probar la pantalla de error y [ Cerrar ]
    ${EndIf}
    ${GetOptions} $R0 "/OLLAMA-FORZAR" $R2
    ${IfNot} ${Errors}
      StrCpy $PruebaNum 2        ; descarga 50 MB de Ollama aunque ya esté instalado, para ver la barra
    ${EndIf}
    ${GetOptions} $R0 "/VCVIEJO" $R2
    ${IfNot} ${Errors}
      StrCpy $PruebaNum 4        ; como si el msvcp140.dll del equipo fuera el de 2020: debe parar al principio con su aviso
    ${EndIf}
    ${GetOptions} $R0 "/MOTORFALLA" $R2
    ${IfNot} ${Errors}
      StrCpy $PruebaNum 5        ; la prueba del motor se cae a propósito (0xC0000005): debe parar tras instalar las librerías, con su aviso
    ${EndIf}
    ${GetOptions} $R0 "/ESQUEMA-NUEVO" $R2
    ${IfNot} ${Errors}
      StrCpy $EsquemaActual 2    ; finge que esta versión trae una carpeta nueva: la actualización debe preguntar por ella
    ${EndIf}
  ${Else}
    StrCpy $ModoPrueba 0
    StrCpy $PruebaNum 0
    StrCpy $RutaApp "$LOCALAPPDATA\Programs\${APP}"
    StrCpy $RutaMotor "$LOCALAPPDATA\${ID}\motor"
    StrCpy $RutaDatos "$APPDATA\${ID}\datos"
    StrCpy $RutaModelos "$PROFILE\.ollama\models"
    StrCpy $RutaOllama "$LOCALAPPDATA\Programs\Ollama"
    StrCpy $RutaConfig "$APPDATA\${ID}\instalacion.json"
    StrCpy $CarpetaMenu "$SMPROGRAMS"
    StrCpy $CarpetaEscritorio "$DESKTOP"
    StrCpy $ClaveDesinst "${UNINSTKEY}"
  ${EndIf}
  StrCpy $EscritorioSi 1
  StrCpy $AbrirSi 1
  StrCpy $ModeloSel 1
  ; Modo actualización: lo lanza el actualizador de la app (con /UPDATE) o se pide con /ACTUALIZAR. Parte de lo que se eligió al instalar.
  StrCpy $Actualizando 0
  ${GetOptions} $R0 "/UPDATE" $R2
  ${IfNot} ${Errors}
    StrCpy $Actualizando 1
  ${EndIf}
  ${GetOptions} $R0 "/ACTUALIZAR" $R2
  ${IfNot} ${Errors}
    StrCpy $Actualizando 1
  ${EndIf}
  ${If} $Actualizando = 1
    Call CargarInstalacion
  ${EndIf}
  Call PrepararFuente
FunctionEnd

Function .onGUIInit
  ${If} $Actualizando = 1
  ${AndIf} $EsquemaInst >= $EsquemaActual
    Call PrepararVentanaMini               ; una actualización no se ve como un instalador (si pide carpetas nuevas, esa pantalla va en la ventana normal y luego se encoge)
  ${Else}
    Call PrepararVentana
  ${EndIf}
FunctionEnd

; Sin secciones de instalación NSIS no compila: todo el trabajo lo hacen las funciones de las páginas.
Section "-vacia"
SectionEnd

; El trabajo del desinstalador lo hacen las funciones de sus páginas (desinstalador.nsh); NSIS exige que exista la sección.
Section "Uninstall"
SectionEnd
