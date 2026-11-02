/**
 * Builds https://mermaid.live editor links. The diagram travels in the URL
 * fragment, which browsers never send to the server, in the `pako:` format
 * Mermaid Live reads: zlib-deflated JSON editor state, base64url encoded.
 */
(() => {
  'use strict';

  function toBase64Url(bytes) {
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * @param {string} code Mermaid source.
   * @returns {Promise<string>} A mermaid.live editor URL that opens with this source.
   */
  async function mermaidLiveUrl(code) {
    const state = {
      code,
      mermaid: JSON.stringify({ theme: 'default' }, null, 2),
      autoSync: true,
      updateDiagram: true,
    };
    // CompressionStream 'deflate' is zlib format (RFC 1950), which is what pako.inflate expects.
    const stream = new Blob([JSON.stringify(state)]).stream().pipeThrough(new CompressionStream('deflate'));
    const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    return `https://mermaid.live/edit#pako:${toBase64Url(bytes)}`;
  }

  globalThis.MermaidRenderLive = { mermaidLiveUrl };
})();
