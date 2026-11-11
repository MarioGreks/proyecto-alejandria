// Idioma de lo que escribe la IA. Hoy solo castellano; para añadir otro, una entrada aquí y su equivalente en backend/idioma.py.
const IDIOMAS = {
    es: `IDIOMA: escribe TODO el contenido (explicación, teoría, glosario, ejercicios, notas de las referencias, texto del laboratorio y etiquetas de los controles) en castellano de España: ortografía y vocabulario de España (p. ej. «ordenador», «fichero», «coste», «gráfica»), tuteo o tono académico impersonal, sin voseo ni giros latinoamericanos, y la terminología habitual de las universidades españolas. Los nombres propios, los títulos originales de las referencias, las fórmulas y los identificadores del código (variables y claves del JSON) se dejan como son.`,
} as const;
const IDIOMA_ACTUAL: keyof typeof IDIOMAS = 'es';

// Las IA con búsqueda web (DeepSeek, ChatGPT, Gemini) dejan marcas como [reference:25] en el texto, que en Alejandría no llevan a nada.
const SIN_MARCAS_CITA = `CITAS: dentro de los textos del JSON (teoría, glosario, ejercicios, notas y laboratorio) NO dejes las marcas de cita de tu buscador ni números de referencia sueltos, como [reference:3], [ref 2], [cite: 1], 【4†fuente】 o :contentReference[oaicite:0]{index=0}: fuera de tu chat no llevan a ninguna parte. Si una idea viene de una fuente, nómbrala en la frase (autor y año, p. ej. «como demostró Laplace (1812)») y pon esa fuente, con su nota, en el array "referencias".`;

// Evita forzar matemáticas donde no las hay (una persona, una época, una escuela) sin rebajar el nivel de los conceptos formales.
// El prompt «clásico» (sin esta regla) sigue disponible en la app. Ante la duda, FORMAL.
const TIPO_CONCEPTO = `TIPO DE CONCEPTO: antes de rellenar el JSON decide en silencio de qué tipo es el concepto y adapta el contenido. Es un proceso interno: no lo menciones en el texto de la respuesta ni añadas más campos al JSON que los del ejemplo; el tipo se anota solo en el campo "tipo" del JSON (formal, historico o teorico, sin tildes).
- FORMAL: tiene un resultado, teorema, modelo, método o magnitud cuantificable (p. ej. el teorema de Bayes, Black-Scholes, una distribución de probabilidad, un estimador). Si dudas entre formal e histórico o teórico, elige FORMAL. Se aplican todas las exigencias de nivel doctorado de este prompt: teoría extensa con desarrollo matemático, glosario, ejercicios y laboratorio.
- HISTÓRICO O CONCEPTUAL: es una persona, una época, una escuela, una controversia o una idea sin fórmula propia (p. ej. «Bernoulli y el origen de la probabilidad», «la crisis de fundamentos»). No inventes matemáticas para que parezca formal. La teoría cuenta con rigor el contexto, las personas, las ideas y su influencia, con subtítulos ## a tu criterio y fórmulas solo si de verdad aportan (en bloques $$ como indica este prompt). El glosario recoge los términos y nombres clave con definiciones claras. "ejercicios" va como [] y "laboratorio" como {"explicacion": "", "controles": [], "codigo": ""}, salvo que el concepto tenga una parte cuantificable real: en ese caso se trata como FORMAL. Las referencias siguen siendo obligatorias y reales.
- TEÓRICO NO MATEMÁTICO: es un marco conceptual o argumental sin formalismo propio (p. ej. economía conceptual, filosofía de la ciencia, metodología de la investigación). La teoría es argumentada, con las posturas enfrentadas, sus autores y las críticas; el glosario recoge los conceptos clave con su autor; "ejercicios" son entre 2 y 4 casos de análisis (comparar posturas, aplicar el marco a un caso concreto, evaluar un argumento) con su respuesta razonada; "laboratorio" va vacío como arriba, salvo que haya una parte cuantificable real (entonces, FORMAL).`;

// JSON que un parser estricto pueda leer: las IA fallan sobre todo en comillas dobles dentro de un texto (citas textuales) y en comas olvidadas.
const JSON_SEGURO = `JSON VÁLIDO: el bloque tiene que poder leerse con un parser estricto. Escapa con \\" las comillas dobles que aparezcan DENTRO de un texto (son muy habituales en las citas textuales; mejor usa comillas «así»), escribe los saltos de línea de un texto como \n, duplica las barras invertidas de LaTeX (\\frac, \\lambda) y no olvides ninguna coma entre elementos.`;

// Texto común a todos los modos (la plantilla formal y las de los conceptos no matemáticos comparten estas piezas).
const CLUSTER_DESC = `RAMA ACADÉMICA ESPECÍFICA y breve (máximo 3 palabras, nunca una frase). Ej: 'Estadística' [para markov, splines, estocásticos], 'Biometría y Demografía' [para Lee-Carter, mortalidad, supervivencia], 'Finanzas' [para Black-Scholes, derivados], 'Economía' [Macro/Micro], 'Matemáticas Puras'. Sé preciso con la rama de especialidad, no uses 'Matemáticas' como cajón de sastre para todo. Si en este mensaje aparece una línea 'CLÚSTERES EXISTENTES', reutiliza EXACTAMENTE uno de esos nombres cuando el concepto encaje; crea uno nuevo solo si ninguno encaja.`;
const FUENTES_BIBLIO = `Al final de tu explicación, incluye obligatoriamente un apartado detallando las fuentes bibliográficas y referencias académicas primarias (papers fundacionales, autores y manuales canónicos) de donde bebes la información. **Junto a cada referencia, debes añadir una nota o comentario explicativo que aclare con exactitud qué concepto, teorema, fórmula o desarrollo has sacado de esa fuente específica.** Para localizar y contrastar esas fuentes consulta como mínimo **Google Scholar** (https://scholar.google.com), además de arXiv, DOI/Crossref y las páginas de las editoriales: si tienes búsqueda web, úsala ahí y apóyate en los resultados y en el número de citas de Scholar para priorizar los trabajos fundacionales y más citados; si no puedes consultar la web, dilo expresamente en lugar de suponer. ANTES de escribir cada fuente, cuestiónate a ti mismo y verifica con rigor crítico si de verdad existen dichas fuentes en la literatura académica real (está estrictamente prohibido alucinar o inventar títulos/autores), y proporciona los enlaces directos (URL oficial, enlace DOI o link a arXiv/repositorio académico) a esos papers o páginas de donde las has obtenido.`;

