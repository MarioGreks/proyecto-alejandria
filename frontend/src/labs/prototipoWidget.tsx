// Página de pruebas (solo desarrollo): monta el LaboratorioWidget real con un laboratorio de frontend/public/_prototipo/fixtures.json,
// sin backend. Uso: http://localhost:1420/prototipo-widget.html?lab=black_scholes_merton
import { createRoot } from 'react-dom/client';
import 'katex/dist/katex.min.css';
import '../App.css';
import LaboratorioWidget from '../components/LaboratorioWidget';
import { aprobarLaboratorio, sha256Hex } from '../utils/labSpec';
import { API } from '../utils/api';
import PilarAscii from '../components/PilarAscii';

(async () => {
    const params = new URLSearchParams(location.search);
    if (params.has('pilar')) {                                  // ?pilar: solo el pilar ASCII girando (pantalla de arranque)
        createRoot(document.getElementById('raiz')!).render(<PilarAscii />);
        return;
    }
    if (params.has('formulas')) {                               // ?formulas: casos difíciles de KaTeX con el mismo markdown y CSS del panel
        const { default: ReactMarkdown } = await import('react-markdown');
        const { default: remarkMath } = await import('remark-math');
        const { default: rehypeKatex } = await import('rehype-katex');
        const { forceBlockMath, markdownComponents } = await import('../utils/markdown');
        const casos = [
            'Fracciones anidadas: $$P(N(s)=k\\mid N(t)=n)=\\frac{\\frac{e^{-\\lambda s}(\\lambda s)^k}{k!}\\frac{e^{-\\lambda(t-s)}(\\lambda(t-s))^{n-k}}{(n-k)!}}{\\frac{e^{-\\lambda t}(\\lambda t)^n}{n!}}.\n\\tag{9}$$',
            'Matriz y casos: $$A=\\begin{pmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\end{pmatrix},\\quad f(x)=\\begin{cases} x^2 & x\\ge 0 \\\\ -x & x<0 \\end{cases}$$',
            'Sumas e integrales: $$\\sum_{i=1}^{n}\\frac{1}{i^2}\\to\\frac{\\pi^2}{6},\\qquad \\int_{-\\infty}^{\\infty} e^{-x^2/2}\\,dx=\\sqrt{2\\pi}$$',
            'Alineadas: $$\\begin{aligned} \\mathbb{E}[X] &= \\sum_{k=0}^{\\infty} k\\,\\frac{e^{-\\lambda}\\lambda^k}{k!} \\\\ &= \\lambda e^{-\\lambda}\\sum_{j=0}^{\\infty}\\frac{\\lambda^{j}}{j!} = \\lambda \\end{aligned}$$',
            'Delimitadores grandes: $$\\left\\{ \\left(\\frac{a+b}{c}\\right)^{2} \\middle| \\sqrt{\\frac{x^2+y^2}{1+\\sqrt{z}}} \\right\\} \\binom{n}{k}\\overline{X}_n \\underbrace{x+y}_{s}$$',
            'En línea: la media $\\bar{X}=\\frac{1}{n}\\sum_{i=1}^n X_i$ y la varianza $\\sigma^2=\\mathbb{E}[(X-\\mu)^2]$ de $X\\sim\\mathrm{Pois}(\\lambda)$ con $\\lambda>0$ y $\\binom{n}{k}p^k(1-p)^{n-k}$.',
            'Muy larga (debe hacer scroll horizontal, sin cortar): $$a_1+a_2+a_3+a_4+a_5+a_6+a_7+a_8+a_9+a_{10}+a_{11}+a_{12}+a_{13}+a_{14}+a_{15}+a_{16}+a_{17}+a_{18}+a_{19}+a_{20}+a_{21}+a_{22}+a_{23}+a_{24}+a_{25}+a_{26}+a_{27}+a_{28}+a_{29}+a_{30}$$',
        ];
        createRoot(document.getElementById('raiz')!).render(
            <div className="markdown-container" style={{ lineHeight: 1.6, fontSize: 16, textAlign: 'justify', color: '#e0e0e0', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {casos.map((c, i) => <ReactMarkdown key={i} remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false }]]} components={markdownComponents}>{forceBlockMath(c)}</ReactMarkdown>)}
            </div>
        );
        return;
    }
    let lab;
    if (params.get('demo') === 'graficos') {                    // ?demo=graficos: barras apiladas, fill_between con where y escala log (sin backend ni fixtures)
        lab = {
            explicacion: 'Demostración de gráficos: apiladas, `where` y escala logarítmica.',
            controles: [{ variable: 'k', label: 'k', min: 1, max: 5, step: 0.5, default: 2 }],
            codigo: "import numpy as np\nimport matplotlib.pyplot as plt\nk = {k}\nfig, ax = plt.subplots(1, 3, figsize=(13, 4))\nx = np.arange(1, 6)\nax[0].bar(x, x * k, label='A')\nax[0].bar(x, x * 0.5 * k, bottom=x * k, label='B')\nax[0].legend(); ax[0].set_title('Apiladas')\nt = np.linspace(0, 10, 200)\ny = np.sin(t * k / 2)\nax[1].plot(t, y)\nax[1].fill_between(t, 0, y, where=y > 0, color='g', alpha=0.4, label='y > 0')\nax[1].legend(); ax[1].set_title('where')\nf = np.logspace(0, 4, 100)\nax[2].loglog(f, 1 / f ** (k / 2), label='ley de potencias')\nax[2].grid(True, alpha=0.3); ax[2].legend(); ax[2].set_title('loglog')\nplt.show()",
        };
    } else if (params.get('nodo')) {                                  // ?nodo=<id>: el laboratorio real de una neurona (necesita el backend)
        lab = (await (await fetch(`${API}/node/${params.get('nodo')}`)).json()).laboratorio;
    } else {
        const fixtures = await (await fetch('/_prototipo/fixtures.json')).json();
        lab = fixtures.find((f: any) => f.nombre === (params.get('lab') ?? fixtures[0].nombre)).laboratorio;
    }
    aprobarLaboratorio(await sha256Hex(lab.codigo));      // es de los originales: sin la pantalla de aprobación
    createRoot(document.getElementById('raiz')!).render(<LaboratorioWidget data={lab} nodeId="prueba_prototipo" />);
})();
