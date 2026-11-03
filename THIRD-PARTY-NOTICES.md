# Avisos de terceros

Proyecto Alejandría es software MIT (ver [LICENSE](LICENSE)). Este archivo recoge los avisos de copyright y las licencias de las bibliotecas de terceros que **se redistribuyen dentro de la aplicación y del instalador**, y, solo como información, las que el instalador **descarga desde su origen**. Es orientación, no asesoría legal.

> Generado por `npm run avisos` (script `frontend/scripts/avisos.mjs`): no se edita a mano.

## Resumen

- JavaScript empaquetado en la app (npm, producción y sus dependencias): **212** paquetes.
- Rust compilado en la app (Tauri y dependencias, Windows): **291** crates.
- Pyodide y las ruedas de Python que lleva la app para los laboratorios: Pyodide 0.29.5 y **14** ruedas.
- Ninguna de ellas declara GPL, LGPL, AGPL, SSPL ni licencia no comercial en sus metadatos.
- Los modelos de IA (phi3:mini, qwen2.5, el modelo de clasificación) y Ollama **no se incluyen**: se descargan desde su origen; sus licencias están en la sección «Modelos de IA y software de terceros» del [README](README.md).

## Pyodide (copyleft débil, MPL-2.0)

La app incluye **Pyodide 0.29.5** (MPL-2.0) **sin modificar**. Código fuente de esa versión exacta: <https://github.com/pyodide/pyodide/tree/0.29.5>.

Otras dependencias con MPL-2.0 (también sin modificar; su código fuente está en la dirección indicada o en su registro de paquetes):

- Rust: cssparser 0.37.0 (MPL-2.0) — https://github.com/servo/rust-cssparser
- Rust: cssparser-macros 0.7.1 (MPL-2.0) — https://github.com/servo/rust-cssparser
- Rust: dtoa-short 0.3.5 (MPL-2.0) — https://github.com/upsuper/dtoa-short
- Rust: option-ext 0.2.0 (MPL-2.0) — https://github.com/soc/option-ext.git
- Rust: selectors 0.38.0 (MPL-2.0) — https://github.com/servo/stylo

## JavaScript empaquetado (npm)