// Temas relacionados (campo «sugerencias»): la app los compara con las neuronas que ya existen y solo enseña los que aún no están (utils/sugerencias.ts).
const CAMPO_SUGERENCIAS = `    "sugerencias": [
        {"nombre": "Nombre formal de un tema relacionado, tal como se llama en la literatura (p. ej. Modelo de Gompertz)", "motivo": "Una frase: por qué conviene verlo después de este concepto"}
    ],\n`;
const REGLA_SUGERENCIAS = `SUGERENCIAS: en "sugerencias" pon entre 3 y 5 temas relacionados con este concepto que merezca la pena estudiar a continuación (casos particulares, generalizaciones, alternativas, prerrequisitos o aplicaciones). Cada uno lleva su "nombre" formal y habitual, sin paréntesis ni explicaciones (p. ej. «Modelo de Gompertz»), y un "motivo" de una sola frase. Han de ser conceptos reales y distintos de este mismo concepto: no repitas el que acabas de desarrollar ni inventes temas.`;

const DOBLE_SALTO = '\n\n';

// Campo «tipo» del JSON de ejemplo, solo en el prompt que decide el tipo (automático). El clásico no lo lleva: sus neuronas se deducen en el backend (limpieza.tipo_de).
const CAMPO_TIPO_AUTO = `    "tipo": "formal, historico o teorico: el que hayas decidido en TIPO DE CONCEPTO (exactamente una de esas tres palabras, sin tildes)",\n`;

// Frases que solo lleva el prompt flexible, dentro del campo «teoria» del JSON de ejemplo.
const SI_FORMAL = (flexible: boolean) => flexible ? 'SI EL CONCEPTO ES FORMAL (ver «TIPO DE CONCEPTO» antes de las reglas): ' : '';
const SI_HISTORICO = (flexible: boolean) => flexible ? ' SI ES HISTÓRICO O CONCEPTUAL: relato claro y riguroso del contexto, las personas, las ideas y su influencia, sin desarrollo matemático forzado.' : '';

// Revisión interna: mejora la calidad sin añadir nada visible a la respuesta (ni en el texto ni en el JSON).
const VERIFICACION_OCULTA = `VERIFICACIÓN DOBLE OCULTA: antes de escribir la respuesta final, revísala DOS veces en silencio. Primera pasada, rigor: cada definición, fórmula, deducción, dato, fecha, autor y referencia es correcto; si no estás seguro de algo, quítalo o suavízalo en lugar de inventarlo. Segunda pasada, coherencia: la teoría, el glosario, los ejercicios y el laboratorio no se contradicen y usan la misma notación; cada ejercicio se resuelve de verdad con el resultado que das; el código del laboratorio se ejecuta sin errores y dibuja lo que la teoría describe. Corrige lo que falle y repite la revisión hasta no encontrar nada. Es un proceso interno: NO lo muestres ni lo menciones (ni listas de comprobación, ni «verificado», ni notas, ni campos extra en el JSON); la respuesta debe leerse como si hubiera salido correcta a la primera.`;

// Un tema de asignatura trae varios conceptos y cada neurona trata uno solo: primero se elige, luego se genera.
const ELEGIR_CONCEPTO = (conceptos: string) => `El material puede contener varios ${conceptos} distintos y cada neurona de Alejandría trata UNO solo, así que trabajas en DOS PASOS:

PASO 1 (en tu primera respuesta): lee TODO el material y haz una lista numerada de TODOS los ${conceptos} distintos que contiene, con su nombre y una línea sobre qué trata cada uno, sin dejarte ninguno. Termina preguntándome cuál quiero. En este paso NO generes ningún JSON: si tu primera respuesta lo contiene, has incumplido estas instrucciones. Solo si el material trata claramente de un único concepto, sáltate la pregunta y pasa directamente al PASO 2.

PASO 2 (cuando te diga cuál): genera un único objeto JSON solo de ese concepto (su teoría cubre solo ese; los demás se mencionan sin desarrollarlos) que siga EXACTAMENTE esta estructura, sin añadir texto fuera del JSON (ni saludos ni explicaciones extra). Entrégalo SIEMPRE dentro de un único bloque de código \`\`\`json ... \`\`\`, nunca como texto suelto del chat: el chat se come los \`$$\`, los \`##\` y la sangría del código Python al copiarlo. Si luego te pido otro concepto de la lista, haz otro JSON igual.`;

// Una IA escribió `n_puntos = int(n_puntos)` sin llaves: el nombre no existe en Python y el control no hacía nada.
const LLAVES_SIEMPRE = ' Cada control se usa SIEMPRE con sus llaves, también dentro de una conversión (`n = int({n})`, `mu = float({mu})`); NUNCA escribas el nombre suelto sin llaves (`n = int(n)`), porque esa variable no existe en Python.';

const FORMATO_FINAL ='Devuelve ÚNICAMENTE el bloque JSON en el PASO 2; en el PASO 1 solo la lista y la pregunta.';

