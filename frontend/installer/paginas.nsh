; Páginas del asistente (nsDialogs). Todas siguen el mismo patrón: NuevaPagina + controles + pie de botones + nsDialogs::Show.

!include Sections.nsh

; ---------------------------------------------------------------- 1. Bienvenida (pilar girando)
Var PilarCtl
Var Fotograma

Function MostrarFotograma
  StrCpy $0 $Fotograma
  Call ObtenerFotograma
  Pop $0
  ${NSD_SetText} $PilarCtl $0
FunctionEnd

Function AnimarPilar
  IntOp $Fotograma $Fotograma + 1
  ${If} $Fotograma >= ${PILAR_FOTOGRAMAS}
    StrCpy $Fotograma 0
  ${EndIf}
  Call MostrarFotograma
FunctionEnd

Function PgBienvenida
  !insertmacro NuevaPagina "PROYECTO ALEJANDRÍA"
  ${NSD_CreateLabel} 30 80 220 410 ""
  Pop $PilarCtl
  SetCtlColors $PilarCtl ${C_VERDE} ${C_FONDO}
  SendMessage $PilarCtl ${WM_SETFONT} $Mono 1
  StrCpy $Fotograma 0
  Call MostrarFotograma
  ${NSD_CreateTimer} AnimarPilar 110
  !insertmacro Texto $0 270 90 400 22 "Tu segundo cerebro, local y privado." ${C_BLANCO} $Mono
  !insertmacro Texto $0 270 130 400 120 "Este asistente va a:$\r$\n$\r$\n  1. elegir dónde se instala todo,$\r$\n  2. descargar Python, las librerías y el modelo de$\r$\n     clasificación (unos 480 MB, una sola vez),$\r$\n  3. instalar Ollama, la IA local, si quieres." ${C_SUAVE} $Mono
  !insertmacro Texto $0 270 290 400 60 "Nada sale de tu equipo: las neuronas, la IA y los laboratorios funcionan en local." ${C_SUAVE} $Mono
  !insertmacro Texto $0 270 460 400 18 "Versión ${VERSION} · licencia MIT" ${C_TENUE} $Mono
  !insertmacro PieSinAtras "[ Siguiente > ]"
  nsDialogs::Show
FunctionEnd

Function PgBienvenidaSalir
  ${NSD_KillTimer} AnimarPilar
FunctionEnd

; ---------------------------------------------------------------- 2. Rutas
Var EdApp
Var EdMotor
Var EdDatos
Var EdModelos

!macro DefExaminar NOMBRE ED TITULO
  Function ${NOMBRE}
    Pop $Tmp
    ${NSD_GetText} ${ED} $0
    nsDialogs::SelectFolderDialog "${TITULO}" "$0"
    Pop $0
    ${If} $0 != error
      ${NSD_SetText} ${ED} $0
    ${EndIf}
  FunctionEnd
!macroend
!insertmacro DefExaminar ExaminarApp $EdApp "Carpeta de la aplicación"
!insertmacro DefExaminar ExaminarMotor $EdMotor "Carpeta del motor (Python y librerías)"
!insertmacro DefExaminar ExaminarDatos $EdDatos "Carpeta de tus neuronas"
!insertmacro DefExaminar ExaminarModelos $EdModelos "Carpeta de los modelos de Ollama"

Function PgRutas
  !insertmacro NuevaPagina "¿DÓNDE LO INSTALAMOS?"
  !insertmacro Texto $0 30 80 640 18 "Puedes dejar las carpetas que propone el instalador." ${C_SUAVE} $Mono

  !insertmacro Texto $0 30 120 520 18 "Aplicación · el programa (~40 MB)" ${C_BLANCO} $Mono
  !insertmacro Campo $EdApp 30 142 520 24 "$RutaApp"
  !insertmacro BotonSuave $0 560 142 110 24 "[ Examinar ]" ExaminarApp

  !insertmacro Texto $0 30 200 640 18 "Motor · Python y librerías (~500 MB, se puede regenerar)" ${C_BLANCO} $Mono
  !insertmacro Campo $EdMotor 30 222 520 24 "$RutaMotor"
  !insertmacro BotonSuave $0 560 222 110 24 "[ Examinar ]" ExaminarMotor

  !insertmacro Texto $0 30 280 640 18 "Tus neuronas · lo más valioso: conviene que esté en una carpeta con copia de seguridad" ${C_BLANCO} $Mono
  !insertmacro Campo $EdDatos 30 302 520 24 "$RutaDatos"
  !insertmacro BotonSuave $0 560 302 110 24 "[ Examinar ]" ExaminarDatos

  !insertmacro Texto $0 30 370 640 60 "Se instala solo para tu usuario: no hace falta ser administrador.$\r$\nEl motor y tus neuronas quedan fuera de la carpeta de la aplicación, así que$\r$\nactualizar o desinstalar el programa no toca tus datos." ${C_SUAVE} $Mono
  !insertmacro PieConAtras "[ Siguiente > ]"
  nsDialogs::Show
