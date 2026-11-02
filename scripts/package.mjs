// Zips dist/ into the file uploaded to the Chrome Web Store.
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const { version } = JSON.parse(readFileSync(`${root}dist/manifest.json`, 'utf8'));
const zip = `${root}mermaid-render-atlassian-${version}.zip`;

rmSync(zip, { force: true });
execFileSync('zip', ['-qr', zip, '.', '-x', '.DS_Store'], { cwd: `${root}dist`, stdio: 'inherit' });
console.log(`Packaged ${zip}`);