const fuentes = (flexible: boolean) => `Actúa como un Catedrático Universitario e Investigador Postdoctoral experto en visualización de datos. Tu objetivo es procesar el material académico que te proporciono y estructurarlo de forma exhaustiva, rigurosa y con extrema profundidad en un formato JSON diseñado para "Alejandría", un simulador interactivo de conocimiento.

${ELEGIR_CONCEPTO(flexible ? 'conceptos' : 'conceptos matemáticos/analíticos')}

\`\`\`json
{
    "id": "identificador_unico_snake_case",
    "cluster": "${CLUSTER_DESC}",
${flexible ? CAMPO_TIPO_AUTO : ''}    "nombre": "Nombre Completo del Concepto",
    "teoria": "${SI_FORMAL(flexible)}Explicación teórica EXTREMADAMENTE EXTENSA, profunda y rigurosa del concepto (mínimo 1000 palabras). Utiliza un lenguaje académico formal de nivel doctorado (PhD). DEBES estructurar el contenido con subtítulos Markdown (##) abarcando: 1. Introducción Histórica/Contextual, 2. Fundamentos y Axiomas, 3. Desarrollo Matemático Profundo, 4. Aplicaciones y Limitaciones (las referencias bibliográficas se colocan por separado en el campo 'referencias', NO dentro de este texto de teoría). Desglosa cada deducción paso a paso. ESTÁ ESTRICTAMENTE PROHIBIDO usar fórmulas apelmazadas dentro de los párrafos (inline con $). Absolutamente TODAS las fórmulas, ecuaciones y desarrollo matemático deben ir segregadas en bloques independientes usando $$ con líneas en blanco antes y después, y estar numeradas al estilo paper académico usando \\\\tag{n}, ejemplo:\\n\\n$$\\nf(x) = y \\\\tag{1}\\n$$\\n\\nUsa solo texto puro para explicar y manda toda la matemática a bloques $$.${SI_HISTORICO(flexible)}",
    "glosario": [
        {"termino": "Variable 1", "definicion": "Definición estricta y matemática usando LaTeX si es necesario."},
        {"termino": "Variable 2", "definicion": "Definición estricta y matemática usando LaTeX si es necesario."}
    ],
    "ejercicios": [
        {
            "enunciado": "Planteamiento de un problema avanzado de investigación sobre este tema.",
            "solucion": "Resolución analítica paso a paso del problema, demostrando el desarrollo lógico e implementando $$ LaTeX $$."
        }
    ],
    "referencias": [
        {
            "titulo": "Título exacto del paper, libro o publicación académica fuente",
            "autores": "Autor/es y año (ej: 'Itô, K. (1951)')",
            "url": "https://doi.org/..., enlace directo oficial o la ficha de la publicación en Google Scholar (https://scholar.google.com/...) si no tiene DOI",
            "nota": "Comentario conciso explicando qué concepto, deducción matemática, fórmula o axioma concreto se ha extraído de esta fuente para este apunte. Si la localizaste o la contrastaste en Google Scholar, indícalo aquí."
        }
    ],
${CAMPO_SUGERENCIAS}    "laboratorio": {
        "explicacion": "Explicación detallada (soporta LaTeX con $$) sobre qué representa la simulación y qué parámetros modifica el usuario con los deslizables para experimentar.",
        "controles": [
            {
                "variable": "v_ini",
                "label": "Velocidad Inicial (m/s)",
                "min": 10,
                "max": 100,
                "step": 1,
                "default": 50
            },
            {
                "variable": "angulo",
                "label": "Ángulo (grados)",
                "min": 0,
                "max": 90,
                "step": 1,
                "default": 45
            }
        ],
        "codigo": "import numpy as np\\nimport matplotlib.pyplot as plt\\n\\n# Variables controladas por UI\\nv_ini = {v_ini}\\nangulo = {angulo}\\ngravedad = 9.8\\n\\nt = np.linspace(0, 10, 200)\\nrad = np.radians(angulo)\\nx = v_ini * np.cos(rad) * t\\ny = v_ini * np.sin(rad) * t - 0.5 * gravedad * t**2\\n\\nmask = y >= 0\\nplt.figure(figsize=(8,5))\\nplt.plot(x[mask], y[mask], color='cyan')\\nplt.title('Trayectoria Parabólica')\\nplt.grid(True, alpha=0.3)\\nplt.show()"
    }
}
\`\`\`

${flexible ? TIPO_CONCEPTO + DOBLE_SALTO + JSON_SEGURO + DOBLE_SALTO : ''}### REGLAS DE ORO:
1. El campo \`codigo\` dentro de \`laboratorio\` debe ser un string de Python válido (con saltos de línea escapados \\n).
2. ${flexible ? 'Si el concepto es FORMAL, debes' : 'Debes'} incluir SIEMPRE un array \`controles\` con los parámetros que el usuario podrá modificar en la UI. Define tantos como necesite el modelo para APRENDERLO explorando (suelen ser entre 2 y 8, hasta un máximo de 24): los que cambien de verdad el comportamiento, sin rellenar con controles que no enseñen nada ni dejar fuera una variable clave. Si son muchos, agrúpalos con el campo opcional \`"grupo"\` (p. ej. \`"grupo": "Mercado"\`). Cada rango (\`min\`/\`max\`) debe permitir ver los regímenes interesantes del modelo, no solo el valor típico. Por defecto son deslizables (\`min\`, \`max\`, \`step\`, \`default\` numéricos). También puedes usar \`"tipo": "checkbox"\` (\`default\`: true/false; en el código llega como True/False) o \`"tipo": "select"\` con \`"opciones": ["a", "b"]\` y un \`default\` de la lista (en el código llega como un literal de Python, p. ej. \`"a"\`).
3. En el código Python, el valor de las variables controladas debe asignarse utilizando EXACTAMENTE las variables del array \`controles\` envueltas en llaves, por ejemplo \`v_ini = {v_ini}\`. Nuestro sistema reemplazará estos tokens en tiempo de ejecución.${LLAVES_SIEMPRE}
4. El código Python debe generar gráficos avanzados con \`matplotlib\` (\`plt.show()\`). Ya no usamos output JSON crudo. Para que la gráfica responda con fluidez al mover los controles, usa solo: \`plot\`, \`scatter\`, \`bar\` (colores y anchos uniformes), \`fill_between\`, \`axvline\`/\`axhline\`/\`axvspan\`/\`axhspan\`, \`text\`/\`annotate\`, \`title\`/\`xlabel\`/\`ylabel\`/\`xlim\`/\`ylim\`/\`grid\`/\`legend\` y \`subplots\`. También puedes usar \`xticks\`/\`yticks\` (con o sin etiquetas), barras apiladas (\`bar(..., bottom=...)\`), \`fill_between(..., where=...)\` y escala logarítmica en base 10 (\`set_yscale('log')\`, \`semilogy\`, \`loglog\`), histogramas (\`hist\` de una sola serie, con bins de igual anchura) e imágenes de matrices (\`imshow\` sin interpolación suave) sin perder fluidez. Contornos, 3D, barras de color (\`colorbar\`) o \`rotation\` en los ticks también funcionan, pero se muestran como imagen estática (mucho más lenta).
5. ANTES DE RESPONDER: Utiliza tu propio intérprete de Python en segundo plano para verificar que la lógica del script es robusta y sin errores.
6. ${IDIOMAS[IDIOMA_ACTUAL]}
7. ${VERIFICACION_OCULTA}
8. ${SIN_MARCAS_CITA}
9. ${REGLA_SUGERENCIAS}
10. ${FORMATO_FINAL}`;

