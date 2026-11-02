// Assembles the loadable extension in dist/: src/ plus the vendored Mermaid bundle.
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = `${root}dist`;

rmSync(dist, { recursive: true, force: true });
cpSync(`${root}src`, dist, { recursive: true });
mkdirSync(`${dist}/vendor`, { recursive: true });
cpSync(`${root}node_modules/mermaid/dist/mermaid.min.js`, `${dist}/vendor/mermaid.min.js`);
cpSync(`${root}node_modules/mermaid/LICENSE`, `${dist}/vendor/MERMAID-LICENSE`);

console.log(`Built ${dist}`);
