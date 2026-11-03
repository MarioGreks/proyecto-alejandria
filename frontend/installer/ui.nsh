; Piezas comunes del asistente: colores, fuentes, ventana oscura, botones y casillas hechos con texto (para poder colorearlos), barra ASCII.

!define C_FONDO 0x05070D
!define C_PANEL 0x0B1620
!define C_VERDE 0x00FFAA
!define C_SUAVE 0x4AAA88
!define C_TENUE 0x2F8068
!define C_DORADO 0xFFD166
!define C_ROJO 0xFF6B6B
!define C_BLANCO 0xCFEEE3

!ifndef SS_NOTIFY
  !define SS_NOTIFY 0x100
!endif
!ifndef SS_CENTER
  !define SS_CENTER 0x1
!endif
!ifndef SS_CENTERIMAGE
  !define SS_CENTERIMAGE 0x200
!endif
!define ANCHO_VENTANA 700
!define ALTO_VENTANA 580

Var Mono
Var MonoGrande
Var ModoPrueba
Var Dlg
Var Tmp

Var BasePrueba      ; con /PRUEBA=<carpeta>: todo se hace dentro de esa carpeta y de una clave de registro de prueba
Var PruebaNum       ; 0 normal, 1 prueba, 2 prueba que además descarga Ollama aunque ya esté instalado (/OLLAMA-FORZAR)
Var ClaveDesinst
Var Actualizando    ; 1 si se ejecuta en modo actualización (/UPDATE del actualizador de la app, o /ACTUALIZAR): sin preguntas, sobre lo ya instalado
Var EsquemaInst     ; estructura de rutas con la que se instaló (sin dato = 1)
Var EsquemaActual   ; la de este instalador (ESQUEMA); si es mayor, en una actualización se piden solo las carpetas nuevas
Var NuevasRutas     ; «clave=ruta;clave=ruta» de lo elegido en esas carpetas nuevas, para guardarlo en instalacion.json
Var CarpetaMenu
Var CarpetaEscritorio
Var RutaConfig
Var ModeloNombre
Var AppCopiada
Var PsLanzado
Var MensajePs
Var EstadoPs
Var ErrorFatal

Var BorrarDatos
Var LblDatosUn
Var LblEstadoUn
Var BtnCerrarUn
Var LblRegistro

; Elecciones del usuario
Var RutaApp
Var RutaMotor
Var RutaDatos
Var RutaModelos
Var OllamaYa        ; 1 si Ollama ya está instalado
Var OllamaSi        ; 1 si se pide instalarlo
Var ModeloSel       ; 0 ninguno, 1 qwen2.5:1.5b, 2 phi3:mini
Var EscritorioSi
Var AbrirSi

!macro AyudasVentana P
Function ${P}PrepararFuente
  CreateFont $Mono "Consolas" 9 400
  CreateFont $MonoGrande "Consolas" 15 700
FunctionEnd

; Ventana más grande, centrada y oscura, sin los botones ni rótulos de Windows (los botones los dibujamos nosotros, con texto).
Function ${P}PrepararVentana
  System::Call 'user32::SetWindowPos(i $HWNDPARENT, i 0, i 0, i 0, i ${ANCHO_VENTANA}, i ${ALTO_VENTANA}, i 0x16)'
  System::Call 'user32::GetSystemMetrics(i 0)i.r0'
  System::Call 'user32::GetSystemMetrics(i 1)i.r1'
  IntOp $0 $0 - ${ANCHO_VENTANA}
  IntOp $0 $0 / 2
  IntOp $1 $1 - ${ALTO_VENTANA}
  IntOp $1 $1 / 2
  System::Call 'user32::SetWindowPos(i $HWNDPARENT, i 0, i r0, i r1, i 0, i 0, i 0x15)'
  GetDlgItem $2 $HWNDPARENT 1018
  System::Call 'user32::SetWindowPos(i r2, i 0, i 0, i 0, i ${ANCHO_VENTANA}, i ${ALTO_VENTANA}, i 0x14)'
  ; botones y rótulos estándar: 1 Siguiente, 2 Cancelar, 3 Atrás, 1006 texto superior, 1028 marca, 1045 y 1256 líneas
  StrCpy $3 1
  ${Do}
    ${Select} $3
      ${Case} 1
        StrCpy $4 2
      ${Case} 2
        StrCpy $4 3
      ${Case} 3
        StrCpy $4 1006
      ${Case} 1006
        StrCpy $4 1028
      ${Case} 1028
        StrCpy $4 1045
      ${Case} 1045
        StrCpy $4 1256
      ${Case} 1256
        StrCpy $4 0
    ${EndSelect}
    GetDlgItem $5 $HWNDPARENT $3
    ShowWindow $5 ${SW_HIDE}
    StrCpy $3 $4
  ${LoopUntil} $3 = 0
  SetCtlColors $HWNDPARENT ${C_VERDE} ${C_FONDO}