const exploracion = (flexible: boolean) => `Actúa como un Investigador Catedrático y tutor académico de nivel de Doctorado (PhD). 
Quiero que me expliques a fondo y con extremo rigor el siguiente concepto: **[INSERTA EL CONCEPTO AQUÍ]**.

Tu respuesta debe estructurarse obligatoriamente en **DOS PARTES SECUENCIALES**:

**PARTE 1: Explicación Magistral (PhD Level)**
Explícame el concepto paso a paso con un nivel de detalle propio de una tesis doctoral. Incluye el formalismo matemático subyacente${flexible ? ' (si el concepto lo tiene)' : ''}, intuición física/geométrica profunda, deducciones críticas, implicaciones en investigación actual y ejemplos avanzados. Usa todo el formato LaTeX (usando \`$$\` y \`$\`) que consideres necesario para que la lectura sea de altísimo valor investigativo. No escatimes en extensión, se tan explícito y minucioso como te sea posible. 

${FUENTES_BIBLIO}

**PARTE 2: La Neurona JSON (Sintetizador de Alejandría)**
Inmediatamente después de haber desarrollado toda tu explicación magistral (NUNCA te saltes la PARTE 1), debes aislar ${flexible ? 'el núcleo (su corazón matemático, si es formal)' : 'el corazón matemático'} de lo que me acabas de explicar y generar una "Neurona JSON" compatible con mi sistema de simulación interactiva.

La Neurona JSON debe estar al final de tu respuesta, obligatoriamente envuelta en un bloque \`\`\`json y seguir EXACTAMENTE esta estructura:

\`\`\`json
{
    "id": "identificador_unico_snake_case_del_tema",
    "cluster": "${CLUSTER_DESC}",
${flexible ? CAMPO_TIPO_AUTO : ''}    "nombre": "Nombre Formal del Concepto",
    "teoria": "${SI_FORMAL(flexible)}Explicación teórica EXTREMADAMENTE EXTENSA, profunda y rigurosa del concepto (mínimo 1000 palabras). Basándote en tu explicación magistral anterior, debes estructurar el contenido con subtítulos Markdown (##) abarcando: 1. Introducción Histórica/Contextual, 2. Fundamentos y Axiomas, 3. Desarrollo Matemático Profundo, 4. Aplicaciones y Limitaciones (las referencias bibliográficas se colocan por separado en el campo 'referencias', NO dentro de este texto de teoría). ESTÁ ESTRICTAMENTE PROHIBIDO usar fórmulas apelmazadas dentro de los párrafos (inline con $). Absolutamente TODAS las fórmulas y desarrollos deben ir segregados en bloques independientes usando $$ con líneas en blanco antes y después, y numeradas con \\\\tag{n}. El texto solo para leer, las matemáticas separadas en bloques.${SI_HISTORICO(flexible)}",
    "glosario": [
        {"termino": "Término Clave 1", "definicion": "Definición matemática formal en LaTeX."},
        {"termino": "Término Clave 2", "definicion": "Definición matemática formal en LaTeX."}
    ],
    "ejercicios": [
        {
            "enunciado": "Un problema matemático avanzado de nivel doctorado sobre el tema.",
            "solucion": "Resolución analítica paso a paso del problema usando $$ LaTeX $$."
        }
    ],
    "referencias": [
        {
            "titulo": "Título exacto del paper, libro o publicación académica real",
            "autores": "Autor/es y año de publicación (Ej: 'Itô, K. (1951)')",
            "url": "https://doi.org/..., link directo a arXiv / repositorio oficial o la ficha de la publicación en Google Scholar (https://scholar.google.com/...)",
            "nota": "Comentario detallado explicando qué concepto, deducción matemática, fórmula o axioma concreto se ha extraído de esta fuente para este apunte. Si la localizaste o la contrastaste en Google Scholar, indícalo aquí."
        }
    ],
${CAMPO_SUGERENCIAS}    "laboratorio": {
        "explicacion": "Explicación detallada (soporta LaTeX con $$) sobre qué representa la simulación y qué parámetros modifica el usuario con los deslizables para experimentar.",
        "controles": [
            {
                "variable": "param_1",
                "label": "Parámetro Físico 1",
                "min": 0,
                "max": 10,
                "step": 0.5,
                "default": 1.0
            },
            {
                "variable": "param_2",
                "label": "Coeficiente Alpha",
                "min": 0.1,
                "max": 1.0,
                "step": 0.1,
                "default": 0.5
            }
        ],
        "codigo": "import numpy as np\\nimport matplotlib.pyplot as plt\\n\\n# Variables de control UI\\nparam_1 = {param_1}\\nparam_2 = {param_2}\\n\\nt = np.linspace(0, 20, 500)\\ny = np.exp(-param_2 * t) * np.cos(param_1 * t)\\n\\nplt.figure(figsize=(8,4))\\nplt.plot(t, y, color='orange')\\nplt.title('Oscilador Amortiguado')\\nplt.grid(True, alpha=0.3)\\nplt.show()"
    }
}
\`\`\`

${flexible ? TIPO_CONCEPTO + DOBLE_SALTO + JSON_SEGURO + DOBLE_SALTO : ''}### REGLAS DE ORO:
1. El campo \`codigo\` dentro de \`laboratorio\` debe ser un string de Python válido (con saltos de línea escapados \\n).
2. ${flexible ? 'Si el concepto es FORMAL, debes' : 'Debes'} incluir SIEMPRE un array \`controles\` con los parámetros que el usuario podrá modificar en la UI. Define tantos como necesite el modelo para APRENDERLO explorando (suelen ser entre 2 y 8, hasta un máximo de 24): los que cambien de verdad el comportamiento, sin rellenar con controles que no enseñen nada ni dejar fuera una variable clave. Si son muchos, agrúpalos con el campo opcional \`"grupo"\` (p. ej. \`"grupo": "Mercado"\`). Cada rango (\`min\`/\`max\`) debe permitir ver los regímenes interesantes del modelo, no solo el valor típico. Por defecto son deslizables (\`min\`, \`max\`, \`step\`, \`default\` numéricos). También puedes usar \`"tipo": "checkbox"\` (\`default\`: true/false; en el código llega como True/False) o \`"tipo": "select"\` con \`"opciones": ["a", "b"]\` y un \`default\` de la lista (en el código llega como un literal de Python, p. ej. \`"a"\`).
3. En el código Python, el valor de las variables controladas debe asignarse utilizando EXACTAMENTE las variables del array \`controles\` envueltas en llaves, por ejemplo \`param_1 = {param_1}\`.${LLAVES_SIEMPRE}
4. El código Python debe generar gráficos con \`matplotlib\` (\`plt.show()\`). Para que la gráfica responda con fluidez al mover los controles, usa solo: \`plot\`, \`scatter\`, \`bar\` (colores y anchos uniformes), \`fill_between\`, \`axvline\`/\`axhline\`/\`axvspan\`/\`axhspan\`, \`text\`/\`annotate\`, \`title\`/\`xlabel\`/\`ylabel\`/\`xlim\`/\`ylim\`/\`grid\`/\`legend\` y \`subplots\`. También puedes usar \`xticks\`/\`yticks\` (con o sin etiquetas), barras apiladas (\`bar(..., bottom=...)\`), \`fill_between(..., where=...)\` y escala logarítmica en base 10 (\`set_yscale('log')\`, \`semilogy\`, \`loglog\`), histogramas (\`hist\` de una sola serie, con bins de igual anchura) e imágenes de matrices (\`imshow\` sin interpolación suave) sin perder fluidez. Contornos, 3D, barras de color (\`colorbar\`) o \`rotation\` en los ticks también funcionan, pero se muestran como imagen estática (mucho más lenta).
5. ANTES DE RESPONDER: Utiliza tu propio intérprete de Python en segundo plano para verificar que tu script no genera errores y es robusto.
6. SECUENCIA OBLIGATORIA: Tu respuesta DEBE contener AMBAS partes en este orden estricto. Primero escribe la PARTE 1 completa (la explicación magistral extensa en texto y LaTeX con sus fuentes verificadas, enlaces directos y la nota de extracción de cada una) y, solo al final, la PARTE 2 envuelta en su bloque \`\`\`json. Está TERMINANTEMENTE PROHIBIDO devolver únicamente el bloque JSON o saltarse la explicación magistral inicial.
7. ${IDIOMAS[IDIOMA_ACTUAL]}
8. ${VERIFICACION_OCULTA} Esto vale para la PARTE 1 y para el JSON de la PARTE 2.
9. ${SIN_MARCAS_CITA}
10. ${REGLA_SUGERENCIAS}`;