FunctionEnd

!macro ValidarRuta VAR NOMBRE
  StrCpy $0 ${VAR} 2 1
  ${If} $0 != ":\"
    MessageBox MB_OK|MB_ICONEXCLAMATION "${NOMBRE}: escribe una ruta completa, por ejemplo C:\Carpeta."
    Abort
  ${EndIf}
!macroend

Function PgRutasSalir
  ${NSD_GetText} $EdApp $RutaApp
  ${NSD_GetText} $EdMotor $RutaMotor
  ${NSD_GetText} $EdDatos $RutaDatos
  !insertmacro ValidarRuta $RutaApp "Carpeta de la aplicación"
  !insertmacro ValidarRuta $RutaMotor "Carpeta del motor"
  !insertmacro ValidarRuta $RutaDatos "Carpeta de tus neuronas"
FunctionEnd

; ---------------------------------------------------------------- 3. Componentes (Ollama, modelo, acceso directo)
Var LblOllama
Var LblM0
Var LblM1
Var LblM2
Var LblEsc
Var TxtModelos
Var BtnModelos

Function RefrescarComponentes
  ${If} $OllamaYa = 1
    ${NSD_SetText} $LblOllama "[v] Ollama ya está instalado en este equipo: se usará tal cual."
  ${ElseIf} $OllamaSi = 1
    ${NSD_SetText} $LblOllama "[x] Instalar Ollama (IA local) · descarga de ~1,6 GB"
  ${Else}
    ${NSD_SetText} $LblOllama "[ ] Instalar Ollama (IA local) · descarga de ~1,6 GB"
  ${EndIf}
  ${If} $ModeloSel = 0
    ${NSD_SetText} $LblM0 "(*) Ninguno por ahora (lo eliges luego en Ajustes)"
  ${Else}
    ${NSD_SetText} $LblM0 "( ) Ninguno por ahora (lo eliges luego en Ajustes)"
  ${EndIf}
  ${If} $ModeloSel = 1
    ${NSD_SetText} $LblM1 "(*) qwen2.5:1.5b · ligero, ~1 GB"
  ${Else}
    ${NSD_SetText} $LblM1 "( ) qwen2.5:1.5b · ligero, ~1 GB"
  ${EndIf}
  ${If} $ModeloSel = 2
    ${NSD_SetText} $LblM2 "(*) phi3:mini · el que prefiere la app, ~2,2 GB"
  ${Else}
    ${NSD_SetText} $LblM2 "( ) phi3:mini · el que prefiere la app, ~2,2 GB"
  ${EndIf}
  ${If} $EscritorioSi = 1
    ${NSD_SetText} $LblEsc "[x] Crear un acceso directo en el escritorio"
  ${Else}
    ${NSD_SetText} $LblEsc "[ ] Crear un acceso directo en el escritorio"
  ${EndIf}
  ; la carpeta de modelos solo se elige si se instala Ollama
  ${If} $OllamaSi = 1
    ShowWindow $TxtModelos ${SW_SHOW}
    ShowWindow $EdModelos ${SW_SHOW}
    ShowWindow $BtnModelos ${SW_SHOW}
  ${Else}
    ShowWindow $TxtModelos ${SW_HIDE}
    ShowWindow $EdModelos ${SW_HIDE}
    ShowWindow $BtnModelos ${SW_HIDE}
  ${EndIf}
FunctionEnd

Function AlternarOllama
  Pop $Tmp
  ${If} $OllamaYa = 1
    Return
  ${EndIf}
  ${If} $OllamaSi = 1
    StrCpy $OllamaSi 0
  ${Else}
    StrCpy $OllamaSi 1
  ${EndIf}
  Call RefrescarComponentes
FunctionEnd
Function ElegirM0
  Pop $Tmp
  StrCpy $ModeloSel 0
  Call RefrescarComponentes
FunctionEnd
Function ElegirM1
  Pop $Tmp
  StrCpy $ModeloSel 1
  Call RefrescarComponentes
