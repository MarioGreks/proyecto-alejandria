# PROMPTS MAESTROS - PROYECTO ALEJANDRÍA

> **Fuente de verdad:** `frontend/src/utils/prompts.ts` (son los prompts que copian los botones de la app). Este documento es una copia para uso manual: si cambias uno, cambia el otro. Los botones de la app añaden además, justo antes de las "REGLAS DE ORO", la línea `CLÚSTERES EXISTENTES EN MI SISTEMA: A, B, C` para que la IA reutilice esos nombres; si copias de aquí, puedes añadirla a mano.

Este documento contiene dos modalidades de Prompt Maestro adaptadas a un **Nivel de Doctorado (PhD)**.
- Utiliza la **Modalidad 1** cuando tengas tus propios apuntes o papers (fuentes cerradas).
- Utiliza la **Modalidad 2** cuando quieras explorar un concepto desde cero pidiéndoselo a un agente de IA externo (como DeepSeek, Claude o ChatGPT).

---

## 🧠 MODALIDAD 1: Asimilación de Fuentes Propias
**Instrucciones de uso:** Copia el siguiente bloque y pégalo en tu IA de preferencia (Claude, ChatGPT, NotebookLM) **junto con tus apuntes, PDFs o papers de doctorado**.

> Actúa como un Catedrático Universitario e Investigador Postdoctoral experto en visualización de datos. Tu objetivo es procesar el material académico que te proporciono y estructurarlo de forma exhaustiva, rigurosa y con extrema profundidad en un formato JSON diseñado para "Alejandría", un simulador interactivo de conocimiento.
>
> Para el concepto matemático/analítico más crítico del texto, debes generar un único objeto JSON que siga EXACTAMENTE esta estructura, sin añadir texto fuera del JSON (ni saludos ni explicaciones extra):
>
> ```json
> {
>     "id": "identificador_unico_snake_case",
>     "cluster": "RAMA ACADÉMICA ESPECÍFICA y breve (máximo 3 palabras, nunca una frase). Ej: 'Estadística' [para markov, splines, estocásticos], 'Biometría y Demografía' [para Lee-Carter, mortalidad, supervivencia], 'Finanzas' [para Black-Scholes, derivados], 'Economía' [Macro/Micro], 'Matemáticas Puras'. Sé preciso con la rama de especialidad, no uses 'Matemáticas' como cajón de sastre para todo. Si en este mensaje aparece una línea 'CLÚSTERES EXISTENTES', reutiliza EXACTAMENTE uno de esos nombres cuando el concepto encaje; crea uno nuevo solo si ninguno encaja.",
>     "nombre": "Nombre Completo del Concepto",
>     "teoria": "Explicación teórica EXTREMADAMENTE EXTENSA, profunda y rigurosa del concepto (mínimo 1000 palabras). Utiliza un lenguaje académico formal de nivel doctorado (PhD). DEBES estructurar el contenido con subtítulos Markdown (##) abarcando: 1. Introducción Histórica/Contextual, 2. Fundamentos y Axiomas, 3. Desarrollo Matemático Profundo, 4. Aplicaciones y Limitaciones (las referencias bibliográficas se colocan por separado en el campo 'referencias', NO dentro de este texto de teoría). Desglosa cada deducción paso a paso. ESTÁ ESTRICTAMENTE PROHIBIDO usar fórmulas apelmazadas dentro de los párrafos (inline con $). Absolutamente TODAS las fórmulas, ecuaciones y desarrollo matemático deben ir segregadas en bloques independientes usando $$ con líneas en blanco antes y después, y estar numeradas al estilo paper académico usando \\tag{n}, ejemplo:\n\n$$\nf(x) = y \\tag{1}\n$$\n\nUsa solo texto puro para explicar y manda toda la matemática a bloques $$.",
>     "glosario": [
>         {"termino": "Variable 1", "definicion": "Definición estricta y matemática usando LaTeX si es necesario."},
>         {"termino": "Variable 2", "definicion": "Definición estricta y matemática usando LaTeX si es necesario."}
>     ],
>     "ejercicios": [
>         {
>             "enunciado": "Planteamiento de un problema avanzado de investigación sobre este tema.",
>             "solucion": "Resolución analítica paso a paso del problema, demostrando el desarrollo lógico e implementando $$ LaTeX $$."
>         }
>     ],
>     "referencias": [
>         {
>             "titulo": "Título exacto del paper, libro o publicación académica fuente",
>             "autores": "Autor/es y año (ej: 'Itô, K. (1951)')",
>             "url": "https://doi.org/..., enlace directo oficial o la ficha de la publicación en Google Scholar (https://scholar.google.com/...) si no tiene DOI",
>             "nota": "Comentario conciso explicando qué concepto, deducción matemática, fórmula o axioma concreto se ha extraído de esta fuente para este apunte. Si la localizaste o la contrastaste en Google Scholar, indícalo aquí."
>         }
>     ],
>     "laboratorio": {
>         "explicacion": "Explicación detallada (soporta LaTeX con $$) sobre qué representa la simulación y qué parámetros modifica el usuario con los deslizables para experimentar.",
>         "controles": [
>             {
>                 "variable": "v_ini",
>                 "label": "Velocidad Inicial (m/s)",
>                 "min": 10,
>                 "max": 100,
>                 "step": 1,
>                 "default": 50
>             },
>             {
>                 "variable": "angulo",
>                 "label": "Ángulo (grados)",
>                 "min": 0,
>                 "max": 90,
>                 "step": 1,
>                 "default": 45
>             }
>         ],
>         "codigo": "import numpy as np\nimport matplotlib.pyplot as plt\n\n# Variables controladas por UI\nv_ini = {v_ini}\nangulo = {angulo}\ngravedad = 9.8\n\nt = np.linspace(0, 10, 200)\nrad = np.radians(angulo)\nx = v_ini * np.cos(rad) * t\ny = v_ini * np.sin(rad) * t - 0.5 * gravedad * t**2\n\nmask = y >= 0\nplt.figure(figsize=(8,5))\nplt.plot(x[mask], y[mask], color='cyan')\nplt.title('Trayectoria Parabólica')\nplt.grid(True, alpha=0.3)\nplt.show()"
>     }
> }
> ```
>
> ### REGLAS DE ORO:
> 1. El campo `codigo` dentro de `laboratorio` debe ser un string de Python válido (con saltos de línea escapados \n).
> 2. Debes incluir SIEMPRE un array `controles` con los parámetros que el usuario podrá modificar en la UI. Define tantos como necesite el modelo para APRENDERLO explorando (suelen ser entre 2 y 8, hasta un máximo de 24): los que cambien de verdad el comportamiento, sin rellenar con controles que no enseñen nada ni dejar fuera una variable clave. Si son muchos, agrúpalos con el campo opcional `"grupo"` (p. ej. `"grupo": "Mercado"`). Cada rango (`min`/`max`) debe permitir ver los regímenes interesantes del modelo, no solo el valor típico. Por defecto son deslizables (`min`, `max`, `step`, `default` numéricos). También puedes usar `"tipo": "checkbox"` (`default`: true/false; en el código llega como True/False) o `"tipo": "select"` con `"opciones": ["a", "b"]` y un `default` de la lista (en el código llega como un literal de Python, p. ej. `"a"`).
> 3. En el código Python, el valor de las variables controladas debe asignarse utilizando EXACTAMENTE las variables del array `controles` envueltas en llaves, por ejemplo `v_ini = {v_ini}`. Nuestro sistema reemplazará estos tokens en tiempo de ejecución.
> 4. El código Python debe generar gráficos avanzados con `matplotlib` (`plt.show()`). Ya no usamos output JSON crudo. Para que la gráfica responda con fluidez al mover los controles, usa solo: `plot`, `scatter`, `bar` (colores y anchos uniformes), `fill_between`, `axvline`/`axhline`/`axvspan`/`axhspan`, `text`/`annotate`, `title`/`xlabel`/`ylabel`/`xlim`/`ylim`/`grid`/`legend` y `subplots`. También puedes usar `xticks`/`yticks` (con o sin etiquetas), barras apiladas (`bar(..., bottom=...)`), `fill_between(..., where=...)` y escala logarítmica en base 10 (`set_yscale('log')`, `semilogy`, `loglog`) sin perder fluidez. Contornos, 3D, imágenes o `rotation` en los ticks también funcionan, pero se muestran como imagen estática (más lenta).
> 5. ANTES DE RESPONDER: Utiliza tu propio intérprete de Python en segundo plano para verificar que la lógica del script es robusta y sin errores.
> 6. Devuelve ÚNICAMENTE el bloque JSON.