export const PROMPT_FUENTES = fuentes(true);
export const PROMPT_EXPLORACION = exploracion(true);
/** Versión anterior de ambos prompts: todo concepto se trata como matemático. Se elige en el Sintetizador. */
export const PROMPT_FUENTES_CLASICO = fuentes(false);
export const PROMPT_EXPLORACION_CLASICO = exploracion(false);

// ---------------------------------------------------------------------------------------------------------------------------
// Modos del Sintetizador. «formal» es el prompt de siempre; «auto» deja que la IA decida entre los tres tipos; «historico» y «teorico» son
// prompts propios (no el matemático con partes vacías) para conceptos sin formalismo: comparten idioma, citas, verificación y formato.
export type ModoPrompt = 'auto' | 'formal' | 'historico' | 'teorico';
export const MODOS_PROMPT: { id: ModoPrompt; etiqueta: string; ayuda: string }[] = [
    { id: 'auto', etiqueta: 'Automático (la IA decide)', ayuda: 'La IA decide si el concepto es formal, histórico o teórico y adapta el contenido. Ante la duda lo trata como formal.' },
    { id: 'formal', etiqueta: 'Formal (matemático, el clásico)', ayuda: 'Teoría de doctorado con desarrollo matemático, glosario, ejercicios y laboratorio. Es el prompt de siempre.' },
    { id: 'historico', etiqueta: 'Histórico o conceptual', ayuda: 'Personas, épocas, escuelas e ideas: relato documentado, glosario y referencias. Sin ejercicios ni laboratorio.' },
    { id: 'teorico', etiqueta: 'Teórico no matemático', ayuda: 'Marcos conceptuales o argumentales (economía conceptual, filosofía de la ciencia, metodología): teoría argumentada, glosario, casos de análisis y referencias. Sin laboratorio.' },
];

type NoFormal = { tipo: 'historico' | 'teorico'; rol: string; nombre: string; explicacion: string; teoria: string; termino: string; definicion: string; ejercicios: string; reglaEjercicios: string };