FunctionEnd

; Navegación: se simula lo que harían los botones de Windows, que están ocultos.
Function ${P}IrSiguiente
  Pop $Tmp
  SendMessage $HWNDPARENT ${WM_COMMAND} 1 0
FunctionEnd
Function ${P}IrAtras
  Pop $Tmp
  SendMessage $HWNDPARENT ${WM_COMMAND} 3 0
FunctionEnd
Function ${P}IrCancelar
  Pop $Tmp
  SendMessage $HWNDPARENT ${WM_COMMAND} 2 0
FunctionEnd
!macroend
!insertmacro AyudasVentana ""
!insertmacro AyudasVentana "un."

; Crea la página: cuadro oscuro, título y línea.
!macro NuevaPagina TITULO
  nsDialogs::Create 1018
  Pop $Dlg
  ${If} $Dlg == error
    Abort
  ${EndIf}
  SetCtlColors $Dlg ${C_VERDE} ${C_FONDO}
  ; NSIS vuelve a mostrar los botones de Windows al cambiar de página: se ocultan otra vez
  GetDlgItem $0 $HWNDPARENT 1
  ShowWindow $0 ${SW_HIDE}
  GetDlgItem $0 $HWNDPARENT 2
  ShowWindow $0 ${SW_HIDE}
  GetDlgItem $0 $HWNDPARENT 3
  ShowWindow $0 ${SW_HIDE}
  !insertmacro Texto $0 30 18 640 30 "> ${TITULO}" ${C_VERDE} $MonoGrande
  !insertmacro Texto $0 30 50 640 16 "=====================================================================" ${C_PANEL} $Mono
!macroend

; Etiqueta de texto (transparente sobre el fondo oscuro)
!macro Texto VAR X Y W H TXT COL FUENTE
  ${NSD_CreateLabel} ${X} ${Y} ${W} ${H} "${TXT}"
  Pop ${VAR}
  SetCtlColors ${VAR} ${COL} ${C_FONDO}
  SendMessage ${VAR} ${WM_SETFONT} ${FUENTE} 1
!macroend

; Ruta en una sola línea: si no cabe, se acorta por el MEDIO («C:\Users\...\motor»), así siempre se ve cómo empieza y cómo acaba.
!ifndef SS_PATHELLIPSIS
  !define SS_PATHELLIPSIS 0x8000
!endif
!macro TextoRuta VAR X Y W H TXT COL FUENTE
  !insertmacro Texto ${VAR} ${X} ${Y} ${W} ${H} "${TXT}" ${COL} ${FUENTE}
  ${NSD_AddStyle} ${VAR} ${SS_PATHELLIPSIS}
!macroend