FunctionEnd
Function ElegirM2
  Pop $Tmp
  StrCpy $ModeloSel 2
  Call RefrescarComponentes
FunctionEnd
Function AlternarEscritorio
  Pop $Tmp
  ${If} $EscritorioSi = 1
    StrCpy $EscritorioSi 0
  ${Else}
    StrCpy $EscritorioSi 1
  ${EndIf}
  Call RefrescarComponentes
FunctionEnd

Function PgComponentes
  ; ¿Ya hay Ollama? (carpeta habitual del instalador de Ollama, o en el PATH)
  StrCpy $OllamaYa 0
  ${If} ${FileExists} "$LOCALAPPDATA\Programs\Ollama\ollama.exe"
    StrCpy $OllamaYa 1
  ${Else}
    SearchPath $0 "ollama.exe"
    ${If} $0 != ""
      StrCpy $OllamaYa 1
    ${EndIf}
  ${EndIf}
  ${If} $OllamaYa = 1
    StrCpy $OllamaSi 0
  ${EndIf}

  ${If} $PruebaNum = 2          ; prueba: como si Ollama no estuviera y se hubiera marcado instalarlo
    StrCpy $OllamaYa 0
    StrCpy $OllamaSi 1
  ${EndIf}
  !insertmacro NuevaPagina "COMPONENTES"
  !insertmacro Texto $0 30 80 640 18 "La IA local (Ollama) clasifica tus neuronas y propone conexiones." ${C_SUAVE} $Mono
  !insertmacro Casilla $LblOllama 30 112 640 22 0 "" AlternarOllama
  !insertmacro Texto $0 30 150 640 18 "Modelo de IA para descargar:" ${C_SUAVE} $Mono
  !insertmacro Casilla $LblM1 50 174 620 22 0 "" ElegirM1
  !insertmacro Casilla $LblM2 50 198 620 22 0 "" ElegirM2
  !insertmacro Casilla $LblM0 50 222 620 22 0 "" ElegirM0

  !insertmacro Texto $TxtModelos 30 262 640 18 "Carpeta de los modelos de Ollama (ocupan varios GB):" ${C_BLANCO} $Mono
  !insertmacro Campo $EdModelos 30 284 520 24 "$RutaModelos"
  !insertmacro BotonSuave $BtnModelos 560 284 110 24 "[ Examinar ]" ExaminarModelos

  !insertmacro Casilla $LblEsc 30 340 640 22 0 "" AlternarEscritorio
  !insertmacro Texto $0 30 380 640 40 "Se añade siempre al menú Inicio. Todo se puede cambiar después en Ajustes." ${C_TENUE} $Mono
  Call RefrescarComponentes
  !insertmacro PieConAtras "[ Siguiente > ]"
  nsDialogs::Show
FunctionEnd

Function PgComponentesSalir
  ${NSD_GetText} $EdModelos $RutaModelos
  ${If} $OllamaSi = 1
    !insertmacro ValidarRuta $RutaModelos "Carpeta de los modelos de Ollama"
  ${EndIf}
FunctionEnd

; ---------------------------------------------------------------- 4. Resumen
Var DescargaMB
Var DiscoMB

; entrada $R0 = MB; salida en la pila: «512 MB» o «3,4 GB»
Function FormatearMB
  ${If} $R0 < 1024
    Push "$R0 MB"
  ${Else}
    IntOp $R1 $R0 * 10
    IntOp $R1 $R1 / 1024
    IntOp $R2 $R1 / 10
    IntOp $R3 $R1 % 10
    Push "$R2,$R3 GB"
  ${EndIf}
FunctionEnd