| Paquete | Versión | Licencia | Copyright | Texto |
| --- | --- | --- | --- | --- |
| @babel/runtime | 7.29.7 | MIT | Copyright (c) 2014-present Sebastian McKenzie and other contributors | [L3](#l3) |
| @dimforge/rapier3d-compat | 0.12.0 | Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2) |
| @mediapipe/tasks-vision | 0.10.17 | Apache-2.0 | _sin archivo de licencia en el paquete (texto estándar)_ | [L2](#l2) |
| @monogrid/gainmap-js | 3.4.0 | MIT | Copyright (c) 2023 MONOGRID | [L3](#l3) |
| @react-three/drei | 10.7.9 | MIT | Copyright (c) 2020 react-spring | [L3](#l3) |
| @react-three/fiber | 9.8.1 | MIT | _sin archivo de licencia en el paquete (texto estándar)_ | [L1](#l1) |
| @react-three/postprocessing | 3.1.3 | MIT | Copyright (c) 2020 react-spring | [L3](#l3) |
| @reduxjs/toolkit | 2.13.0 | MIT | Copyright (c) 2018 Mark Erikson | [L3](#l3) |
| @standard-schema/spec | 1.1.0 | MIT | Copyright (c) 2024 Colin McDonnell | [L3](#l3) |
| @standard-schema/utils | 0.3.0 | MIT | Copyright (c) 2024 Fabian Hiller | [L3](#l3) |
| @tauri-apps/api | 2.12.1 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L3](#l3), [L34](#l34) |
| @tauri-apps/plugin-opener | 2.7.0 | MIT OR Apache-2.0 |  | [L17](#l17) |
| @tweenjs/tween.js | 23.1.3 | MIT | Copyright (c) 2010-2012 Tween.js authors. | [L32](#l32) |
| @types/d3-array | 3.2.2 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/d3-color | 3.1.3 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/d3-ease | 3.0.2 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/d3-interpolate | 3.0.4 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/d3-path | 3.1.1 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/d3-scale | 4.0.9 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/d3-shape | 3.2.0 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/d3-time | 3.0.4 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/d3-timer | 3.0.2 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/debug | 4.1.13 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/draco3d | 1.4.10 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/emscripten | 1.41.6 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/estree | 1.0.9 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/estree-jsx | 1.0.5 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/hast | 3.0.5 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/katex | 0.16.8 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/mdast | 4.0.4 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/ms | 2.1.0 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/offscreencanvas | 2019.7.3 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/react-reconciler | 0.28.9 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/stats.js | 0.17.4 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/three | 0.186.0 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/unist | 3.0.3 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/unist | 2.0.11 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/use-sync-external-store | 0.0.6 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @types/webxr | 0.5.24 | MIT | Copyright (c) Microsoft Corporation. | [L7](#l7) |
| @ungap/structured-clone | 1.4.0 | ISC | Copyright (c) 2021, Andrea Giammarchi, @WebReflection · copyright notice and this permission notice appear in all copies. | [L36](#l36) |
| @use-gesture/core | 10.3.1 | MIT | Copyright (c) 2018-present Paul Henschel <drcmda@gmail.com> | [L1](#l1) |
| @use-gesture/react | 10.3.1 | MIT | Copyright (c) 2018-present Paul Henschel <drcmda@gmail.com> | [L1](#l1) |
| bail | 2.0.2 | MIT | Copyright (c) 2015 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| base64-js | 1.5.1 | MIT | Copyright (c) 2014 Jameson Little | [L6](#l6) |
| bidi-js | 1.1.0 | MIT | Copyright (c) 2021 Jason Johnston | [L3](#l3) |
| buffer | 6.0.3 | MIT | Copyright (c) Feross Aboukhadijeh, and other contributors. | [L6](#l6) |
| camera-controls | 3.1.2 | MIT | Copyright (c) 2017 @yomotsu | [L3](#l3) |
| ccount | 2.0.1 | MIT | Copyright (c) 2015 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| character-entities | 2.0.2 | MIT | Copyright (c) 2015 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| character-entities-html4 | 2.1.0 | MIT | Copyright (c) 2015 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| character-entities-legacy | 3.0.0 | MIT | Copyright (c) 2015 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| character-reference-invalid | 2.0.1 | MIT | Copyright (c) 2015 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| clsx | 2.1.1 | MIT | Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com) | [L3](#l3) |
| comma-separated-tokens | 2.0.3 | MIT | Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| commander | 8.3.0 | MIT | Copyright (c) 2011 TJ Holowaychuk <tj@vision-media.ca> | [L4](#l4) |
| cross-env | 7.0.3 | MIT | Copyright (c) 2017 Kent C. Dodds | [L6](#l6) |
| cross-spawn | 7.0.6 | MIT | Copyright (c) 2018 Made With MOXY Lda <hello@moxy.studio> | [L6](#l6) |
| d3-array | 3.2.4 | ISC | Copyright 2010-2023 Mike Bostock | [L10](#l10) |
| d3-color | 3.1.0 | ISC | Copyright 2010-2022 Mike Bostock | [L10](#l10) |
| d3-ease | 3.0.1 | BSD-3-Clause | Copyright 2010-2021 Mike Bostock · Copyright 2001 Robert Penner | [L38](#l38) |
| d3-format | 3.1.2 | ISC | Copyright 2010-2026 Mike Bostock | [L10](#l10) |
| d3-interpolate | 3.0.1 | ISC | Copyright 2010-2021 Mike Bostock | [L10](#l10) |
| d3-path | 3.1.0 | ISC | Copyright 2015-2022 Mike Bostock | [L10](#l10) |
| d3-scale | 4.0.2 | ISC | Copyright 2010-2021 Mike Bostock | [L10](#l10) |
| d3-shape | 3.2.0 | ISC | Copyright 2010-2022 Mike Bostock | [L10](#l10) |
| d3-time | 3.1.0 | ISC | Copyright 2010-2022 Mike Bostock | [L10](#l10) |
| d3-time-format | 4.1.0 | ISC | Copyright 2010-2021 Mike Bostock | [L10](#l10) |
| d3-timer | 3.0.1 | ISC | Copyright 2010-2021 Mike Bostock | [L10](#l10) |
| debug | 4.4.3 | MIT | Copyright (c) 2014-2017 TJ Holowaychuk <tj@vision-media.ca> · Copyright (c) 2018-2021 Josh Junon | [L4](#l4) |
| decimal.js-light | 2.5.1 | MIT | Copyright (c) 2020 Michael Mclaughlin | [L37](#l37) |
| decode-named-character-reference | 1.3.0 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| dequal | 2.0.3 | MIT | Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com) | [L6](#l6) |
| detect-gpu | 5.0.70 | MIT | Copyright (c) 2020 Tim van Scherpenzeel | [L3](#l3) |
| devlop | 1.1.0 | MIT | Copyright (c) 2023 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| draco3d | 1.5.7 | Apache-2.0 | _sin archivo de licencia en el paquete (texto estándar)_ | [L2](#l2) |
| entities | 6.0.1 | BSD-2-Clause | Copyright (c) Felix Böhm | [L39](#l39) |
| es-toolkit | 1.52.0 | MIT | Copyright (c) 2024 Viva Republica, Inc. | [L3](#l3) |
| estree-util-is-identifier-name | 3.0.0 | MIT | Copyright (c) 2020 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| eventemitter3 | 5.0.4 | MIT | Copyright (c) 2014 Arnout Kazemier | [L6](#l6) |
| extend | 3.0.2 | MIT | Copyright (c) 2014 Stefan Thomas | [L6](#l6) |
| fflate | 0.8.3 | MIT | Copyright (c) 2026 Arjun Barrett | [L3](#l3) |
| fflate | 0.6.11 | MIT | Copyright (c) 2020 Arjun Barrett | [L3](#l3) |
| glsl-noise | 0.0.0 | MIT | Copyright (C) 2011 by Ashima Arts (Simplex noise) · Copyright (C) 2011 by Stefan Gustavson (Classic noise) | [L1](#l1) |
| hast-util-from-dom | 5.0.1 | ISC | Copyright (c) Keith McKnight <keith@mcknig.ht> | [L40](#l40) |
| hast-util-from-html | 2.0.3 | MIT | Copyright (c) 2022 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| hast-util-from-html-isomorphic | 2.0.0 | MIT | Copyright (c) 2023 Remco Haszing <remcohaszing@gmail.com> | [L4](#l4) |
| hast-util-from-parse5 | 8.0.3 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| hast-util-is-element | 3.0.0 | MIT | Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| hast-util-parse-selector | 4.0.0 | MIT | Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| hast-util-to-jsx-runtime | 2.3.6 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| hast-util-to-text | 4.0.2 | MIT | Copyright (c) 2019 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| hast-util-whitespace | 3.0.0 | MIT | Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| hastscript | 9.0.1 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| hls.js | 1.7.3 | Apache-2.0 | Copyright (c) 2017 Dailymotion (http://www.dailymotion.com) · Copyright (c) 2013-2015 Brightcove | [L31](#l31) |
| html-url-attributes | 3.0.1 | MIT | Copyright (c) Titus Wormer | [L15](#l15) |
| ieee754 | 1.2.1 | BSD-3-Clause | Copyright 2008 Fair Oaks Labs, Inc. | [L22](#l22) |
| immediate | 3.0.6 | MIT | Copyright (c) 2012 Barnesandnoble.com, llc, Donavon West, Domenic Denicola, Brian Cavalier | [L1](#l1) |
| immer | 11.1.21 | MIT | Copyright (c) 2017 Michel Weststrate | [L3](#l3) |
| inline-style-parser | 0.2.7 | MIT | Copyright (c) 2012 TJ Holowaychuk <tj@vision-media.ca> | [L4](#l4) |
| internmap | 2.0.3 | ISC | Copyright 2021 Mike Bostock | [L10](#l10) |
| is-alphabetical | 2.0.1 | MIT | Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| is-alphanumerical | 2.0.1 | MIT | Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| is-decimal | 2.0.1 | MIT | Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| is-hexadecimal | 2.0.1 | MIT | Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| is-plain-obj | 4.1.0 | MIT | Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com) | [L3](#l3) |
| is-promise | 2.2.2 | MIT | Copyright (c) 2014 Forbes Lindesay | [L1](#l1) |
| isexe | 2.0.0 | ISC | Copyright (c) Isaac Z. Schlueter and Contributors · copyright notice and this permission notice appear in all copies. | [L21](#l21) |
| its-fine | 2.1.1 | MIT | Copyright (c) 2022-2025 Poimandres | [L3](#l3) |
| katex | 0.16.47 | MIT | Copyright (c) 2013-2020 Khan Academy and other contributors | [L6](#l6) |
| lie | 3.3.0 | MIT |  | [L30](#l30) |
| longest-streak | 3.1.0 | MIT | Copyright (c) 2015 Titus Wormer <mailto:tituswormer@gmail.com> | [L4](#l4) |
| maath | 0.10.8 | MIT | _sin archivo de licencia en el paquete (texto estándar)_ | [L1](#l1) |
| mdast-util-from-markdown | 2.1.0 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| mdast-util-math | 3.0.0 | MIT | Copyright (c) 2020 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| mdast-util-mdx-expression | 2.0.1 | MIT | Copyright (c) 2020 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| mdast-util-mdx-jsx | 3.2.0 | MIT | Copyright (c) 2020 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| mdast-util-mdxjs-esm | 2.0.1 | MIT | Copyright (c) 2020 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| mdast-util-phrasing | 4.1.0 | MIT | Copyright (c) 2017 Titus Wormer <tituswormer@gmail.com> · Copyright (c) 2017 Victor Felder <victor@draft.li> | [L4](#l4) |
| mdast-util-to-hast | 13.2.1 | MIT | Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| mdast-util-to-markdown | 2.2.0 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| mdast-util-to-string | 4.0.0 | MIT | Copyright (c) 2015 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| meshline | 3.3.1 | MIT | Copyright (c) 2016 Jaume Sanchez | [L3](#l3) |
| meshoptimizer | 1.1.1 | MIT | Copyright (c) 2016-2026 Arseny Kapoulkine | [L3](#l3) |
| micromark | 4.0.3 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-core-commonmark | 2.0.4 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-extension-math | 3.1.0 | MIT | Copyright (c) 2020 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-factory-destination | 2.0.1 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-factory-label | 2.0.1 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-factory-space | 2.1.0 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-factory-title | 2.0.1 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-factory-whitespace | 2.0.1 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-util-character | 2.1.1 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-util-chunked | 2.0.1 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-util-classify-character | 2.0.1 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-util-combine-extensions | 2.0.1 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-util-decode-numeric-character-reference | 2.0.2 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-util-decode-string | 2.0.1 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-util-edit-map | 1.0.0 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-util-encode | 2.0.1 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-util-html-tag-name | 2.0.1 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-util-normalize-identifier | 2.0.1 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-util-resolve-all | 2.0.1 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-util-sanitize-uri | 2.0.1 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-util-subtokenize | 2.1.0 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-util-symbol | 2.0.1 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| micromark-util-types | 2.0.3 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| ms | 2.1.3 | MIT | Copyright (c) 2020 Vercel, Inc. | [L6](#l6) |
| n8ao | 2.0.1 | ISC |  | [L23](#l23) |
| parse-entities | 4.0.2 | MIT | Copyright (c) Titus Wormer <mailto:tituswormer@gmail.com> | [L4](#l4) |
| parse5 | 7.3.0 | MIT | Copyright (c) 2013-2019 Ivan Nikulin (ifaaan@gmail.com, https://github.com/inikulin) | [L1](#l1) |
| path-key | 3.1.1 | MIT | Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) | [L3](#l3) |
| potpack | 1.0.2 | ISC | Copyright (c) 2018, Mapbox | [L33](#l33) |
| promise-worker-transferable | 1.0.4 | Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2) |
| property-information | 7.2.0 | MIT | Copyright (c) Titus Wormer <mailto:tituswormer@gmail.com> | [L4](#l4) |
| pyodide | 0.29.5 | MPL-2.0 | _sin archivo de licencia en el paquete (texto estándar)_ | [L19](#l19) |
| react | 19.3.0 | MIT | Copyright (c) Meta Platforms, Inc. and affiliates. | [L3](#l3) |
| react-dom | 19.3.0 | MIT | Copyright (c) Meta Platforms, Inc. and affiliates. | [L3](#l3) |
| react-markdown | 10.1.0 | MIT | Copyright (c) Espen Hovlandsdal | [L6](#l6) |
| react-redux | 9.3.0 | MIT | Copyright (c) 2015-present Dan Abramov | [L6](#l6) |
| react-use-measure | 2.1.7 | MIT | Copyright (c) 2019-2025 Poimandres | [L3](#l3) |
| recharts | 3.10.1 | MIT | Copyright (c) 2015-present recharts | [L6](#l6) |
| redux | 5.0.1 | MIT | Copyright (c) 2015-present Dan Abramov | [L6](#l6) |
| redux-thunk | 3.1.0 | MIT | Copyright (c) 2015-present Dan Abramov | [L6](#l6) |
| rehype-katex | 7.0.1 | MIT | _sin archivo de licencia en el paquete (texto estándar)_ | [L1](#l1) |
| remark-math | 6.0.0 | MIT | _sin archivo de licencia en el paquete (texto estándar)_ | [L1](#l1) |
| remark-parse | 11.0.0 | MIT | Copyright (c) 2014 Titus Wormer <tituswormer@gmail.com> | [L15](#l15) |
| remark-rehype | 11.1.2 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| require-from-string | 2.0.2 | MIT | Copyright (c) Vsevolod Strukchinsky <floatdrop@gmail.com> (github.com/floatdrop) | [L6](#l6) |
| reselect | 5.2.0 | MIT | Copyright (c) 2015-2018 Reselect Contributors | [L6](#l6) |
| scheduler | 0.28.0 | MIT | Copyright (c) Meta Platforms, Inc. and affiliates. | [L3](#l3) |
| shebang-command | 2.0.0 | MIT | Copyright (c) Kevin Mårtensson <kevinmartensson@gmail.com> (github.com/kevva) | [L3](#l3) |
| shebang-regex | 3.0.0 | MIT | Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) | [L3](#l3) |
| space-separated-tokens | 2.0.2 | MIT | Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| stats-gl | 2.4.2 | MIT | _sin archivo de licencia en el paquete (texto estándar)_ | [L1](#l1) |
| stats.js | 0.17.0 | MIT | Copyright (c) 2009-2016 stats.js authors | [L16](#l16) |
| stringify-entities | 4.0.4 | MIT | Copyright (c) 2015 Titus Wormer <mailto:tituswormer@gmail.com> | [L4](#l4) |
| style-to-js | 1.1.21 | MIT | Copyright (c) 2020 Menglin "Mark" Xu <mark@remarkablemark.org> | [L6](#l6) |
| style-to-object | 1.0.14 | MIT | Copyright (c) 2017 Menglin "Mark" Xu <mark@remarkablemark.org> | [L6](#l6) |
| suspend-react | 0.1.3 | MIT | Copyright (c) 2021 Paul Henschel | [L3](#l3) |
| three | 0.170.0 | MIT | Copyright © 2010-2024 three.js authors | [L16](#l16) |
| three | 0.186.1 | MIT | Copyright © 2010-2026 three.js authors | [L16](#l16) |
| three-mesh-bvh | 0.8.3 | MIT | Copyright (c) 2018 Garrett Johnson | [L3](#l3) |
| three-stdlib | 2.36.1 | MIT | Copyright (c) 2021-2023 Poimandres | [L3](#l3) |
| tiny-invariant | 1.3.3 | MIT | Copyright (c) 2019 Alexander Reardon | [L3](#l3) |
| trim-lines | 3.0.1 | MIT | Copyright (c) 2015 Titus Wormer <mailto:tituswormer@gmail.com> | [L4](#l4) |
| troika-three-text | 0.52.5 | MIT | Copyright (c) 2019 ProtectWise · Copyright (c) 2021 Jason Johnston | [L3](#l3) |
| troika-three-utils | 0.52.5 | MIT | Copyright (c) 2019 ProtectWise · Copyright (c) 2021 Jason Johnston | [L3](#l3) |
| troika-worker-utils | 0.52.0 | MIT | Copyright (c) 2019 ProtectWise · Copyright (c) 2021 Jason Johnston | [L3](#l3) |
| trough | 2.2.0 | MIT | Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com> | [L15](#l15) |
| tunnel-rat | 0.1.2 | MIT | Copyright (c) 2022 Poimandres | [L3](#l3) |
| unified | 11.0.5 | MIT | Copyright (c) 2015 Titus Wormer <tituswormer@gmail.com> | [L15](#l15) |
| unist-util-find-after | 5.0.0 | MIT | Copyright (c) 2015 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| unist-util-is | 6.0.1 | MIT | Copyright (c) 2015 Titus Wormer <tituswormer@gmail.com> | [L35](#l35) |
| unist-util-position | 5.0.0 | MIT | Copyright (c) 2015 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| unist-util-remove-position | 5.0.0 | MIT | Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| unist-util-stringify-position | 4.0.0 | MIT | Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| unist-util-visit | 5.1.0 | MIT | Copyright (c) 2015 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| unist-util-visit-parents | 6.0.2 | MIT | Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| use-sync-external-store | 1.7.0 | MIT | Copyright (c) Meta Platforms, Inc. and affiliates. | [L3](#l3) |
| utility-types | 3.11.0 | MIT | Copyright (c) 2016 Piotr Witek <piotrek.witek@gmail.com> (http://piotrwitek.github.io) | [L3](#l3) |
| vfile | 6.0.3 | MIT | Copyright (c) 2015 Titus Wormer <tituswormer@gmail.com> | [L15](#l15) |
| vfile-location | 5.0.3 | MIT | Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| vfile-message | 4.0.3 | MIT | Copyright (c) Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| victory-vendor | 37.3.6 | MIT AND ISC | _sin archivo de licencia en el paquete (texto estándar)_ | [L1](#l1), [L10](#l10) |
| web-namespaces | 2.0.1 | MIT | Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |
| webgl-constants | 1.1.1 | sin campo de licencia | Copyright (c) 2019 Tim van Scherpenzeel | [L3](#l3) |
| webgl-sdf-generator | 1.1.1 | MIT | Copyright (c) 2021 Jason Johnston | [L3](#l3) |
| which | 2.0.2 | ISC | Copyright (c) Isaac Z. Schlueter and Contributors · copyright notice and this permission notice appear in all copies. | [L21](#l21) |
| ws | 8.22.1 | MIT | Copyright (c) 2011 Einar Otto Stangvik <einaros@gmail.com> · Copyright (c) 2013 Arnout Kazemier and contributors · Copyright (c) 2016 Luigi Pinca and contributors | [L24](#l24) |
| zustand | 4.5.7 | MIT | Copyright (c) 2019 Paul Henschel | [L3](#l3) |
| zustand | 5.0.15 | MIT | Copyright (c) 2019 Paul Henschel | [L3](#l3) |
| zwitch | 2.0.4 | MIT | Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com> | [L4](#l4) |

## Rust compilado

| Paquete | Versión | Licencia | Copyright | Texto |
| --- | --- | --- | --- | --- |
| adler2 | 2.0.1 | 0BSD OR MIT OR Apache-2.0 | Copyright (C) Jonas Schievink <jonasschievink@gmail.com> · copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, | [L41](#l41), [L25](#l25), [L1](#l1) |
| aho-corasick | 1.1.5 | Unlicense OR MIT | Copyright (c) 2015 Andrew Gallant | [L11](#l11), [L6](#l6), [L12](#l12) |
| alloc-no-stdlib | 3.0.0 | BSD-3-Clause | Copyright (c) 2016 Dropbox, Inc. | [L18](#l18) |
| alloc-stdlib | 0.3.0 | BSD-3-Clause | _sin archivo de licencia en el paquete (texto estándar)_ | [L18](#l18) |
| anyhow | 1.0.104 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| atomic-waker | 1.1.2 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1), [L42](#l42) |
| autocfg | 1.5.1 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| base64 | 0.22.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L6](#l6) |
| base64 | 0.23.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L6](#l6) |
| bit-set | 0.8.0 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| bit-vec | 0.8.0 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| bitflags | 1.3.2 | MIT/Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| bitflags | 2.13.2 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| block-buffer | 0.10.4 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| brotli | 9.0.0 | BSD-3-Clause AND MIT | Copyright (c) 2016 Dropbox, Inc. · Copyright (c) 2009, 2010, 2013-2016 by the Brotli Authors. | [L18](#l18), [L1](#l1) |
| brotli-decompressor | 6.0.1 | BSD-3-Clause/MIT | Copyright (c) 2016 Dropbox, Inc. | [L18](#l18) |
| bs58 | 0.5.1 | MIT/Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L3](#l3) |
| byteorder | 1.5.0 | Unlicense OR MIT | Copyright (c) 2015 Andrew Gallant | [L11](#l11), [L6](#l6), [L12](#l12) |
| bytes | 1.12.1 | MIT | Copyright (c) 2018 Carl Lerche | [L1](#l1) |
| camino | 1.2.6 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| cargo_metadata | 0.19.2 | MIT |  | [L1](#l1) |
| cargo_toml | 1.0.1 | Apache-2.0 OR MIT | © Kornel Lesiński · copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, | [L43](#l43) |
| cargo-platform | 0.1.9 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L25](#l25), [L1](#l1) |
| cc | 1.6.0 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| cfb | 0.14.0 | MIT | Copyright (c) 2017 Matthew D. Steele | [L3](#l3) |
| cfg-if | 1.0.5 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| chrono | 0.4.45 | MIT OR Apache-2.0 | Copyright (c) 2014, Kang Seonghoon. · copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, | [L44](#l44) |
| cookie | 0.18.2 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| cpufeatures | 0.2.17 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| crc32fast | 1.5.2 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L9](#l9), [L3](#l3) |
| crossbeam-channel | 0.5.17 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L6](#l6), [L45](#l45) |
| crossbeam-utils | 0.8.23 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L6](#l6) |
| crypto-common | 0.1.7 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| cssparser | 0.37.0 | MPL-2.0 | (c) under Patent Claims infringed by Covered Software in the absence of | [L19](#l19) |
| cssparser-macros | 0.7.1 | MPL-2.0 | (c) under Patent Claims infringed by Covered Software in the absence of | [L19](#l19) |
| ctor | 1.0.13 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L9](#l9), [L1](#l1) |
| darling | 0.24.1 | MIT | Copyright (c) 2017 Ted Driggs | [L3](#l3) |
| darling_core | 0.24.1 | MIT | Copyright (c) 2017 Ted Driggs | [L3](#l3) |
| darling_macro | 0.24.1 | MIT | Copyright (c) 2017 Ted Driggs | [L3](#l3) |
| defmt | 1.1.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| defmt-macros | 1.1.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| defmt-parser | 1.0.0 | MIT OR Apache-2.0 | _sin archivo de licencia en el paquete (texto estándar)_ | [L1](#l1) |
| deranged | 0.5.8 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| derive_more | 2.1.1 | MIT | Copyright (c) 2016 Jelte Fennema | [L6](#l6) |
| derive_more-impl | 2.1.1 | MIT | Copyright (c) 2016 Jelte Fennema | [L6](#l6) |
| digest | 0.10.7 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| dirs | 7.0.0 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L26](#l26), [L1](#l1) |
| dirs-sys | 0.5.0 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L26](#l26), [L1](#l1) |
| displaydoc | 0.2.7 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| dom_query | 0.28.0 | MIT | Copyright (c) 2023 Mykola Humanov | [L46](#l46) |
| dpi | 0.1.2 | Apache-2.0 AND MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L9](#l9), [L47](#l47) |
| dtoa | 1.0.11 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| dtoa-short | 0.3.5 | MPL-2.0 | (c) under Patent Claims infringed by Covered Software in the absence of | [L19](#l19) |
| dunce | 1.0.5 | CC0-1.0 OR MIT-0 OR Apache-2.0 |  | [L23](#l23) |
| dyn-clone | 1.0.20 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| embed-resource | 3.0.11 | MIT | Copyright (c) 2017 nabijaczleweli | [L6](#l6) |
| equivalent | 1.0.2 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| erased-serde | 0.4.10 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| fastrand | 2.5.0 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| fdeflate | 0.3.7 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L3](#l3) |
| find-msvc-tools | 0.1.14 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| flate2 | 1.1.10 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| fnv | 1.0.7 | Apache-2.0 / MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| foldhash | 0.2.0 | Zlib | Copyright (c) 2024 Orson Peters | [L13](#l13) |
| form_urlencoded | 1.2.2 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| futures-channel | 0.3.34 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| futures-core | 0.3.34 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| futures-io | 0.3.34 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| futures-macro | 0.3.34 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| futures-sink | 0.3.34 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| futures-task | 0.3.34 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| futures-util | 0.3.34 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| generic-array | 0.14.7 | MIT | Copyright (c) 2015 Bartłomiej Kamiński | [L6](#l6) |
| getrandom | 0.2.17 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L20](#l20), [L1](#l1) |
| getrandom | 0.3.4 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L20](#l20), [L1](#l1) |
| getrandom | 0.4.3 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L20](#l20), [L1](#l1) |
| glob | 0.3.4 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| hashbrown | 0.12.3 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| hashbrown | 0.17.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| heck | 0.5.0 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| hex | 0.4.3 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L9](#l9), [L1](#l1) |
| html5ever | 0.39.0 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| http | 1.5.0 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| http-body | 1.1.0 | MIT | Copyright (c) 2019-2026 Sean McArthur & Hyper Contributors | [L1](#l1) |
| http-body-util | 0.1.5 | MIT | Copyright (c) 2019-2026 Sean McArthur & Hyper Contributors | [L1](#l1) |
| httparse | 1.10.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| hyper | 1.11.1 | MIT | Copyright (c) 2014-2026 Sean McArthur | [L1](#l1) |
| hyper-rustls | 0.27.10 | Apache-2.0 OR ISC OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L27](#l27), [L1](#l1) |
| hyper-util | 0.1.21 | MIT | Copyright (c) 2023-2025 Sean McArthur | [L1](#l1) |
| ico | 0.5.0 | MIT | Copyright (c) 2018 Matthew D. Steele | [L3](#l3) |
| icu_collections | 2.3.0 | Unicode-3.0 | COPYRIGHT AND PERMISSION NOTICE · Copyright © 2020-2024 Unicode, Inc. | [L8](#l8) |
| icu_locale_core | 2.3.0 | Unicode-3.0 | COPYRIGHT AND PERMISSION NOTICE · Copyright © 2020-2024 Unicode, Inc. | [L8](#l8) |
| icu_normalizer | 2.3.0 | Unicode-3.0 | COPYRIGHT AND PERMISSION NOTICE · Copyright © 2020-2024 Unicode, Inc. | [L8](#l8) |
| icu_normalizer_data | 2.3.0 | Unicode-3.0 | COPYRIGHT AND PERMISSION NOTICE · Copyright © 2020-2024 Unicode, Inc. | [L8](#l8) |
| icu_properties | 2.3.0 | Unicode-3.0 | COPYRIGHT AND PERMISSION NOTICE · Copyright © 2020-2024 Unicode, Inc. | [L8](#l8) |
| icu_properties_data | 2.3.0 | Unicode-3.0 | COPYRIGHT AND PERMISSION NOTICE · Copyright © 2020-2024 Unicode, Inc. | [L8](#l8) |
| icu_provider | 2.3.1 | Unicode-3.0 | COPYRIGHT AND PERMISSION NOTICE · Copyright © 2020-2024 Unicode, Inc. | [L8](#l8) |
| ident_case | 1.0.1 | MIT/Apache-2.0 |  | [L3](#l3) |
| idna | 1.1.0 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| idna_adapter | 1.2.2 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| indexmap | 1.9.3 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| indexmap | 2.14.2 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| infer | 0.22.0 | MIT | Copyright (c) 2019 Bojan | [L3](#l3) |
| ipnet | 2.12.2 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L9](#l9), [L1](#l1) |
| itoa | 1.0.18 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| jiff | 0.2.37 | Unlicense OR MIT | Copyright (c) 2015 Andrew Gallant | [L11](#l11), [L6](#l6), [L12](#l12) |
| jiff-core | 0.1.1 | Unlicense OR MIT | Copyright (c) 2015 Andrew Gallant | [L11](#l11), [L6](#l6), [L12](#l12) |
| jiff-tzdb | 0.1.8 | Unlicense OR MIT | Copyright (c) 2015 Andrew Gallant | [L11](#l11), [L6](#l6), [L12](#l12) |
| jiff-tzdb-platform | 0.1.3 | Unlicense OR MIT | Copyright (c) 2015 Andrew Gallant | [L11](#l11), [L6](#l6), [L12](#l12) |
| json-patch | 4.2.0 | MIT/Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L9](#l9), [L3](#l3) |
| jsonptr | 0.7.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L3](#l3) |
| keyboard-types | 0.8.3 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| libc | 0.2.190 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| litemap | 0.8.3 | Unicode-3.0 | COPYRIGHT AND PERMISSION NOTICE · Copyright © 2020-2024 Unicode, Inc. | [L8](#l8) |
| lock_api | 0.4.14 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| log | 0.4.34 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| markup5ever | 0.39.0 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| memchr | 2.8.3 | Unlicense OR MIT | Copyright (c) 2015 Andrew Gallant | [L11](#l11), [L6](#l6), [L12](#l12) |
| mime | 0.3.17 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| minisign-verify | 0.3.0 | MIT | Copyright (c) 2019-2025 Frank Denis · Copyright (c) 2006-2009 Graydon Hoare · Copyright (c) 2009-2013 Mozilla Foundation | [L48](#l48) |
| miniz_oxide | 0.8.9 | MIT OR Zlib OR Apache-2.0 | Copyright 2013-2014 RAD Game Tools and Valve Software · Copyright 2010-2014 Rich Geldreich and Tenacious Software LLC · Copyright (c) 2017 Frommi | [L3](#l3), [L5](#l5), [L13](#l13) |
| miniz_oxide | 0.9.1 | MIT OR Zlib OR Apache-2.0 | Copyright 2013-2014 RAD Game Tools and Valve Software · Copyright 2010-2014 Rich Geldreich and Tenacious Software LLC · Copyright (c) 2017 Frommi | [L3](#l3), [L5](#l5), [L13](#l13) |
| mio | 1.2.4 | MIT | Copyright (c) 2014 Carl Lerche and other MIO contributors | [L1](#l1) |
| muda | 0.20.0 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L3](#l3), [L49](#l49) |
| new_debug_unreachable | 1.0.6 | MIT | Copyright (c) 2015 Jonathan Reem | [L1](#l1) |
| num-conv | 0.2.2 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| num-traits | 0.2.19 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| once_cell | 1.21.4 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| open | 5.4.4 | MIT | Copyright © `2015` `Sebastian Thiel` | [L50](#l50) |
| option-ext | 0.2.0 | MPL-2.0 | (c) under Patent Claims infringed by Covered Software in the absence of | [L51](#l51) |
| parking_lot | 0.12.5 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| parking_lot_core | 0.9.12 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| percent-encoding | 2.3.2 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| phf | 0.13.1 | MIT | Copyright (c) 2014-2022 Steven Fackler, Yuki Okushi · COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER | [L14](#l14) |
| phf_codegen | 0.13.1 | MIT | Copyright (c) 2014-2022 Steven Fackler, Yuki Okushi · COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER | [L14](#l14) |
| phf_generator | 0.13.1 | MIT | Copyright (c) 2014-2022 Steven Fackler, Yuki Okushi · COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER | [L14](#l14) |
| phf_macros | 0.13.1 | MIT | Copyright (c) 2014-2022 Steven Fackler, Yuki Okushi · COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER | [L14](#l14) |
| phf_shared | 0.13.1 | MIT | Copyright (c) 2014-2022 Steven Fackler, Yuki Okushi · COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER | [L14](#l14) |
| pin-project-lite | 0.2.17 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| plist | 1.10.1 | MIT | Copyright (c) 2015 Edward Barnard | [L1](#l1) |
| png | 0.17.16 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| png | 0.18.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| potential_utf | 0.1.6 | Unicode-3.0 | COPYRIGHT AND PERMISSION NOTICE · Copyright © 2020-2024 Unicode, Inc. | [L8](#l8) |
| powerfmt | 0.2.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| precomputed-hash | 0.1.1 | MIT | Copyright (c) 2017 Emilio Cobos Álvarez | [L3](#l3) |
| proc-macro2 | 1.0.107 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| quick-xml | 0.42.0 | MIT | Copyright (c) 2016 Johann Tuffe | [L6](#l6) |
| quote | 1.0.47 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| raw-window-handle | 0.6.2 | MIT OR Apache-2.0 OR Zlib | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L3](#l3), [L13](#l13) |
| ref-cast | 1.0.27 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| ref-cast-impl | 1.0.27 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| regex | 1.13.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| regex-automata | 0.4.18 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| regex-syntax | 0.8.11 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| reqwest | 0.13.5 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| ring | 0.17.14 | Apache-2.0 AND ISC | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L52](#l52), [L53](#l53), [L54](#l54) |
| rustc_version | 0.4.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| rustc-hash | 2.1.3 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| rustls | 0.23.46 | Apache-2.0 OR ISC OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L27](#l27), [L1](#l1) |
| rustls-pki-types | 1.15.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| rustls-platform-verifier | 0.7.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L3](#l3) |
| rustls-webpki | 0.103.16 | ISC | Copyright 2015 Brian Smith. · copyright notice and this permission notice appear in all copies. | [L55](#l55) |
| same-file | 1.0.6 | Unlicense/MIT | Copyright (c) 2017 Andrew Gallant | [L11](#l11), [L6](#l6), [L12](#l12) |
| schemars | 0.8.22 | MIT | Copyright (c) 2019 Graham Esau | [L3](#l3) |
| schemars | 0.9.0 | MIT | Copyright (c) 2019 Graham Esau | [L3](#l3) |
| schemars | 1.2.2 | MIT | Copyright (c) 2019 Graham Esau | [L3](#l3) |
| schemars_derive | 0.8.22 | MIT | Copyright (c) 2019 Graham Esau | [L3](#l3) |
| scopeguard | 1.2.0 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| selectors | 0.38.0 | MPL-2.0 | _sin archivo de licencia en el paquete (texto estándar)_ | [L19](#l19) |
| semver | 1.0.28 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| serde | 1.0.229 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| serde_core | 1.0.229 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| serde_derive | 1.0.229 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| serde_derive_internals | 0.29.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| serde_json | 1.0.151 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| serde_repr | 0.1.21 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| serde_spanned | 1.1.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L9](#l9), [L1](#l1) |
| serde_with | 3.24.0 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| serde_with_macros | 3.24.0 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| serde-untagged | 0.1.9 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| serialize-to-javascript | 0.1.2 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L3](#l3) |
| serialize-to-javascript-impl | 0.1.2 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L3](#l3) |
| servo_arc | 0.4.3 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| sha2 | 0.10.9 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| shlex | 2.0.1 | MIT OR Apache-2.0 | Copyright 2015 Nicholas Allegra (comex). · Copyright (c) 2015 Nicholas Allegra (comex). | [L56](#l56), [L6](#l6) |
| simd-adler32 | 0.3.10 | MIT | Copyright (c) [2021] [Marvin Countryman] | [L3](#l3) |
| siphasher | 1.0.4 | MIT OR Apache-2.0 | Copyright 2012-2016 The Rust Project Developers. · Copyright 2016-2026 Frank Denis. · copyright notice that is included in or attached to the work | [L57](#l57), [L2](#l2), [L1](#l1) |
| slab | 0.4.12 | MIT | Copyright (c) 2019 Carl Lerche | [L1](#l1) |
| smallvec | 1.16.2 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| socket2 | 0.6.5 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| softbuffer | 0.4.8 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L9](#l9), [L1](#l1) |
| stable_deref_trait | 1.2.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| string_cache | 0.9.0 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| string_cache_codegen | 0.6.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| strsim | 0.11.1 | MIT | Copyright (c) 2015 Danny Guo · Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com> · Copyright (c) 2018 Akash Kurdekar | [L6](#l6) |
| subtle | 2.6.1 | BSD-3-Clause | Copyright (c) 2016-2017 Isis Agora Lovecruft, Henry de Valence. All rights reserved. · Copyright (c) 2016-2024 Isis Agora Lovecruft. All rights reserved. | [L22](#l22) |
| syn | 2.0.119 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| syn | 3.0.6 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| sync_wrapper | 1.0.2 | Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5) |
| synstructure | 0.14.0 | MIT | Copyright 2016 Nika Layzell | [L1](#l1) |
| tao | 0.37.1 | Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L9](#l9), [L58](#l58) |
| tauri | 2.12.1 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L3](#l3) |
| tauri-build | 2.7.1 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L3](#l3) |
| tauri-codegen | 2.7.1 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L3](#l3) |
| tauri-macros | 2.7.1 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L3](#l3) |
| tauri-plugin | 2.7.1 | Apache-2.0 OR MIT | _sin archivo de licencia en el paquete (texto estándar)_ | [L2](#l2) |
| tauri-plugin-opener | 2.7.0 | Apache-2.0 OR MIT |  | [L17](#l17) |
| tauri-plugin-updater | 2.14.1 | Apache-2.0 OR MIT |  | [L17](#l17) |
| tauri-runtime | 2.12.1 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L3](#l3) |
| tauri-runtime-wry | 2.12.1 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L3](#l3) |
| tauri-utils | 2.10.1 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L3](#l3) |
| tauri-winres | 0.3.6 | MIT | Copyright (c) 2023 - Present Tauri Apps Contributors · Copyright (c) 2016 Max Resch | [L6](#l6) |
| tempfile | 3.27.0 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| tendril | 0.5.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| thiserror | 2.0.21 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| thiserror-impl | 2.0.21 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| time | 0.3.55 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| time-core | 0.1.9 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| time-macros | 0.2.32 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| tinystr | 0.8.4 | Unicode-3.0 | COPYRIGHT AND PERMISSION NOTICE · Copyright © 2020-2024 Unicode, Inc. | [L8](#l8) |
| tinyvec | 1.13.3 | Zlib OR Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1), [L13](#l13) |
| tokio | 1.53.2 | MIT | Copyright (c) Tokio Contributors | [L3](#l3) |
| tokio-rustls | 0.26.6 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| tokio-util | 0.7.19 | MIT | Copyright (c) Tokio Contributors | [L3](#l3) |
| toml | 1.1.6+spec-1.1.0 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L9](#l9), [L1](#l1) |
| toml_datetime | 1.1.1+spec-1.1.0 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L9](#l9), [L1](#l1) |
| toml_parser | 1.1.3+spec-1.1.0 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L9](#l9), [L1](#l1) |
| toml_writer | 1.1.2+spec-1.1.0 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L9](#l9), [L1](#l1) |
| tower | 0.5.3 | MIT | Copyright (c) 2019 Tower Contributors | [L1](#l1) |
| tower-http | 0.6.11 | MIT | Copyright (c) 2019-2021 Tower Contributors | [L1](#l1) |
| tower-layer | 0.3.3 | MIT | Copyright (c) 2019 Tower Contributors | [L1](#l1) |
| tower-service | 0.3.3 | MIT | Copyright (c) 2019 Tower Contributors | [L1](#l1) |
| tracing | 0.1.44 | MIT | Copyright (c) 2019 Tokio Contributors | [L1](#l1) |
| tracing-attributes | 0.1.31 | MIT | Copyright (c) 2019 Tokio Contributors | [L1](#l1) |
| tracing-core | 0.1.36 | MIT | Copyright (c) 2019 Tokio Contributors | [L1](#l1) |
| tray-icon | 0.25.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L3](#l3), [L59](#l59) |
| try-lock | 0.2.5 | MIT | Copyright (c) 2018-2023 Sean McArthur · Copyright (c) 2016 Alex Crichton | [L1](#l1) |
| typed-path | 0.13.0 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| typeid | 1.0.3 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1) |
| typenum | 1.20.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L60](#l60), [L2](#l2), [L6](#l6) |
| unicode-ident | 1.0.26 | (MIT OR Apache-2.0) AND Unicode-3.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L5](#l5), [L1](#l1), [L61](#l61) |
| unicode-segmentation | 1.13.3 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| untrusted | 0.9.0 | ISC |  | [L62](#l62) |
| url | 2.5.8 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| urlpattern | 0.6.0 | MIT | Copyright (c) 2021 the Deno authors | [L3](#l3) |
| utf8_iter | 1.0.4 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| uuid | 1.27.0 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| version_check | 0.9.5 | MIT/Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L14](#l14) |
| vswhom | 0.1.0 | MIT | Copyright (c) 2019 nabijaczleweli | [L6](#l6) |
| vswhom-sys | 0.1.3 | MIT | Copyright (c) 2019 nabijaczleweli | [L6](#l6) |
| walkdir | 2.5.0 | Unlicense/MIT | Copyright (c) 2015 Andrew Gallant | [L11](#l11), [L6](#l6), [L12](#l12) |
| want | 0.3.2 | MIT | Copyright (c) 2018-2019 Sean McArthur | [L1](#l1) |
| web_atoms | 0.2.6 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| web-time | 1.1.0 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L3](#l3) |
| webview2-com | 0.39.1 | MIT | _sin archivo de licencia en el paquete (texto estándar)_ | [L1](#l1) |
| webview2-com-macros | 0.8.1 | MIT | _sin archivo de licencia en el paquete (texto estándar)_ | [L1](#l1) |
| webview2-com-sys | 0.39.1 | MIT | _sin archivo de licencia en el paquete (texto estándar)_ | [L1](#l1) |
| winapi-util | 0.1.11 | Unlicense OR MIT | Copyright (c) 2017 Andrew Gallant | [L11](#l11), [L6](#l6), [L12](#l12) |
| window-vibrancy | 0.8.1 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L3](#l3), [L63](#l63) |
| windows | 0.62.2 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L7](#l7) |
| windows_x86_64_msvc | 0.52.6 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L7](#l7) |
| windows-collections | 0.3.2 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L7](#l7) |
| windows-core | 0.62.2 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L7](#l7) |
| windows-future | 0.3.2 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L7](#l7) |
| windows-implement | 0.60.2 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L7](#l7) |
| windows-interface | 0.59.3 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L7](#l7) |
| windows-link | 0.2.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L7](#l7) |
| windows-numerics | 0.3.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L7](#l7) |
| windows-registry | 0.6.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L7](#l7) |
| windows-result | 0.4.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L7](#l7) |
| windows-strings | 0.5.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L7](#l7) |
| windows-sys | 0.59.0 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L7](#l7) |
| windows-sys | 0.61.2 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L7](#l7) |
| windows-targets | 0.52.6 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L7](#l7) |
| windows-threading | 0.2.1 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L7](#l7) |
| windows-version | 0.1.7 | MIT OR Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L7](#l7) |
| winnow | 1.0.4 | MIT |  | [L1](#l1) |
| winreg | 0.55.0 | MIT | Copyright (c) 2015 Igor Shaula | [L1](#l1) |
| writeable | 0.6.4 | Unicode-3.0 | COPYRIGHT AND PERMISSION NOTICE · Copyright © 2020-2024 Unicode, Inc. | [L8](#l8) |
| wry | 0.57.0 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L3](#l3), [L64](#l64) |
| yoke | 0.8.3 | Unicode-3.0 | COPYRIGHT AND PERMISSION NOTICE · Copyright © 2020-2024 Unicode, Inc. | [L8](#l8) |
| yoke-derive | 0.8.4 | Unicode-3.0 | COPYRIGHT AND PERMISSION NOTICE · Copyright © 2020-2024 Unicode, Inc. | [L8](#l8) |
| zerofrom | 0.1.8 | Unicode-3.0 | COPYRIGHT AND PERMISSION NOTICE · Copyright © 2020-2024 Unicode, Inc. | [L8](#l8) |
| zerofrom-derive | 0.1.8 | Unicode-3.0 | COPYRIGHT AND PERMISSION NOTICE · Copyright © 2020-2024 Unicode, Inc. | [L8](#l8) |
| zeroize | 1.9.1 | Apache-2.0 OR MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L2](#l2), [L1](#l1) |
| zerotrie | 0.2.5 | Unicode-3.0 | COPYRIGHT AND PERMISSION NOTICE · Copyright © 2020-2024 Unicode, Inc. | [L8](#l8) |
| zerovec | 0.11.8 | Unicode-3.0 | COPYRIGHT AND PERMISSION NOTICE · Copyright © 2020-2024 Unicode, Inc. | [L8](#l8) |
| zerovec-derive | 0.11.6 | Unicode-3.0 | COPYRIGHT AND PERMISSION NOTICE · Copyright © 2020-2024 Unicode, Inc. | [L8](#l8) |
| zip | 9.3.0 | MIT | Copyright (c) 2014 Mathijs van de Nes | [L6](#l6) |
| zlib-rs | 0.6.8 | Zlib | (C) 2024 Trifecta Tech Foundation | [L13](#l13) |
| zmij | 1.0.23 | MIT |  | [L1](#l1) |

## Ruedas de Python que lleva Pyodide

| Paquete | Versión | Licencia | Copyright | Texto |
| --- | --- | --- | --- | --- |
| contourpy | 1.3.1 | BSD License | Copyright (c) 2021-2024, ContourPy Developers. | [L65](#l65) |
| cycler | 0.12.1 | BSD License | Copyright (c) 2015, matplotlib project | [L66](#l66) |
| fonttools | 4.56.0 | MIT License | Copyright (c) 2017 Just van Rossum | [L3](#l3) |
| kiwisolver | 1.4.8 | BSD License | Copyright (c) 2013-2024, Nucleic Development Team | [L67](#l67) |
| matplotlib | 3.8.4 | Python Software Foundation License | Copyright (c) 2003 by Bitstream, Inc. All Rights Reserved. Bitstream Vera is · Copyright (c) 2006 by Tavmjong Bah. All Rights Reserved. · Copyright (c) 2001-2010 by the STI Pub Companies, consisting of the American | [L68](#l68), [L28](#l28), [L69](#l69), [L70](#l70), [L71](#l71), [L72](#l72), [L73](#l73), [L74](#l74), [L75](#l75), [L76](#l76), [L77](#l77), [L78](#l78), [L79](#l79) |
| numpy | 2.2.5 | BSD License | Copyright (C) 2010 - 2019 ridiculous_fish, <libdivide@ridiculousfish.com> · Copyright (C) 2016 - 2019 Kim Walisch, <kim.walisch@gmail.com> · Copyright (c) 2005-2024, NumPy Developers. | [L80](#l80), [L81](#l81), [L82](#l82), [L83](#l83) |
| packaging | 26.2 | Apache-2.0 OR BSD-2-Clause | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works | [L84](#l84), [L5](#l5), [L85](#l85) |
| pandas | 2.3.3 | BSD License | Copyright (c) 2008-2011, AQR Capital Management, LLC, Lambda Foundry, Inc. and PyData Development T… · Copyright (c) 2011-2023, Open source contributors. | [L29](#l29) |
| pillow | 11.3.0 | MIT-CMU | Copyright © 1997-2011 by Secret Labs AB · Copyright © 1995-2011 by Fredrik Lundh and contributors · Copyright © 2010 by Jeffrey A. Clark and contributors | [L86](#l86) |
| pyparsing | 3.2.1 | MIT License |  | [L1](#l1) |
| python-dateutil | 2.9.0.post0 | BSD License | Copyright 2017- Paul Ganssle <paul@ganssle.io> · Copyright 2017- dateutil contributors (see AUTHORS file) · Copyright (c) 2003-2011 - Gustavo Niemeyer <gustavo@niemeyer.net> | [L87](#l87) |
| pytz | 2025.2 | MIT License | Copyright (c) 2003-2019 Stuart Bishop <stuart@stuartbishop.net> | [L1](#l1) |
| scipy | 1.14.1 | BSD License | Copyright (c) 2018, Quansight-Labs · Copyright (C) 2010-2019 Max-Planck-Society · Copyright (c) 1996-2008 Rice University. | [L29](#l29), [L88](#l88), [L89](#l89), [L90](#l90), [L91](#l91) |
| six | 1.17.0 | MIT License | Copyright (c) 2010-2024 Benjamin Peterson · COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER | [L24](#l24) |

## Fuentes incluidas

- **DejaVu Sans Mono** (laboratorios, interfaz y rótulos): licencia de las fuentes DejaVu/Bitstream Vera, texto en [frontend/public/fuentes/LICENSE_DEJAVU](frontend/public/fuentes/LICENSE_DEJAVU).
- **Fuentes de KaTeX** (fórmulas): vienen en el paquete `katex` de la lista npm (su licencia figura arriba).

## Se descarga al instalar (no se redistribuye aquí)

El instalador baja estas piezas desde su origen; cada una llega con su propia licencia. Se listan por transparencia.

- **uv** (MIT o Apache-2.0): <https://github.com/astral-sh/uv>. **Python 3.13** (PSF-2.0), que instala uv desde <https://github.com/astral-sh/python-build-standalone>.
- **Ollama** (MIT, opcional): <https://ollama.com>. Modelos de IA: ver el README.

Librerías de Python de `backend/requirements.txt` y sus dependencias (licencia según los metadatos del entorno de desarrollo; las versiones instaladas pueden diferir ligeramente):

| Paquete | Versión (desarrollo) | Licencia |
| --- | --- | --- |
| annotated-doc | 0.0.5 | MIT |
| annotated-types | 0.8.0 | MIT |
| anyio | 4.15.1 | MIT |
| certifi | 2026.7.22 | Mozilla Public License 2.0 (MPL 2.0) |
| charset-normalizer | 3.5.2 | MIT |
| click | 8.5.0 | BSD-3-Clause |
| colorama | 0.4.6 | BSD License |
| fastapi | 0.142.2 | MIT |
| fastembed | 0.9.0 | Apache Software License |
| filelock | 4.0.12 | MIT |
| flatbuffers | 25.12.19 | Apache Software License |
| fsspec | 2026.9.0 | BSD-3-Clause |
| h11 | 0.16.0 | MIT License |
| hf-xet | 1.7.0 | Apache-2.0 |
| httpcore | 1.0.9 | BSD-3-Clause |
| httpx | 0.28.1 | BSD License |
| huggingface_hub | 1.33.0 | Apache Software License |
| idna | 3.20 | BSD-3-Clause |
| loguru | 0.7.3 | MIT License |
| mmh3 | 5.3.1 | MIT License |
| numpy | 2.5.3 | BSD-3-Clause AND 0BSD AND MIT AND Zlib AND CC0-1.0 |
| onnxruntime | 1.30.0 | MIT License |
| opentelemetry-api | 1.45.0 | Apache-2.0 |
| packaging | 26.3 | Apache-2.0 OR BSD-2-Clause |
| pandas | 3.0.6 | BSD License |
| pillow | 12.3.0 | MIT-CMU |
| protobuf | 7.36.2 | 3-Clause BSD License |
| py_rust_stemmers | 0.1.8 |  |
| pyarrow | 25.0.1 | Apache-2.0 |
| pydantic | 2.13.5 | MIT |
| pydantic_core | 2.46.5 | MIT |
| python-dateutil | 2.9.0.post0 | BSD License |
| PyYAML | 6.0.3 | MIT License |
| requests | 2.34.2 | Apache Software License |
| six | 1.17.0 | MIT License |
| starlette | 1.7.0 | BSD-3-Clause |
| tokenizers | 0.23.2 | Apache Software License |
| tqdm | 4.70.1 | MPL-2.0 AND MIT |
| typing_extensions | 4.16.0 | PSF-2.0 |
| typing-inspection | 0.4.4 | MIT |
| tzdata | 2026.5 | Apache-2.0 |
| urllib3 | 2.8.0 | MIT |
| uvicorn | 0.54.0 | BSD-3-Clause |
| win32_setctime | 1.2.0 | MIT License |

## Textos de licencia

Cada texto distinto aparece una vez. Los titulares del copyright de cada paquete están en las tablas de arriba; los textos de este apartado son los de los paquetes que remiten a ellos (puede cambiar solo la línea de copyright).

### L1

MIT OR Apache-2.0 / MIT / Apache-2.0 OR MIT · 163 archivos

```text
Copyright (c) 2014 Forbes Lindesay

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### L2

MIT OR Apache-2.0 / Apache-2.0 OR MIT / MIT/Apache-2.0 · 119 archivos

```text
Apache License
                          Version 2.0, January 2004
                       http://www.apache.org/licenses/

  TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

  1. Definitions.

     "License" shall mean the terms and conditions for use, reproduction,
     and distribution as defined by Sections 1 through 9 of this document.

     "Licensor" shall mean the copyright owner or entity authorized by
     the copyright owner that is granting the License.

     "Legal Entity" shall mean the union of the acting entity and all
     other entities that control, are controlled by, or are under common
     control with that entity. For the purposes of this definition,
     "control" means (i) the power, direct or indirect, to cause the
     direction or management of such entity, whether by contract or
     otherwise, or (ii) ownership of fifty percent (50%) or more of the
     outstanding shares, or (iii) beneficial ownership of such entity.

     "You" (or "Your") shall mean an individual or Legal Entity
     exercising permissions granted by this License.

     "Source" form shall mean the preferred form for making modifications,
     including but not limited to software source code, documentation
     source, and configuration files.

     "Object" form shall mean any form resulting from mechanical
     transformation or translation of a Source form, including but
     not limited to compiled object code, generated documentation,
     and conversions to other media types.

     "Work" shall mean the work of authorship, whether in Source or
     Object form, made available under the License, as indicated by a
     copyright notice that is included in or attached to the work
     (an example is provided in the Appendix below).

     "Derivative Works" shall mean any work, whether in Source or Object
     form, that is based on (or derived from) the Work and for which the
     editorial revisions, annotations, elaborations, or other modifications
     represent, as a whole, an original work of authorship. For the purposes
     of this License, Derivative Works shall not include works that remain
     separable from, or merely link (or bind by name) to the interfaces of,
     the Work and Derivative Works thereof.

     "Contribution" shall mean any work of authorship, including
     the original version of the Work and any modifications or additions
     to that Work or Derivative Works thereof, that is intentionally
     submitted to Licensor for inclusion in the Work by the copyright owner
     or by an individual or Legal Entity authorized to submit on behalf of
     the copyright owner. For the purposes of this definition, "submitted"
     means any form of electronic, verbal, or written communication sent
     to the Licensor or its representatives, including but not limited to
     communication on electronic mailing lists, source code control systems,
     and issue tracking systems that are managed by, or on behalf of, the
     Licensor for the purpose of discussing and improving the Work, but
     excluding communication that is conspicuously marked or otherwise
     designated in writing by the copyright owner as "Not a Contribution."

     "Contributor" shall mean Licensor and any individual or Legal Entity
     on behalf of whom a Contribution has been received by Licensor and
     subsequently incorporated within the Work.

  2. Grant of Copyright License. Subject to the terms and conditions of
     this License, each Contributor hereby grants to You a perpetual,
     worldwide, non-exclusive, no-charge, royalty-free, irrevocable
     copyright license to reproduce, prepare Derivative Works of,
     publicly display, publicly perform, sublicense, and distribute the
     Work and such Derivative Works in Source or Object form.

  3. Grant of Patent License. Subject to the terms and conditions of
     this License, each Contributor hereby grants to You a perpetual,
     worldwide, non-exclusive, no-charge, royalty-free, irrevocable
     (except as stated in this section) patent license to make, have made,
     use, offer to sell, sell, import, and otherwise transfer the Work,
     where such license applies only to those patent claims licensable
     by such Contributor that are necessarily infringed by their
     Contribution(s) alone or by combination of their Contribution(s)
     with the Work to which such Contribution(s) was submitted. If You
     institute patent litigation against any entity (including a
     cross-claim or counterclaim in a lawsuit) alleging that the Work
     or a Contribution incorporated within the Work constitutes direct
     or contributory patent infringement, then any patent licenses
     granted to You under this License for that Work shall terminate
     as of the date such litigation is filed.

  4. Redistribution. You may reproduce and distribute copies of the
     Work or Derivative Works thereof in any medium, with or without
     modifications, and in Source or Object form, provided that You
     meet the following conditions:

     (a) You must give any other recipients of the Work or
         Derivative Works a copy of this License; and

     (b) You must cause any modified files to carry prominent notices
         stating that You changed the files; and

     (c) You must retain, in the Source form of any Derivative Works
         that You distribute, all copyright, patent, trademark, and
         attribution notices from the Source form of the Work,
         excluding those notices that do not pertain to any part of
         the Derivative Works; and

     (d) If the Work includes a "NOTICE" text file as part of its
         distribution, then any Derivative Works that You distribute must
         include a readable copy of the attribution notices contained
         within such NOTICE file, excluding those notices that do not
         pertain to any part of the Derivative Works, in at least one
         of the following places: within a NOTICE text file distributed
         as part of the Derivative Works; within the Source form or
         documentation, if provided along with the Derivative Works; or,
         within a display generated by the Derivative Works, if and
         wherever such third-party notices normally appear. The contents
         of the NOTICE file are for informational purposes only and
         do not modify the License. You may add Your own attribution
         notices within Derivative Works that You distribute, alongside
         or as an addendum to the NOTICE text from the Work, provided
         that such additional attribution notices cannot be construed
         as modifying the License.

     You may add Your own copyright statement to Your modifications and
     may provide additional or different license terms and conditions
     for use, reproduction, or distribution of Your modifications, or
     for any such Derivative Works as a whole, provided Your use,
     reproduction, and distribution of the Work otherwise complies with
     the conditions stated in this License.

  5. Submission of Contributions. Unless You explicitly state otherwise,
     any Contribution intentionally submitted for inclusion in the Work
     by You to the Licensor shall be under the terms and conditions of
     this License, without any additional terms or conditions.
     Notwithstanding the above, nothing herein shall supersede or modify
     the terms of any separate license agreement you may have executed
     with Licensor regarding such Contributions.

  6. Trademarks. This License does not grant permission to use the trade
     names, trademarks, service marks, or product names of the Licensor,
     except as required for reasonable and customary use in describing the
     origin of the Work and reproducing the content of the NOTICE file.

  7. Disclaimer of Warranty. Unless required by applicable law or
     agreed to in writing, Licensor provides the Work (and each
     Contributor provides its Contributions) on an "AS IS" BASIS,
     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
     implied, including, without limitation, any warranties or conditions
     of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
     PARTICULAR PURPOSE. You are solely responsible for determining the
     appropriateness of using or redistributing the Work and assume any
     risks associated with Your exercise of permissions under this License.

  8. Limitation of Liability. In no event and under no legal theory,
     whether in tort (including negligence), contract, or otherwise,
     unless required by applicable law (such as deliberate and grossly
     negligent acts) or agreed to in writing, shall any Contributor be
     liable to You for damages, including any direct, indirect, special,
     incidental, or consequential damages of any character arising as a
     result of this License or out of the use or inability to use the
     Work (including but not limited to damages for loss of goodwill,
     work stoppage, computer failure or malfunction, or any and all
     other commercial damages or losses), even if such Contributor
     has been advised of the possibility of such damages.

  9. Accepting Warranty or Additional Liability. While redistributing
     the Work or Derivative Works thereof, You may choose to offer,
     and charge a fee for, acceptance of support, warranty, indemnity,
     or other liability obligations and/or rights consistent with this
     License. However, in accepting such obligations, You may act only
     on Your own behalf and on Your sole responsibility, not on behalf
     of any other Contributor, and only if You agree to indemnify,
     defend, and hold each Contributor harmless for any liability
     incurred by, or claims asserted against, such Contributor by reason
     of your accepting any such warranty or additional liability.

  END OF TERMS AND CONDITIONS

  APPENDIX: How to apply the Apache License to your work.

     To apply the Apache License to your work, attach the following
     boilerplate notice, with the fields enclosed by brackets "[]"
     replaced with your own identifying information. (Don't include
     the brackets!)  The text should be enclosed in the appropriate
     comment syntax for the file format. We also recommend that a
     file or class name and description of purpose be included on the
     same "printed page" as the copyright notice for easier
     identification within third-party archives.

  Copyright [yyyy] [name of copyright owner]

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
```

### L3

MIT / Apache-2.0 OR MIT / MIT OR Apache-2.0 · 83 archivos

```text
MIT License

Copyright (c) 2020 react-spring

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### L4

MIT · 75 archivos

```text
(The MIT License)

Copyright (c) 2011 TJ Holowaychuk <tj@vision-media.ca>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### L5

MIT OR Apache-2.0 / Apache-2.0 OR MIT / MIT OR Zlib OR Apache-2.0 · 45 archivos

```text
Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS
```

### L6

MIT / Unlicense OR MIT / MIT OR Apache-2.0 · 44 archivos

```text
The MIT License (MIT)
Copyright (c) 2017 Kent C. Dodds

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### L7

MIT / MIT OR Apache-2.0 · 43 archivos

```text
MIT License

    Copyright (c) Microsoft Corporation.

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE
```

### L8

Unicode-3.0 · 18 archivos

```text
UNICODE LICENSE V3

COPYRIGHT AND PERMISSION NOTICE

Copyright © 2020-2024 Unicode, Inc.

NOTICE TO USER: Carefully read the following legal agreement. BY
DOWNLOADING, INSTALLING, COPYING OR OTHERWISE USING DATA FILES, AND/OR
SOFTWARE, YOU UNEQUIVOCALLY ACCEPT, AND AGREE TO BE BOUND BY, ALL OF THE
TERMS AND CONDITIONS OF THIS AGREEMENT. IF YOU DO NOT AGREE, DO NOT
DOWNLOAD, INSTALL, COPY, DISTRIBUTE OR USE THE DATA FILES OR SOFTWARE.

Permission is hereby granted, free of charge, to any person obtaining a
copy of data files and any associated documentation (the "Data Files") or
software and any associated documentation (the "Software") to deal in the
Data Files or Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, and/or sell
copies of the Data Files or Software, and to permit persons to whom the
Data Files or Software are furnished to do so, provided that either (a)
this copyright and permission notice appear with all copies of the Data
Files or Software, or (b) this copyright and permission notice appear in
associated Documentation.

THE DATA FILES AND SOFTWARE ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF
THIRD PARTY RIGHTS.

IN NO EVENT SHALL THE COPYRIGHT HOLDER OR HOLDERS INCLUDED IN THIS NOTICE
BE LIABLE FOR ANY CLAIM, OR ANY SPECIAL INDIRECT OR CONSEQUENTIAL DAMAGES,
OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THE DATA
FILES OR SOFTWARE.

Except as contained in this notice, the name of a copyright holder shall
not be used in advertising or otherwise to promote the sale, use or other
dealings in these Data Files or Software without prior written
authorization of the copyright holder.

SPDX-License-Identifier: Unicode-3.0

—

Portions of ICU4X may have been adapted from ICU4C and/or ICU4J.
ICU 1.8.1 to ICU 57.1 © 1995-2016 International Business Machines Corporation and others.
```

### L9

MIT OR Apache-2.0 / Apache-2.0 OR MIT / Apache-2.0 AND MIT · 13 archivos

```text
Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "{}"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright {yyyy} {name of copyright owner}

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

### L10

ISC · 11 archivos

```text
Copyright 2010-2023 Mike Bostock

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
```

### L11

Unlicense OR MIT / Unlicense/MIT · 10 archivos

```text
This project is dual-licensed under the Unlicense and MIT licenses.

You may use this code under the terms of either license.
```

### L12

Unlicense OR MIT / Unlicense/MIT · 10 archivos

```text
This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
```

### L13

Zlib / MIT OR Zlib OR Apache-2.0 / MIT OR Apache-2.0 OR Zlib · 6 archivos

```text
Copyright (c) 2024 Orson Peters

This software is provided 'as-is', without any express or implied warranty. In
no event will the authors be held liable for any damages arising from the use of
this software.

Permission is granted to anyone to use this software for any purpose, including
commercial applications, and to alter it and redistribute it freely, subject to
the following restrictions:

1. The origin of this software must not be misrepresented; you must not claim
    that you wrote the original software. If you use this software in a product,
    an acknowledgment in the product documentation would be appreciated but is
    not required.

2. Altered source versions must be plainly marked as such, and must not be
    misrepresented as being the original software.

3. This notice may not be removed or altered from any source distribution.
```

### L14

MIT / MIT/Apache-2.0 · 6 archivos

```text
The MIT License (MIT)

Copyright (c) 2014-2022 Steven Fackler, Yuki Okushi

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### L15

MIT · 5 archivos

```text
(The MIT License)

Copyright (c) Titus Wormer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### L16

MIT · 3 archivos

```text
The MIT License

Copyright © 2010-2024 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### L17

Apache-2.0 OR MIT / MIT OR Apache-2.0 · 3 archivos

```text
SPDXVersion: SPDX-2.1
DataLicense: CC0-1.0
PackageName: tauri
DataFormat: SPDXRef-1
PackageSupplier: Organization: The Tauri Programme in the Commons Conservancy
PackageHomePage: https://tauri.app
PackageLicenseDeclared: Apache-2.0
PackageLicenseDeclared: MIT
PackageCopyrightText: 2019-2022, The Tauri Programme in the Commons Conservancy
PackageSummary: <text>Tauri is a rust project that enables developers to make secure
and small desktop applications using a web frontend.
                </text>
PackageComment: <text>The package includes the following libraries; see
Relationship information.
                </text>
Created: 2019-05-20T09:00:00Z
PackageDownloadLocation: git://github.com/tauri-apps/tauri
PackageDownloadLocation: git+https://github.com/tauri-apps/tauri.git
PackageDownloadLocation: git+ssh://github.com/tauri-apps/tauri.git
Creator: Person: Daniel Thompson-Yvetot
```

### L18

BSD-3-Clause / BSD-3-Clause AND MIT / BSD-3-Clause/MIT · 3 archivos

```text
Copyright (c) 2016 Dropbox, Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### L19

MPL-2.0 · 3 archivos

```text
Mozilla Public License Version 2.0
==================================

1. Definitions
--------------

1.1. "Contributor"
    means each individual or legal entity that creates, contributes to
    the creation of, or owns Covered Software.

1.2. "Contributor Version"
    means the combination of the Contributions of others (if any) used
    by a Contributor and that particular Contributor's Contribution.

1.3. "Contribution"
    means Covered Software of a particular Contributor.

1.4. "Covered Software"
    means Source Code Form to which the initial Contributor has attached
    the notice in Exhibit A, the Executable Form of such Source Code
    Form, and Modifications of such Source Code Form, in each case
    including portions thereof.

1.5. "Incompatible With Secondary Licenses"
    means

    (a) that the initial Contributor has attached the notice described
        in Exhibit B to the Covered Software; or

    (b) that the Covered Software was made available under the terms of
        version 1.1 or earlier of the License, but not also under the
        terms of a Secondary License.

1.6. "Executable Form"
    means any form of the work other than Source Code Form.

1.7. "Larger Work"
    means a work that combines Covered Software with other material, in 
    a separate file or files, that is not Covered Software.

1.8. "License"
    means this document.

1.9. "Licensable"
    means having the right to grant, to the maximum extent possible,
    whether at the time of the initial grant or subsequently, any and
    all of the rights conveyed by this License.

1.10. "Modifications"
    means any of the following:

    (a) any file in Source Code Form that results from an addition to,
        deletion from, or modification of the contents of Covered
        Software; or

    (b) any new file in Source Code Form that contains any Covered
        Software.

1.11. "Patent Claims" of a Contributor
    means any patent claim(s), including without limitation, method,
    process, and apparatus claims, in any patent Licensable by such
    Contributor that would be infringed, but for the grant of the
    License, by the making, using, selling, offering for sale, having
    made, import, or transfer of either its Contributions or its
    Contributor Version.

1.12. "Secondary License"
    means either the GNU General Public License, Version 2.0, the GNU
    Lesser General Public License, Version 2.1, the GNU Affero General
    Public License, Version 3.0, or any later versions of those
    licenses.

1.13. "Source Code Form"
    means the form of the work preferred for making modifications.

1.14. "You" (or "Your")
    means an individual or a legal entity exercising rights under this
    License. For legal entities, "You" includes any entity that
    controls, is controlled by, or is under common control with You. For
    purposes of this definition, "control" means (a) the power, direct
    or indirect, to cause the direction or management of such entity,
    whether by contract or otherwise, or (b) ownership of more than
    fifty percent (50%) of the outstanding shares or beneficial
    ownership of such entity.

2. License Grants and Conditions
--------------------------------

2.1. Grants

Each Contributor hereby grants You a world-wide, royalty-free,
non-exclusive license:

(a) under intellectual property rights (other than patent or trademark)
    Licensable by such Contributor to use, reproduce, make available,
    modify, display, perform, distribute, and otherwise exploit its
    Contributions, either on an unmodified basis, with Modifications, or
    as part of a Larger Work; and

(b) under Patent Claims of such Contributor to make, use, sell, offer
    for sale, have made, import, and otherwise transfer either its
    Contributions or its Contributor Version.

2.2. Effective Date

The licenses granted in Section 2.1 with respect to any Contribution
become effective for each Contribution on the date the Contributor first
distributes such Contribution.

2.3. Limitations on Grant Scope

The licenses granted in this Section 2 are the only rights granted under
this License. No additional rights or licenses will be implied from the
distribution or licensing of Covered Software under this License.
Notwithstanding Section 2.1(b) above, no patent license is granted by a
Contributor:

(a) for any code that a Contributor has removed from Covered Software;
    or

(b) for infringements caused by: (i) Your and any other third party's
    modifications of Covered Software, or (ii) the combination of its
    Contributions with other software (except as part of its Contributor
    Version); or

(c) under Patent Claims infringed by Covered Software in the absence of
    its Contributions.

This License does not grant any rights in the trademarks, service marks,
or logos of any Contributor (except as may be necessary to comply with
the notice requirements in Section 3.4).

2.4. Subsequent Licenses

No Contributor makes additional grants as a result of Your choice to
distribute the Covered Software under a subsequent version of this
License (see Section 10.2) or under the terms of a Secondary License (if
permitted under the terms of Section 3.3).

2.5. Representation

Each Contributor represents that the Contributor believes its
Contributions are its original creation(s) or it has sufficient rights
to grant the rights to its Contributions conveyed by this License.

2.6. Fair Use

This License is not intended to limit any rights You have under
applicable copyright doctrines of fair use, fair dealing, or other
equivalents.

2.7. Conditions

Sections 3.1, 3.2, 3.3, and 3.4 are conditions of the licenses granted
in Section 2.1.

3. Responsibilities
-------------------

3.1. Distribution of Source Form

All distribution of Covered Software in Source Code Form, including any
Modifications that You create or to which You contribute, must be under
the terms of this License. You must inform recipients that the Source
Code Form of the Covered Software is governed by the terms of this
License, and how they can obtain a copy of this License. You may not
attempt to alter or restrict the recipients' rights in the Source Code
Form.

3.2. Distribution of Executable Form

If You distribute Covered Software in Executable Form then:

(a) such Covered Software must also be made available in Source Code
    Form, as described in Section 3.1, and You must inform recipients of
    the Executable Form how they can obtain a copy of such Source Code
    Form by reasonable means in a timely manner, at a charge no more
    than the cost of distribution to the recipient; and

(b) You may distribute such Executable Form under the terms of this
    License, or sublicense it under different terms, provided that the
    license for the Executable Form does not attempt to limit or alter
    the recipients' rights in the Source Code Form under this License.

3.3. Distribution of a Larger Work

You may create and distribute a Larger Work under terms of Your choice,
provided that You also comply with the requirements of this License for
the Covered Software. If the Larger Work is a combination of Covered
Software with a work governed by one or more Secondary Licenses, and the
Covered Software is not Incompatible With Secondary Licenses, this
License permits You to additionally distribute such Covered Software
under the terms of such Secondary License(s), so that the recipient of
the Larger Work may, at their option, further distribute the Covered
Software under the terms of either this License or such Secondary
License(s).

3.4. Notices

You may not remove or alter the substance of any license notices
(including copyright notices, patent notices, disclaimers of warranty,
or limitations of liability) contained within the Source Code Form of
the Covered Software, except that You may alter any license notices to
the extent required to remedy known factual inaccuracies.

3.5. Application of Additional Terms

You may choose to offer, and to charge a fee for, warranty, support,
indemnity or liability obligations to one or more recipients of Covered
Software. However, You may do so only on Your own behalf, and not on
behalf of any Contributor. You must make it absolutely clear that any
such warranty, support, indemnity, or liability obligation is offered by
You alone, and You hereby agree to indemnify every Contributor for any
liability incurred by such Contributor as a result of warranty, support,
indemnity or liability terms You offer. You may include additional
disclaimers of warranty and limitations of liability specific to any
jurisdiction.

4. Inability to Comply Due to Statute or Regulation
---------------------------------------------------

If it is impossible for You to comply with any of the terms of this
License with respect to some or all of the Covered Software due to
statute, judicial order, or regulation then You must: (a) comply with
the terms of this License to the maximum extent possible; and (b)
describe the limitations and the code they affect. Such description must
be placed in a text file included with all distributions of the Covered
Software under this License. Except to the extent prohibited by statute
or regulation, such description must be sufficiently detailed for a
recipient of ordinary skill to be able to understand it.

5. Termination
--------------

5.1. The rights granted under this License will terminate automatically
if You fail to comply with any of its terms. However, if You become
compliant, then the rights granted under this License from a particular
Contributor are reinstated (a) provisionally, unless and until such
Contributor explicitly and finally terminates Your grants, and (b) on an
ongoing basis, if such Contributor fails to notify You of the
non-compliance by some reasonable means prior to 60 days after You have
come back into compliance. Moreover, Your grants from a particular
Contributor are reinstated on an ongoing basis if such Contributor
notifies You of the non-compliance by some reasonable means, this is the
first time You have received notice of non-compliance with this License
from such Contributor, and You become compliant prior to 30 days after
Your receipt of the notice.

5.2. If You initiate litigation against any entity by asserting a patent
infringement claim (excluding declaratory judgment actions,
counter-claims, and cross-claims) alleging that a Contributor Version
directly or indirectly infringes any patent, then the rights granted to
You by any and all Contributors for the Covered Software under Section
2.1 of this License shall terminate.

5.3. In the event of termination under Sections 5.1 or 5.2 above, all
end user license agreements (excluding distributors and resellers) which
have been validly granted by You or Your distributors under this License
prior to termination shall survive termination.

************************************************************************
*                                                                      *
*  6. Disclaimer of Warranty                                           *
*  -------------------------                                           *
*                                                                      *
*  Covered Software is provided under this License on an "as is"       *
*  basis, without warranty of any kind, either expressed, implied, or  *
*  statutory, including, without limitation, warranties that the       *
*  Covered Software is free of defects, merchantable, fit for a        *
*  particular purpose or non-infringing. The entire risk as to the     *
*  quality and performance of the Covered Software is with You.        *
*  Should any Covered Software prove defective in any respect, You     *
*  (not any Contributor) assume the cost of any necessary servicing,   *
*  repair, or correction. This disclaimer of warranty constitutes an   *
*  essential part of this License. No use of any Covered Software is   *
*  authorized under this License except under this disclaimer.         *
*                                                                      *
************************************************************************

************************************************************************
*                                                                      *
*  7. Limitation of Liability                                          *
*  --------------------------                                          *
*                                                                      *
*  Under no circumstances and under no legal theory, whether tort      *
*  (including negligence), contract, or otherwise, shall any           *
*  Contributor, or anyone who distributes Covered Software as          *
*  permitted above, be liable to You for any direct, indirect,         *
*  special, incidental, or consequential damages of any character      *
*  including, without limitation, damages for lost profits, loss of    *
*  goodwill, work stoppage, computer failure or malfunction, or any    *
*  and all other commercial damages or losses, even if such party      *
*  shall have been informed of the possibility of such damages. This   *
*  limitation of liability shall not apply to liability for death or   *
*  personal injury resulting from such party's negligence to the       *
*  extent applicable law prohibits such limitation. Some               *
*  jurisdictions do not allow the exclusion or limitation of           *
*  incidental or consequential damages, so this exclusion and          *
*  limitation may not apply to You.                                    *
*                                                                      *
************************************************************************

8. Litigation
-------------

Any litigation relating to this License may be brought only in the
courts of a jurisdiction where the defendant maintains its principal
place of business and such litigation shall be governed by laws of that
jurisdiction, without reference to its conflict-of-law provisions.
Nothing in this Section shall prevent a party's ability to bring
cross-claims or counter-claims.

9. Miscellaneous
----------------

This License represents the complete agreement concerning the subject
matter hereof. If any provision of this License is held to be
unenforceable, such provision shall be reformed only to the extent
necessary to make it enforceable. Any law or regulation which provides
that the language of a contract shall be construed against the drafter
shall not be used to construe this License against a Contributor.

10. Versions of the License
---------------------------

10.1. New Versions

Mozilla Foundation is the license steward. Except as provided in Section
10.3, no one other than the license steward has the right to modify or
publish new versions of this License. Each version will be given a
distinguishing version number.

10.2. Effect of New Versions

You may distribute the Covered Software under the terms of the version
of the License under which You originally received the Covered Software,
or under the terms of any subsequent version published by the license
steward.

10.3. Modified Versions

If you create software not governed by this License, and you want to
create a new license for such software, you may create and use a
modified version of this License if you rename the license and remove
any references to the name of the license steward (except to note that
such modified license differs from this License).

10.4. Distributing Source Code Form that is Incompatible With Secondary
Licenses

If You choose to distribute Source Code Form that is Incompatible With
Secondary Licenses under the terms of this version of the License, the
notice described in Exhibit B of this License must be attached.

Exhibit A - Source Code Form License Notice
-------------------------------------------

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

If it is not possible or desirable to put the notice in a particular
file, then You may include the notice in a location (such as a LICENSE
file in a relevant directory) where a recipient would be likely to look
for such a notice.

You may add additional accurate notices of copyright ownership.

Exhibit B - "Incompatible With Secondary Licenses" Notice
---------------------------------------------------------

  This Source Code Form is "Incompatible With Secondary Licenses", as
  defined by the Mozilla Public License, v. 2.0.
```

### L20

MIT OR Apache-2.0 · 3 archivos

```text
Apache License
                        Version 2.0, January 2004
                     https://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

   "License" shall mean the terms and conditions for use, reproduction,
   and distribution as defined by Sections 1 through 9 of this document.

   "Licensor" shall mean the copyright owner or entity authorized by
   the copyright owner that is granting the License.

   "Legal Entity" shall mean the union of the acting entity and all
   other entities that control, are controlled by, or are under common
   control with that entity. For the purposes of this definition,
   "control" means (i) the power, direct or indirect, to cause the
   direction or management of such entity, whether by contract or
   otherwise, or (ii) ownership of fifty percent (50%) or more of the
   outstanding shares, or (iii) beneficial ownership of such entity.

   "You" (or "Your") shall mean an individual or Legal Entity
   exercising permissions granted by this License.

   "Source" form shall mean the preferred form for making modifications,
   including but not limited to software source code, documentation
   source, and configuration files.

   "Object" form shall mean any form resulting from mechanical
   transformation or translation of a Source form, including but
   not limited to compiled object code, generated documentation,
   and conversions to other media types.

   "Work" shall mean the work of authorship, whether in Source or
   Object form, made available under the License, as indicated by a
   copyright notice that is included in or attached to the work
   (an example is provided in the Appendix below).

   "Derivative Works" shall mean any work, whether in Source or Object
   form, that is based on (or derived from) the Work and for which the
   editorial revisions, annotations, elaborations, or other modifications
   represent, as a whole, an original work of authorship. For the purposes
   of this License, Derivative Works shall not include works that remain
   separable from, or merely link (or bind by name) to the interfaces of,
   the Work and Derivative Works thereof.

   "Contribution" shall mean any work of authorship, including
   the original version of the Work and any modifications or additions
   to that Work or Derivative Works thereof, that is intentionally
   submitted to Licensor for inclusion in the Work by the copyright owner
   or by an individual or Legal Entity authorized to submit on behalf of
   the copyright owner. For the purposes of this definition, "submitted"
   means any form of electronic, verbal, or written communication sent
   to the Licensor or its representatives, including but not limited to
   communication on electronic mailing lists, source code control systems,
   and issue tracking systems that are managed by, or on behalf of, the
   Licensor for the purpose of discussing and improving the Work, but
   excluding communication that is conspicuously marked or otherwise
   designated in writing by the copyright owner as "Not a Contribution."

   "Contributor" shall mean Licensor and any individual or Legal Entity
   on behalf of whom a Contribution has been received by Licensor and
   subsequently incorporated within the Work.

2. Grant of Copyright License. Subject to the terms and conditions of
   this License, each Contributor hereby grants to You a perpetual,
   worldwide, non-exclusive, no-charge, royalty-free, irrevocable
   copyright license to reproduce, prepare Derivative Works of,
   publicly display, publicly perform, sublicense, and distribute the
   Work and such Derivative Works in Source or Object form.

3. Grant of Patent License. Subject to the terms and conditions of
   this License, each Contributor hereby grants to You a perpetual,
   worldwide, non-exclusive, no-charge, royalty-free, irrevocable
   (except as stated in this section) patent license to make, have made,
   use, offer to sell, sell, import, and otherwise transfer the Work,
   where such license applies only to those patent claims licensable
   by such Contributor that are necessarily infringed by their
   Contribution(s) alone or by combination of their Contribution(s)
   with the Work to which such Contribution(s) was submitted. If You
   institute patent litigation against any entity (including a
   cross-claim or counterclaim in a lawsuit) alleging that the Work
   or a Contribution incorporated within the Work constitutes direct
   or contributory patent infringement, then any patent licenses
   granted to You under this License for that Work shall terminate
   as of the date such litigation is filed.

4. Redistribution. You may reproduce and distribute copies of the
   Work or Derivative Works thereof in any medium, with or without
   modifications, and in Source or Object form, provided that You
   meet the following conditions:

   (a) You must give any other recipients of the Work or
       Derivative Works a copy of this License; and

   (b) You must cause any modified files to carry prominent notices
       stating that You changed the files; and

   (c) You must retain, in the Source form of any Derivative Works
       that You distribute, all copyright, patent, trademark, and
       attribution notices from the Source form of the Work,
       excluding those notices that do not pertain to any part of
       the Derivative Works; and

   (d) If the Work includes a "NOTICE" text file as part of its
       distribution, then any Derivative Works that You distribute must
       include a readable copy of the attribution notices contained
       within such NOTICE file, excluding those notices that do not
       pertain to any part of the Derivative Works, in at least one
       of the following places: within a NOTICE text file distributed
       as part of the Derivative Works; within the Source form or
       documentation, if provided along with the Derivative Works; or,
       within a display generated by the Derivative Works, if and
       wherever such third-party notices normally appear. The contents
       of the NOTICE file are for informational purposes only and
       do not modify the License. You may add Your own attribution
       notices within Derivative Works that You distribute, alongside
       or as an addendum to the NOTICE text from the Work, provided
       that such additional attribution notices cannot be construed
       as modifying the License.

   You may add Your own copyright statement to Your modifications and
   may provide additional or different license terms and conditions
   for use, reproduction, or distribution of Your modifications, or
   for any such Derivative Works as a whole, provided Your use,
   reproduction, and distribution of the Work otherwise complies with
   the conditions stated in this License.

5. Submission of Contributions. Unless You explicitly state otherwise,
   any Contribution intentionally submitted for inclusion in the Work
   by You to the Licensor shall be under the terms and conditions of
   this License, without any additional terms or conditions.
   Notwithstanding the above, nothing herein shall supersede or modify
   the terms of any separate license agreement you may have executed
   with Licensor regarding such Contributions.

6. Trademarks. This License does not grant permission to use the trade
   names, trademarks, service marks, or product names of the Licensor,
   except as required for reasonable and customary use in describing the
   origin of the Work and reproducing the content of the NOTICE file.

7. Disclaimer of Warranty. Unless required by applicable law or
   agreed to in writing, Licensor provides the Work (and each
   Contributor provides its Contributions) on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
   implied, including, without limitation, any warranties or conditions
   of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
   PARTICULAR PURPOSE. You are solely responsible for determining the
   appropriateness of using or redistributing the Work and assume any
   risks associated with Your exercise of permissions under this License.

8. Limitation of Liability. In no event and under no legal theory,
   whether in tort (including negligence), contract, or otherwise,
   unless required by applicable law (such as deliberate and grossly
   negligent acts) or agreed to in writing, shall any Contributor be
   liable to You for damages, including any direct, indirect, special,
   incidental, or consequential damages of any character arising as a
   result of this License or out of the use or inability to use the
   Work (including but not limited to damages for loss of goodwill,
   work stoppage, computer failure or malfunction, or any and all
   other commercial damages or losses), even if such Contributor
   has been advised of the possibility of such damages.

9. Accepting Warranty or Additional Liability. While redistributing
   the Work or Derivative Works thereof, You may choose to offer,
   and charge a fee for, acceptance of support, warranty, indemnity,
   or other liability obligations and/or rights consistent with this
   License. However, in accepting such obligations, You may act only
   on Your own behalf and on Your sole responsibility, not on behalf
   of any other Contributor, and only if You agree to indemnify,
   defend, and hold each Contributor harmless for any liability
   incurred by, or claims asserted against, such Contributor by reason
   of your accepting any such warranty or additional liability.

END OF TERMS AND CONDITIONS

APPENDIX: How to apply the Apache License to your work.

   To apply the Apache License to your work, attach the following
   boilerplate notice, with the fields enclosed by brackets "[]"
   replaced with your own identifying information. (Don't include
   the brackets!)  The text should be enclosed in the appropriate
   comment syntax for the file format. We also recommend that a
   file or class name and description of purpose be included on the
   same "printed page" as the copyright notice for easier
   identification within third-party archives.

Copyright [yyyy] [name of copyright owner]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

### L21

ISC · 2 archivos

```text
The ISC License

Copyright (c) Isaac Z. Schlueter and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### L22

BSD-3-Clause · 2 archivos

```text
Copyright 2008 Fair Oaks Labs, Inc.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### L23

ISC / CC0-1.0 OR MIT-0 OR Apache-2.0 · 2 archivos

```text
Creative Commons Legal Code

CC0 1.0 Universal

    CREATIVE COMMONS CORPORATION IS NOT A LAW FIRM AND DOES NOT PROVIDE
    LEGAL SERVICES. DISTRIBUTION OF THIS DOCUMENT DOES NOT CREATE AN
    ATTORNEY-CLIENT RELATIONSHIP. CREATIVE COMMONS PROVIDES THIS
    INFORMATION ON AN "AS-IS" BASIS. CREATIVE COMMONS MAKES NO WARRANTIES
    REGARDING THE USE OF THIS DOCUMENT OR THE INFORMATION OR WORKS
    PROVIDED HEREUNDER, AND DISCLAIMS LIABILITY FOR DAMAGES RESULTING FROM
    THE USE OF THIS DOCUMENT OR THE INFORMATION OR WORKS PROVIDED
    HEREUNDER.

Statement of Purpose

The laws of most jurisdictions throughout the world automatically confer
exclusive Copyright and Related Rights (defined below) upon the creator
and subsequent owner(s) (each and all, an "owner") of an original work of
authorship and/or a database (each, a "Work").

Certain owners wish to permanently relinquish those rights to a Work for
the purpose of contributing to a commons of creative, cultural and
scientific works ("Commons") that the public can reliably and without fear
of later claims of infringement build upon, modify, incorporate in other
works, reuse and redistribute as freely as possible in any form whatsoever
and for any purposes, including without limitation commercial purposes.
These owners may contribute to the Commons to promote the ideal of a free
culture and the further production of creative, cultural and scientific
works, or to gain reputation or greater distribution for their Work in
part through the use and efforts of others.

For these and/or other purposes and motivations, and without any
expectation of additional consideration or compensation, the person
associating CC0 with a Work (the "Affirmer"), to the extent that he or she
is an owner of Copyright and Related Rights in the Work, voluntarily
elects to apply CC0 to the Work and publicly distribute the Work under its
terms, with knowledge of his or her Copyright and Related Rights in the
Work and the meaning and intended legal effect of CC0 on those rights.

1. Copyright and Related Rights. A Work made available under CC0 may be
protected by copyright and related or neighboring rights ("Copyright and
Related Rights"). Copyright and Related Rights include, but are not
limited to, the following:

  i. the right to reproduce, adapt, distribute, perform, display,
     communicate, and translate a Work;
 ii. moral rights retained by the original author(s) and/or performer(s);
iii. publicity and privacy rights pertaining to a person's image or
     likeness depicted in a Work;
 iv. rights protecting against unfair competition in regards to a Work,
     subject to the limitations in paragraph 4(a), below;
  v. rights protecting the extraction, dissemination, use and reuse of data
     in a Work;
 vi. database rights (such as those arising under Directive 96/9/EC of the
     European Parliament and of the Council of 11 March 1996 on the legal
     protection of databases, and under any national implementation
     thereof, including any amended or successor version of such
     directive); and
vii. other similar, equivalent or corresponding rights throughout the
     world based on applicable law or treaty, and any national
     implementations thereof.

2. Waiver. To the greatest extent permitted by, but not in contravention
of, applicable law, Affirmer hereby overtly, fully, permanently,
irrevocably and unconditionally waives, abandons, and surrenders all of
Affirmer's Copyright and Related Rights and associated claims and causes
of action, whether now known or unknown (including existing as well as
future claims and causes of action), in the Work (i) in all territories
worldwide, (ii) for the maximum duration provided by applicable law or
treaty (including future time extensions), (iii) in any current or future
medium and for any number of copies, and (iv) for any purpose whatsoever,
including without limitation commercial, advertising or promotional
purposes (the "Waiver"). Affirmer makes the Waiver for the benefit of each
member of the public at large and to the detriment of Affirmer's heirs and
successors, fully intending that such Waiver shall not be subject to
revocation, rescission, cancellation, termination, or any other legal or
equitable action to disrupt the quiet enjoyment of the Work by the public
as contemplated by Affirmer's express Statement of Purpose.

3. Public License Fallback. Should any part of the Waiver for any reason
be judged legally invalid or ineffective under applicable law, then the
Waiver shall be preserved to the maximum extent permitted taking into
account Affirmer's express Statement of Purpose. In addition, to the
extent the Waiver is so judged Affirmer hereby grants to each affected
person a royalty-free, non transferable, non sublicensable, non exclusive,
irrevocable and unconditional license to exercise Affirmer's Copyright and
Related Rights in the Work (i) in all territories worldwide, (ii) for the
maximum duration provided by applicable law or treaty (including future
time extensions), (iii) in any current or future medium and for any number
of copies, and (iv) for any purpose whatsoever, including without
limitation commercial, advertising or promotional purposes (the
"License"). The License shall be deemed effective as of the date CC0 was
applied by Affirmer to the Work. Should any part of the License for any
reason be judged legally invalid or ineffective under applicable law, such
partial invalidity or ineffectiveness shall not invalidate the remainder
of the License, and in such case Affirmer hereby affirms that he or she
will not (i) exercise any of his or her remaining Copyright and Related
Rights in the Work or (ii) assert any associated claims and causes of
action with respect to the Work, in either case contrary to Affirmer's
express Statement of Purpose.

4. Limitations and Disclaimers.

 a. No trademark or patent rights held by Affirmer are waived, abandoned,
    surrendered, licensed or otherwise affected by this document.
 b. Affirmer offers the Work as-is and makes no representations or
    warranties of any kind concerning the Work, express, implied,
    statutory or otherwise, including without limitation warranties of
    title, merchantability, fitness for a particular purpose, non
    infringement, or the absence of latent or other defects, accuracy, or
    the present or absence of errors, whether or not discoverable, all to
    the greatest extent permissible under applicable law.
 c. Affirmer disclaims responsibility for clearing rights of other persons
    that may apply to the Work or any use thereof, including without
    limitation any person's Copyright and Related Rights in the Work.
    Further, Affirmer disclaims responsibility for obtaining any necessary
    consents, permissions or other rights required for any use of the
    Work.
 d. Affirmer understands and acknowledges that Creative Commons is not a
    party to this document and has no duty or obligation with respect to
    this CC0 or use of the Work.
```

### L24

MIT / MIT License · 2 archivos

```text
Copyright (c) 2011 Einar Otto Stangvik <einaros@gmail.com>
Copyright (c) 2013 Arnout Kazemier and contributors
Copyright (c) 2016 Luigi Pinca and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### L25

0BSD OR MIT OR Apache-2.0 / MIT OR Apache-2.0 · 2 archivos

```text
Apache License
                        Version 2.0, January 2004
                     https://www.apache.org/licenses/LICENSE-2.0

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

   "License" shall mean the terms and conditions for use, reproduction,
   and distribution as defined by Sections 1 through 9 of this document.

   "Licensor" shall mean the copyright owner or entity authorized by
   the copyright owner that is granting the License.

   "Legal Entity" shall mean the union of the acting entity and all
   other entities that control, are controlled by, or are under common
   control with that entity. For the purposes of this definition,
   "control" means (i) the power, direct or indirect, to cause the
   direction or management of such entity, whether by contract or
   otherwise, or (ii) ownership of fifty percent (50%) or more of the
   outstanding shares, or (iii) beneficial ownership of such entity.

   "You" (or "Your") shall mean an individual or Legal Entity
   exercising permissions granted by this License.

   "Source" form shall mean the preferred form for making modifications,
   including but not limited to software source code, documentation
   source, and configuration files.

   "Object" form shall mean any form resulting from mechanical
   transformation or translation of a Source form, including but
   not limited to compiled object code, generated documentation,
   and conversions to other media types.

   "Work" shall mean the work of authorship, whether in Source or
   Object form, made available under the License, as indicated by a
   copyright notice that is included in or attached to the work
   (an example is provided in the Appendix below).

   "Derivative Works" shall mean any work, whether in Source or Object
   form, that is based on (or derived from) the Work and for which the
   editorial revisions, annotations, elaborations, or other modifications
   represent, as a whole, an original work of authorship. For the purposes
   of this License, Derivative Works shall not include works that remain
   separable from, or merely link (or bind by name) to the interfaces of,
   the Work and Derivative Works thereof.

   "Contribution" shall mean any work of authorship, including
   the original version of the Work and any modifications or additions
   to that Work or Derivative Works thereof, that is intentionally
   submitted to Licensor for inclusion in the Work by the copyright owner
   or by an individual or Legal Entity authorized to submit on behalf of
   the copyright owner. For the purposes of this definition, "submitted"
   means any form of electronic, verbal, or written communication sent
   to the Licensor or its representatives, including but not limited to
   communication on electronic mailing lists, source code control systems,
   and issue tracking systems that are managed by, or on behalf of, the
   Licensor for the purpose of discussing and improving the Work, but
   excluding communication that is conspicuously marked or otherwise
   designated in writing by the copyright owner as "Not a Contribution."

   "Contributor" shall mean Licensor and any individual or Legal Entity
   on behalf of whom a Contribution has been received by Licensor and
   subsequently incorporated within the Work.

2. Grant of Copyright License. Subject to the terms and conditions of
   this License, each Contributor hereby grants to You a perpetual,
   worldwide, non-exclusive, no-charge, royalty-free, irrevocable
   copyright license to reproduce, prepare Derivative Works of,
   publicly display, publicly perform, sublicense, and distribute the
   Work and such Derivative Works in Source or Object form.

3. Grant of Patent License. Subject to the terms and conditions of
   this License, each Contributor hereby grants to You a perpetual,
   worldwide, non-exclusive, no-charge, royalty-free, irrevocable
   (except as stated in this section) patent license to make, have made,
   use, offer to sell, sell, import, and otherwise transfer the Work,
   where such license applies only to those patent claims licensable
   by such Contributor that are necessarily infringed by their
   Contribution(s) alone or by combination of their Contribution(s)
   with the Work to which such Contribution(s) was submitted. If You
   institute patent litigation against any entity (including a
   cross-claim or counterclaim in a lawsuit) alleging that the Work
   or a Contribution incorporated within the Work constitutes direct
   or contributory patent infringement, then any patent licenses
   granted to You under this License for that Work shall terminate
   as of the date such litigation is filed.

4. Redistribution. You may reproduce and distribute copies of the
   Work or Derivative Works thereof in any medium, with or without
   modifications, and in Source or Object form, provided that You
   meet the following conditions:

   (a) You must give any other recipients of the Work or
       Derivative Works a copy of this License; and

   (b) You must cause any modified files to carry prominent notices
       stating that You changed the files; and

   (c) You must retain, in the Source form of any Derivative Works
       that You distribute, all copyright, patent, trademark, and
       attribution notices from the Source form of the Work,
       excluding those notices that do not pertain to any part of
       the Derivative Works; and

   (d) If the Work includes a "NOTICE" text file as part of its
       distribution, then any Derivative Works that You distribute must
       include a readable copy of the attribution notices contained
       within such NOTICE file, excluding those notices that do not
       pertain to any part of the Derivative Works, in at least one
       of the following places: within a NOTICE text file distributed
       as part of the Derivative Works; within the Source form or
       documentation, if provided along with the Derivative Works; or,
       within a display generated by the Derivative Works, if and
       wherever such third-party notices normally appear. The contents
       of the NOTICE file are for informational purposes only and
       do not modify the License. You may add Your own attribution
       notices within Derivative Works that You distribute, alongside
       or as an addendum to the NOTICE text from the Work, provided
       that such additional attribution notices cannot be construed
       as modifying the License.

   You may add Your own copyright statement to Your modifications and
   may provide additional or different license terms and conditions
   for use, reproduction, or distribution of Your modifications, or
   for any such Derivative Works as a whole, provided Your use,
   reproduction, and distribution of the Work otherwise complies with
   the conditions stated in this License.

5. Submission of Contributions. Unless You explicitly state otherwise,
   any Contribution intentionally submitted for inclusion in the Work
   by You to the Licensor shall be under the terms and conditions of
   this License, without any additional terms or conditions.
   Notwithstanding the above, nothing herein shall supersede or modify
   the terms of any separate license agreement you may have executed
   with Licensor regarding such Contributions.

6. Trademarks. This License does not grant permission to use the trade
   names, trademarks, service marks, or product names of the Licensor,
   except as required for reasonable and customary use in describing the
   origin of the Work and reproducing the content of the NOTICE file.

7. Disclaimer of Warranty. Unless required by applicable law or
   agreed to in writing, Licensor provides the Work (and each
   Contributor provides its Contributions) on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
   implied, including, without limitation, any warranties or conditions
   of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
   PARTICULAR PURPOSE. You are solely responsible for determining the
   appropriateness of using or redistributing the Work and assume any
   risks associated with Your exercise of permissions under this License.

8. Limitation of Liability. In no event and under no legal theory,
   whether in tort (including negligence), contract, or otherwise,
   unless required by applicable law (such as deliberate and grossly
   negligent acts) or agreed to in writing, shall any Contributor be
   liable to You for damages, including any direct, indirect, special,
   incidental, or consequential damages of any character arising as a
   result of this License or out of the use or inability to use the
   Work (including but not limited to damages for loss of goodwill,
   work stoppage, computer failure or malfunction, or any and all
   other commercial damages or losses), even if such Contributor
   has been advised of the possibility of such damages.

9. Accepting Warranty or Additional Liability. While redistributing
   the Work or Derivative Works thereof, You may choose to offer,
   and charge a fee for, acceptance of support, warranty, indemnity,
   or other liability obligations and/or rights consistent with this
   License. However, in accepting such obligations, You may act only
   on Your own behalf and on Your sole responsibility, not on behalf
   of any other Contributor, and only if You agree to indemnify,
   defend, and hold each Contributor harmless for any liability
   incurred by, or claims asserted against, such Contributor by reason
   of your accepting any such warranty or additional liability.

END OF TERMS AND CONDITIONS

APPENDIX: How to apply the Apache License to your work.

   To apply the Apache License to your work, attach the following
   boilerplate notice, with the fields enclosed by brackets "[]"
   replaced with your own identifying information. (Don't include
   the brackets!)  The text should be enclosed in the appropriate
   comment syntax for the file format. We also recommend that a
   file or class name and description of purpose be included on the
   same "printed page" as the copyright notice for easier
   identification within third-party archives.

Copyright [yyyy] [name of copyright owner]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

### L26

MIT OR Apache-2.0 · 2 archivos

```text
Apache License
                        Version 2.0, January 2004
                     http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

   "License" shall mean the terms and conditions for use, reproduction,
   and distribution as defined by Sections 1 through 9 of this document.

   "Licensor" shall mean the copyright owner or entity authorized by
   the copyright owner that is granting the License.

   "Legal Entity" shall mean the union of the acting entity and all
   other entities that control, are controlled by, or are under common
   control with that entity. For the purposes of this definition,
   "control" means (i) the power, direct or indirect, to cause the
   direction or management of such entity, whether by contract or
   otherwise, or (ii) ownership of fifty percent (50%) or more of the
   outstanding shares, or (iii) beneficial ownership of such entity.

   "You" (or "Your") shall mean an individual or Legal Entity
   exercising permissions granted by this License.

   "Source" form shall mean the preferred form for making modifications,
   including but not limited to software source code, documentation
   source, and configuration files.

   "Object" form shall mean any form resulting from mechanical
   transformation or translation of a Source form, including but
   not limited to compiled object code, generated documentation,
   and conversions to other media types.

   "Work" shall mean the work of authorship, whether in Source or
   Object form, made available under the License, as indicated by a
   copyright notice that is included in or attached to the work
   (an example is provided in the Appendix below).

   "Derivative Works" shall mean any work, whether in Source or Object
   form, that is based on (or derived from) the Work and for which the
   editorial revisions, annotations, elaborations, or other modifications
   represent, as a whole, an original work of authorship. For the purposes
   of this License, Derivative Works shall not include works that remain
   separable from, or merely link (or bind by name) to the interfaces of,
   the Work and Derivative Works thereof.

   "Contribution" shall mean any work of authorship, including
   the original version of the Work and any modifications or additions
   to that Work or Derivative Works thereof, that is intentionally
   submitted to Licensor for inclusion in the Work by the copyright owner
   or by an individual or Legal Entity authorized to submit on behalf of
   the copyright owner. For the purposes of this definition, "submitted"
   means any form of electronic, verbal, or written communication sent
   to the Licensor or its representatives, including but not limited to
   communication on electronic mailing lists, source code control systems,
   and issue tracking systems that are managed by, or on behalf of, the
   Licensor for the purpose of discussing and improving the Work, but
   excluding communication that is conspicuously marked or otherwise
   designated in writing by the copyright owner as "Not a Contribution."

   "Contributor" shall mean Licensor and any individual or Legal Entity
   on behalf of whom a Contribution has been received by Licensor and
   subsequently incorporated within the Work.

2. Grant of Copyright License. Subject to the terms and conditions of
   this License, each Contributor hereby grants to You a perpetual,
   worldwide, non-exclusive, no-charge, royalty-free, irrevocable
   copyright license to reproduce, prepare Derivative Works of,
   publicly display, publicly perform, sublicense, and distribute the
   Work and such Derivative Works in Source or Object form.

3. Grant of Patent License. Subject to the terms and conditions of
   this License, each Contributor hereby grants to You a perpetual,
   worldwide, non-exclusive, no-charge, royalty-free, irrevocable
   (except as stated in this section) patent license to make, have made,
   use, offer to sell, sell, import, and otherwise transfer the Work,
   where such license applies only to those patent claims licensable
   by such Contributor that are necessarily infringed by their
   Contribution(s) alone or by combination of their Contribution(s)
   with the Work to which such Contribution(s) was submitted. If You
   institute patent litigation against any entity (including a
   cross-claim or counterclaim in a lawsuit) alleging that the Work
   or a Contribution incorporated within the Work constitutes direct
   or contributory patent infringement, then any patent licenses
   granted to You under this License for that Work shall terminate
   as of the date such litigation is filed.

4. Redistribution. You may reproduce and distribute copies of the
   Work or Derivative Works thereof in any medium, with or without
   modifications, and in Source or Object form, provided that You
   meet the following conditions:

   (a) You must give any other recipients of the Work or
       Derivative Works a copy of this License; and

   (b) You must cause any modified files to carry prominent notices
       stating that You changed the files; and

   (c) You must retain, in the Source form of any Derivative Works
       that You distribute, all copyright, patent, trademark, and
       attribution notices from the Source form of the Work,
       excluding those notices that do not pertain to any part of
       the Derivative Works; and

   (d) If the Work includes a "NOTICE" text file as part of its
       distribution, then any Derivative Works that You distribute must
       include a readable copy of the attribution notices contained
       within such NOTICE file, excluding those notices that do not
       pertain to any part of the Derivative Works, in at least one
       of the following places: within a NOTICE text file distributed
       as part of the Derivative Works; within the Source form or
       documentation, if provided along with the Derivative Works; or,
       within a display generated by the Derivative Works, if and
       wherever such third-party notices normally appear. The contents
       of the NOTICE file are for informational purposes only and
       do not modify the License. You may add Your own attribution
       notices within Derivative Works that You distribute, alongside
       or as an addendum to the NOTICE text from the Work, provided
       that such additional attribution notices cannot be construed
       as modifying the License.

   You may add Your own copyright statement to Your modifications and
   may provide additional or different license terms and conditions
   for use, reproduction, or distribution of Your modifications, or
   for any such Derivative Works as a whole, provided Your use,
   reproduction, and distribution of the Work otherwise complies with
   the conditions stated in this License.

5. Submission of Contributions. Unless You explicitly state otherwise,
   any Contribution intentionally submitted for inclusion in the Work
   by You to the Licensor shall be under the terms and conditions of
   this License, without any additional terms or conditions.
   Notwithstanding the above, nothing herein shall supersede or modify
   the terms of any separate license agreement you may have executed
   with Licensor regarding such Contributions.

6. Trademarks. This License does not grant permission to use the trade
   names, trademarks, service marks, or product names of the Licensor,
   except as required for reasonable and customary use in describing the
   origin of the Work and reproducing the content of the NOTICE file.

7. Disclaimer of Warranty. Unless required by applicable law or
   agreed to in writing, Licensor provides the Work (and each
   Contributor provides its Contributions) on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
   implied, including, without limitation, any warranties or conditions
   of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
   PARTICULAR PURPOSE. You are solely responsible for determining the
   appropriateness of using or redistributing the Work and assume any
   risks associated with Your exercise of permissions under this License.

8. Limitation of Liability. In no event and under no legal theory,
   whether in tort (including negligence), contract, or otherwise,
   unless required by applicable law (such as deliberate and grossly
   negligent acts) or agreed to in writing, shall any Contributor be
   liable to You for damages, including any direct, indirect, special,
   incidental, or consequential damages of any character arising as a
   result of this License or out of the use or inability to use the
   Work (including but not limited to damages for loss of goodwill,
   work stoppage, computer failure or malfunction, or any and all
   other commercial damages or losses), even if such Contributor
   has been advised of the possibility of such damages.

9. Accepting Warranty or Additional Liability. While redistributing
   the Work or Derivative Works thereof, You may choose to offer,
   and charge a fee for, acceptance of support, warranty, indemnity,
   or other liability obligations and/or rights consistent with this
   License. However, in accepting such obligations, You may act only
   on Your own behalf and on Your sole responsibility, not on behalf
   of any other Contributor, and only if You agree to indemnify,
   defend, and hold each Contributor harmless for any liability
   incurred by, or claims asserted against, such Contributor by reason
   of your accepting any such warranty or additional liability.
```

### L27

Apache-2.0 OR ISC OR MIT · 2 archivos

```text
ISC License (ISC)
Copyright (c) 2016, Joseph Birr-Pixton <jpixton@gmail.com>

Permission to use, copy, modify, and/or distribute this software for
any purpose with or without fee is hereby granted, provided that the
above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL
WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE
AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL
DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR
PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS
ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
```

### L28

Python Software Foundation License · 2 archivos

```text
The STIX fonts distributed with matplotlib have been modified from
their canonical form.  They have been converted from OTF to TTF format
using Fontforge and this script:

  #!/usr/bin/env fontforge
  i=1
  while ( i<$argc )
    Open($argv[i])
    Generate($argv[i]:r + ".ttf")
    i = i+1
  endloop

The original STIX Font License begins below.

-----------------------------------------------------------

STIX Font License

24 May 2010

Copyright (c) 2001-2010 by the STI Pub Companies, consisting of the American
Institute of Physics, the American Chemical Society, the American Mathematical
Society, the American Physical Society, Elsevier, Inc., and The Institute of
Electrical and Electronic Engineers, Inc. (www.stixfonts.org), with Reserved
Font Name STIX Fonts, STIX Fonts (TM) is a  trademark of The Institute of
Electrical and Electronics Engineers, Inc.

Portions copyright (c) 1998-2003 by MicroPress, Inc. (www.micropress-inc.com),
with Reserved Font Name TM Math. To obtain additional mathematical fonts, please
contact MicroPress, Inc., 68-30 Harrow Street, Forest Hills, NY 11375, USA,
Phone: (718) 575-1816.

Portions copyright (c) 1990 by Elsevier, Inc.

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
https://scripts.sil.org/OFL

-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

### L29

BSD License · 2 archivos

```text
BSD 3-Clause License

Copyright (c) 2008-2011, AQR Capital Management, LLC, Lambda Foundry, Inc. and PyData Development Team
All rights reserved.

Copyright (c) 2011-2023, Open source contributors.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of the copyright holder nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### L30

MIT · 1 archivo

```text
#Copyright (c) 2014-2018 Calvin Metcalf, Jordan Harband

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

**THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.**
```

### L31

Apache-2.0 · 1 archivo

```text
Copyright (c) 2017 Dailymotion (http://www.dailymotion.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

src/remux/mp4-generator.js and src/demux/exp-golomb.ts implementation in this project
are derived from the HLS library for video.js (https://github.com/videojs/videojs-contrib-hls)

That work is also covered by the Apache 2 License, following copyright:
Copyright (c) 2013-2015 Brightcove

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### L32

MIT · 1 archivo

```text
The MIT License

Copyright (c) 2010-2012 Tween.js authors.

Easing equations Copyright (c) 2001 Robert Penner http://robertpenner.com/easing/

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### L33

ISC · 1 archivo

```text
ISC License

Copyright (c) 2018, Mapbox

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
```

### L34

Apache-2.0 OR MIT · 1 archivo

```text
SPDXVersion: SPDX-2.1
DataLicense: CC0-1.0
PackageName: tauri
DataFormat: SPDXRef-1
PackageSupplier: Organization: The Tauri Programme in the Commons Conservancy
PackageHomePage: https://tauri.app
PackageLicenseDeclared: Apache-2.0
PackageLicenseDeclared: MIT
PackageCopyrightText: 2019-2025, The Tauri Programme in the Commons Conservancy
PackageSummary: <text>Tauri is a rust project that enables developers to make secure
and small desktop applications using a web frontend.
                </text>
PackageComment: <text>The package includes the following libraries; see
Relationship information.
                </text>
Created: 2019-05-20T09:00:00Z
PackageDownloadLocation: git://github.com/tauri-apps/tauri
PackageDownloadLocation: git+https://github.com/tauri-apps/tauri.git
PackageDownloadLocation: git+ssh://github.com/tauri-apps/tauri.git
Creator: Person: Daniel Thompson-Yvetot
```

### L35

MIT · 1 archivo

```text
(The MIT license)

Copyright (c) 2015 Titus Wormer <tituswormer@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### L36

ISC · 1 archivo

```text
ISC License

Copyright (c) 2021, Andrea Giammarchi, @WebReflection

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
```

### L37

MIT · 1 archivo

```text
The MIT Expat Licence.

Copyright (c) 2020 Michael Mclaughlin

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### L38

BSD-3-Clause · 1 archivo

```text
Copyright 2010-2021 Mike Bostock
Copyright 2001 Robert Penner
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of the author nor the names of contributors may be used to
  endorse or promote products derived from this software without specific prior
  written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### L39

BSD-2-Clause · 1 archivo

```text
Copyright (c) Felix Böhm
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### L40

ISC · 1 archivo

```text
(ISC License)

Copyright (c) Keith McKnight <keith@mcknig.ht>

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
```

### L41

0BSD OR MIT OR Apache-2.0 · 1 archivo

```text
Copyright (C) Jonas Schievink <jonasschievink@gmail.com>

Permission to use, copy, modify, and/or distribute this software for
any purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN
AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT
OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### L42

Apache-2.0 OR MIT · 1 archivo

```text
===============================================================================

Copyright (c) 2016 Alex Crichton
Copyright (c) 2017 The Tokio Authors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

===============================================================================

Copyright (c) 2016 Alex Crichton
Copyright (c) 2017 The Tokio Authors

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```

### L43

Apache-2.0 OR MIT · 1 archivo

```text
© Kornel Lesiński

                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

----

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```

### L44

MIT OR Apache-2.0 · 1 archivo

```text
Rust-chrono is dual-licensed under The MIT License [1] and
Apache 2.0 License [2]. Copyright (c) 2014--2026, Kang Seonghoon and
contributors.

Nota Bene: This is same as the Rust Project's own license.

[1]: <http://opensource.org/licenses/MIT>, which is reproduced below:

~~~~
The MIT License (MIT)

Copyright (c) 2014, Kang Seonghoon.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
~~~~

[2]: <http://www.apache.org/licenses/LICENSE-2.0>, which is reproduced below:

~~~~
                              Apache License
                        Version 2.0, January 2004
                     http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

   "License" shall mean the terms and conditions for use, reproduction,
   and distribution as defined by Sections 1 through 9 of this document.

   "Licensor" shall mean the copyright owner or entity authorized by
   the copyright owner that is granting the License.

   "Legal Entity" shall mean the union of the acting entity and all
   other entities that control, are controlled by, or are under common
   control with that entity. For the purposes of this definition,
   "control" means (i) the power, direct or indirect, to cause the
   direction or management of such entity, whether by contract or
   otherwise, or (ii) ownership of fifty percent (50%) or more of the
   outstanding shares, or (iii) beneficial ownership of such entity.

   "You" (or "Your") shall mean an individual or Legal Entity
   exercising permissions granted by this License.

   "Source" form shall mean the preferred form for making modifications,
   including but not limited to software source code, documentation
   source, and configuration files.

   "Object" form shall mean any form resulting from mechanical
   transformation or translation of a Source form, including but
   not limited to compiled object code, generated documentation,
   and conversions to other media types.

   "Work" shall mean the work of authorship, whether in Source or
   Object form, made available under the License, as indicated by a
   copyright notice that is included in or attached to the work
   (an example is provided in the Appendix below).

   "Derivative Works" shall mean any work, whether in Source or Object
   form, that is based on (or derived from) the Work and for which the
   editorial revisions, annotations, elaborations, or other modifications
   represent, as a whole, an original work of authorship. For the purposes
   of this License, Derivative Works shall not include works that remain
   separable from, or merely link (or bind by name) to the interfaces of,
   the Work and Derivative Works thereof.

   "Contribution" shall mean any work of authorship, including
   the original version of the Work and any modifications or additions
   to that Work or Derivative Works thereof, that is intentionally
   submitted to Licensor for inclusion in the Work by the copyright owner
   or by an individual or Legal Entity authorized to submit on behalf of
   the copyright owner. For the purposes of this definition, "submitted"
   means any form of electronic, verbal, or written communication sent
   to the Licensor or its representatives, including but not limited to
   communication on electronic mailing lists, source code control systems,
   and issue tracking systems that are managed by, or on behalf of, the
   Licensor for the purpose of discussing and improving the Work, but
   excluding communication that is conspicuously marked or otherwise
   designated in writing by the copyright owner as "Not a Contribution."

   "Contributor" shall mean Licensor and any individual or Legal Entity
   on behalf of whom a Contribution has been received by Licensor and
   subsequently incorporated within the Work.

2. Grant of Copyright License. Subject to the terms and conditions of
   this License, each Contributor hereby grants to You a perpetual,
   worldwide, non-exclusive, no-charge, royalty-free, irrevocable
   copyright license to reproduce, prepare Derivative Works of,
   publicly display, publicly perform, sublicense, and distribute the
   Work and such Derivative Works in Source or Object form.

3. Grant of Patent License. Subject to the terms and conditions of
   this License, each Contributor hereby grants to You a perpetual,
   worldwide, non-exclusive, no-charge, royalty-free, irrevocable
   (except as stated in this section) patent license to make, have made,
   use, offer to sell, sell, import, and otherwise transfer the Work,
   where such license applies only to those patent claims licensable
   by such Contributor that are necessarily infringed by their
   Contribution(s) alone or by combination of their Contribution(s)
   with the Work to which such Contribution(s) was submitted. If You
   institute patent litigation against any entity (including a
   cross-claim or counterclaim in a lawsuit) alleging that the Work
   or a Contribution incorporated within the Work constitutes direct
   or contributory patent infringement, then any patent licenses
   granted to You under this License for that Work shall terminate
   as of the date such litigation is filed.

4. Redistribution. You may reproduce and distribute copies of the
   Work or Derivative Works thereof in any medium, with or without
   modifications, and in Source or Object form, provided that You
   meet the following conditions:

   (a) You must give any other recipients of the Work or
       Derivative Works a copy of this License; and

   (b) You must cause any modified files to carry prominent notices
       stating that You changed the files; and

   (c) You must retain, in the Source form of any Derivative Works
       that You distribute, all copyright, patent, trademark, and
       attribution notices from the Source form of the Work,
       excluding those notices that do not pertain to any part of
       the Derivative Works; and

   (d) If the Work includes a "NOTICE" text file as part of its
       distribution, then any Derivative Works that You distribute must
       include a readable copy of the attribution notices contained
       within such NOTICE file, excluding those notices that do not
       pertain to any part of the Derivative Works, in at least one
       of the following places: within a NOTICE text file distributed
       as part of the Derivative Works; within the Source form or
       documentation, if provided along with the Derivative Works; or,
       within a display generated by the Derivative Works, if and
       wherever such third-party notices normally appear. The contents
       of the NOTICE file are for informational purposes only and
       do not modify the License. You may add Your own attribution
       notices within Derivative Works that You distribute, alongside
       or as an addendum to the NOTICE text from the Work, provided
       that such additional attribution notices cannot be construed
       as modifying the License.

   You may add Your own copyright statement to Your modifications and
   may provide additional or different license terms and conditions
   for use, reproduction, or distribution of Your modifications, or
   for any such Derivative Works as a whole, provided Your use,
   reproduction, and distribution of the Work otherwise complies with
   the conditions stated in this License.

5. Submission of Contributions. Unless You explicitly state otherwise,
   any Contribution intentionally submitted for inclusion in the Work
   by You to the Licensor shall be under the terms and conditions of
   this License, without any additional terms or conditions.
   Notwithstanding the above, nothing herein shall supersede or modify
   the terms of any separate license agreement you may have executed
   with Licensor regarding such Contributions.

6. Trademarks. This License does not grant permission to use the trade
   names, trademarks, service marks, or product names of the Licensor,
   except as required for reasonable and customary use in describing the
   origin of the Work and reproducing the content of the NOTICE file.

7. Disclaimer of Warranty. Unless required by applicable law or
   agreed to in writing, Licensor provides the Work (and each
   Contributor provides its Contributions) on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
   implied, including, without limitation, any warranties or conditions
   of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
   PARTICULAR PURPOSE. You are solely responsible for determining the
   appropriateness of using or redistributing the Work and assume any
   risks associated with Your exercise of permissions under this License.

8. Limitation of Liability. In no event and under no legal theory,
   whether in tort (including negligence), contract, or otherwise,
   unless required by applicable law (such as deliberate and grossly
   negligent acts) or agreed to in writing, shall any Contributor be
   liable to You for damages, including any direct, indirect, special,
   incidental, or consequential damages of any character arising as a
   result of this License or out of the use or inability to use the
   Work (including but not limited to damages for loss of goodwill,
   work stoppage, computer failure or malfunction, or any and all
   other commercial damages or losses), even if such Contributor
   has been advised of the possibility of such damages.

9. Accepting Warranty or Additional Liability. While redistributing
   the Work or Derivative Works thereof, You may choose to offer,
   and charge a fee for, acceptance of support, warranty, indemnity,
   or other liability obligations and/or rights consistent with this
   License. However, in accepting such obligations, You may act only
   on Your own behalf and on Your sole responsibility, not on behalf
   of any other Contributor, and only if You agree to indemnify,
   defend, and hold each Contributor harmless for any liability
   incurred by, or claims asserted against, such Contributor by reason
   of your accepting any such warranty or additional liability.

END OF TERMS AND CONDITIONS

APPENDIX: How to apply the Apache License to your work.

   To apply the Apache License to your work, attach the following
   boilerplate notice, with the fields enclosed by brackets "[]"
   replaced with your own identifying information. (Don't include
   the brackets!)  The text should be enclosed in the appropriate
   comment syntax for the file format. We also recommend that a
   file or class name and description of purpose be included on the
   same "printed page" as the copyright notice for easier
   identification within third-party archives.

Copyright [yyyy] [name of copyright owner]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
~~~~
```

### L45

MIT OR Apache-2.0 · 1 archivo

```text
===============================================================================

matching.go
https://creativecommons.org/licenses/by/3.0/legalcode

Creative Commons Legal Code

Attribution 3.0 Unported

    CREATIVE COMMONS CORPORATION IS NOT A LAW FIRM AND DOES NOT PROVIDE
    LEGAL SERVICES. DISTRIBUTION OF THIS LICENSE DOES NOT CREATE AN
    ATTORNEY-CLIENT RELATIONSHIP. CREATIVE COMMONS PROVIDES THIS
    INFORMATION ON AN "AS-IS" BASIS. CREATIVE COMMONS MAKES NO WARRANTIES
    REGARDING THE INFORMATION PROVIDED, AND DISCLAIMS LIABILITY FOR
    DAMAGES RESULTING FROM ITS USE.

License

THE WORK (AS DEFINED BELOW) IS PROVIDED UNDER THE TERMS OF THIS CREATIVE
COMMONS PUBLIC LICENSE ("CCPL" OR "LICENSE"). THE WORK IS PROTECTED BY
COPYRIGHT AND/OR OTHER APPLICABLE LAW. ANY USE OF THE WORK OTHER THAN AS
AUTHORIZED UNDER THIS LICENSE OR COPYRIGHT LAW IS PROHIBITED.

BY EXERCISING ANY RIGHTS TO THE WORK PROVIDED HERE, YOU ACCEPT AND AGREE
TO BE BOUND BY THE TERMS OF THIS LICENSE. TO THE EXTENT THIS LICENSE MAY
BE CONSIDERED TO BE A CONTRACT, THE LICENSOR GRANTS YOU THE RIGHTS
CONTAINED HERE IN CONSIDERATION OF YOUR ACCEPTANCE OF SUCH TERMS AND
CONDITIONS.

1. Definitions

 a. "Adaptation" means a work based upon the Work, or upon the Work and
    other pre-existing works, such as a translation, adaptation,
    derivative work, arrangement of music or other alterations of a
    literary or artistic work, or phonogram or performance and includes
    cinematographic adaptations or any other form in which the Work may be
    recast, transformed, or adapted including in any form recognizably
    derived from the original, except that a work that constitutes a
    Collection will not be considered an Adaptation for the purpose of
    this License. For the avoidance of doubt, where the Work is a musical
    work, performance or phonogram, the synchronization of the Work in
    timed-relation with a moving image ("synching") will be considered an
    Adaptation for the purpose of this License.
 b. "Collection" means a collection of literary or artistic works, such as
    encyclopedias and anthologies, or performances, phonograms or
    broadcasts, or other works or subject matter other than works listed
    in Section 1(f) below, which, by reason of the selection and
    arrangement of their contents, constitute intellectual creations, in
    which the Work is included in its entirety in unmodified form along
    with one or more other contributions, each constituting separate and
    independent works in themselves, which together are assembled into a
    collective whole. A work that constitutes a Collection will not be
    considered an Adaptation (as defined above) for the purposes of this
    License.
 c. "Distribute" means to make available to the public the original and
    copies of the Work or Adaptation, as appropriate, through sale or
    other transfer of ownership.
 d. "Licensor" means the individual, individuals, entity or entities that
    offer(s) the Work under the terms of this License.
 e. "Original Author" means, in the case of a literary or artistic work,
    the individual, individuals, entity or entities who created the Work
    or if no individual or entity can be identified, the publisher; and in
    addition (i) in the case of a performance the actors, singers,
    musicians, dancers, and other persons who act, sing, deliver, declaim,
    play in, interpret or otherwise perform literary or artistic works or
    expressions of folklore; (ii) in the case of a phonogram the producer
    being the person or legal entity who first fixes the sounds of a
    performance or other sounds; and, (iii) in the case of broadcasts, the
    organization that transmits the broadcast.
 f. "Work" means the literary and/or artistic work offered under the terms
    of this License including without limitation any production in the
    literary, scientific and artistic domain, whatever may be the mode or
    form of its expression including digital form, such as a book,
    pamphlet and other writing; a lecture, address, sermon or other work
    of the same nature; a dramatic or dramatico-musical work; a
    choreographic work or entertainment in dumb show; a musical
    composition with or without words; a cinematographic work to which are
    assimilated works expressed by a process analogous to cinematography;
    a work of drawing, painting, architecture, sculpture, engraving or
    lithography; a photographic work to which are assimilated works
    expressed by a process analogous to photography; a work of applied
    art; an illustration, map, plan, sketch or three-dimensional work
    relative to geography, topography, architecture or science; a
    performance; a broadcast; a phonogram; a compilation of data to the
    extent it is protected as a copyrightable work; or a work performed by
    a variety or circus performer to the extent it is not otherwise
    considered a literary or artistic work.
 g. "You" means an individual or entity exercising rights under this
    License who has not previously violated the terms of this License with
    respect to the Work, or who has received express permission from the
    Licensor to exercise rights under this License despite a previous
    violation.
 h. "Publicly Perform" means to perform public recitations of the Work and
    to communicate to the public those public recitations, by any means or
    process, including by wire or wireless means or public digital
    performances; to make available to the public Works in such a way that
    members of the public may access these Works from a place and at a
    place individually chosen by them; to perform the Work to the public
    by any means or process and the communication to the public of the
    performances of the Work, including by public digital performance; to
    broadcast and rebroadcast the Work by any means including signs,
    sounds or images.
 i. "Reproduce" means to make copies of the Work by any means including
    without limitation by sound or visual recordings and the right of
    fixation and reproducing fixations of the Work, including storage of a
    protected performance or phonogram in digital form or other electronic
    medium.

2. Fair Dealing Rights. Nothing in this License is intended to reduce,
limit, or restrict any uses free from copyright or rights arising from
limitations or exceptions that are provided for in connection with the
copyright protection under copyright law or other applicable laws.

3. License Grant. Subject to the terms and conditions of this License,
Licensor hereby grants You a worldwide, royalty-free, non-exclusive,
perpetual (for the duration of the applicable copyright) license to
exercise the rights in the Work as stated below:

 a. to Reproduce the Work, to incorporate the Work into one or more
    Collections, and to Reproduce the Work as incorporated in the
    Collections;
 b. to create and Reproduce Adaptations provided that any such Adaptation,
    including any translation in any medium, takes reasonable steps to
    clearly label, demarcate or otherwise identify that changes were made
    to the original Work. For example, a translation could be marked "The
    original work was translated from English to Spanish," or a
    modification could indicate "The original work has been modified.";
 c. to Distribute and Publicly Perform the Work including as incorporated
    in Collections; and,
 d. to Distribute and Publicly Perform Adaptations.
 e. For the avoidance of doubt:

     i. Non-waivable Compulsory License Schemes. In those jurisdictions in
        which the right to collect royalties through any statutory or
        compulsory licensing scheme cannot be waived, the Licensor
        reserves the exclusive right to collect such royalties for any
        exercise by You of the rights granted under this License;
    ii. Waivable Compulsory License Schemes. In those jurisdictions in
        which the right to collect royalties through any statutory or
        compulsory licensing scheme can be waived, the Licensor waives the
        exclusive right to collect such royalties for any exercise by You
        of the rights granted under this License; and,
   iii. Voluntary License Schemes. The Licensor waives the right to
        collect royalties, whether individually or, in the event that the
        Licensor is a member of a collecting society that administers
        voluntary licensing schemes, via that society, from any exercise
        by You of the rights granted under this License.

The above rights may be exercised in all media and formats whether now
known or hereafter devised. The above rights include the right to make
such modifications as are technically necessary to exercise the rights in
other media and formats. Subject to Section 8(f), all rights not expressly
granted by Licensor are hereby reserved.

4. Restrictions. The license granted in Section 3 above is expressly made
subject to and limited by the following restrictions:

 a. You may Distribute or Publicly Perform the Work only under the terms
    of this License. You must include a copy of, or the Uniform Resource
    Identifier (URI) for, this License with every copy of the Work You
    Distribute or Publicly Perform. You may not offer or impose any terms
    on the Work that restrict the terms of this License or the ability of
    the recipient of the Work to exercise the rights granted to that
    recipient under the terms of the License. You may not sublicense the
    Work. You must keep intact all notices that refer to this License and
    to the disclaimer of warranties with every copy of the Work You
    Distribute or Publicly Perform. When You Distribute or Publicly
    Perform the Work, You may not impose any effective technological
    measures on the Work that restrict the ability of a recipient of the
    Work from You to exercise the rights granted to that recipient under
    the terms of the License. This Section 4(a) applies to the Work as
    incorporated in a Collection, but this does not require the Collection
    apart from the Work itself to be made subject to the terms of this
    License. If You create a Collection, upon notice from any Licensor You
    must, to the extent practicable, remove from the Collection any credit
    as required by Section 4(b), as requested. If You create an
    Adaptation, upon notice from any Licensor You must, to the extent
    practicable, remove from the Adaptation any credit as required by
    Section 4(b), as requested.
 b. If You Distribute, or Publicly Perform the Work or any Adaptations or
    Collections, You must, unless a request has been made pursuant to
    Section 4(a), keep intact all copyright notices for the Work and
    provide, reasonable to the medium or means You are utilizing: (i) the
    name of the Original Author (or pseudonym, if applicable) if supplied,
    and/or if the Original Author and/or Licensor designate another party
    or parties (e.g., a sponsor institute, publishing entity, journal) for
    attribution ("Attribution Parties") in Licensor's copyright notice,
    terms of service or by other reasonable means, the name of such party
    or parties; (ii) the title of the Work if supplied; (iii) to the
    extent reasonably practicable, the URI, if any, that Licensor
    specifies to be associated with the Work, unless such URI does not
    refer to the copyright notice or licensing information for the Work;
    and (iv) , consistent with Section 3(b), in the case of an Adaptation,
    a credit identifying the use of the Work in the Adaptation (e.g.,
    "French translation of the Work by Original Author," or "Screenplay
    based on original Work by Original Author"). The credit required by
    this Section 4 (b) may be implemented in any reasonable manner;
    provided, however, that in the case of a Adaptation or Collection, at
    a minimum such credit will appear, if a credit for all contributing
    authors of the Adaptation or Collection appears, then as part of these
    credits and in a manner at least as prominent as the credits for the
    other contributing authors. For the avoidance of doubt, You may only
    use the credit required by this Section for the purpose of attribution
    in the manner set out above and, by exercising Your rights under this
    License, You may not implicitly or explicitly assert or imply any
    connection with, sponsorship or endorsement by the Original Author,
    Licensor and/or Attribution Parties, as appropriate, of You or Your
    use of the Work, without the separate, express prior written
    permission of the Original Author, Licensor and/or Attribution
    Parties.
 c. Except as otherwise agreed in writing by the Licensor or as may be
    otherwise permitted by applicable law, if You Reproduce, Distribute or
    Publicly Perform the Work either by itself or as part of any
    Adaptations or Collections, You must not distort, mutilate, modify or
    take other derogatory action in relation to the Work which would be
    prejudicial to the Original Author's honor or reputation. Licensor
    agrees that in those jurisdictions (e.g. Japan), in which any exercise
    of the right granted in Section 3(b) of this License (the right to
    make Adaptations) would be deemed to be a distortion, mutilation,
    modification or other derogatory action prejudicial to the Original
    Author's honor and reputation, the Licensor will waive or not assert,
    as appropriate, this Section, to the fullest extent permitted by the
    applicable national law, to enable You to reasonably exercise Your
    right under Section 3(b) of this License (right to make Adaptations)
    but not otherwise.

5. Representations, Warranties and Disclaimer

UNLESS OTHERWISE MUTUALLY AGREED TO BY THE PARTIES IN WRITING, LICENSOR
OFFERS THE WORK AS-IS AND MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY
KIND CONCERNING THE WORK, EXPRESS, IMPLIED, STATUTORY OR OTHERWISE,
INCLUDING, WITHOUT LIMITATION, WARRANTIES OF TITLE, MERCHANTIBILITY,
FITNESS FOR A PARTICULAR PURPOSE, NONINFRINGEMENT, OR THE ABSENCE OF
LATENT OR OTHER DEFECTS, ACCURACY, OR THE PRESENCE OF ABSENCE OF ERRORS,
WHETHER OR NOT DISCOVERABLE. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION
OF IMPLIED WARRANTIES, SO SUCH EXCLUSION MAY NOT APPLY TO YOU.

6. Limitation on Liability. EXCEPT TO THE EXTENT REQUIRED BY APPLICABLE
LAW, IN NO EVENT WILL LICENSOR BE LIABLE TO YOU ON ANY LEGAL THEORY FOR
ANY SPECIAL, INCIDENTAL, CONSEQUENTIAL, PUNITIVE OR EXEMPLARY DAMAGES
ARISING OUT OF THIS LICENSE OR THE USE OF THE WORK, EVEN IF LICENSOR HAS
BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

7. Termination

 a. This License and the rights granted hereunder will terminate
    automatically upon any breach by You of the terms of this License.
    Individuals or entities who have received Adaptations or Collections
    from You under this License, however, will not have their licenses
    terminated provided such individuals or entities remain in full
    compliance with those licenses. Sections 1, 2, 5, 6, 7, and 8 will
    survive any termination of this License.
 b. Subject to the above terms and conditions, the license granted here is
    perpetual (for the duration of the applicable copyright in the Work).
    Notwithstanding the above, Licensor reserves the right to release the
    Work under different license terms or to stop distributing the Work at
    any time; provided, however that any such election will not serve to
    withdraw this License (or any other license that has been, or is
    required to be, granted under the terms of this License), and this
    License will continue in full force and effect unless terminated as
    stated above.

8. Miscellaneous

 a. Each time You Distribute or Publicly Perform the Work or a Collection,
    the Licensor offers to the recipient a license to the Work on the same
    terms and conditions as the license granted to You under this License.
 b. Each time You Distribute or Publicly Perform an Adaptation, Licensor
    offers to the recipient a license to the original Work on the same
    terms and conditions as the license granted to You under this License.
 c. If any provision of this License is invalid or unenforceable under
    applicable law, it shall not affect the validity or enforceability of
    the remainder of the terms of this License, and without further action
    by the parties to this agreement, such provision shall be reformed to
    the minimum extent necessary to make such provision valid and
    enforceable.
 d. No term or provision of this License shall be deemed waived and no
    breach consented to unless such waiver or consent shall be in writing
    and signed by the party to be charged with such waiver or consent.
 e. This License constitutes the entire agreement between the parties with
    respect to the Work licensed here. There are no understandings,
    agreements or representations with respect to the Work not specified
    here. Licensor shall not be bound by any additional provisions that
    may appear in any communication from You. This License may not be
    modified without the mutual written agreement of the Licensor and You.
 f. The rights granted under, and the subject matter referenced, in this
    License were drafted utilizing the terminology of the Berne Convention
    for the Protection of Literary and Artistic Works (as amended on
    September 28, 1979), the Rome Convention of 1961, the WIPO Copyright
    Treaty of 1996, the WIPO Performances and Phonograms Treaty of 1996
    and the Universal Copyright Convention (as revised on July 24, 1971).
    These rights and subject matter take effect in the relevant
    jurisdiction in which the License terms are sought to be enforced
    according to the corresponding provisions of the implementation of
    those treaty provisions in the applicable national law. If the
    standard suite of rights granted under applicable copyright law
    includes additional rights not granted under this License, such
    additional rights are deemed to be included in the License; this
    License is not intended to restrict the license of any rights under
    applicable law.

Creative Commons Notice

    Creative Commons is not a party to this License, and makes no warranty
    whatsoever in connection with the Work. Creative Commons will not be
    liable to You or any party on any legal theory for any damages
    whatsoever, including without limitation any general, special,
    incidental or consequential damages arising in connection to this
    license. Notwithstanding the foregoing two (2) sentences, if Creative
    Commons has expressly identified itself as the Licensor hereunder, it
    shall have all rights and obligations of Licensor.

    Except for the limited purpose of indicating to the public that the
    Work is licensed under the CCPL, Creative Commons does not authorize
    the use by either party of the trademark "Creative Commons" or any
    related trademark or logo of Creative Commons without the prior
    written consent of Creative Commons. Any permitted use will be in
    compliance with Creative Commons' then-current trademark usage
    guidelines, as may be published on its website or otherwise made
    available upon request from time to time. For the avoidance of doubt,
    this trademark restriction does not form part of this License.

    Creative Commons may be contacted at https://creativecommons.org/.

===============================================================================

The Go Programming Language
https://golang.org/LICENSE

Copyright (c) 2009 The Go Authors. All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

   * Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
   * Redistributions in binary form must reproduce the above
copyright notice, this list of conditions and the following disclaimer
in the documentation and/or other materials provided with the
distribution.
   * Neither the name of Google Inc. nor the names of its
contributors may be used to endorse or promote products derived from
this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

===============================================================================

The Rust Programming Language
https://github.com/rust-lang/rust/blob/master/LICENSE-MIT

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

===============================================================================

The Rust Programming Language
https://github.com/rust-lang/rust/blob/master/LICENSE-APACHE

                              Apache License
                        Version 2.0, January 2004
                     http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

   "License" shall mean the terms and conditions for use, reproduction,
   and distribution as defined by Sections 1 through 9 of this document.

   "Licensor" shall mean the copyright owner or entity authorized by
   the copyright owner that is granting the License.

   "Legal Entity" shall mean the union of the acting entity and all
   other entities that control, are controlled by, or are under common
   control with that entity. For the purposes of this definition,
   "control" means (i) the power, direct or indirect, to cause the
   direction or management of such entity, whether by contract or
   otherwise, or (ii) ownership of fifty percent (50%) or more of the
   outstanding shares, or (iii) beneficial ownership of such entity.

   "You" (or "Your") shall mean an individual or Legal Entity
   exercising permissions granted by this License.

   "Source" form shall mean the preferred form for making modifications,
   including but not limited to software source code, documentation
   source, and configuration files.

   "Object" form shall mean any form resulting from mechanical
   transformation or translation of a Source form, including but
   not limited to compiled object code, generated documentation,
   and conversions to other media types.

   "Work" shall mean the work of authorship, whether in Source or
   Object form, made available under the License, as indicated by a
   copyright notice that is included in or attached to the work
   (an example is provided in the Appendix below).

   "Derivative Works" shall mean any work, whether in Source or Object
   form, that is based on (or derived from) the Work and for which the
   editorial revisions, annotations, elaborations, or other modifications
   represent, as a whole, an original work of authorship. For the purposes
   of this License, Derivative Works shall not include works that remain
   separable from, or merely link (or bind by name) to the interfaces of,
   the Work and Derivative Works thereof.

   "Contribution" shall mean any work of authorship, including
   the original version of the Work and any modifications or additions
   to that Work or Derivative Works thereof, that is intentionally
   submitted to Licensor for inclusion in the Work by the copyright owner
   or by an individual or Legal Entity authorized to submit on behalf of
   the copyright owner. For the purposes of this definition, "submitted"
   means any form of electronic, verbal, or written communication sent
   to the Licensor or its representatives, including but not limited to
   communication on electronic mailing lists, source code control systems,
   and issue tracking systems that are managed by, or on behalf of, the
   Licensor for the purpose of discussing and improving the Work, but
   excluding communication that is conspicuously marked or otherwise
   designated in writing by the copyright owner as "Not a Contribution."

   "Contributor" shall mean Licensor and any individual or Legal Entity
   on behalf of whom a Contribution has been received by Licensor and
   subsequently incorporated within the Work.

2. Grant of Copyright License. Subject to the terms and conditions of
   this License, each Contributor hereby grants to You a perpetual,
   worldwide, non-exclusive, no-charge, royalty-free, irrevocable
   copyright license to reproduce, prepare Derivative Works of,
   publicly display, publicly perform, sublicense, and distribute the
   Work and such Derivative Works in Source or Object form.

3. Grant of Patent License. Subject to the terms and conditions of
   this License, each Contributor hereby grants to You a perpetual,
   worldwide, non-exclusive, no-charge, royalty-free, irrevocable
   (except as stated in this section) patent license to make, have made,
   use, offer to sell, sell, import, and otherwise transfer the Work,
   where such license applies only to those patent claims licensable
   by such Contributor that are necessarily infringed by their
   Contribution(s) alone or by combination of their Contribution(s)
   with the Work to which such Contribution(s) was submitted. If You
   institute patent litigation against any entity (including a
   cross-claim or counterclaim in a lawsuit) alleging that the Work
   or a Contribution incorporated within the Work constitutes direct
   or contributory patent infringement, then any patent licenses
   granted to You under this License for that Work shall terminate
   as of the date such litigation is filed.

4. Redistribution. You may reproduce and distribute copies of the
   Work or Derivative Works thereof in any medium, with or without
   modifications, and in Source or Object form, provided that You
   meet the following conditions:

   (a) You must give any other recipients of the Work or
       Derivative Works a copy of this License; and

   (b) You must cause any modified files to carry prominent notices
       stating that You changed the files; and

   (c) You must retain, in the Source form of any Derivative Works
       that You distribute, all copyright, patent, trademark, and
       attribution notices from the Source form of the Work,
       excluding those notices that do not pertain to any part of
       the Derivative Works; and

   (d) If the Work includes a "NOTICE" text file as part of its
       distribution, then any Derivative Works that You distribute must
       include a readable copy of the attribution notices contained
       within such NOTICE file, excluding those notices that do not
       pertain to any part of the Derivative Works, in at least one
       of the following places: within a NOTICE text file distributed
       as part of the Derivative Works; within the Source form or
       documentation, if provided along with the Derivative Works; or,
       within a display generated by the Derivative Works, if and
       wherever such third-party notices normally appear. The contents
       of the NOTICE file are for informational purposes only and
       do not modify the License. You may add Your own attribution
       notices within Derivative Works that You distribute, alongside
       or as an addendum to the NOTICE text from the Work, provided
       that such additional attribution notices cannot be construed
       as modifying the License.

   You may add Your own copyright statement to Your modifications and
   may provide additional or different license terms and conditions
   for use, reproduction, or distribution of Your modifications, or
   for any such Derivative Works as a whole, provided Your use,
   reproduction, and distribution of the Work otherwise complies with
   the conditions stated in this License.

5. Submission of Contributions. Unless You explicitly state otherwise,
   any Contribution intentionally submitted for inclusion in the Work
   by You to the Licensor shall be under the terms and conditions of
   this License, without any additional terms or conditions.
   Notwithstanding the above, nothing herein shall supersede or modify
   the terms of any separate license agreement you may have executed
   with Licensor regarding such Contributions.

6. Trademarks. This License does not grant permission to use the trade
   names, trademarks, service marks, or product names of the Licensor,
   except as required for reasonable and customary use in describing the
   origin of the Work and reproducing the content of the NOTICE file.

7. Disclaimer of Warranty. Unless required by applicable law or
   agreed to in writing, Licensor provides the Work (and each
   Contributor provides its Contributions) on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
   implied, including, without limitation, any warranties or conditions
   of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
   PARTICULAR PURPOSE. You are solely responsible for determining the
   appropriateness of using or redistributing the Work and assume any
   risks associated with Your exercise of permissions under this License.

8. Limitation of Liability. In no event and under no legal theory,
   whether in tort (including negligence), contract, or otherwise,
   unless required by applicable law (such as deliberate and grossly
   negligent acts) or agreed to in writing, shall any Contributor be
   liable to You for damages, including any direct, indirect, special,
   incidental, or consequential damages of any character arising as a
   result of this License or out of the use or inability to use the
   Work (including but not limited to damages for loss of goodwill,
   work stoppage, computer failure or malfunction, or any and all
   other commercial damages or losses), even if such Contributor
   has been advised of the possibility of such damages.

9. Accepting Warranty or Additional Liability. While redistributing
   the Work or Derivative Works thereof, You may choose to offer,
   and charge a fee for, acceptance of support, warranty, indemnity,
   or other liability obligations and/or rights consistent with this
   License. However, in accepting such obligations, You may act only
   on Your own behalf and on Your sole responsibility, not on behalf
   of any other Contributor, and only if You agree to indemnify,
   defend, and hold each Contributor harmless for any liability
   incurred by, or claims asserted against, such Contributor by reason
   of your accepting any such warranty or additional liability.

END OF TERMS AND CONDITIONS

APPENDIX: How to apply the Apache License to your work.

   To apply the Apache License to your work, attach the following
   boilerplate notice, with the fields enclosed by brackets "[]"
   replaced with your own identifying information. (Don't include
   the brackets!)  The text should be enclosed in the appropriate
   comment syntax for the file format. We also recommend that a
   file or class name and description of purpose be included on the
   same "printed page" as the copyright notice for easier
   identification within third-party archives.

Copyright [yyyy] [name of copyright owner]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

### L46

MIT · 1 archivo

```text
MIT License

Copyright (c) 2023 Mykola Humanov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

This project contains portions of code and architectural concepts originally 
derived from the "nipper" project (https://github.com/importcjj/nipper), 
developed by Chen Jiaju, licensed under the MIT License and the Apache License 2.0 (dual licensed).
```

### L47

Apache-2.0 AND MIT · 1 archivo

```text
rust-lang/libm as a whole is available for use under the MIT license:

------------------------------------------------------------------------------
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
------------------------------------------------------------------------------

This Rust library contains the following copyrights:

    Copyright (c) 2018 Jorge Aparicio

Portions of this software are derived from third-party works licensed under
terms compatible with the above MIT license:

* musl libc https://www.musl-libc.org/. This library contains the following
  copyright:

      Copyright © 2005-2020 Rich Felker, et al.

* The CORE-MATH project https://core-math.gitlabpages.inria.fr/. CORE-MATH
  routines are available under the MIT license on a per-file basis.

The musl libc COPYRIGHT file also includes the following notice relevant to
math portions of the library:

------------------------------------------------------------------------------
Much of the math library code (src/math/* and src/complex/*) is
Copyright © 1993,2004 Sun Microsystems or
Copyright © 2003-2011 David Schultz or
Copyright © 2003-2009 Steven G. Kargl or
Copyright © 2003-2009 Bruce D. Evans or
Copyright © 2008 Stephen L. Moshier or
Copyright © 2017-2018 Arm Limited
and labelled as such in comments in the individual source files. All
have been licensed under extremely permissive terms.
------------------------------------------------------------------------------
```

### L48

MIT · 1 archivo

```text
Copyright (c) 2019-2025 Frank Denis

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

--

Code in the src/crypto folder is derived from the rust-crypto project:
https://github.com/DaGenix/rust-crypto

Original ISC license follows:

Copyright (c) 2006-2009 Graydon Hoare
Copyright (c) 2009-2013 Mozilla Foundation

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```

### L49

Apache-2.0 OR MIT · 1 archivo

```text
SPDXVersion: SPDX-2.1
DataLicense: CC0-1.0
PackageName: muda
DataFormat: SPDXRef-1
PackageSupplier: Organization: The Tauri Programme in the Commons Conservancy
PackageHomePage: https://tauri.app
PackageLicenseDeclared: Apache-2.0
PackageLicenseDeclared: MIT
PackageCopyrightText: 2020-2022, The Tauri Programme in the Commons Conservancy
PackageSummary: <text>Menu Utilities for Desktop Applications.
                </text>
PackageComment: <text>The package includes the following libraries; see
Relationship information.
                </text>
Created: 2022-12-05T09:00:00Z
PackageDownloadLocation: git://github.com/tauri-apps/muda
PackageDownloadLocation: git+https://github.com/tauri-apps/muda.git
PackageDownloadLocation: git+ssh://github.com/tauri-apps/muda.git
Creator: Person: Daniel Thompson-Yvetot
```

### L50

MIT · 1 archivo

```text
The MIT License (MIT)
=====================

Copyright © `2015` `Sebastian Thiel`

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the “Software”), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
```

### L51

MPL-2.0 · 1 archivo

```text
Mozilla Public License Version 2.0
==================================

1. Definitions
--------------

1.1. "Contributor"
    means each individual or legal entity that creates, contributes to
    the creation of, or owns Covered Software.

1.2. "Contributor Version"
    means the combination of the Contributions of others (if any) used
    by a Contributor and that particular Contributor's Contribution.

1.3. "Contribution"
    means Covered Software of a particular Contributor.

1.4. "Covered Software"
    means Source Code Form to which the initial Contributor has attached
    the notice in Exhibit A, the Executable Form of such Source Code
    Form, and Modifications of such Source Code Form, in each case
    including portions thereof.

1.5. "Incompatible With Secondary Licenses"
    means

    (a) that the initial Contributor has attached the notice described
        in Exhibit B to the Covered Software; or

    (b) that the Covered Software was made available under the terms of
        version 1.1 or earlier of the License, but not also under the
        terms of a Secondary License.

1.6. "Executable Form"
    means any form of the work other than Source Code Form.

1.7. "Larger Work"
    means a work that combines Covered Software with other material, in 
    a separate file or files, that is not Covered Software.

1.8. "License"
    means this document.

1.9. "Licensable"
    means having the right to grant, to the maximum extent possible,
    whether at the time of the initial grant or subsequently, any and
    all of the rights conveyed by this License.

1.10. "Modifications"
    means any of the following:

    (a) any file in Source Code Form that results from an addition to,
        deletion from, or modification of the contents of Covered
        Software; or

    (b) any new file in Source Code Form that contains any Covered
        Software.

1.11. "Patent Claims" of a Contributor
    means any patent claim(s), including without limitation, method,
    process, and apparatus claims, in any patent Licensable by such
    Contributor that would be infringed, but for the grant of the
    License, by the making, using, selling, offering for sale, having
    made, import, or transfer of either its Contributions or its
    Contributor Version.

1.12. "Secondary License"
    means either the GNU General Public License, Version 2.0, the GNU
    Lesser General Public License, Version 2.1, the GNU Affero General
    Public License, Version 3.0, or any later versions of those
    licenses.

1.13. "Source Code Form"
    means the form of the work preferred for making modifications.

1.14. "You" (or "Your")
    means an individual or a legal entity exercising rights under this
    License. For legal entities, "You" includes any entity that
    controls, is controlled by, or is under common control with You. For
    purposes of this definition, "control" means (a) the power, direct
    or indirect, to cause the direction or management of such entity,
    whether by contract or otherwise, or (b) ownership of more than
    fifty percent (50%) of the outstanding shares or beneficial
    ownership of such entity.

2. License Grants and Conditions
--------------------------------

2.1. Grants

Each Contributor hereby grants You a world-wide, royalty-free,
non-exclusive license:

(a) under intellectual property rights (other than patent or trademark)
    Licensable by such Contributor to use, reproduce, make available,
    modify, display, perform, distribute, and otherwise exploit its
    Contributions, either on an unmodified basis, with Modifications, or
    as part of a Larger Work; and

(b) under Patent Claims of such Contributor to make, use, sell, offer
    for sale, have made, import, and otherwise transfer either its
    Contributions or its Contributor Version.

2.2. Effective Date

The licenses granted in Section 2.1 with respect to any Contribution
become effective for each Contribution on the date the Contributor first
distributes such Contribution.

2.3. Limitations on Grant Scope

The licenses granted in this Section 2 are the only rights granted under
this License. No additional rights or licenses will be implied from the
distribution or licensing of Covered Software under this License.
Notwithstanding Section 2.1(b) above, no patent license is granted by a
Contributor:

(a) for any code that a Contributor has removed from Covered Software;
    or

(b) for infringements caused by: (i) Your and any other third party's
    modifications of Covered Software, or (ii) the combination of its
    Contributions with other software (except as part of its Contributor
    Version); or

(c) under Patent Claims infringed by Covered Software in the absence of
    its Contributions.

This License does not grant any rights in the trademarks, service marks,
or logos of any Contributor (except as may be necessary to comply with
the notice requirements in Section 3.4).

2.4. Subsequent Licenses

No Contributor makes additional grants as a result of Your choice to
distribute the Covered Software under a subsequent version of this
License (see Section 10.2) or under the terms of a Secondary License (if
permitted under the terms of Section 3.3).

2.5. Representation

Each Contributor represents that the Contributor believes its
Contributions are its original creation(s) or it has sufficient rights
to grant the rights to its Contributions conveyed by this License.

2.6. Fair Use

This License is not intended to limit any rights You have under
applicable copyright doctrines of fair use, fair dealing, or other
equivalents.

2.7. Conditions

Sections 3.1, 3.2, 3.3, and 3.4 are conditions of the licenses granted
in Section 2.1.

3. Responsibilities
-------------------

3.1. Distribution of Source Form

All distribution of Covered Software in Source Code Form, including any
Modifications that You create or to which You contribute, must be under
the terms of this License. You must inform recipients that the Source
Code Form of the Covered Software is governed by the terms of this
License, and how they can obtain a copy of this License. You may not
attempt to alter or restrict the recipients' rights in the Source Code
Form.

3.2. Distribution of Executable Form

If You distribute Covered Software in Executable Form then:

(a) such Covered Software must also be made available in Source Code
    Form, as described in Section 3.1, and You must inform recipients of
    the Executable Form how they can obtain a copy of such Source Code
    Form by reasonable means in a timely manner, at a charge no more
    than the cost of distribution to the recipient; and

(b) You may distribute such Executable Form under the terms of this
    License, or sublicense it under different terms, provided that the
    license for the Executable Form does not attempt to limit or alter
    the recipients' rights in the Source Code Form under this License.

3.3. Distribution of a Larger Work

You may create and distribute a Larger Work under terms of Your choice,
provided that You also comply with the requirements of this License for
the Covered Software. If the Larger Work is a combination of Covered
Software with a work governed by one or more Secondary Licenses, and the
Covered Software is not Incompatible With Secondary Licenses, this
License permits You to additionally distribute such Covered Software
under the terms of such Secondary License(s), so that the recipient of
the Larger Work may, at their option, further distribute the Covered
Software under the terms of either this License or such Secondary
License(s).

3.4. Notices

You may not remove or alter the substance of any license notices
(including copyright notices, patent notices, disclaimers of warranty,
or limitations of liability) contained within the Source Code Form of
the Covered Software, except that You may alter any license notices to
the extent required to remedy known factual inaccuracies.

3.5. Application of Additional Terms

You may choose to offer, and to charge a fee for, warranty, support,
indemnity or liability obligations to one or more recipients of Covered
Software. However, You may do so only on Your own behalf, and not on
behalf of any Contributor. You must make it absolutely clear that any
such warranty, support, indemnity, or liability obligation is offered by
You alone, and You hereby agree to indemnify every Contributor for any
liability incurred by such Contributor as a result of warranty, support,
indemnity or liability terms You offer. You may include additional
disclaimers of warranty and limitations of liability specific to any
jurisdiction.

4. Inability to Comply Due to Statute or Regulation
---------------------------------------------------

If it is impossible for You to comply with any of the terms of this
License with respect to some or all of the Covered Software due to
statute, judicial order, or regulation then You must: (a) comply with
the terms of this License to the maximum extent possible; and (b)
describe the limitations and the code they affect. Such description must
be placed in a text file included with all distributions of the Covered
Software under this License. Except to the extent prohibited by statute
or regulation, such description must be sufficiently detailed for a
recipient of ordinary skill to be able to understand it.

5. Termination
--------------

5.1. The rights granted under this License will terminate automatically
if You fail to comply with any of its terms. However, if You become
compliant, then the rights granted under this License from a particular
Contributor are reinstated (a) provisionally, unless and until such
Contributor explicitly and finally terminates Your grants, and (b) on an
ongoing basis, if such Contributor fails to notify You of the
non-compliance by some reasonable means prior to 60 days after You have
come back into compliance. Moreover, Your grants from a particular
Contributor are reinstated on an ongoing basis if such Contributor
notifies You of the non-compliance by some reasonable means, this is the
first time You have received notice of non-compliance with this License
from such Contributor, and You become compliant prior to 30 days after
Your receipt of the notice.

5.2. If You initiate litigation against any entity by asserting a patent
infringement claim (excluding declaratory judgment actions,
counter-claims, and cross-claims) alleging that a Contributor Version
directly or indirectly infringes any patent, then the rights granted to
You by any and all Contributors for the Covered Software under Section
2.1 of this License shall terminate.

5.3. In the event of termination under Sections 5.1 or 5.2 above, all
end user license agreements (excluding distributors and resellers) which
have been validly granted by You or Your distributors under this License
prior to termination shall survive termination.

************************************************************************
*                                                                      *
*  6. Disclaimer of Warranty                                           *
*  -------------------------                                           *
*                                                                      *
*  Covered Software is provided under this License on an "as is"       *
*  basis, without warranty of any kind, either expressed, implied, or  *
*  statutory, including, without limitation, warranties that the       *
*  Covered Software is free of defects, merchantable, fit for a        *
*  particular purpose or non-infringing. The entire risk as to the     *
*  quality and performance of the Covered Software is with You.        *
*  Should any Covered Software prove defective in any respect, You     *
*  (not any Contributor) assume the cost of any necessary servicing,   *
*  repair, or correction. This disclaimer of warranty constitutes an   *
*  essential part of this License. No use of any Covered Software is   *
*  authorized under this License except under this disclaimer.         *
*                                                                      *
************************************************************************

************************************************************************
*                                                                      *
*  7. Limitation of Liability                                          *
*  --------------------------                                          *
*                                                                      *
*  Under no circumstances and under no legal theory, whether tort      *
*  (including negligence), contract, or otherwise, shall any           *
*  Contributor, or anyone who distributes Covered Software as          *
*  permitted above, be liable to You for any direct, indirect,         *
*  special, incidental, or consequential damages of any character      *
*  including, without limitation, damages for lost profits, loss of    *
*  goodwill, work stoppage, computer failure or malfunction, or any    *
*  and all other commercial damages or losses, even if such party      *
*  shall have been informed of the possibility of such damages. This   *
*  limitation of liability shall not apply to liability for death or   *
*  personal injury resulting from such party's negligence to the       *
*  extent applicable law prohibits such limitation. Some               *
*  jurisdictions do not allow the exclusion or limitation of           *
*  incidental or consequential damages, so this exclusion and          *
*  limitation may not apply to You.                                    *
*                                                                      *
************************************************************************

8. Litigation
-------------

Any litigation relating to this License may be brought only in the
courts of a jurisdiction where the defendant maintains its principal
place of business and such litigation shall be governed by laws of that
jurisdiction, without reference to its conflict-of-law provisions.
Nothing in this Section shall prevent a party's ability to bring
cross-claims or counter-claims.

9. Miscellaneous
----------------

This License represents the complete agreement concerning the subject
matter hereof. If any provision of this License is held to be
unenforceable, such provision shall be reformed only to the extent
necessary to make it enforceable. Any law or regulation which provides
that the language of a contract shall be construed against the drafter
shall not be used to construe this License against a Contributor.

10. Versions of the License
---------------------------

10.1. New Versions

Mozilla Foundation is the license steward. Except as provided in Section
10.3, no one other than the license steward has the right to modify or
publish new versions of this License. Each version will be given a
distinguishing version number.

10.2. Effect of New Versions

You may distribute the Covered Software under the terms of the version
of the License under which You originally received the Covered Software,
or under the terms of any subsequent version published by the license
steward.

10.3. Modified Versions

If you create software not governed by this License, and you want to
create a new license for such software, you may create and use a
modified version of this License if you rename the license and remove
any references to the name of the license steward (except to note that
such modified license differs from this License).

10.4. Distributing Source Code Form that is Incompatible With Secondary
Licenses

If You choose to distribute Source Code Form that is Incompatible With
Secondary Licenses under the terms of this version of the License, the
notice described in Exhibit B of this License must be attached.

Exhibit A - Source Code Form License Notice
-------------------------------------------

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at https://mozilla.org/MPL/2.0/.

If it is not possible or desirable to put the notice in a particular
file, then You may include the notice in a location (such as a LICENSE
file in a relevant directory) where a recipient would be likely to look
for such a notice.

You may add additional accurate notices of copyright ownership.

Exhibit B - "Incompatible With Secondary Licenses" Notice
---------------------------------------------------------

  This Source Code Form is "Incompatible With Secondary Licenses", as
  defined by the Mozilla Public License, v. 2.0.
```

### L52

Apache-2.0 AND ISC · 1 archivo

```text
*ring* uses an "ISC" license, like BoringSSL used to use, for new code
files. See LICENSE-other-bits for the text of that license.

See LICENSE-BoringSSL for code that was sourced from BoringSSL under the
Apache 2.0 license. Some code that was sourced from BoringSSL under the ISC
license. In each case, the license info is at the top of the file.

See src/polyfill/once_cell/LICENSE-APACHE and src/polyfill/once_cell/LICENSE-MIT
for the license to code that was sourced from the once_cell project.
```

### L53

Apache-2.0 AND ISC · 1 archivo

```text
Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright [yyyy] [name of copyright owner]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

Licenses for support code
-------------------------

Parts of the TLS test suite are under the Go license. This code is not included
in BoringSSL (i.e. libcrypto and libssl) when compiled, however, so
distributing code linked against BoringSSL does not trigger this license:

Copyright (c) 2009 The Go Authors. All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

   * Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
   * Redistributions in binary form must reproduce the above
copyright notice, this list of conditions and the following disclaimer
in the documentation and/or other materials provided with the
distribution.
   * Neither the name of Google Inc. nor the names of its
contributors may be used to endorse or promote products derived from
this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

BoringSSL uses the Chromium test infrastructure to run a continuous build,
trybots etc. The scripts which manage this, and the script for generating build
metadata, are under the Chromium license. Distributing code linked against
BoringSSL does not trigger this license.

Copyright 2015 The Chromium Authors. All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

   * Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
   * Redistributions in binary form must reproduce the above
copyright notice, this list of conditions and the following disclaimer
in the documentation and/or other materials provided with the
distribution.
   * Neither the name of Google Inc. nor the names of its
contributors may be used to endorse or promote products derived from
this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### L54

Apache-2.0 AND ISC · 1 archivo

```text
Copyright 2015-2025 Brian Smith.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### L55

ISC · 1 archivo

```text
Except as otherwise noted, this project is licensed under the following
(ISC-style) terms:

Copyright 2015 Brian Smith.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHORS DISCLAIM ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

The files under third-party/chromium are licensed as described in
third-party/chromium/LICENSE.
```

### L56

MIT OR Apache-2.0 · 1 archivo

```text
Copyright 2015 Nicholas Allegra (comex).

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

### L57

MIT OR Apache-2.0 · 1 archivo

```text
Copyright 2012-2016 The Rust Project Developers.
Copyright 2016-2026 Frank Denis.

Licensed under the Apache License, Version 2.0 <LICENSE-APACHE or
http://www.apache.org/licenses/LICENSE-2.0> or the MIT license
<LICENSE-MIT or http://opensource.org/licenses/MIT>, at your
option.
```

### L58

Apache-2.0 · 1 archivo

```text
SPDXVersion: SPDX-2.1
DataLicense: CC0-1.0
PackageName: tao
DataFormat: SPDXRef-1
PackageSupplier: Organization: The Tauri Programme in the Commons Conservancy
PackageHomePage: https://tauri.app
PackageLicenseDeclared: Apache-2.0
PackageCopyrightText: 2021-2023, The Tauri Programme in the Commons Conservancy
PackageSummary: <text>Tao is the official, rust-based window manager for Wry.
                </text>
PackageComment: <text>The package includes the following libraries; see
Relationship information.
                </text>
Created: 2020-05-20T09:00:00Z
PackageDownloadLocation: git://github.com/tauri-apps/tao
PackageDownloadLocation: git+https://github.com/tauri-apps/tao.git
PackageDownloadLocation: git+ssh://github.com/tauri-apps/tao.git
Creator: Person: Daniel Thompson-Yvetot
```

### L59

MIT OR Apache-2.0 · 1 archivo

```text
SPDXVersion: SPDX-2.1
DataLicense: CC0-1.0
PackageName: tray-icon
DataFormat: SPDXRef-1
PackageSupplier: Organization: The Tauri Programme in the Commons Conservancy
PackageHomePage: https://tauri.app
PackageLicenseDeclared: Apache-2.0
PackageLicenseDeclared: MIT
PackageCopyrightText: 2020-2022, The Tauri Programme in the Commons Conservancy
PackageSummary: <text>Create tray icons for desktop applications.
                </text>
PackageComment: <text>The package includes the following libraries; see
Relationship information.
                </text>
Created: 2022-12-05T09:00:00Z
PackageDownloadLocation: git://github.com/tauri-apps/tray-icon
PackageDownloadLocation: git+https://github.com/tauri-apps/tray-icon.git
PackageDownloadLocation: git+ssh://github.com/tauri-apps/tray-icon.git
Creator: Person: Daniel Thompson-Yvetot
```

### L60

MIT OR Apache-2.0 · 1 archivo

```text
MIT OR Apache-2.0
```

### L61

(MIT OR Apache-2.0) AND Unicode-3.0 · 1 archivo

```text
UNICODE LICENSE V3

COPYRIGHT AND PERMISSION NOTICE

Copyright © 1991-2023 Unicode, Inc.

NOTICE TO USER: Carefully read the following legal agreement. BY
DOWNLOADING, INSTALLING, COPYING OR OTHERWISE USING DATA FILES, AND/OR
SOFTWARE, YOU UNEQUIVOCALLY ACCEPT, AND AGREE TO BE BOUND BY, ALL OF THE
TERMS AND CONDITIONS OF THIS AGREEMENT. IF YOU DO NOT AGREE, DO NOT
DOWNLOAD, INSTALL, COPY, DISTRIBUTE OR USE THE DATA FILES OR SOFTWARE.

Permission is hereby granted, free of charge, to any person obtaining a
copy of data files and any associated documentation (the "Data Files") or
software and any associated documentation (the "Software") to deal in the
Data Files or Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, and/or sell
copies of the Data Files or Software, and to permit persons to whom the
Data Files or Software are furnished to do so, provided that either (a)
this copyright and permission notice appear with all copies of the Data
Files or Software, or (b) this copyright and permission notice appear in
associated Documentation.

THE DATA FILES AND SOFTWARE ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF
THIRD PARTY RIGHTS.

IN NO EVENT SHALL THE COPYRIGHT HOLDER OR HOLDERS INCLUDED IN THIS NOTICE
BE LIABLE FOR ANY CLAIM, OR ANY SPECIAL INDIRECT OR CONSEQUENTIAL DAMAGES,
OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THE DATA
FILES OR SOFTWARE.

Except as contained in this notice, the name of a copyright holder shall
not be used in advertising or otherwise to promote the sale, use or other
dealings in these Data Files or Software without prior written
authorization of the copyright holder.
```

### L62

ISC · 1 archivo

```text
// Copyright 2015-2016 Brian Smith.
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHORS DISCLAIM ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### L63

Apache-2.0 OR MIT · 1 archivo

```text
SPDXVersion: SPDX-2.1
DataLicense: CC0-1.0
PackageName: window-vibrancy
DataFormat: SPDXRef-1
PackageSupplier: Organization: The Tauri Programme in the Commons Conservancy
PackageHomePage: https://tauri.app
PackageLicenseDeclared: Apache-2.0
PackageLicenseDeclared: MIT
PackageCopyrightText: 2020-2022, The Tauri Programme in the Commons Conservancy
PackageSummary: <text>Make your windows vibrant.
                </text>
PackageComment: <text>The package includes the following libraries; see
Relationship information.
                </text>
Created: 2020-05-20T09:00:00Z
PackageDownloadLocation: git://github.com/tauri-apps/window-vibrancy
PackageDownloadLocation: git+https://github.com/tauri-apps/window-vibrancy.git
PackageDownloadLocation: git+ssh://github.com/tauri-apps/window-vibrancy.git
Creator: Person: Daniel Thompson-Yvetot
```

### L64

Apache-2.0 OR MIT · 1 archivo

```text
SPDXVersion: SPDX-2.1
DataLicense: CC0-1.0
PackageName: wry
DataFormat: SPDXRef-1
PackageSupplier: Organization: The Tauri Programme in the Commons Conservancy
PackageHomePage: https://tauri.app
PackageLicenseDeclared: Apache-2.0
PackageLicenseDeclared: MIT
PackageCopyrightText: 2020-2023, The Tauri Programme in the Commons Conservancy
PackageSummary: <text>Wry is the official, rust-based webview
windowing service for Tauri.
                </text>
PackageComment: <text>The package includes the following libraries; see
Relationship information.
                </text>
Created: 2020-05-20T09:00:00Z
PackageDownloadLocation: git://github.com/tauri-apps/wry
PackageDownloadLocation: git+https://github.com/tauri-apps/wry.git
PackageDownloadLocation: git+ssh://github.com/tauri-apps/wry.git
Creator: Person: Daniel Thompson-Yvetot
```

### L65

BSD License · 1 archivo

```text
BSD 3-Clause License

Copyright (c) 2021-2024, ContourPy Developers.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### L66

BSD License · 1 archivo

```text
Copyright (c) 2015, matplotlib project
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of the matplotlib project nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### L67

BSD License · 1 archivo

```text
=========================
 The Kiwi licensing terms
=========================
Kiwi is licensed under the terms of the Modified BSD License (also known as
New or Revised BSD), as follows:

Copyright (c) 2013-2024, Nucleic Development Team

All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this
list of conditions and the following disclaimer in the documentation and/or
other materials provided with the distribution.

Neither the name of the Nucleic Development Team nor the names of its
contributors may be used to endorse or promote products derived from this
software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

About Kiwi
----------
Chris Colbert began the Kiwi project in December 2013 in an effort to
create a blisteringly fast UI constraint solver. Chris is still the
project lead.

The Nucleic Development Team is the set of all contributors to the Nucleic
project and its subprojects.

The core team that coordinates development on GitHub can be found here:
http://github.com/nucleic. The current team consists of:

* Chris Colbert

Our Copyright Policy
--------------------
Nucleic uses a shared copyright model. Each contributor maintains copyright
over their contributions to Nucleic. But, it is important to note that these
contributions are typically only changes to the repositories. Thus, the Nucleic
source code, in its entirety is not the copyright of any single person or
institution. Instead, it is the collective copyright of the entire Nucleic
Development Team. If individual contributors want to maintain a record of what
changes/contributions they have specific copyright on, they should indicate
their copyright in the commit message of the change, when they commit the
change to one of the Nucleic repositories.

With this in mind, the following banner should be used in any source code file
to indicate the copyright and license terms:

#------------------------------------------------------------------------------
# Copyright (c) 2013-2024, Nucleic Development Team.
#
# Distributed under the terms of the Modified BSD License.
#
# The full license is in the file LICENSE, distributed with this software.
#------------------------------------------------------------------------------
```

### L68

Python Software Foundation License · 1 archivo

```text
Fonts are (c) Bitstream (see below). DejaVu changes are in public domain.
Glyphs imported from Arev fonts are (c) Tavmjong Bah (see below)

Bitstream Vera Fonts Copyright
------------------------------

Copyright (c) 2003 by Bitstream, Inc. All Rights Reserved. Bitstream Vera is
a trademark of Bitstream, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of the fonts accompanying this license ("Fonts") and associated
documentation files (the "Font Software"), to reproduce and distribute the
Font Software, including without limitation the rights to use, copy, merge,
publish, distribute, and/or sell copies of the Font Software, and to permit
persons to whom the Font Software is furnished to do so, subject to the
following conditions:

The above copyright and trademark notices and this permission notice shall
be included in all copies of one or more of the Font Software typefaces.

The Font Software may be modified, altered, or added to, and in particular
the designs of glyphs or characters in the Fonts may be modified and
additional glyphs or characters may be added to the Fonts, only if the fonts
are renamed to names not containing either the words "Bitstream" or the word
"Vera".

This License becomes null and void to the extent applicable to Fonts or Font
Software that has been modified and is distributed under the "Bitstream
Vera" names.

The Font Software may be sold as part of a larger software package but no
copy of one or more of the Font Software typefaces may be sold by itself.

THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF COPYRIGHT, PATENT,
TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL BITSTREAM OR THE GNOME
FOUNDATION BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, INCLUDING
ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF
THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM OTHER DEALINGS IN THE
FONT SOFTWARE.

Except as contained in this notice, the names of Gnome, the Gnome
Foundation, and Bitstream Inc., shall not be used in advertising or
otherwise to promote the sale, use or other dealings in this Font Software
without prior written authorization from the Gnome Foundation or Bitstream
Inc., respectively. For further information, contact: fonts at gnome dot
org. 

Arev Fonts Copyright
------------------------------

Copyright (c) 2006 by Tavmjong Bah. All Rights Reserved.

Permission is hereby granted, free of charge, to any person obtaining
a copy of the fonts accompanying this license ("Fonts") and
associated documentation files (the "Font Software"), to reproduce
and distribute the modifications to the Bitstream Vera Font Software,
including without limitation the rights to use, copy, merge, publish,
distribute, and/or sell copies of the Font Software, and to permit
persons to whom the Font Software is furnished to do so, subject to
the following conditions:

The above copyright and trademark notices and this permission notice
shall be included in all copies of one or more of the Font Software
typefaces.

The Font Software may be modified, altered, or added to, and in
particular the designs of glyphs or characters in the Fonts may be
modified and additional glyphs or characters may be added to the
Fonts, only if the fonts are renamed to names not containing either
the words "Tavmjong Bah" or the word "Arev".

This License becomes null and void to the extent applicable to Fonts
or Font Software that has been modified and is distributed under the 
"Tavmjong Bah Arev" names.

The Font Software may be sold as part of a larger software package but
no copy of one or more of the Font Software typefaces may be sold by
itself.

THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL
TAVMJONG BAH BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.

Except as contained in this notice, the name of Tavmjong Bah shall not
be used in advertising or otherwise to promote the sale, use or other
dealings in this Font Software without prior written authorization
from Tavmjong Bah. For further information, contact: tavmjong @ free
. fr.

$Id: LICENSE 2133 2007-11-28 02:46:28Z lechimp $
```

### L69

Python Software Foundation License · 1 archivo

```text
License agreement for matplotlib versions 1.3.0 and later
=========================================================

1. This LICENSE AGREEMENT is between the Matplotlib Development Team
("MDT"), and the Individual or Organization ("Licensee") accessing and
otherwise using matplotlib software in source or binary form and its
associated documentation.

2. Subject to the terms and conditions of this License Agreement, MDT
hereby grants Licensee a nonexclusive, royalty-free, world-wide license
to reproduce, analyze, test, perform and/or display publicly, prepare
derivative works, distribute, and otherwise use matplotlib
alone or in any derivative version, provided, however, that MDT's
License Agreement and MDT's notice of copyright, i.e., "Copyright (c)
2012- Matplotlib Development Team; All Rights Reserved" are retained in
matplotlib  alone or in any derivative version prepared by
Licensee.

3. In the event Licensee prepares a derivative work that is based on or
incorporates matplotlib or any part thereof, and wants to
make the derivative work available to others as provided herein, then
Licensee hereby agrees to include in any such work a brief summary of
the changes made to matplotlib .

4. MDT is making matplotlib available to Licensee on an "AS
IS" basis.  MDT MAKES NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR
IMPLIED.  BY WAY OF EXAMPLE, BUT NOT LIMITATION, MDT MAKES NO AND
DISCLAIMS ANY REPRESENTATION OR WARRANTY OF MERCHANTABILITY OR FITNESS
FOR ANY PARTICULAR PURPOSE OR THAT THE USE OF MATPLOTLIB
WILL NOT INFRINGE ANY THIRD PARTY RIGHTS.

5. MDT SHALL NOT BE LIABLE TO LICENSEE OR ANY OTHER USERS OF MATPLOTLIB
 FOR ANY INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES OR
LOSS AS A RESULT OF MODIFYING, DISTRIBUTING, OR OTHERWISE USING
MATPLOTLIB , OR ANY DERIVATIVE THEREOF, EVEN IF ADVISED OF
THE POSSIBILITY THEREOF.

6. This License Agreement will automatically terminate upon a material
breach of its terms and conditions.

7. Nothing in this License Agreement shall be deemed to create any
relationship of agency, partnership, or joint venture between MDT and
Licensee.  This License Agreement does not grant permission to use MDT
trademarks or trade name in a trademark sense to endorse or promote
products or services of Licensee, or any third party.

8. By copying, installing or otherwise using matplotlib ,
Licensee agrees to be bound by the terms and conditions of this License
Agreement.

License agreement for matplotlib versions prior to 1.3.0
========================================================

1. This LICENSE AGREEMENT is between John D. Hunter ("JDH"), and the
Individual or Organization ("Licensee") accessing and otherwise using
matplotlib software in source or binary form and its associated
documentation.

2. Subject to the terms and conditions of this License Agreement, JDH
hereby grants Licensee a nonexclusive, royalty-free, world-wide license
to reproduce, analyze, test, perform and/or display publicly, prepare
derivative works, distribute, and otherwise use matplotlib
alone or in any derivative version, provided, however, that JDH's
License Agreement and JDH's notice of copyright, i.e., "Copyright (c)
2002-2011 John D. Hunter; All Rights Reserved" are retained in
matplotlib  alone or in any derivative version prepared by
Licensee.

3. In the event Licensee prepares a derivative work that is based on or
incorporates matplotlib  or any part thereof, and wants to
make the derivative work available to others as provided herein, then
Licensee hereby agrees to include in any such work a brief summary of
the changes made to matplotlib.

4. JDH is making matplotlib  available to Licensee on an "AS
IS" basis.  JDH MAKES NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR
IMPLIED.  BY WAY OF EXAMPLE, BUT NOT LIMITATION, JDH MAKES NO AND
DISCLAIMS ANY REPRESENTATION OR WARRANTY OF MERCHANTABILITY OR FITNESS
FOR ANY PARTICULAR PURPOSE OR THAT THE USE OF MATPLOTLIB
WILL NOT INFRINGE ANY THIRD PARTY RIGHTS.

5. JDH SHALL NOT BE LIABLE TO LICENSEE OR ANY OTHER USERS OF MATPLOTLIB
 FOR ANY INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES OR
LOSS AS A RESULT OF MODIFYING, DISTRIBUTING, OR OTHERWISE USING
MATPLOTLIB , OR ANY DERIVATIVE THEREOF, EVEN IF ADVISED OF
THE POSSIBILITY THEREOF.

6. This License Agreement will automatically terminate upon a material
breach of its terms and conditions.

7. Nothing in this License Agreement shall be deemed to create any
relationship of agency, partnership, or joint venture between JDH and
Licensee.  This License Agreement does not grant permission to use JDH
trademarks or trade name in a trademark sense to endorse or promote
products or services of Licensee, or any third party.

8. By copying, installing or otherwise using matplotlib,
Licensee agrees to be bound by the terms and conditions of this License
Agreement.
```

### L70

Python Software Foundation License · 1 archivo

```text
The cmr10.pfb file is a Type-1 version of one of Knuth's Computer Modern fonts.
It is included here as test data only, but the following license applies.

Copyright (c) 1997, 2009, American Mathematical Society (http://www.ams.org).
All Rights Reserved.

"cmb10" is a Reserved Font Name for this Font Software.
"cmbsy10" is a Reserved Font Name for this Font Software.
"cmbsy5" is a Reserved Font Name for this Font Software.
"cmbsy6" is a Reserved Font Name for this Font Software.
"cmbsy7" is a Reserved Font Name for this Font Software.
"cmbsy8" is a Reserved Font Name for this Font Software.
"cmbsy9" is a Reserved Font Name for this Font Software.
"cmbx10" is a Reserved Font Name for this Font Software.
"cmbx12" is a Reserved Font Name for this Font Software.
"cmbx5" is a Reserved Font Name for this Font Software.
"cmbx6" is a Reserved Font Name for this Font Software.
"cmbx7" is a Reserved Font Name for this Font Software.
"cmbx8" is a Reserved Font Name for this Font Software.
"cmbx9" is a Reserved Font Name for this Font Software.
"cmbxsl10" is a Reserved Font Name for this Font Software.
"cmbxti10" is a Reserved Font Name for this Font Software.
"cmcsc10" is a Reserved Font Name for this Font Software.
"cmcsc8" is a Reserved Font Name for this Font Software.
"cmcsc9" is a Reserved Font Name for this Font Software.
"cmdunh10" is a Reserved Font Name for this Font Software.
"cmex10" is a Reserved Font Name for this Font Software.
"cmex7" is a Reserved Font Name for this Font Software.
"cmex8" is a Reserved Font Name for this Font Software.
"cmex9" is a Reserved Font Name for this Font Software.
"cmff10" is a Reserved Font Name for this Font Software.
"cmfi10" is a Reserved Font Name for this Font Software.
"cmfib8" is a Reserved Font Name for this Font Software.
"cminch" is a Reserved Font Name for this Font Software.
"cmitt10" is a Reserved Font Name for this Font Software.
"cmmi10" is a Reserved Font Name for this Font Software.
"cmmi12" is a Reserved Font Name for this Font Software.
"cmmi5" is a Reserved Font Name for this Font Software.
"cmmi6" is a Reserved Font Name for this Font Software.
"cmmi7" is a Reserved Font Name for this Font Software.
"cmmi8" is a Reserved Font Name for this Font Software.
"cmmi9" is a Reserved Font Name for this Font Software.
"cmmib10" is a Reserved Font Name for this Font Software.
"cmmib5" is a Reserved Font Name for this Font Software.
"cmmib6" is a Reserved Font Name for this Font Software.
"cmmib7" is a Reserved Font Name for this Font Software.
"cmmib8" is a Reserved Font Name for this Font Software.
"cmmib9" is a Reserved Font Name for this Font Software.
"cmr10" is a Reserved Font Name for this Font Software.
"cmr12" is a Reserved Font Name for this Font Software.
"cmr17" is a Reserved Font Name for this Font Software.
"cmr5" is a Reserved Font Name for this Font Software.
"cmr6" is a Reserved Font Name for this Font Software.
"cmr7" is a Reserved Font Name for this Font Software.
"cmr8" is a Reserved Font Name for this Font Software.
"cmr9" is a Reserved Font Name for this Font Software.
"cmsl10" is a Reserved Font Name for this Font Software.
"cmsl12" is a Reserved Font Name for this Font Software.
"cmsl8" is a Reserved Font Name for this Font Software.
"cmsl9" is a Reserved Font Name for this Font Software.
"cmsltt10" is a Reserved Font Name for this Font Software.
"cmss10" is a Reserved Font Name for this Font Software.
"cmss12" is a Reserved Font Name for this Font Software.
"cmss17" is a Reserved Font Name for this Font Software.
"cmss8" is a Reserved Font Name for this Font Software.
"cmss9" is a Reserved Font Name for this Font Software.
"cmssbx10" is a Reserved Font Name for this Font Software.
"cmssdc10" is a Reserved Font Name for this Font Software.
"cmssi10" is a Reserved Font Name for this Font Software.
"cmssi12" is a Reserved Font Name for this Font Software.
"cmssi17" is a Reserved Font Name for this Font Software.
"cmssi8" is a Reserved Font Name for this Font Software.
"cmssi9" is a Reserved Font Name for this Font Software.
"cmssq8" is a Reserved Font Name for this Font Software.
"cmssqi8" is a Reserved Font Name for this Font Software.
"cmsy10" is a Reserved Font Name for this Font Software.
"cmsy5" is a Reserved Font Name for this Font Software.
"cmsy6" is a Reserved Font Name for this Font Software.
"cmsy7" is a Reserved Font Name for this Font Software.
"cmsy8" is a Reserved Font Name for this Font Software.
"cmsy9" is a Reserved Font Name for this Font Software.
"cmtcsc10" is a Reserved Font Name for this Font Software.
"cmtex10" is a Reserved Font Name for this Font Software.
"cmtex8" is a Reserved Font Name for this Font Software.
"cmtex9" is a Reserved Font Name for this Font Software.
"cmti10" is a Reserved Font Name for this Font Software.
"cmti12" is a Reserved Font Name for this Font Software.
"cmti7" is a Reserved Font Name for this Font Software.
"cmti8" is a Reserved Font Name for this Font Software.
"cmti9" is a Reserved Font Name for this Font Software.
"cmtt10" is a Reserved Font Name for this Font Software.
"cmtt12" is a Reserved Font Name for this Font Software.
"cmtt8" is a Reserved Font Name for this Font Software.
"cmtt9" is a Reserved Font Name for this Font Software.
"cmu10" is a Reserved Font Name for this Font Software.
"cmvtt10" is a Reserved Font Name for this Font Software.
"euex10" is a Reserved Font Name for this Font Software.
"euex7" is a Reserved Font Name for this Font Software.
"euex8" is a Reserved Font Name for this Font Software.
"euex9" is a Reserved Font Name for this Font Software.
"eufb10" is a Reserved Font Name for this Font Software.
"eufb5" is a Reserved Font Name for this Font Software.
"eufb7" is a Reserved Font Name for this Font Software.
"eufm10" is a Reserved Font Name for this Font Software.
"eufm5" is a Reserved Font Name for this Font Software.
"eufm7" is a Reserved Font Name for this Font Software.
"eurb10" is a Reserved Font Name for this Font Software.
"eurb5" is a Reserved Font Name for this Font Software.
"eurb7" is a Reserved Font Name for this Font Software.
"eurm10" is a Reserved Font Name for this Font Software.
"eurm5" is a Reserved Font Name for this Font Software.
"eurm7" is a Reserved Font Name for this Font Software.
"eusb10" is a Reserved Font Name for this Font Software.
"eusb5" is a Reserved Font Name for this Font Software.
"eusb7" is a Reserved Font Name for this Font Software.
"eusm10" is a Reserved Font Name for this Font Software.
"eusm5" is a Reserved Font Name for this Font Software.
"eusm7" is a Reserved Font Name for this Font Software.
"lasy10" is a Reserved Font Name for this Font Software.
"lasy5" is a Reserved Font Name for this Font Software.
"lasy6" is a Reserved Font Name for this Font Software.
"lasy7" is a Reserved Font Name for this Font Software.
"lasy8" is a Reserved Font Name for this Font Software.
"lasy9" is a Reserved Font Name for this Font Software.
"lasyb10" is a Reserved Font Name for this Font Software.
"lcircle1" is a Reserved Font Name for this Font Software.
"lcirclew" is a Reserved Font Name for this Font Software.
"lcmss8" is a Reserved Font Name for this Font Software.
"lcmssb8" is a Reserved Font Name for this Font Software.
"lcmssi8" is a Reserved Font Name for this Font Software.
"line10" is a Reserved Font Name for this Font Software.
"linew10" is a Reserved Font Name for this Font Software.
"msam10" is a Reserved Font Name for this Font Software.
"msam5" is a Reserved Font Name for this Font Software.
"msam6" is a Reserved Font Name for this Font Software.
"msam7" is a Reserved Font Name for this Font Software.
"msam8" is a Reserved Font Name for this Font Software.
"msam9" is a Reserved Font Name for this Font Software.
"msbm10" is a Reserved Font Name for this Font Software.
"msbm5" is a Reserved Font Name for this Font Software.
"msbm6" is a Reserved Font Name for this Font Software.
"msbm7" is a Reserved Font Name for this Font Software.
"msbm8" is a Reserved Font Name for this Font Software.
"msbm9" is a Reserved Font Name for this Font Software.
"wncyb10" is a Reserved Font Name for this Font Software.
"wncyi10" is a Reserved Font Name for this Font Software.
"wncyr10" is a Reserved Font Name for this Font Software.
"wncysc10" is a Reserved Font Name for this Font Software.
"wncyss10" is a Reserved Font Name for this Font Software.

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL

-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded, 
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

### L71

Python Software Foundation License · 1 archivo

```text
BaKoMa Fonts Licence
			--------------------

  This licence covers two font packs (known as BaKoMa Fonts Collection,
  which is available at `CTAN:fonts/cm/ps-type1/bakoma/'):

    1) BaKoMa-CM (1.1/12-Nov-94)
       Computer Modern Fonts in PostScript Type 1 and TrueType font formats.

    2) BaKoMa-AMS (1.2/19-Jan-95)
       AMS TeX fonts in PostScript Type 1 and TrueType font formats.
   
  Copyright (C) 1994, 1995, Basil K. Malyshev. All Rights Reserved.

  Permission to copy and distribute these fonts for any purpose is 
  hereby granted without fee, provided that the above copyright notice, 
  author statement and this permission notice appear in all copies of 
  these fonts and related documentation.

  Permission to modify and distribute modified fonts for any purpose is 
  hereby granted without fee, provided that the copyright notice, 
  author statement, this permission notice and location of original 
  fonts (http://www.ctan.org/tex-archive/fonts/cm/ps-type1/bakoma)
  appear in all copies of modified fonts and related documentation.

  Permission to use these fonts (embedding into PostScript, PDF, SVG
  and printing by using any software) is hereby granted without fee. 
  It is not required to provide any notices about using these fonts.

 Basil K. Malyshev
 INSTITUTE FOR HIGH ENERGY PHYSICS
 IHEP, OMVT
 Moscow Region
 142281 PROTVINO
 RUSSIA

 E-Mail:	bakoma@mail.ru
      or	malyshev@mail.ihep.ru
```

### L72

Python Software Foundation License · 1 archivo

```text
----> we renamed carlito -> carlogo to comply with the terms <----

Copyright (c) 2010-2013 by tyPoland Lukasz Dziedzic with Reserved Font Name "Carlito".

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at: http://scripts.sil.org/OFL

-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide development of collaborative font projects, to support the font creation efforts of academic and linguistic communities, and to provide a free and open framework in which fonts may be shared and improved in partnership with others.

The OFL allows the licensed fonts to be used, studied, modified and redistributed freely as long as they are not sold by themselves. The fonts, including any derivative works, can be bundled, embedded, redistributed and/or sold with any software provided that any reserved names are not used by derivative works. The fonts and derivatives, however, cannot be released under any other type of license. The requirement for fonts to remain under this license does not apply to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright Holder(s) under this license and clearly marked as such. This may include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the copyright statement(s).

"Original Version" refers to the collection of Font Software components as distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting, or substituting -- in part or in whole -- any of the components of the Original Version, by changing formats or by porting the Font Software to a new environment.

"Author" refers to any designer, engineer, programmer, technical writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining a copy of the Font Software, to use, study, copy, merge, embed, modify, redistribute, and sell modified and unmodified copies of the Font Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components, in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled, redistributed and/or sold with any software, provided that each copy contains the above copyright notice and this license. These can be included either as stand-alone text files, human-readable headers or in the appropriate machine-readable metadata fields within text or binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font Name(s) unless explicit written permission is granted by the corresponding Copyright Holder. This restriction only applies to the primary font name as presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font Software shall not be used to promote, endorse or advertise any Modified Version, except to acknowledge the contribution(s) of the Copyright Holder(s) and the Author(s) or with their explicit written permission.

5) The Font Software, modified or unmodified, in part or in whole, must be distributed entirely under this license, and must not be distributed under any other license. The requirement for fonts to remain under this license does not apply to any document created using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM OTHER DEALINGS IN THE FONT SOFTWARE.
```

### L73

Python Software Foundation License · 1 archivo

```text
Apache-Style Software License for ColorBrewer software and ColorBrewer Color Schemes

Copyright (c) 2002 Cynthia Brewer, Mark Harrower, and The Pennsylvania State University.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.
```

### L74

Python Software Foundation License · 1 archivo

```text
The Courier10PitchBT-Bold.pfb file is a Type-1 version of
Courier 10 Pitch BT Bold by Bitstream, obtained from
<https://ctan.org/tex-archive/fonts/courierten>. It is included
here as test data only, but the following license applies.

(c) Copyright 1989-1992, Bitstream Inc., Cambridge, MA.

You are hereby granted permission under all Bitstream propriety rights
to use, copy, modify, sublicense, sell, and redistribute the 4 Bitstream
Charter (r) Type 1 outline fonts and the 4 Courier Type 1 outline fonts
for any purpose and without restriction; provided, that this notice is
left intact on all copies of such fonts and that Bitstream's trademark
is acknowledged as shown below on all unmodified copies of the 4 Charter
Type 1 fonts.

BITSTREAM CHARTER is a registered trademark of Bitstream Inc.
```

### L75

Python Software Foundation License · 1 archivo

```text
# CC0 1.0 Universal

## Statement of Purpose

The laws of most jurisdictions throughout the world automatically confer
exclusive Copyright and Related Rights (defined below) upon the creator and
subsequent owner(s) (each and all, an “owner”) of an original work of
authorship and/or a database (each, a “Work”).

Certain owners wish to permanently relinquish those rights to a Work for the
purpose of contributing to a commons of creative, cultural and scientific works
(“Commons”) that the public can reliably and without fear of later claims of
infringement build upon, modify, incorporate in other works, reuse and
redistribute as freely as possible in any form whatsoever and for any purposes,
including without limitation commercial purposes. These owners may contribute
to the Commons to promote the ideal of a free culture and the further
production of creative, cultural and scientific works, or to gain reputation or
greater distribution for their Work in part through the use and efforts of
others.

For these and/or other purposes and motivations, and without any expectation of
additional consideration or compensation, the person associating CC0 with a
Work (the “Affirmer”), to the extent that he or she is an owner of Copyright
and Related Rights in the Work, voluntarily elects to apply CC0 to the Work and
publicly distribute the Work under its terms, with knowledge of his or her
Copyright and Related Rights in the Work and the meaning and intended legal
effect of CC0 on those rights.

1. Copyright and Related Rights. A Work made available under CC0 may be
   protected by copyright and related or neighboring rights (“Copyright and
   Related Rights”). Copyright and Related Rights include, but are not limited
   to, the following:
   1. the right to reproduce, adapt, distribute, perform, display, communicate,
      and translate a Work;
   2. moral rights retained by the original author(s) and/or performer(s);
   3. publicity and privacy rights pertaining to a person’s image or likeness
      depicted in a Work;
   4. rights protecting against unfair competition in regards to a Work,
      subject to the limitations in paragraph 4(i), below;
   5. rights protecting the extraction, dissemination, use and reuse of data in
      a Work;
   6. database rights (such as those arising under Directive 96/9/EC of the
      European Parliament and of the Council of 11 March 1996 on the legal
      protection of databases, and under any national implementation thereof,
      including any amended or successor version of such directive); and
   7. other similar, equivalent or corresponding rights throughout the world
      based on applicable law or treaty, and any national implementations
      thereof.

2. Waiver. To the greatest extent permitted by, but not in contravention of,
   applicable law, Affirmer hereby overtly, fully, permanently, irrevocably and
   unconditionally waives, abandons, and surrenders all of Affirmer’s Copyright
   and Related Rights and associated claims and causes of action, whether now
   known or unknown (including existing as well as future claims and causes of
   action), in the Work (i) in all territories worldwide, (ii) for the maximum
   duration provided by applicable law or treaty (including future time
   extensions), (iii) in any current or future medium and for any number of
   copies, and (iv) for any purpose whatsoever, including without limitation
   commercial, advertising or promotional purposes (the “Waiver”). Affirmer
   makes the Waiver for the benefit of each member of the public at large and
   to the detriment of Affirmer’s heirs and successors, fully intending that
   such Waiver shall not be subject to revocation, rescission, cancellation,
   termination, or any other legal or equitable action to disrupt the quiet
   enjoyment of the Work by the public as contemplated by Affirmer’s express
   Statement of Purpose.

3. Public License Fallback. Should any part of the Waiver for any reason be
   judged legally invalid or ineffective under applicable law, then the Waiver
   shall be preserved to the maximum extent permitted taking into account
   Affirmer’s express Statement of Purpose. In addition, to the extent the
   Waiver is so judged Affirmer hereby grants to each affected person a
   royalty-free, non transferable, non sublicensable, non exclusive,
   irrevocable and unconditional license to exercise Affirmer’s Copyright and
   Related Rights in the Work (i) in all territories worldwide, (ii) for the
   maximum duration provided by applicable law or treaty (including future time
   extensions), (iii) in any current or future medium and for any number of
   copies, and (iv) for any purpose whatsoever, including without limitation
   commercial, advertising or promotional purposes (the “License”). The License
   shall be deemed effective as of the date CC0 was applied by Affirmer to the
   Work. Should any part of the License for any reason be judged legally
   invalid or ineffective under applicable law, such partial invalidity or
   ineffectiveness shall not invalidate the remainder of the License, and in
   such case Affirmer hereby affirms that he or she will not (i) exercise any
   of his or her remaining Copyright and Related Rights in the Work or (ii)
   assert any associated claims and causes of action with respect to the Work,
   in either case contrary to Affirmer’s express Statement of Purpose.

4. Limitations and Disclaimers.
   1. No trademark or patent rights held by Affirmer are waived, abandoned,
      surrendered, licensed or otherwise affected by this document.
   2. Affirmer offers the Work as-is and makes no representations or warranties
      of any kind concerning the Work, express, implied, statutory or
      otherwise, including without limitation warranties of title,
      merchantability, fitness for a particular purpose, non infringement, or
      the absence of latent or other defects, accuracy, or the present or
      absence of errors, whether or not discoverable, all to the greatest
      extent permissible under applicable law.
   3. Affirmer disclaims responsibility for clearing rights of other persons
      that may apply to the Work or any use thereof, including without
      limitation any person’s Copyright and Related Rights in the Work.
      Further, Affirmer disclaims responsibility for obtaining any necessary
      consents, permissions or other rights required for any use of the Work.
   4. Affirmer understands and acknowledges that Creative Commons is not a
      party to this document and has no duty or obligation with respect to this
      CC0 or use of the Work.

For more information, please see
http://creativecommons.org/publicdomain/zero/1.0/.
```

### L76

Python Software Foundation License · 1 archivo

```text
Qhull, Copyright (c) 1993-2020
                    
                            C.B. Barber
                           Arlington, MA 
                          
                               and

       The National Science and Technology Research Center for
        Computation and Visualization of Geometric Structures
                        (The Geometry Center)
                       University of Minnesota

                       email: qhull@qhull.org

This software includes Qhull from C.B. Barber and The Geometry Center.  
Files derived from Qhull 1.0 are copyrighted by the Geometry Center.  The
remaining files are copyrighted by C.B. Barber.  Qhull is free software 
and may be obtained via http from www.qhull.org.  It may be freely copied, 
modified, and redistributed under the following conditions:

1. All copyright notices must remain intact in all files.

2. A copy of this text file must be distributed along with any copies 
   of Qhull that you redistribute; this includes copies that you have 
   modified, or copies of programs or other software products that 
   include Qhull.

3. If you modify Qhull, you must include a notice giving the
   name of the person performing the modification, the date of
   modification, and the reason for such modification.

4. When distributing modified versions of Qhull, or other software 
   products that include Qhull, you must provide notice that the original 
   source code may be obtained as noted above.

5. There is no warranty or other guarantee of fitness for Qhull, it is 
   provided solely "as is".  Bug reports or fixes may be sent to 
   qhull_bug@qhull.org; the authors may or may not act on them as 
   they desire.
```

### L77

Python Software Foundation License · 1 archivo

```text
Module creating PyQt4 form dialogs/layouts to edit various type of parameters

formlayout License Agreement (MIT License)
------------------------------------------

Copyright (c) 2009 Pierre Raybaut

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
"""
```

### L78

Python Software Foundation License · 1 archivo

```text
https://github.com/altercation/solarized/blob/master/LICENSE
Copyright (c) 2011 Ethan Schoonover

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### L79

Python Software Foundation License · 1 archivo

```text
BSD-style license for gist/yorick colormaps.

Copyright:

  Copyright (c) 1996.  The Regents of the University of California.
			 All rights reserved.

Permission to use, copy, modify, and distribute this software for any
purpose without fee is hereby granted, provided that this entire
notice is included in all copies of any software which is or includes
a copy or modification of this software and in all copies of the
supporting documentation for such software.

This work was produced at the University of California, Lawrence
Livermore National Laboratory under contract no. W-7405-ENG-48 between
the U.S. Department of Energy and The Regents of the University of
California for the operation of UC LLNL.

			      DISCLAIMER

This software was prepared as an account of work sponsored by an
agency of the United States Government.  Neither the United States
Government nor the University of California nor any of their
employees, makes any warranty, express or implied, or assumes any
liability or responsibility for the accuracy, completeness, or
usefulness of any information, apparatus, product, or process
disclosed, or represents that its use would not infringe
privately-owned rights.  Reference herein to any specific commercial
products, process, or service by trade name, trademark, manufacturer,
or otherwise, does not necessarily constitute or imply its
endorsement, recommendation, or favoring by the United States
Government or the University of California.  The views and opinions of
authors expressed herein do not necessarily state or reflect those of
the United States Government or the University of California, and
shall not be used for advertising or product endorsement purposes.

				AUTHOR

David H. Munro wrote Yorick and Gist.  Berkeley Yacc (byacc) generated
the Yorick parser.  The routines in Math are from LAPACK and FFTPACK;
MathC contains C translations by David H. Munro.  The algorithms for
Yorick's random number generator and several special functions in
Yorick/include were taken from Numerical Recipes by Press, et. al.,
although the Yorick implementations are unrelated to those in
Numerical Recipes.  A small amount of code in Gist was adapted from
the X11R4 release, copyright M.I.T. -- the complete copyright notice
may be found in the (unused) file Gist/host.c.
```

### L80

BSD License · 1 archivo

```text
zlib License
  ------------

  Copyright (C) 2010 - 2019 ridiculous_fish, <libdivide@ridiculousfish.com>
  Copyright (C) 2016 - 2019 Kim Walisch, <kim.walisch@gmail.com>

  This software is provided 'as-is', without any express or implied
  warranty.  In no event will the authors be held liable for any damages
  arising from the use of this software.

  Permission is granted to anyone to use this software for any purpose,
  including commercial applications, and to alter it and redistribute it
  freely, subject to the following restrictions:

  1. The origin of this software must not be misrepresented; you must not
     claim that you wrote the original software. If you use this software
     in a product, an acknowledgment in the product documentation would be
     appreciated but is not required.
  2. Altered source versions must be plainly marked as such, and must not be
     misrepresented as being the original software.
  3. This notice may not be removed or altered from any source distribution.
```

### L81

BSD License · 1 archivo

```text
* Copyright (c) 2006, University of Georgia and Pierre G.F. Gerard-Marchant
* All rights reserved.
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*
*     * Redistributions of source code must retain the above copyright
*       notice, this list of conditions and the following disclaimer.
*     * Redistributions in binary form must reproduce the above copyright
*       notice, this list of conditions and the following disclaimer in the
*       documentation and/or other materials provided with the distribution.
*     * Neither the name of the University of Georgia nor the
*       names of its contributors may be used to endorse or promote products
*       derived from this software without specific prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND ANY
* EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
* WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE FOR ANY
* DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
* (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
* LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
* ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
* (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
* SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### L82

BSD License · 1 archivo

```text
**This software is dual-licensed under the The University of Illinois/NCSA
Open Source License (NCSA) and The 3-Clause BSD License**

# NCSA Open Source License
**Copyright (c) 2019 Kevin Sheppard. All rights reserved.**

Developed by: Kevin Sheppard (<kevin.sheppard@economics.ox.ac.uk>,
<kevin.k.sheppard@gmail.com>)
[http://www.kevinsheppard.com](http://www.kevinsheppard.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal with
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimers.

Redistributions in binary form must reproduce the above copyright notice, this
list of conditions and the following disclaimers in the documentation and/or
other materials provided with the distribution.

Neither the names of Kevin Sheppard, nor the names of any contributors may be
used to endorse or promote products derived from this Software without specific
prior written permission.

**THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
CONTRIBUTORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS WITH
THE SOFTWARE.**

# 3-Clause BSD License
**Copyright (c) 2019 Kevin Sheppard. All rights reserved.**

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice,
   this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors
   may be used to endorse or promote products derived from this software
   without specific prior written permission.

**THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
THE POSSIBILITY OF SUCH DAMAGE.**

# Components

Many parts of this module have been derived from original sources, 
often the algorithm's designer. Component licenses are located with 
the component code.
```

### L83

BSD License · 1 archivo

```text
Copyright (c) 2005-2024, NumPy Developers.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

    * Redistributions of source code must retain the above copyright
       notice, this list of conditions and the following disclaimer.

    * Redistributions in binary form must reproduce the above
       copyright notice, this list of conditions and the following
       disclaimer in the documentation and/or other materials provided
       with the distribution.

    * Neither the name of the NumPy Developers nor the names of any
       contributors may be used to endorse or promote products derived
       from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### L84

Apache-2.0 OR BSD-2-Clause · 1 archivo

```text
This software is made available under the terms of *either* of the licenses
found in LICENSE.APACHE or LICENSE.BSD. Contributions to this software is made
under the terms of *both* these licenses.
```

### L85

Apache-2.0 OR BSD-2-Clause · 1 archivo

```text
Copyright (c) Donald Stufft and individual contributors.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    1. Redistributions of source code must retain the above copyright notice,
       this list of conditions and the following disclaimer.

    2. Redistributions in binary form must reproduce the above copyright
       notice, this list of conditions and the following disclaimer in the
       documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### L86

MIT-CMU · 1 archivo

```text
The Python Imaging Library (PIL) is

    Copyright © 1997-2011 by Secret Labs AB
    Copyright © 1995-2011 by Fredrik Lundh and contributors

Pillow is the friendly PIL fork. It is

    Copyright © 2010 by Jeffrey A. Clark and contributors

Like PIL, Pillow is licensed under the open source MIT-CMU License:

By obtaining, using, and/or copying this software and/or its associated
documentation, you agree that you have read, understood, and will comply
with the following terms and conditions:

Permission to use, copy, modify and distribute this software and its
documentation for any purpose and without fee is hereby granted,
provided that the above copyright notice appears in all copies, and that
both that copyright notice and this permission notice appear in supporting
documentation, and that the name of Secret Labs AB or the author not be
used in advertising or publicity pertaining to distribution of the software
without specific, written prior permission.

SECRET LABS AB AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS
SOFTWARE, INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS.
IN NO EVENT SHALL SECRET LABS AB OR THE AUTHOR BE LIABLE FOR ANY SPECIAL,
INDIRECT OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
```

### L87

BSD License · 1 archivo

```text
Copyright 2017- Paul Ganssle <paul@ganssle.io>
Copyright 2017- dateutil contributors (see AUTHORS file)

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

The above license applies to all contributions after 2017-12-01, as well as
all contributions that have been re-licensed (see AUTHORS file for the list of
contributors who have re-licensed their code).
--------------------------------------------------------------------------------
dateutil - Extensions to the standard Python datetime module.

Copyright (c) 2003-2011 - Gustavo Niemeyer <gustavo@niemeyer.net>
Copyright (c) 2012-2014 - Tomi Pieviläinen <tomi.pievilainen@iki.fi>
Copyright (c) 2014-2016 - Yaron de Leeuw <me@jarondl.net>
Copyright (c) 2015-     - Paul Ganssle <paul@ganssle.io>
Copyright (c) 2015-     - dateutil contributors (see AUTHORS file)

All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice,
      this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
      and/or other materials provided with the distribution.
    * Neither the name of the copyright holder nor the names of its
      contributors may be used to endorse or promote products derived from
      this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The above BSD License Applies to all code, even that also covered by Apache 2.0.
```

### L88

BSD License · 1 archivo

```text
Copyright (C) 2010-2019 Max-Planck-Society
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this
  list of conditions and the following disclaimer in the documentation and/or
  other materials provided with the distribution.
* Neither the name of the copyright holder nor the names of its contributors may
  be used to endorse or promote products derived from this software without
  specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### L89

BSD License · 1 archivo

```text
BSD Software License

Pertains to ARPACK and P_ARPACK

Copyright (c) 1996-2008 Rice University.
Developed by D.C. Sorensen, R.B. Lehoucq, C. Yang, and K. Maschhoff.
All rights reserved.

Arpack has been renamed to arpack-ng.

Copyright (c) 2001-2011 - Scilab Enterprises
Updated by Allan Cornet, Sylvestre Ledru.

Copyright (c) 2010 - Jordi Gutiérrez Hermoso (Octave patch)

Copyright (c) 2007 - Sébastien Fabbro (gentoo patch)

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

- Redistributions of source code must retain the above copyright
  notice, this list of conditions and the following disclaimer.

- Redistributions in binary form must reproduce the above copyright
  notice, this list of conditions and the following disclaimer listed
  in this license in the documentation and/or other materials
  provided with the distribution.

- Neither the name of the copyright holders nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### L90

BSD License · 1 archivo

```text
Qhull, Copyright (c) 1993-2019
                    
                            C.B. Barber
                           Arlington, MA 
                          
                               and

       The National Science and Technology Research Center for
        Computation and Visualization of Geometric Structures
                        (The Geometry Center)
                       University of Minnesota

                       email: qhull@qhull.org

This software includes Qhull from C.B. Barber and The Geometry Center.  
Qhull is copyrighted as noted above.  Qhull is free software and may 
be obtained via http from www.qhull.org.  It may be freely copied, modified, 
and redistributed under the following conditions:

1. All copyright notices must remain intact in all files.

2. A copy of this text file must be distributed along with any copies 
   of Qhull that you redistribute; this includes copies that you have 
   modified, or copies of programs or other software products that 
   include Qhull.

3. If you modify Qhull, you must include a notice giving the
   name of the person performing the modification, the date of
   modification, and the reason for such modification.

4. When distributing modified versions of Qhull, or other software 
   products that include Qhull, you must provide notice that the original 
   source code may be obtained as noted above.

5. There is no warranty or other guarantee of fitness for Qhull, it is 
   provided solely "as is".  Bug reports or fixes may be sent to 
   qhull_bug@qhull.org; the authors may or may not act on them as 
   they desire.
```

### L91

BSD License · 1 archivo

```text
Copyright (c) 2001-2002 Enthought, Inc. 2003-2024, SciPy Developers.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

1. Redistributions of source code must retain the above copyright
   notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above
   copyright notice, this list of conditions and the following
   disclaimer in the documentation and/or other materials provided
   with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived
   from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

## Avisos NOTICE (Apache-2.0)

### es-toolkit 1.52.0 (npm)

```text
es-toolkit

Parts of the test suite and compatibility layer in es-toolkit/compat are
derived from Lodash (https://github.com/lodash/lodash).

Lodash copyright notice and MIT permission notice:

Copyright OpenJS Foundation and other contributors <https://openjsf.org/>

Based on Underscore.js, copyright Jeremy Ashkenas,
DocumentCloud and Investigative Reporters & Editors <http://underscorejs.org/>

This software consists of voluntary contributions made by many
individuals. For exact contribution history, see the revision history
available at https://github.com/lodash/lodash

The following license applies to all parts of this software except as
documented below:

====

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

