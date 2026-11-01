# Proyecto Alejandría

**Español** · [English](#english)

Tu segundo cerebro, local y privado. Cada concepto que aprendes es una **neurona** en un universo 3D; las **sinapsis** (conexiones) las propone una IA que corre en tu propio ordenador. Cada neurona trae teoría, glosario, ejercicios y un **laboratorio**: una simulación en Python que se ejecuta en la propia ventana (Pyodide/WebAssembly), sin internet y sin tocar tus archivos.

<p align="center"><img src="frontend/public/logo.png" alt="Proyecto Alejandría" width="160"></p>

> **Estado: versión temprana (0.1).** Solo Windows 10/11.

## Instalar

1. Descarga `Proyecto-Alejandria-Setup.exe` de la página de [Releases](../../releases).
2. **Comprueba que no está alterado** (opcional, recomendable): en PowerShell, `Get-FileHash .\Proyecto-Alejandria-Setup.exe -Algorithm SHA256` debe dar el mismo valor que `SHA256SUMS.txt` de esa Release.
3. Ejecútalo. **Windows SmartScreen avisará** («Windows protegió su PC») porque el instalador **no está firmado** (la firma de código cuesta dinero y este es un proyecto personal). Pulsa *Más información → Ejecutar de todas formas*. Solo conviene hacerlo si lo has descargado de esta Release y el hash coincide.
4. El asistente te deja elegir dónde va la aplicación, el «motor» (Python y librerías, ~500 MB), tus neuronas y, si quieres, instalar **Ollama** (la IA local, 1,6 GB) con un modelo. Todo se descarga una sola vez; no hace falta ser administrador.

<p align="center">
<img src="docs/img/instalador-1.png" width="48%" alt="Bienvenida">
<img src="docs/img/instalador-2.png" width="48%" alt="Carpetas">
<img src="docs/img/instalador-3.png" width="48%" alt="Componentes">
<img src="docs/img/instalador-5.png" width="48%" alt="Instalando">
</p>

## Qué hace

- **Neuronas**: pega el JSON que te devuelva tu IA favorita (hay dos prompts listos en el Inyector Neuronal; el de exploración le pide consultar Google Scholar) y la app lo clasifica en una rama y lo coloca en el universo.
- **Sinapsis**: una IA local (Ollama) propone conexiones con su razón; tú las aceptas o rechazas, y lo rechazado no se vuelve a proponer.
- **Laboratorios editables**: mueve los controles y el gráfico se redibuja al instante (barras, líneas, áreas, escala logarítmica...); puedes cambiar variables, rangos y código.
- **Tus datos son tuyos**: todo vive en una carpeta local; Ajustes permite exportar e importar neuronas, elegir el modelo de IA o desactivarla.
- **Tutorial** en la primera ejecución y 3 neuronas de ejemplo opcionales.

## Privacidad

Nada sale de tu equipo: la IA corre en local, el backend solo escucha en `127.0.0.1` y rechaza peticiones de otros orígenes, la app aplica una política de contenido (CSP) estricta y el código de los laboratorios se ejecuta aislado en WebAssembly y pide tu aprobación antes de correr. La única red que se usa es para descargar (una vez) uv, Python, las librerías, el modelo de clasificación y, si lo eliges, Ollama y su modelo.

## Desarrollo

Necesitas [Python](https://www.python.org/) 3.11+ (probado con 3.13), [Node.js](https://nodejs.org/) 20+ y [Rust](https://rustup.rs/).

```bash
alejandria.bat                    # backend de desarrollo (crea el entorno la primera vez)
cd frontend && npm install && npm run tauri dev
```

La primera vez, `npm run dev`/`build` descarga Pyodide (~40 MB, comprobado con sha256) a `frontend/public/pyodide/`.

```bash
cd frontend && npm run instalador # compila la app y construye el instalador (frontend/installer/)
cd backend && .venv\Scripts\python.exe -m unittest test_backend
cd frontend && npm test && npx tsc --noEmit
```

El instalador se puede probar sin tocar tu sistema: `Proyecto-Alejandria-Setup.exe /PRUEBA=C:\carpeta` lo hace todo dentro de esa carpeta.

## Licencia

[MIT](LICENSE)

### Modelos de IA y software de terceros

Proyecto Alejandría **no incluye ningún modelo de IA**. El instalador los descarga una sola vez desde su origen; son **gratuitos y de pesos abiertos (sin coste)**, y cada uno tiene su propia licencia. La licencia MIT de este proyecto cubre solo su código.

| Qué | Para qué | Licencia |
| --- | --- | --- |
| `paraphrase-multilingual-MiniLM-L12-v2` (Hugging Face, con fastembed) | Clasificar apuntes | Apache-2.0 |
| `phi3:mini` (Microsoft, con Ollama) | Razonar las sinapsis (por defecto) | MIT |
| `qwen2.5` (Alibaba, con Ollama), alternativa | Razonar las sinapsis | Apache-2.0 (0.5B, 1.5B, 7B, 14B, 32B). **3B**: licencia Qwen Research, solo investigación o evaluación, **no comercial**. **72B**: licencia Qwen, con condiciones propias (pide licencia a quien supera los 100 millones de usuarios activos al mes) |
| [Ollama](https://ollama.com) | Ejecutar la IA en tu equipo | MIT |
| [Pyodide](https://pyodide.org) | Ejecutar los laboratorios de Python | MPL-2.0 |

Gratuito no siempre significa de código abierto en el sentido de la OSI: los Qwen 3B y 72B son de pesos abiertos y sin coste, pero con restricciones de uso. Si eliges otro modelo, revisa su licencia, sobre todo antes de un uso comercial.

---

## English

Your second brain, local and private. Every concept you learn is a **neuron** in a 3D universe; **synapses** (links) are proposed by an AI running on your own machine. Each neuron carries theory, a glossary, exercises and a **lab**: a Python simulation that runs inside the window itself (Pyodide/WebAssembly), offline and without touching your files.

> **Status: early version (0.1).** Windows 10/11 only. The interface is in Spanish.

### Install

1. Download `Proyecto-Alejandria-Setup.exe` from the [Releases](../../releases) page.
2. **Verify it** (optional but recommended): in PowerShell, `Get-FileHash .\Proyecto-Alejandria-Setup.exe -Algorithm SHA256` must match `SHA256SUMS.txt` in that release.
3. Run it. **Windows SmartScreen will warn you** ("Windows protected your PC") because the installer is **not code-signed** (a certificate costs money and this is a personal project). Click *More info → Run anyway*, and only if you downloaded it from this release and the hash matches.
4. The wizard lets you choose where the app, the "engine" (Python and libraries, ~500 MB) and your neurons go, and optionally install **Ollama** (local AI, 1.6 GB) with a model. Everything is downloaded once; no administrator rights needed.

### Features

- **Neurons**: paste the JSON your favourite AI returns (two ready-made prompts are in the Neural Injector; the exploration one asks the AI to consult Google Scholar); the app sorts it into a branch and places it in the universe.
- **Synapses**: a local AI (Ollama) proposes links with a reason; you accept or reject them, and rejected links are never proposed again.
- **Editable labs**: move the controls and the chart redraws instantly (bars, lines, areas, log scale...); you can change variables, ranges and code.
- **Your data is yours**: everything lives in a local folder; Settings lets you export/import neurons, pick the AI model or turn the AI off.
- **Tutorial** on first run and 3 optional example neurons.

### Privacy

Nothing leaves your machine: the AI runs locally, the backend only listens on `127.0.0.1` and rejects requests from other origins, the app enforces a strict Content Security Policy, and lab code runs sandboxed in WebAssembly and asks for your approval before running. The network is only used to download (once) uv, Python, the libraries, the classification model and, if you choose it, Ollama and its model.

### Development

Requirements: Python 3.11+ (tested with 3.13), Node.js 20+ and Rust.

```bash
alejandria.bat                    # development backend (creates the environment on first run)
cd frontend && npm install && npm run tauri dev
cd frontend && npm run instalador # builds the app and the installer (frontend/installer/)
```

The installer can be tried without touching your system: `Proyecto-Alejandria-Setup.exe /PRUEBA=C:\folder` does everything inside that folder.

### License

[MIT](LICENSE)

#### AI models and third-party software

Proyecto Alejandría **does not ship any AI model**. The installer downloads them once from their source; they are **free of charge and open-weight**, and each has its own license. This project's MIT license covers its code only.

| What | Used for | License |
| --- | --- | --- |
| `paraphrase-multilingual-MiniLM-L12-v2` (Hugging Face, via fastembed) | Classifying notes | Apache-2.0 |
| `phi3:mini` (Microsoft, via Ollama) | Reasoning about synapses (default) | MIT |
| `qwen2.5` (Alibaba, via Ollama), alternative | Reasoning about synapses | Apache-2.0 (0.5B, 1.5B, 7B, 14B, 32B). **3B**: Qwen Research License, research or evaluation only, **non-commercial**. **72B**: Qwen License, with its own terms (a license is required above 100 million monthly active users) |
| [Ollama](https://ollama.com) | Running the AI on your machine | MIT |
| [Pyodide](https://pyodide.org) | Running the Python labs | MPL-2.0 |

Free of charge does not always mean open source in the OSI sense: Qwen 3B and 72B are open-weight and cost nothing, but have usage restrictions. If you pick another model, check its license, especially before commercial use.
