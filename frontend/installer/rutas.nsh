; Rutas de las carpetas: al elegir una carpeta con «Examinar», cada parte va en su propia subcarpeta dentro de ella (Aplicacion, Motor, Neuronas, Modelos),
; para que no quede todo esparramado en la carpeta elegida. Archivo aparte para poder probar ComponerRuta con un instalador de pruebas.

; Entrada: $R0 = carpeta elegida, $R1 = nombre de la subcarpeta. Salida: $R0 = «carpeta elegida\subcarpeta».
; No deja «\\» si la elegida acaba en «\» (raíz de una unidad: D:\) ni repite el nombre si ya acaba en él (D:\Datos\Motor + Motor).
Function ComponerRuta
  Push $R2
  Push $R3
  Push $R4
  StrCpy $R2 $R0 1 -1
  ${If} $R2 == "\"
    StrCpy $R0 $R0 -1
  ${EndIf}
  StrLen $R3 "\$R1"
  StrCpy $R4 $R0 "" -$R3
  ${If} $R4 != "\$R1"
    StrCpy $R0 "$R0\$R1"
  ${EndIf}
  Pop $R4
  Pop $R3
  Pop $R2
FunctionEnd
