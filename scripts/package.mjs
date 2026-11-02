// Zips dist/ into store/out/, the file uploaded to the Chrome Web Store.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const { version } = JSON.parse(readFileSync(`${root}dist/manifest.json`, 'utf8'));
const zip = `${root}store/out/mermaid-render-atlassian-${version}.zip`;

mkdirSync(`${root}store/out`, { recursive: true });
rmSync(zip, { force: true });
execFileSync('zip', ['-qr', zip, '.', '-x', '.DS_Store'], { cwd: `${root}dist`, stdio: 'inherit' });
console.log(`Packaged ${zip}`);