Function PgResumen
  !insertmacro NuevaPagina "RESUMEN"
  !insertmacro Texto $0 30 80 640 18 "Revisa lo que se va a hacer y pulsa Instalar." ${C_SUAVE} $Mono
  !insertmacro Texto $0 30 120 130 18 "Aplicación" ${C_VERDE} $Mono
  !insertmacro TextoRuta $0 170 120 500 18 "$RutaApp" ${C_BLANCO} $Mono
  !insertmacro Texto $0 30 146 130 18 "Motor" ${C_VERDE} $Mono
  !insertmacro TextoRuta $0 170 146 500 18 "$RutaMotor" ${C_BLANCO} $Mono
  !insertmacro Texto $0 30 172 130 18 "Neuronas" ${C_VERDE} $Mono
  !insertmacro TextoRuta $0 170 172 500 18 "$RutaDatos" ${C_BLANCO} $Mono

  ; descarga y espacio estimados
  StrCpy $DescargaMB 480
  StrCpy $DiscoMB 800
  ${If} $OllamaYa = 1
    !insertmacro Texto $0 30 214 130 18 "Ollama" ${C_VERDE} $Mono
    !insertmacro Texto $0 170 214 500 18 "ya instalado: se usa tal cual" ${C_BLANCO} $Mono
  ${ElseIf} $OllamaSi = 1
    IntOp $DescargaMB $DescargaMB + 1600
    IntOp $DiscoMB $DiscoMB + 2000
    !insertmacro Texto $0 30 214 130 18 "Ollama" ${C_VERDE} $Mono
    !insertmacro Texto $0 170 214 500 18 "se instalará (descarga de ~1,6 GB)" ${C_DORADO} $Mono
    !insertmacro Texto $0 30 240 130 18 "Modelos en" ${C_VERDE} $Mono
    !insertmacro TextoRuta $0 170 240 500 18 "$RutaModelos" ${C_BLANCO} $Mono
  ${Else}
    !insertmacro Texto $0 30 214 130 18 "Ollama" ${C_VERDE} $Mono
    !insertmacro Texto $0 170 214 500 18 "no se instala (puedes hacerlo más tarde)" ${C_BLANCO} $Mono
  ${EndIf}
  ${If} $ModeloSel = 1
    IntOp $DescargaMB $DescargaMB + 1000
    IntOp $DiscoMB $DiscoMB + 1000
    !insertmacro Texto $0 30 266 130 18 "Modelo" ${C_VERDE} $Mono
    !insertmacro Texto $0 170 266 500 18 "qwen2.5:1.5b (~1 GB)" ${C_DORADO} $Mono
  ${ElseIf} $ModeloSel = 2
    IntOp $DescargaMB $DescargaMB + 2300
    IntOp $DiscoMB $DiscoMB + 2300
    !insertmacro Texto $0 30 266 130 18 "Modelo" ${C_VERDE} $Mono
    !insertmacro Texto $0 170 266 500 18 "phi3:mini (~2,2 GB)" ${C_DORADO} $Mono
  ${Else}
    !insertmacro Texto $0 30 266 130 18 "Modelo" ${C_VERDE} $Mono
    !insertmacro Texto $0 170 266 500 18 "ninguno por ahora" ${C_BLANCO} $Mono
  ${EndIf}

  StrCpy $R0 $DescargaMB
  Call FormatearMB
  Pop $R5
  StrCpy $R0 $DiscoMB
  Call FormatearMB
  Pop $R6
  !insertmacro Texto $0 30 330 640 18 "Descarga estimada:  $R5" ${C_DORADO} $Mono
  !insertmacro Texto $0 30 354 640 18 "Espacio en disco:   $R6" ${C_DORADO} $Mono
  !insertmacro Texto $0 30 400 640 40 "Las descargas vienen de GitHub (uv, Python), PyPI (librerías) y ollama.com.$\r$\nSe comprueba la firma (sha256) de uv antes de usarlo." ${C_SUAVE} $Mono
  !insertmacro PieConAtras "[ Instalar ]"
  nsDialogs::Show
FunctionEnd

Function PgResumenSalir
FunctionEnd

; ---------------------------------------------------------------- 5. Instalando (barras ASCII)
Var LblGlobal
Var LblFases
Var LblLog
Var BtnSigInst
Var FaseActual
Var FasePct1
Var FasePct2
Var FasePct3
Var FasePct4
Var FasePct5
Var FasePct6
Var FasePct7
Var FasesTxt
Var Girando
Var Hecho
Var BtnCerrar

!macro LineaFase IDX NOMBRE
  ${If} $FasePct${IDX} = -1
    StrCpy $R5 "[--] ${NOMBRE} (omitido)"
  ${Else}
    StrCpy $BarraPct $FasePct${IDX}
    StrCpy $BarraLen 28
    Call ConstruirBarra
    ${If} $FasePct${IDX} = 100
      StrCpy $R6 "[ok]"
    ${ElseIf} $FasePct${IDX} > 0
      StrCpy $R6 "[..]"
    ${Else}
      StrCpy $R6 "[  ]"
    ${EndIf}
    StrCpy $R5 "$R6 ${NOMBRE} $BarraTxt"
  ${EndIf}
  StrCpy $FasesTxt "$FasesTxt$R5$\r$\n"
