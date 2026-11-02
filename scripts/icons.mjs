// Renders scripts/icon.svg to the PNG sizes the manifest declares. Needs rsvg-convert (brew install librsvg).
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
for (const size of [16, 32, 48, 128]) {
  execFileSync('rsvg-convert', ['-w', String(size), '-h', String(size), '-o', `${root}src/icons/icon${size}.png`, `${root}scripts/icon.svg`]);
}
console.log('Icons written to src/icons/');