; «Botón»: etiqueta clicable con aspecto de [ texto ]
!macro Boton VAR X Y W H TXT FUNC
  ${NSD_CreateLabel} ${X} ${Y} ${W} ${H} "${TXT}"
  Pop ${VAR}
  ${NSD_AddStyle} ${VAR} ${SS_NOTIFY}|${SS_CENTER}|${SS_CENTERIMAGE}
  SetCtlColors ${VAR} ${C_FONDO} ${C_VERDE}
  SendMessage ${VAR} ${WM_SETFONT} $Mono 1
  ${NSD_OnClick} ${VAR} ${FUNC}
!macroend

; Botón secundario (contorno suave, sin relleno)
!macro BotonSuave VAR X Y W H TXT FUNC
  ${NSD_CreateLabel} ${X} ${Y} ${W} ${H} "${TXT}"
  Pop ${VAR}
  ${NSD_AddStyle} ${VAR} ${SS_NOTIFY}|${SS_CENTER}|${SS_CENTERIMAGE}
  SetCtlColors ${VAR} ${C_VERDE} ${C_PANEL}
  SendMessage ${VAR} ${WM_SETFONT} $Mono 1
  ${NSD_OnClick} ${VAR} ${FUNC}
!macroend

; Campo de texto oscuro
!macro Campo VAR X Y W H TXT
  ${NSD_CreateText} ${X} ${Y} ${W} ${H} "${TXT}"
  Pop ${VAR}
  SetCtlColors ${VAR} ${C_VERDE} ${C_PANEL}
  SendMessage ${VAR} ${WM_SETFONT} $Mono 1
!macroend

; Casilla ASCII: «[x] texto» / «[ ] texto»; al hacer clic cambia. $VARESTADO guarda 1/0.
!macro Casilla VAR X Y W H ESTADO TXT FUNC
  ${NSD_CreateLabel} ${X} ${Y} ${W} ${H} "${TXT}"
  Pop ${VAR}
  ${NSD_AddStyle} ${VAR} ${SS_NOTIFY}
  SetCtlColors ${VAR} ${C_BLANCO} ${C_FONDO}
  SendMessage ${VAR} ${WM_SETFONT} $Mono 1
  ${NSD_OnClick} ${VAR} ${FUNC}
!macroend

; Pie de página con los botones habituales
!macro PieConAtras TXTSIG
  !insertmacro BotonSuave $0 30 505 110 26 "[ Cancelar ]" IrCancelar
  !insertmacro BotonSuave $0 440 505 110 26 "[ < Atrás ]" IrAtras
  !insertmacro Boton $0 560 505 110 26 "${TXTSIG}" IrSiguiente
!macroend
!macro PieFin TXTSIG
  !insertmacro Boton $0 560 505 110 26 "${TXTSIG}" IrSiguiente
!macroend
!macro PieSinAtras TXTSIG
  !insertmacro BotonSuave $0 30 505 110 26 "[ Cancelar ]" IrCancelar
  !insertmacro Boton $0 560 505 110 26 "${TXTSIG}" IrSiguiente
!macroend

; Barra ASCII: entrada $BarraPct (0-100) y $BarraLen; salida $BarraTxt = «[####....] 45%»
Var BarraPct
Var BarraLen
Var BarraTxt
Function ConstruirBarra
  IntOp $R2 $BarraPct * $BarraLen
  IntOp $R2 $R2 / 100
  StrCpy $BarraTxt "["
  StrCpy $R3 0
  ${While} $R3 < $BarraLen
    ${If} $R3 < $R2
      StrCpy $BarraTxt "$BarraTxt#"
    ${Else}
      StrCpy $BarraTxt "$BarraTxt."
    ${EndIf}
    IntOp $R3 $R3 + 1
  ${EndWhile}
  ; porcentaje con 3 caracteres de ancho
  ${If} $BarraPct < 10
    StrCpy $R4 "  $BarraPct"
  ${ElseIf} $BarraPct < 100
    StrCpy $R4 " $BarraPct"
  ${Else}
    StrCpy $R4 "$BarraPct"
  ${EndIf}
  StrCpy $BarraTxt "$BarraTxt] $R4%"
FunctionEnd