!macroend

Function DibujarInstalacion
  StrCpy $FasesTxt ""
  !insertmacro LineaFase 1 "Aplicación    "
  !insertmacro LineaFase 2 "uv            "
  !insertmacro LineaFase 3 "Python 3.13   "
  !insertmacro LineaFase 4 "Librerías     "
  !insertmacro LineaFase 5 "Clasificación "
  !insertmacro LineaFase 6 "Ollama        "
  !insertmacro LineaFase 7 "Modelo de IA  "
  ${NSD_SetText} $LblFases $FasesTxt

  ; barra global: media de las fases que se hacen
  StrCpy $R7 0
  StrCpy $R8 0
  ${For} $R9 1 7
    ${If} $R9 = 1
      StrCpy $0 $FasePct1
    ${ElseIf} $R9 = 2
      StrCpy $0 $FasePct2
    ${ElseIf} $R9 = 3
      StrCpy $0 $FasePct3
    ${ElseIf} $R9 = 4
      StrCpy $0 $FasePct4
    ${ElseIf} $R9 = 5
      StrCpy $0 $FasePct5
    ${ElseIf} $R9 = 6
      StrCpy $0 $FasePct6
    ${Else}
      StrCpy $0 $FasePct7
    ${EndIf}
    ${If} $0 >= 0
      IntOp $R7 $R7 + $0
      IntOp $R8 $R8 + 1
    ${EndIf}
  ${Next}
  IntOp $R7 $R7 / $R8
  StrCpy $BarraPct $R7
  StrCpy $BarraLen 50
  Call ConstruirBarra
  ${NSD_SetText} $LblGlobal "Total   $BarraTxt"
FunctionEnd

Function MostrarError
  StrCpy $Hecho 1
  ${NSD_KillTimer} AvanzarInstalacion
  SetCtlColors $LblLog ${C_ROJO} ${C_FONDO}
  ${If} $ErrorFatal != ""
    StrCpy $MensajePs $ErrorFatal
  ${EndIf}
  ${NSD_SetText} $LblLog "[ERROR] $MensajePs"
  ${NSD_SetText} $LblRegistro "Registro: $RutaMotor\instalacion.log"
  ShowWindow $LblRegistro ${SW_SHOW}
  !insertmacro Texto $0 30 440 640 18 "Puedes volver a ejecutar el instalador: retoma lo que falte." ${C_SUAVE} $Mono
  ShowWindow $BtnCerrar ${SW_SHOW}
FunctionEnd

Function CerrarConError
  Pop $Tmp
  SendMessage $HWNDPARENT ${WM_COMMAND} 2 0
FunctionEnd

Function CancelarInstalacion
  Pop $Tmp
  MessageBox MB_YESNO|MB_ICONQUESTION "¿Cancelar la instalación?$\r$\n$\r$\nLo ya descargado se conserva: al volver a ejecutar el instalador retoma lo que falte." IDNO seguir
    FileOpen $0 "$PLUGINSDIR\cancelar.flag" w
    FileWrite $0 "1"
    FileClose $0
    Sleep 1500
    SendMessage $HWNDPARENT ${WM_COMMAND} 2 0
  seguir:
FunctionEnd

; Se llama cada 150 ms: el primer aviso copia la aplicación y lanza instalar.ps1; los siguientes leen su avance.
Function AvanzarInstalacion
  ${If} $Hecho = 1
    Return
  ${EndIf}
  IntOp $Girando $Girando + 1
  ${If} $AppCopiada = 0
    StrCpy $AppCopiada 1
    ${NSD_SetText} $LblLog "Copiando la aplicación..."
    System::Call 'user32::UpdateWindow(i $LblLog)'
    Call InstalarApp
    ${If} $ErrorFatal != ""
      Call MostrarError
      Return
    ${EndIf}
    StrCpy $FasePct1 100
    Call DibujarInstalacion
    Call LanzarPowerShell
    Return
  ${EndIf}
  Call LeerEstadoPs
  Call ComprobarFinPs
  Call DibujarInstalacion
  ${If} $EstadoPs == "error"
    Call MostrarError
    Return
  ${EndIf}
  ${If} $EstadoPs == "ok"
    StrCpy $Hecho 1
    ${NSD_SetText} $LblLog "Todo listo."
    ShowWindow $BtnSigInst ${SW_SHOW}
    Return
  ${EndIf}
  StrCpy $R1 "|"
  IntOp $R2 $Girando % 4
  ${If} $R2 = 1
    StrCpy $R1 "/"
  ${ElseIf} $R2 = 2
    StrCpy $R1 "-"
  ${ElseIf} $R2 = 3
    StrCpy $R1 "\"
  ${EndIf}
  ${NSD_SetText} $LblLog "$R1 $MensajePs"