const NO_FORMAL: Record<'historico' | 'teorico', NoFormal> = {
    historico: {
        tipo: 'historico',
        rol: 'Historiador de la ciencia y Catedrático Universitario, experto en cómo nacen y evolucionan las ideas',
        nombre: 'Nombre Completo del Concepto, la Persona o la Escuela',
        explicacion: 'Cuéntame el concepto con el rigor de un historiador profesional y un nivel de detalle propio de una tesis doctoral: el problema de la época, las personas y escuelas implicadas, la cronología de cómo se formó la idea, las controversias y su influencia posterior. Distingue siempre lo documentado de lo que los historiadores aún discuten. Usa fórmulas ($$ y $) solo si de verdad aclaran una idea; no inventes desarrollo matemático. No escatimes en extensión.',
        teoria: 'Relato EXTENSO, riguroso y bien documentado del concepto (mínimo 1000 palabras), con lenguaje académico formal. Estructúralo con subtítulos Markdown (##): 1. El problema y el contexto de la época, 2. Protagonistas y escuelas, 3. Cronología y desarrollo de las ideas, 4. Controversias, influencia y legado (las referencias bibliográficas se colocan por separado en el campo «referencias», NO dentro de este texto). Nombra siempre al autor y el año en la frase (p. ej. «como defendió Laplace (1812)») y distingue lo documentado de lo discutido por los historiadores. Fórmulas SOLO si aclaran una idea, en bloques $$ independientes con líneas en blanco antes y después; no inventes desarrollos matemáticos para que parezca formal.',
        termino: 'Persona, obra o término clave',
        definicion: 'Quién fue o qué significa, con fechas y contexto, en una o dos frases claras.',
        ejercicios: '    "ejercicios": [],',
        reglaEjercicios: 'El array "ejercicios" va vacío ([]), como en el ejemplo: un concepto histórico no tiene problemas que resolver.',
    },
    teorico: {
        tipo: 'teorico',
        rol: 'Catedrático Universitario y tutor académico de nivel de Doctorado, experto en teoría y análisis conceptual',
        nombre: 'Nombre Completo del Concepto o del Marco Teórico',
        explicacion: 'Explícame el concepto con el rigor de una tesis doctoral: el problema que aborda, sus supuestos y definiciones, el desarrollo del argumento o del marco conceptual, las posturas enfrentadas con sus autores, las críticas y alternativas, y sus aplicaciones o casos. Distingue hechos, supuestos y valoraciones. Usa fórmulas ($$ y $) solo si de verdad aclaran una idea. No escatimes en extensión.',
        teoria: 'Explicación teórica EXTENSA, rigurosa y argumentada del concepto (mínimo 1000 palabras), con lenguaje académico formal. Estructúrala con subtítulos Markdown (##): 1. Planteamiento y problema que aborda, 2. Supuestos y conceptos fundamentales, 3. Desarrollo del argumento o del marco, 4. Críticas, alternativas y límites, 5. Aplicaciones y casos (las referencias bibliográficas se colocan por separado en el campo «referencias», NO dentro de este texto). Presenta las posturas enfrentadas con su autor y año, y distingue hechos, supuestos y valoraciones. Fórmulas SOLO si aclaran una idea, en bloques $$ independientes con líneas en blanco antes y después; no fuerces un tratamiento matemático.',
        termino: 'Concepto clave',
        definicion: 'Definición precisa, con el autor que la propuso y el marco en el que se usa.',
        ejercicios: `    "ejercicios": [
        {
            "enunciado": "Caso o pregunta de análisis (comparar dos posturas, aplicar el marco a un caso concreto, evaluar un argumento).",
            "solucion": "Respuesta razonada paso a paso, con los criterios usados y las posturas contrarias consideradas."
        }
    ],`,
        reglaEjercicios: 'En "ejercicios" incluye entre 2 y 4 casos de análisis (no problemas de cálculo): comparar posturas, aplicar el marco a un caso concreto o evaluar un argumento, cada uno con su respuesta razonada.',
    },
};

const jsonNoFormal = (m: NoFormal) => `{
    "id": "identificador_unico_snake_case",
    "cluster": "${CLUSTER_DESC}",
    "tipo": "${m.tipo}",
    "nombre": "${m.nombre}",
    "teoria": "${m.teoria}",
    "glosario": [
        {"termino": "${m.termino} 1", "definicion": "${m.definicion}"},
        {"termino": "${m.termino} 2", "definicion": "${m.definicion}"}
    ],
${m.ejercicios}
    "referencias": [
        {
            "titulo": "Título exacto del paper, libro o publicación académica real",
            "autores": "Autor/es y año (ej: 'Hald, A. (1990)')",
            "url": "https://doi.org/..., enlace directo oficial o la ficha de la publicación en Google Scholar (https://scholar.google.com/...) si no tiene DOI",
            "nota": "Comentario conciso explicando qué hecho, idea, postura o desarrollo concreto se ha extraído de esta fuente para este apunte. Si la localizaste o la contrastaste en Google Scholar, indícalo aquí."
        }
    ],
${CAMPO_SUGERENCIAS}    "laboratorio": {"explicacion": "", "controles": [], "codigo": ""}
}`;

const SIN_LABORATORIO = 'El campo "laboratorio" va SIEMPRE vacío, tal como está en el ejemplo: este tipo de concepto no tiene simulación. No inventes controles ni código.';

const reglasNoFormal = (m: NoFormal, ultima: string) => [m.reglaEjercicios, SIN_LABORATORIO, `El campo "tipo" vale siempre "${m.tipo}", tal como está en el ejemplo.`, JSON_SEGURO, IDIOMAS[IDIOMA_ACTUAL], VERIFICACION_OCULTA, SIN_MARCAS_CITA, REGLA_SUGERENCIAS, ultima]
    .map((r, i) => `${i + 1}. ${r}`).join('\n');

const noFormalFuentes = (m: NoFormal) => `Actúa como un ${m.rol}. Tu objetivo es procesar el material académico que te proporciono y estructurarlo con rigor y profundidad en un formato JSON diseñado para "Alejandría", una app de conocimiento interactiva.

${ELEGIR_CONCEPTO('conceptos')}

\`\`\`json
${jsonNoFormal(m)}
\`\`\`

### REGLAS DE ORO:
${reglasNoFormal(m, FORMATO_FINAL)}`;

