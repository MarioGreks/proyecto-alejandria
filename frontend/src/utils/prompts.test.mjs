import test from 'node:test';
import assert from 'node:assert/strict';
import {
    PROMPT_FUENTES, PROMPT_EXPLORACION, PROMPT_FUENTES_CLASICO, PROMPT_EXPLORACION_CLASICO, MODOS_PROMPT, conClustersExistentes,
    conTema, guardarModo, modoGuardado, promptExploracion, promptFuentes, promptRevision,
} from './prompts.ts';

test('la exploración libre obliga a consultar Google Scholar y ambos prompts admiten su ficha como URL de la referencia', () => {
    assert.match(PROMPT_EXPLORACION, /consulta como mínimo \*\*Google Scholar\*\*/);
    assert.match(PROMPT_EXPLORACION, /scholar\.google\.com/);
    assert.match(PROMPT_FUENTES, /ficha de la publicación en Google Scholar/);
});

test('ambos prompts piden castellano de España y una verificación doble que no se muestra', () => {
    for (const p of [PROMPT_FUENTES, PROMPT_EXPLORACION]) {
        assert.match(p, /castellano de España/);
        assert.match(p, /VERIFICACIÓN DOBLE OCULTA/);
        assert.match(p, /NO lo muestres ni lo menciones/);
        assert.ok(!p.includes('[object Object]') && !p.includes('undefined'));    // las plantillas se resolvieron
    }
});

test('los prompts siguen siendo plantillas válidas: bloque json y reglas de gráficos al día', () => {
    for (const p of [PROMPT_FUENTES, PROMPT_EXPLORACION]) {
        assert.ok(p.includes('```json'));
        assert.ok(p.includes('xticks'));
        assert.ok(p.includes('`hist`') && p.includes('`imshow`'));        // la grabadora ya los dibuja en vivo
    }
});

test('ambos prompts piden no dejar marcas de cita como [reference:3] en los textos', () => {
    for (const p of [PROMPT_FUENTES, PROMPT_EXPLORACION]) {
        assert.match(p, /NO dejes las marcas de cita/);
        assert.ok(p.includes('[reference:3]') && p.includes('"referencias"'));
    }
    assert.ok(PROMPT_FUENTES.trimEnd().endsWith('el bloque JSON en el PASO 2; en el PASO 1 solo la lista y la pregunta.'));   // la última regla sigue siendo la de formato
});