FunctionEnd

Function PgInstalar
  !insertmacro NuevaPagina "INSTALANDO"
  StrCpy $AppCopiada 0
  StrCpy $PsLanzado 0
  StrCpy $ErrorFatal ""
  StrCpy $EstadoPs ""
  StrCpy $MensajePs ""
  StrCpy $Girando 0
  StrCpy $Hecho 0
  StrCpy $FasePct1 0
  StrCpy $FasePct2 0
  StrCpy $FasePct3 0
  StrCpy $FasePct4 0
  StrCpy $FasePct5 0
  ${If} $OllamaSi = 1
    StrCpy $FasePct6 0
  ${Else}
    StrCpy $FasePct6 -1
  ${EndIf}
  ${If} $ModeloSel > 0
    StrCpy $FasePct7 0
  ${Else}
    StrCpy $FasePct7 -1
  ${EndIf}

  !insertmacro Texto $LblGlobal 30 90 640 20 "" ${C_DORADO} $Mono
  !insertmacro Texto $LblFases 30 140 640 150 "" ${C_BLANCO} $Mono
  !insertmacro Texto $LblLog 30 330 640 120 "" ${C_SUAVE} $Mono
  !insertmacro Boton $BtnSigInst 560 505 110 26 "[ Siguiente > ]" IrSiguiente
  ShowWindow $BtnSigInst ${SW_HIDE}
  !insertmacro TextoRuta $LblRegistro 30 400 640 18 "" ${C_SUAVE} $Mono
  ShowWindow $LblRegistro ${SW_HIDE}
  !insertmacro Boton $BtnCerrar 560 505 110 26 "[ Cerrar ]" CerrarConError
  ShowWindow $BtnCerrar ${SW_HIDE}
  !insertmacro BotonSuave $0 30 505 110 26 "[ Cancelar ]" CancelarInstalacion
  Call DibujarInstalacion
  ${NSD_CreateTimer} AvanzarInstalacion 150
  nsDialogs::Show
FunctionEnd

Function PgInstalarSalir
  ${NSD_KillTimer} AvanzarInstalacion
FunctionEnd

; ---------------------------------------------------------------- 6. Fin
Function AlternarAbrir
  Pop $Tmp
  ${If} $AbrirSi = 1
    StrCpy $AbrirSi 0
    ${NSD_SetText} $LblEsc "[ ] Abrir ${APP} al terminar"
  ${Else}
    StrCpy $AbrirSi 1
    ${NSD_SetText} $LblEsc "[x] Abrir ${APP} al terminar"
  ${EndIf}
FunctionEnd

Function PgFin
  !insertmacro NuevaPagina "LISTO"
  !insertmacro Texto $0 30 90 640 22 "${APP} está instalado." ${C_VERDE} $Mono
  !insertmacro Texto $0 30 130 130 18 "Instalado en" ${C_VERDE} $Mono
  !insertmacro TextoRuta $0 170 130 500 18 "$RutaApp" ${C_BLANCO} $Mono
  !insertmacro Texto $0 30 156 130 18 "Tus neuronas" ${C_VERDE} $Mono
  !insertmacro TextoRuta $0 170 156 500 18 "$RutaDatos" ${C_BLANCO} $Mono
  !insertmacro Casilla $LblEsc 30 230 640 22 0 "" AlternarAbrir
  ${If} $AbrirSi = 1
    ${NSD_SetText} $LblEsc "[x] Abrir ${APP} al terminar"
  ${Else}
    ${NSD_SetText} $LblEsc "[ ] Abrir ${APP} al terminar"
  ${EndIf}
  !insertmacro PieFin "[ Finalizar ]"
  nsDialogs::Show
FunctionEnd

Function PgFinSalir
  ${If} $AbrirSi = 1
    ${If} $ModoPrueba = 1
      ; en pruebas la app instalada debe usar la configuración de prueba, no la de tu usuario
      System::Call 'kernel32::SetEnvironmentVariable(t "ALEJANDRIA_CONFIG", t "$RutaConfig")i.r0'
    ${EndIf}
    SetOutPath "$RutaApp"
    Exec '"$RutaApp\${EXE}"'
  ${EndIf}
FunctionEnd
