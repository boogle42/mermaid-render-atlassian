import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/content/live.js';

const { mermaidLiveUrl } = globalThis.MermaidRenderLive;

async function decode(url) {
  const prefix = 'https://mermaid.live/edit#pako:';
  assert.ok(url.startsWith(prefix));
  const b64 = url.slice(prefix.length).replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
  return JSON.parse(await new Response(stream).text());
}

test('encodes source as a URL-safe pako editor state', async () => {
  const code = 'sequenceDiagram\n  A->>B: héllo & <b>bye</b> ✓';
  const url = await mermaidLiveUrl(code);
  assert.match(url.slice(url.indexOf('#') + 1), /^pako:[A-Za-z0-9_-]+$/);
  const state = await decode(url);
  assert.equal(state.code, code);
  assert.deepEqual(JSON.parse(state.mermaid), { theme: 'default' });
});