test('fuentes propias: primero lista los conceptos y pregunta cuál, y solo después genera el JSON, en todos los modos', () => {
    for (const modo of ['auto', 'formal', 'historico', 'teorico']) {
        const p = promptFuentes(modo);
        assert.match(p, /PASO 1 \(en tu primera respuesta\)/);
        assert.match(p, /Termina preguntándome cuál quiero\. En este paso NO generes ningún JSON/);
        assert.match(p, /PASO 2 \(cuando te diga cuál\)/);
        assert.match(p, /Solo si el material trata claramente de un único concepto, sáltate la pregunta/);
        assert.match(p, /si tu primera respuesta lo contiene, has incumplido/);
        assert.match(p, /SIEMPRE dentro de un único bloque de código ```json/);     // copiado del chat renderizado se pierden \$\$, ## y la sangría
        assert.ok(!p.includes('más crítico'));     // ya no se queda con un solo concepto elegido por la IA
    }
    assert.match(PROMPT_FUENTES_CLASICO, /conceptos matemáticos\/analíticos distintos/);
});

test('el prompt normal distingue formal de histórico (ante la duda, formal) y el clásico sigue siendo el de antes', () => {
    for (const [normal, clasico] of [[PROMPT_FUENTES, PROMPT_FUENTES_CLASICO], [PROMPT_EXPLORACION, PROMPT_EXPLORACION_CLASICO]]) {
        assert.match(normal, /TIPO DE CONCEPTO/);
        assert.match(normal, /Si dudas entre formal e histórico o teórico, elige FORMAL/);
        assert.match(normal, /"ejercicios" va como \[\]/);
        assert.match(normal, /Si el concepto es FORMAL, debes incluir SIEMPRE un array/);
        assert.ok(!clasico.includes('TIPO DE CONCEPTO') && !clasico.includes('HISTÓRICO'));      // sin la regla: todo es matemático
        assert.match(clasico, /Debes incluir SIEMPRE un array/);
        assert.ok(!clasico.includes('undefined') && !normal.includes('undefined'));
    }
});

test('los clústeres existentes se añaden entre el tipo de concepto y las reglas', () => {
    const p = conClustersExistentes(PROMPT_FUENTES, ['Estadística']);
    const i = p.indexOf('TIPO DE CONCEPTO: antes'), j = p.indexOf('CLÚSTERES EXISTENTES EN MI SISTEMA'), k = p.indexOf('### REGLAS DE ORO:');
    assert.ok(i > 0 && i < j && j < k);
});

const MODOS = ['auto', 'formal', 'historico', 'teorico'];
const bloquesJson = (p) => [...p.matchAll(/```json\n([\s\S]*?)```/g)].map(m => m[1]);

test('hay cuatro modos, sin repetir, y «formal» es el prompt clásico de siempre', () => {
    assert.deepEqual(MODOS_PROMPT.map(m => m.id), MODOS);
    assert.ok(MODOS_PROMPT.every(m => m.etiqueta && m.ayuda));
    assert.equal(promptFuentes('formal'), PROMPT_FUENTES_CLASICO);
    assert.equal(promptExploracion('formal'), PROMPT_EXPLORACION_CLASICO);
    assert.equal(promptFuentes('auto'), PROMPT_FUENTES);
    assert.equal(promptExploracion('auto'), PROMPT_EXPLORACION);
});

test('todos los modos y modalidades llevan lo común: JSON, reglas, castellano, citas y verificación', () => {
    for (const modo of MODOS) for (const p of [promptFuentes(modo), promptExploracion(modo)]) {
        assert.ok(p.includes('```json') && p.includes('### REGLAS DE ORO:'), modo);
        assert.match(p, /castellano de España/);
        assert.match(p, /NO dejes las marcas de cita/);
        assert.match(p, /VERIFICACIÓN DOBLE OCULTA/);
        assert.ok(!p.includes('undefined') && !p.includes('[object'), modo);
        assert.ok(p.includes('Google Scholar'), modo);
    }
});

test('el JSON de ejemplo de cada prompt es JSON válido y tiene todos los campos (es lo que la IA copia)', () => {
    for (const modo of MODOS) for (const [nombre, p] of [['fuentes', promptFuentes(modo)], ['exploracion', promptExploracion(modo)]]) {
        const bloques = bloquesJson(p);
        assert.ok(bloques.length >= 1, `${modo}/${nombre}: sin bloque json`);
        const ejemplo = JSON.parse(bloques[bloques.length - 1]);
        for (const campo of ['id', 'cluster', 'nombre', 'teoria', 'glosario', 'ejercicios', 'referencias', 'laboratorio'])
            assert.ok(campo in ejemplo, `${modo}/${nombre}: falta ${campo}`);
    }
});

test('histórico y teórico no piden laboratorio ni gráficos; el histórico no pide ejercicios y el teórico pide casos de análisis', () => {
    for (const modo of ['historico', 'teorico']) for (const p of [promptFuentes(modo), promptExploracion(modo)]) {
        const ejemplo = JSON.parse(bloquesJson(p).at(-1));
        assert.deepEqual(ejemplo.laboratorio, { explicacion: '', controles: [], codigo: '' });
        assert.match(p, /El campo "laboratorio" va SIEMPRE vacío/);
        assert.ok(!p.includes('matplotlib') && !p.includes('xticks') && !p.includes('controles` con los parámetros'));
        assert.ok(!/mínimo 1000 palabras[^"]*Desarrollo Matemático Profundo/.test(p));      // no arrastran la estructura matemática
    }
    for (const p of [promptFuentes('historico'), promptExploracion('historico')]) {
        assert.deepEqual(JSON.parse(bloquesJson(p).at(-1)).ejercicios, []);
        assert.match(p, /Cronología y desarrollo de las ideas/);
    }
    for (const p of [promptFuentes('teorico'), promptExploracion('teorico')]) {
        assert.equal(JSON.parse(bloquesJson(p).at(-1)).ejercicios.length, 1);
        assert.match(p, /casos de análisis/);
        assert.match(p, /Críticas, alternativas y límites/);
    }
});

test('la modalidad de fuentes termina en la regla de formato y la de exploración exige las dos partes en orden', () => {
    for (const modo of ['historico', 'teorico']) {
        assert.ok(promptFuentes(modo).trimEnd().endsWith('el bloque JSON en el PASO 2; en el PASO 1 solo la lista y la pregunta.'));
        const e = promptExploracion(modo);
        assert.ok(e.includes('PARTE 1') && e.includes('PARTE 2') && e.includes('SECUENCIA OBLIGATORIA'));
        assert.ok(e.indexOf('PARTE 1') < e.indexOf('PARTE 2'));
        assert.match(e, /consulta como mínimo \*\*Google Scholar\*\*/);
    }
});

test('el JSON válido se pide en todos los modos salvo en el clásico, que se queda idéntico al de siempre', () => {
    for (const modo of ['auto', 'historico', 'teorico']) for (const p of [promptFuentes(modo), promptExploracion(modo)]) {
        assert.match(p, /JSON VÁLIDO/);
        assert.ok(p.includes('Escapa con \\" las comillas dobles'));
    }
    for (const p of [promptFuentes('formal'), promptExploracion('formal')]) assert.ok(!p.includes('JSON VÁLIDO'));
});

test('el modo automático conoce los tres tipos', () => {
    for (const p of [promptFuentes('auto'), promptExploracion('auto')]) {
        assert.match(p, /- FORMAL:/);
        assert.match(p, /- HISTÓRICO O CONCEPTUAL:/);
        assert.match(p, /- TEÓRICO NO MATEMÁTICO:/);
    }
});

test('los clústeres existentes se añaden antes de las reglas en todos los modos', () => {
    for (const modo of MODOS) for (const p of [promptFuentes(modo), promptExploracion(modo)]) {
        const c = conClustersExistentes(p, ['Estadística', 'Finanzas']);
        const i = c.indexOf('CLÚSTERES EXISTENTES EN MI SISTEMA: Estadística, Finanzas'), j = c.indexOf('### REGLAS DE ORO:');
        assert.ok(i > 0 && i < j, modo);
        assert.equal(conClustersExistentes(p, []), p);
    }
});

test('el modo se recuerda por ordenador, vale «automático» por defecto y respeta la casilla de la 0.3.0', () => {
    const memoria = (datos) => ({ getItem: (k) => datos[k] ?? null, setItem: (k, v) => { datos[k] = v; } });
    assert.equal(modoGuardado(memoria({})), 'auto');
    assert.equal(modoGuardado(memoria({ 'alejandria.modoPrompt': 'teorico' })), 'teorico');
    assert.equal(modoGuardado(memoria({ 'alejandria.modoPrompt': 'inventado' })), 'auto');           // dato corrupto
    assert.equal(modoGuardado(memoria({ 'alejandria.promptClasico': '1' })), 'formal');              // casilla «clásico» de la 0.3.0
    assert.equal(modoGuardado(memoria({ 'alejandria.promptClasico': '1', 'alejandria.modoPrompt': 'historico' })), 'historico');
    const datos = {}; guardarModo('historico', memoria(datos));
    assert.equal(datos['alejandria.modoPrompt'], 'historico');
    assert.equal(modoGuardado({ getItem: () => { throw new Error('sin almacenamiento'); } }), 'auto');
    assert.doesNotThrow(() => guardarModo('formal', { setItem: () => { throw new Error('lleno'); } }));
});

test('el prompt formal clásico no lleva el campo «tipo» (sigue idéntico) y los demás sí lo fijan', () => {
    for (const p of [promptFuentes('formal'), promptExploracion('formal')]) assert.ok(!bloquesJson(p).at(-1).includes('"tipo"'));
    for (const modo of ['auto', 'historico', 'teorico']) for (const p of [promptFuentes(modo), promptExploracion(modo)]) {
        const ejemplo = JSON.parse(bloquesJson(p).at(-1));
        assert.ok(typeof ejemplo.tipo === 'string', `${modo}: falta tipo`);
        if (modo !== 'auto') assert.equal(ejemplo.tipo, modo);                         // histórico y teórico lo fijan
        else assert.match(ejemplo.tipo, /formal, historico o teorico/);               // el automático lo decide la IA
        assert.match(p, /tipo/);
    }
    assert.match(promptFuentes('historico'), /El campo "tipo" vale siempre "historico"/);
    assert.match(promptExploracion('teorico'), /El campo "tipo" vale siempre "teorico"/);
    assert.match(PROMPT_FUENTES, /se anota solo en el campo "tipo" del JSON/);
    assert.ok(!PROMPT_FUENTES.includes('añadas campos extra'));
});

const NEURONA = {
    id: 'bayes', nombre: 'Teorema de Bayes', cluster: 'Estadística', tipo: 'formal', teoria: 'Sea $\\theta$ un parámetro... "cita"\nsegunda línea',
    glosario: [{ termino: 'Prior', definicion: 'previa' }], ejercicios: [{ enunciado: 'e', solucion: 's' }],
    referencias: [{ titulo: 'An Essay', autores: 'Bayes (1763)', url: 'https://doi.org/x', nota: 'n' }],
    sugerencias: [{ nombre: 'Inferencia bayesiana', motivo: 'Es su aplicación estadística' }],
};

test('el prompt de revisión lleva la neurona exacta (sin laboratorio), su tipo y las reglas de formato', () => {
    for (const tipo of ['formal', 'historico', 'teorico']) {
        const p = promptRevision({ ...NEURONA, tipo, laboratorio: { codigo: 'secreto_del_lab' } });
        const enviada = JSON.parse(bloquesJson(p)[0]);
        assert.deepEqual(enviada, { ...NEURONA, tipo });                                // vuelve idéntica: comillas, saltos de línea y LaTeX incluidos
        assert.ok(!p.includes('secreto_del_lab') && !p.includes('embedding'));
        assert.match(p, new RegExp(`TIPO DE LA NEURONA: ${tipo}\\.`));
        assert.match(p, /ELIMÍNALA: nunca inventes una referencia/);
        assert.match(p, /Google Scholar/);
        assert.match(p, /mismo "id"/);
        assert.match(p, /JSON VÁLIDO/);
        assert.match(p, /castellano de España/);
        assert.match(p, /NO dejes las marcas de cita/);
        assert.match(p, /VERIFICACIÓN DOBLE OCULTA/);
        assert.ok(!p.includes('undefined') && !p.includes('[object'), tipo);
    }
});

test('cada tipo se revisa con su criterio: el histórico no se matematiza y el teórico no se formaliza', () => {
    assert.match(promptRevision({ ...NEURONA, tipo: 'formal' }), /Es un concepto FORMAL: comprueba cada definición, fórmula/);
    assert.match(promptRevision({ ...NEURONA, tipo: 'historico' }), /NO añadas desarrollo matemático ni ejercicios/);
    assert.match(promptRevision({ ...NEURONA, tipo: 'teorico' }), /NO fuerces formalismo matemático/);
});

test('una neurona sin glosario ni referencias también produce un prompt válido', () => {
    const p = promptRevision({ id: 'x', nombre: 'X', tipo: 'historico' });
    assert.deepEqual(JSON.parse(bloquesJson(p)[0]), { id: 'x', cluster: '', tipo: 'historico', nombre: 'X', teoria: '', glosario: [], ejercicios: [], referencias: [], sugerencias: [] });
});

test('los prompts de crear una neurona piden 3-5 temas relacionados con nombre y motivo, en todos los modos y en las dos modalidades', () => {
    for (const modo of MODOS_PROMPT.map(m => m.id)) {
        for (const p of [promptFuentes(modo), promptExploracion(modo)]) {
            assert.match(p, /"sugerencias": \[/, modo);
            assert.match(p, /entre 3 y 5 temas relacionados/, modo);
            assert.match(p, /"motivo" de una sola frase/, modo);
        }
    }
});

test('el prompt de revisión también pide completar las sugerencias y las devuelve en el mismo formato', () => {
    const p = promptRevision({ ...NEURONA });
    assert.match(p, /SUGERENCIAS: el campo "sugerencias"/);
    assert.match(p, /referencias, sugerencias\) y el mismo "id"/);
});

test('conTema pone el concepto sugerido en el hueco del prompt de exploración y no toca un prompt sin hueco', () => {
    const p = conTema(promptExploracion('auto'), 'Modelo de Gompertz');
    assert.match(p, /siguiente concepto: \*\*Modelo de Gompertz\*\*/);
    assert.ok(!p.includes('INSERTA EL CONCEPTO'));
    assert.equal(conTema('sin hueco', 'X'), 'sin hueco');
    assert.ok(conTema('[INSERTA EL CONCEPTO AQUÍ]', 'a $& b').includes('a $& b'), 'los símbolos especiales del tema se copian tal cual');
});

test('sin sinapsis el prompt de revisión no habla de ellas y es el de siempre', () => {
    assert.ok(!/sinapsis/i.test(promptRevision({ ...NEURONA })));
});

test('con sinapsis, el prompt las lista (con estado y motivo, también las rechazadas), pide veredicto y conexiones nuevas solo con neuronas de la red', () => {
    const p = promptRevision({ ...NEURONA,
        sinapsis: [{ con: 'markov', nombre: 'Cadenas de Markov', estado: 'aceptada', motivo: 'Caso\ndiscreto' }, { con: 'ruido', nombre: 'Ruido blanco', estado: 'rechazada', motivo: '' }],
        neuronas: [{ id: 'bayes', nombre: 'Teorema de Bayes' }, { id: 'markov', nombre: 'Cadenas de Markov' }, { id: 'ruido', nombre: 'Ruido blanco' }, { id: 'gompertz', nombre: 'Modelo de Gompertz' }] });
    assert.match(p, /- markov \(«Cadenas de Markov»\) \| estado: aceptada \| motivo: Caso discreto/);
    assert.match(p, /- ruido \(«Ruido blanco»\) \| estado: rechazada \| motivo: \(sin motivo\)/);
    const sinConexion = p.split('NEURONAS DE MI RED CON LAS QUE AÚN NO TIENE CONEXIÓN')[1].split('NEURONA ACTUAL')[0];
    assert.match(sinConexion, /gompertz: Modelo de Gompertz/);
    assert.ok(!/bayes: |markov: |ruido: /.test(sinConexion));                                  // ni ella misma ni las ya conectadas
    assert.match(p, /referencias, sugerencias, sinapsis, sinapsis_nuevas\) y el mismo "id"/);
    assert.match(p, /"veredicto" es exactamente una de estas tres palabras: "confirmar".*"cuestionar".*"quitar"/);
    assert.match(p, /SOLO con neuronas de la lista de arriba/);
    assert.match(p, /No inventes ids/);
    assert.equal(bloquesJson(p).length, 1);                                                    // el ejemplo de formato no es un bloque json
    assert.deepEqual(JSON.parse(bloquesJson(p)[0]), { ...NEURONA });                          // la neurona sigue yendo sin sinapsis
    assert.ok(!p.includes('undefined') && !p.includes('[object'));
});

test('una neurona sin ninguna sinapsis también produce un prompt válido (solo puede proponer nuevas)', () => {
    const p = promptRevision({ ...NEURONA, sinapsis: [], neuronas: [{ id: 'bayes', nombre: 'Teorema de Bayes' }] });
    assert.match(p, /\(esta neurona aún no tiene ninguna\)/);
    assert.match(p, /\(ninguna\)/);
});
