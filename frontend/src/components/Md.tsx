import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { markdownComponents, forceBlockMath, limpiarCitas } from '../utils/markdown';

/** Markdown con fórmulas KaTeX. `enLinea` quita el párrafo (para términos del glosario). */
export const Md = ({ texto, enLinea }: { texto: string; enLinea?: boolean }) => (
    <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false }]]}
        components={enLinea ? { ...markdownComponents, p: ({ node, ...props }: any) => <span {...props} /> } : markdownComponents}
    >
        {enLinea ? limpiarCitas(texto) : forceBlockMath(texto)}
    </ReactMarkdown>
);

export default Md;