const noFormalExploracion = (m: NoFormal) => `Actúa como un ${m.rol}, de nivel de Doctorado (PhD).
Quiero que me expliques a fondo y con extremo rigor el siguiente concepto: **[INSERTA EL CONCEPTO AQUÍ]**.

Tu respuesta debe estructurarse obligatoriamente en **DOS PARTES SECUENCIALES**:

**PARTE 1: Explicación Magistral**
${m.explicacion}

${FUENTES_BIBLIO}

**PARTE 2: La Neurona JSON (Sintetizador de Alejandría)**
Inmediatamente después de haber desarrollado toda tu explicación (NUNCA te saltes la PARTE 1), debes aislar el núcleo de lo que me acabas de explicar y generar una "Neurona JSON" compatible con mi app de conocimiento interactiva.

La Neurona JSON debe estar al final de tu respuesta, obligatoriamente envuelta en un bloque \`\`\`json y seguir EXACTAMENTE esta estructura:

\`\`\`json
${jsonNoFormal(m)}
\`\`\`

### REGLAS DE ORO:
${reglasNoFormal(m, 'SECUENCIA OBLIGATORIA: tu respuesta DEBE contener AMBAS partes en este orden estricto. Primero escribe la PARTE 1 completa (la explicación extensa con sus fuentes verificadas, enlaces directos y la nota de extracción de cada una) y, solo al final, la PARTE 2 envuelta en su bloque json. Está TERMINANTEMENTE PROHIBIDO devolver únicamente el bloque JSON o saltarse la explicación inicial.')}`;

/** Prompt de la modalidad «Fuentes propias» (material que pegas junto al prompt) para cada modo. */
export const promptFuentes = (modo: ModoPrompt): string =>
    modo === 'formal' ? PROMPT_FUENTES_CLASICO : modo === 'auto' ? PROMPT_FUENTES : noFormalFuentes(NO_FORMAL[modo]);
/** Prompt de la modalidad «Exploración libre» (le das solo el concepto a la IA) para cada modo. */
export const promptExploracion = (modo: ModoPrompt): string =>
    modo === 'formal' ? PROMPT_EXPLORACION_CLASICO : modo === 'auto' ? PROMPT_EXPLORACION : noFormalExploracion(NO_FORMAL[modo]);

/** Pone el tema en el hueco «[INSERTA EL CONCEPTO AQUÍ]» del prompt de exploración (cuando vienes de una sugerencia). Si el prompt no tiene hueco, lo deja igual. */
export const conTema = (prompt: string, tema: string) => prompt.replace('[INSERTA EL CONCEPTO AQUÍ]', () => tema);

// Añade, justo antes de las reglas, los clústeres que ya existen para que la IA reutilice sus nombres exactos.
export const conClustersExistentes = (prompt: string, clusters: string[]) =>
    clusters.length === 0 ? prompt : prompt.replace('### REGLAS DE ORO:', () => `CLÚSTERES EXISTENTES EN MI SISTEMA: ${clusters.join(', ')}

### REGLAS DE ORO:`);

// ---------------------------------------------------------------------------------------------------------------------------
// «Pedir revisión»: el prompt que se copia desde el panel de una neurona para que una IA externa la revise. Lleva la neurona (sin laboratorio ni embedding),
// los criterios de su tipo y las mismas reglas de formato que los prompts de creación; el resultado se pega en el editor (no pasa por «importar»).
export interface NeuronaRevisable {
    id: string; nombre: string; cluster?: string; tipo: 'formal' | 'historico' | 'teorico';
    teoria?: string; glosario?: unknown[]; ejercicios?: unknown[]; referencias?: unknown[]; sugerencias?: unknown[];
    sinapsis?: { con: string; nombre: string; estado: string; motivo: string }[];     // sus conexiones (también las rechazadas); sin esto el prompt no habla de sinapsis
    neuronas?: { id: string; nombre: string }[];                                      // el resto de la red, para poder proponer conexiones nuevas con ids reales
}

const linea = (s: string) => s.replace(/\s+/g, ' ').trim();

// Sección y reglas de sinapsis del prompt de revisión (solo si la neurona trae su lista de conexiones).
function seccionSinapsis(n: NeuronaRevisable): { texto: string; formato: string; campos: string } {
    const lista = (n.sinapsis ?? []).map(s => `- ${s.con} («${linea(s.nombre)}») | estado: ${s.estado} | motivo: ${linea(s.motivo) || '(sin motivo)'}`).join('\n') || '(esta neurona aún no tiene ninguna)';
    const otras = (n.neuronas ?? []).filter(o => o.id !== n.id && !(n.sinapsis ?? []).some(s => s.con === o.id));
    const texto = `5. SINAPSIS: son las conexiones de esta neurona con otras de mi red. Estado «aceptada» = la validé yo; «pendiente» = propuesta automática que aún no he mirado; «rechazada» = la descarté yo (se muestra con el motivo con que se propuso). Juzga si cada relación es real, útil y está bien razonada. No cambies nada de la neurona por esto: se responde en campos aparte.

SINAPSIS ACTUALES (id | estado | motivo):

${lista}

NEURONAS DE MI RED CON LAS QUE AÚN NO TIENE CONEXIÓN (id: nombre), por si falta alguna:

${otras.map(o => `${o.id}: ${linea(o.nombre)}`).join('\n') || '(ninguna)'}
`;
    const formato = `\n- Dentro de ese mismo bloque json añade, además, el campo "sinapsis": una entrada por CADA sinapsis actual (también las rechazadas), con "con" (el id exacto de la lista), "veredicto" y "razon" (una frase). "veredicto" es exactamente una de estas tres palabras: "confirmar" (la relación es real y útil; en una rechazada significa que la descartó por error), "cuestionar" (dudosa, vaga o mal razonada) o "quitar" (falsa, trivial o redundante). Y el campo "sinapsis_nuevas": entre 0 y 5 conexiones que falten, SOLO con neuronas de la lista de arriba, cada una con "con" (su id exacto) y "motivo" (una frase). No inventes ids. Ejemplo: "sinapsis": [{"con": "id_vecina", "veredicto": "quitar", "razon": "Solo comparten el nombre."}], "sinapsis_nuevas": [{"con": "id_de_la_lista", "motivo": "Es un caso particular de este concepto."}]`;
    return { texto, formato, campos: ', sinapsis, sinapsis_nuevas' };
}