---

## 🚀 MODALIDAD 2: Exploración Pura (Pseudo-Prompt para IA)
**Instrucciones de uso:** Copia el siguiente texto y pégalo directamente en DeepSeek, ChatGPT o Claude cuando quieras explorar un concepto nuevo sin tener material previo. Sustituye `[INSERTA EL CONCEPTO AQUÍ]` por el tema a investigar.

> Actúa como un Investigador Catedrático y tutor académico de nivel de Doctorado (PhD). 
> Quiero que me expliques a fondo y con extremo rigor el siguiente concepto: **[INSERTA EL CONCEPTO AQUÍ]**.
>
> Tu respuesta debe estructurarse obligatoriamente en **DOS PARTES SECUENCIALES**:
>
> **PARTE 1: Explicación Magistral (PhD Level)**
> Explícame el concepto paso a paso con un nivel de detalle propio de una tesis doctoral. Incluye el formalismo matemático subyacente, intuición física/geométrica profunda, deducciones críticas, implicaciones en investigación actual y ejemplos avanzados. Usa todo el formato LaTeX (usando `$$` y `$`) que consideres necesario para que la lectura sea de altísimo valor investigativo. No escatimes en extensión, se tan explícito y minucioso como te sea posible. 
>
> Al final de tu explicación, incluye obligatoriamente un apartado detallando las fuentes bibliográficas y referencias académicas primarias (papers fundacionales, autores y manuales canónicos) de donde bebes la información. **Junto a cada referencia, debes añadir una nota o comentario explicativo que aclare con exactitud qué concepto, teorema, fórmula o desarrollo has sacado de esa fuente específica.** Para localizar y contrastar esas fuentes consulta como mínimo **Google Scholar** (https://scholar.google.com), además de arXiv, DOI/Crossref y las páginas de las editoriales: si tienes búsqueda web, úsala ahí y apóyate en los resultados y en el número de citas de Scholar para priorizar los trabajos fundacionales y más citados; si no puedes consultar la web, dilo expresamente en lugar de suponer. ANTES de escribir cada fuente, cuestiónate a ti mismo y verifica con rigor crítico si de verdad existen dichas fuentes en la literatura académica real (está estrictamente prohibido alucinar o inventar títulos/autores), y proporciona los enlaces directos (URL oficial, enlace DOI o link a arXiv/repositorio académico) a esos papers o páginas de donde las has obtenido.
>
> **PARTE 2: La Neurona JSON (Sintetizador de Alejandría)**
> Inmediatamente después de haber desarrollado toda tu explicación magistral (NUNCA te saltes la PARTE 1), debes aislar el corazón matemático de lo que me acabas de explicar y generar una "Neurona JSON" compatible con mi sistema de simulación interactiva.
>
> La Neurona JSON debe estar al final de tu respuesta, obligatoriamente envuelta en un bloque ```json y seguir EXACTAMENTE esta estructura:
>
> ```json
> {
>     "id": "identificador_unico_snake_case_del_tema",
>     "cluster": "RAMA ACADÉMICA ESPECÍFICA y breve (máximo 3 palabras, nunca una frase). Ej: 'Estadística' [para markov, splines, estocásticos], 'Biometría y Demografía' [para Lee-Carter, mortalidad, supervivencia], 'Finanzas' [para Black-Scholes, derivados], 'Economía' [Macro/Micro], 'Matemáticas Puras'. Sé preciso con la rama de especialidad, no uses 'Matemáticas' como cajón de sastre para todo. Si en este mensaje aparece una línea 'CLÚSTERES EXISTENTES', reutiliza EXACTAMENTE uno de esos nombres cuando el concepto encaje; crea uno nuevo solo si ninguno encaja.",
>     "nombre": "Nombre Formal del Concepto",
>     "teoria": "Explicación teórica EXTREMADAMENTE EXTENSA, profunda y rigurosa del concepto (mínimo 1000 palabras). Basándote en tu explicación magistral anterior, debes estructurar el contenido con subtítulos Markdown (##) abarcando: 1. Introducción Histórica/Contextual, 2. Fundamentos y Axiomas, 3. Desarrollo Matemático Profundo, 4. Aplicaciones y Limitaciones (las referencias bibliográficas se colocan por separado en el campo 'referencias', NO dentro de este texto de teoría). ESTÁ ESTRICTAMENTE PROHIBIDO usar fórmulas apelmazadas dentro de los párrafos (inline con $). Absolutamente TODAS las fórmulas y desarrollos deben ir segregados en bloques independientes usando $$ con líneas en blanco antes y después, y numeradas con \\tag{n}. El texto solo para leer, las matemáticas separadas en bloques.",
>     "glosario": [
>         {"termino": "Término Clave 1", "definicion": "Definición matemática formal en LaTeX."},
>         {"termino": "Término Clave 2", "definicion": "Definición matemática formal en LaTeX."}
>     ],
>     "ejercicios": [
>         {
>             "enunciado": "Un problema matemático avanzado de nivel doctorado sobre el tema.",
>             "solucion": "Resolución analítica paso a paso del problema usando $$ LaTeX $$."
>         }
>     ],
>     "referencias": [
>         {
>             "titulo": "Título exacto del paper, libro o publicación académica real",
>             "autores": "Autor/es y año de publicación (Ej: 'Itô, K. (1951)')",
>             "url": "https://doi.org/..., link directo a arXiv / repositorio oficial o la ficha de la publicación en Google Scholar (https://scholar.google.com/...)",
>             "nota": "Comentario detallado explicando qué concepto, deducción matemática, fórmula o axioma concreto se ha extraído de esta fuente para este apunte. Si la localizaste o la contrastaste en Google Scholar, indícalo aquí."
>         }
>     ],
>     "laboratorio": {
>         "explicacion": "Explicación detallada (soporta LaTeX con $$) sobre qué representa la simulación y qué parámetros modifica el usuario con los deslizables para experimentar.",
>         "controles": [
>             {
>                 "variable": "param_1",
>                 "label": "Parámetro Físico 1",
>                 "min": 0,
>                 "max": 10,
>                 "step": 0.5,
>                 "default": 1.0
>             },
>             {
>                 "variable": "param_2",
>                 "label": "Coeficiente Alpha",
>                 "min": 0.1,
>                 "max": 1.0,
>                 "step": 0.1,
>                 "default": 0.5
>             }
>         ],
>         "codigo": "import numpy as np\nimport matplotlib.pyplot as plt\n\n# Variables de control UI\nparam_1 = {param_1}\nparam_2 = {param_2}\n\nt = np.linspace(0, 20, 500)\ny = np.exp(-param_2 * t) * np.cos(param_1 * t)\n\nplt.figure(figsize=(8,4))\nplt.plot(t, y, color='orange')\nplt.title('Oscilador Amortiguado')\nplt.grid(True, alpha=0.3)\nplt.show()"
>     }
> }
> ```
>
> ### REGLAS DE ORO:
> 1. El campo `codigo` dentro de `laboratorio` debe ser un string de Python válido (con saltos de línea escapados \n).
> 2. Debes incluir SIEMPRE un array `controles` con los parámetros que el usuario podrá modificar en la UI. Define tantos como necesite el modelo para APRENDERLO explorando (suelen ser entre 2 y 8, hasta un máximo de 24): los que cambien de verdad el comportamiento, sin rellenar con controles que no enseñen nada ni dejar fuera una variable clave. Si son muchos, agrúpalos con el campo opcional `"grupo"` (p. ej. `"grupo": "Mercado"`). Cada rango (`min`/`max`) debe permitir ver los regímenes interesantes del modelo, no solo el valor típico. Por defecto son deslizables (`min`, `max`, `step`, `default` numéricos). También puedes usar `"tipo": "checkbox"` (`default`: true/false; en el código llega como True/False) o `"tipo": "select"` con `"opciones": ["a", "b"]` y un `default` de la lista (en el código llega como un literal de Python, p. ej. `"a"`).
> 3. En el código Python, el valor de las variables controladas debe asignarse utilizando EXACTAMENTE las variables del array `controles` envueltas en llaves, por ejemplo `param_1 = {param_1}`.
> 4. El código Python debe generar gráficos con `matplotlib` (`plt.show()`). Para que la gráfica responda con fluidez al mover los controles, usa solo: `plot`, `scatter`, `bar` (colores y anchos uniformes), `fill_between`, `axvline`/`axhline`/`axvspan`/`axhspan`, `text`/`annotate`, `title`/`xlabel`/`ylabel`/`xlim`/`ylim`/`grid`/`legend` y `subplots`. También puedes usar `xticks`/`yticks` (con o sin etiquetas), barras apiladas (`bar(..., bottom=...)`), `fill_between(..., where=...)` y escala logarítmica en base 10 (`set_yscale('log')`, `semilogy`, `loglog`) sin perder fluidez. Contornos, 3D, imágenes o `rotation` en los ticks también funcionan, pero se muestran como imagen estática (más lenta).
> 5. ANTES DE RESPONDER: Utiliza tu propio intérprete de Python en segundo plano para verificar que tu script no genera errores y es robusto.
> 6. SECUENCIA OBLIGATORIA: Tu respuesta DEBE contener AMBAS partes en este orden estricto. Primero escribe la PARTE 1 completa (la explicación magistral extensa en texto y LaTeX con sus fuentes verificadas, enlaces directos y la nota de extracción de cada una) y, solo al final, la PARTE 2 envuelta en su bloque ```json. Está TERMINANTEMENTE PROHIBIDO devolver únicamente el bloque JSON o saltarse la explicación magistral inicial.