const REVISION: Record<NeuronaRevisable['tipo'], { rol: string; criterio: string }> = {
    formal: {
        rol: 'Catedrático Universitario e Investigador Postdoctoral, experto en rigor matemático y en bibliografía académica',
        criterio: 'Es un concepto FORMAL: comprueba cada definición, fórmula, deducción, hipótesis y resultado (LaTeX con $ y $$), que los ejercicios y sus soluciones sean correctos y que no falte nada esencial. Si "ejercicios" tiene contenido, déjalo con contenido.',
    },
    historico: {
        rol: 'Historiador de la ciencia y Catedrático Universitario, experto en cómo nacen y evolucionan las ideas',
        criterio: 'Es un concepto HISTÓRICO O CONCEPTUAL: comprueba fechas, personas, obras, escuelas y cronología, y distingue lo documentado de lo que los historiadores aún discuten. NO añadas desarrollo matemático ni ejercicios que la neurona no tenga.',
    },
    teorico: {
        rol: 'Catedrático Universitario y tutor académico de nivel de Doctorado, experto en teoría y análisis conceptual',
        criterio: 'Es un concepto TEÓRICO NO MATEMÁTICO: comprueba que cada postura esté bien atribuida (autor y año), que los supuestos y las críticas sean fieles y que los casos de análisis de "ejercicios" sigan siendo razonados. NO fuerces formalismo matemático.',
    },
};

export function promptRevision(n: NeuronaRevisable): string {
    const r = REVISION[n.tipo];
    const neurona = JSON.stringify({
        id: n.id, cluster: n.cluster ?? '', tipo: n.tipo, nombre: n.nombre, teoria: n.teoria ?? '',
        glosario: n.glosario ?? [], ejercicios: n.ejercicios ?? [], referencias: n.referencias ?? [], sugerencias: n.sugerencias ?? [],
    }, null, 4);
    const sin = n.sinapsis ? seccionSinapsis(n) : { texto: '', formato: '', campos: '' };
    return `Actúa como un ${r.rol}. Te paso una neurona de "Alejandría" (una app de conocimiento personal) escrita por una IA que puede haberse equivocado. Revísala a fondo y devuélveme el JSON corregido en EL MISMO FORMATO.

TIPO DE LA NEURONA: ${n.tipo}. ${r.criterio} No cambies el valor del campo "tipo".

QUÉ REVISAR, por orden de importancia:
1. REFERENCIAS: cada una debe existir y estar bien atribuida (título exacto, autores, año y enlace). Si una está mal atribuida, corrígela; si no puedes confirmar que existe, ELIMÍNALA: nunca inventes una referencia ni la dejes con dudas. Contrasta como mínimo en **Google Scholar** y, si no tiene DOI, usa como url la ficha de la publicación en Google Scholar (https://scholar.google.com/...).
2. CONTENIDO: errores de hechos, fechas, autores, fórmulas y atribuciones en la teoría, el glosario y los ejercicios.
3. SUGERENCIAS: el campo "sugerencias" son temas relacionados que merece la pena estudiar después de este. Quita los que no existan o no tengan relación real con el concepto y, si hay menos de 3, completa hasta 3-5 con temas reales (cada uno con su "nombre" formal y habitual y un "motivo" de una frase). Si el campo está vacío, rellénalo.
4. Cambia SOLO lo que esté mal o falte. Lo correcto déjalo tal cual: no lo reescribas ni lo acortes, y mantén la extensión, los subtítulos Markdown y las fórmulas con $ y $$.
${sin.texto}
NEURONA ACTUAL:

\`\`\`json
${neurona}
\`\`\`

FORMATO DE LA RESPUESTA:
- Primero, una lista breve (máximo 10 viñetas) de lo que has cambiado y por qué; incluye cada referencia que corrijas o quites.
- Después, UN ÚNICO bloque \`\`\`json con la neurona corregida: los mismos campos que arriba (id, cluster, tipo, nombre, teoria, glosario, ejercicios, referencias, sugerencias${sin.campos}) y el mismo "id". No incluyas "laboratorio" ni campos nuevos, y no uses ningún otro bloque de código.${sin.formato}
- Si no hay nada que corregir, dilo y devuelve igualmente el bloque con la neurona tal cual.

### REGLAS DE ORO:
1. ${JSON_SEGURO}
2. ${IDIOMAS[IDIOMA_ACTUAL]}
3. ${VERIFICACION_OCULTA}
4. ${SIN_MARCAS_CITA}`;
}

const CLAVE_MODO = 'alejandria.modoPrompt';
const esModo = (v: unknown): v is ModoPrompt => MODOS_PROMPT.some(m => m.id === v);

/** Modo elegido en el Sintetizador, recordado en este ordenador. La casilla «prompt clásico» de la 0.3.0 equivale a «formal». */
export function modoGuardado(almacen?: Pick<Storage, 'getItem'>): ModoPrompt {
    try {
        const a = almacen ?? localStorage;
        const v = a.getItem(CLAVE_MODO);
        if (esModo(v)) return v;
        if (a.getItem('alejandria.promptClasico') === '1') return 'formal';
    } catch { /* sin almacenamiento: vale «automático» */ }
    return 'auto';
}

export function guardarModo(modo: ModoPrompt, almacen?: Pick<Storage, 'setItem'>): void {
    try { (almacen ?? localStorage).setItem(CLAVE_MODO, modo); } catch { /* sin almacenamiento: vale solo para esta sesión */ }
}
