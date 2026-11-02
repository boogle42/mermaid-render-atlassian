/**
 * Finds Mermaid code blocks on Jira, Confluence and Bitbucket pages and shows
 * each one as a diagram beside the original block, which is hidden but never
 * modified. Blocks that are not Mermaid are never touched.
 *
 * Mermaid itself (~5 MB) is injected by the service worker only on pages that
 * contain at least one Mermaid block.
 */
(() => {
  'use strict';

  // Static and dynamically registered content scripts can both match one page.
  if (globalThis.__mermaidRenderLoaded) return;
  globalThis.__mermaidRenderLoaded = true;

  const { CODE_BLOCK_TARGETS, isMermaidSource } = globalThis.MermaidRenderDetect;
  const CONTAINER_CLASS = 'mr-diagram';

  /**
   * Mermaid sizes HTML labels by measuring them, then the page shows them inside
   * Atlassian's renderer, whose `p { font; margin }` rules would make them taller
   * than measured and clip them. Mermaid scopes themeCSS under the diagram's id,
   * so these rules outrank the page's and apply identically at both moments.
   */
  const LABEL_CSS = `
    p { margin: 0 !important; font: inherit !important; }
    .label, .nodeLabel, .edgeLabel, .cluster-label, foreignObject div, p { line-height: 1.5 !important; }
  `;

  /** @type {Map<Element, {source: string, container: HTMLElement, canvas: HTMLElement, button: HTMLButtonElement, note: HTMLElement, view: 'diagram'|'source', theme: string|null, error: string|null}>} */
  const blocks = new Map();
  let themeSetting = 'auto';
  let mermaidLoading = null;
  let renderSeq = 0;
  let renderQueue = Promise.resolve();

  function loadMermaid() {
    if (globalThis.mermaid) return Promise.resolve(globalThis.mermaid);
    mermaidLoading ??= chrome.runtime.sendMessage({ type: 'load-mermaid' }).then((res) => {
      if (!res?.ok || !globalThis.mermaid) {
        mermaidLoading = null;
        throw new Error(res?.error || 'Mermaid failed to load');
      }
      return globalThis.mermaid;
    });
    return mermaidLoading;
  }

  function luminanceIsDark(cssColor) {
    const m = cssColor.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    if (a === 0) return null;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
  }

  /** Atlassian sets html[data-color-mode]; otherwise judge by the background behind the block. */
  function isDark(el) {
    if (themeSetting !== 'auto') return themeSetting === 'dark';
    const mode = document.documentElement.dataset.colorMode;
    if (mode === 'dark' || mode === 'light') return mode === 'dark';
    for (let n = el; n instanceof Element; n = n.parentElement) {
      const dark = luminanceIsDark(getComputedStyle(n).backgroundColor);
      if (dark !== null) return dark;
    }
    return matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function applyView(wrapper, state) {
    const showDiagram = state.view === 'diagram' && state.theme !== null && !state.error;
    if (showDiagram) wrapper.style.setProperty('display', 'none', 'important');
    else wrapper.style.removeProperty('display');
    state.canvas.hidden = !showDiagram;
    state.note.hidden = !state.error;
    state.button.hidden = state.theme === null || !!state.error;
    state.button.textContent = showDiagram ? 'Show source' : 'Show diagram';
  }

  function createState(wrapper, source) {
    const container = document.createElement('div');
    container.className = CONTAINER_CLASS;

    const toolbar = document.createElement('div');
    toolbar.className = 'mr-toolbar';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mr-button';
    button.hidden = true;
    toolbar.append(button);

    const canvas = document.createElement('div');
    canvas.className = 'mr-canvas';
    canvas.hidden = true;

    const note = document.createElement('div');
    note.className = 'mr-note';
    note.hidden = true;

    container.append(toolbar, canvas, note);
    const state = { source, container, canvas, button, note, view: 'diagram', theme: null, error: null };
    button.addEventListener('click', () => {
      state.view = state.view === 'diagram' ? 'source' : 'diagram';
      applyView(wrapper, state);
    });
    return state;
  }

  function enqueueRender(wrapper, state) {
    renderQueue = renderQueue
      .then(() => renderBlock(wrapper, state))
      .catch((err) => console.warn('[Mermaid Render]', err));
  }

  async function renderBlock(wrapper, state) {
    if (blocks.get(wrapper) !== state) return;
    const mermaid = await loadMermaid();
    const host = wrapper.parentElement ?? wrapper;
    const theme = isDark(host) ? 'dark' : 'default';
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      suppressErrorRendering: true,
      theme,
      fontFamily: getComputedStyle(host).fontFamily,
      themeCSS: LABEL_CSS,
    });
    const id = `mermaid-render-${++renderSeq}`;
    try {
      const { svg } = await mermaid.render(id, state.source);
      if (blocks.get(wrapper) !== state) return;
      // securityLevel 'strict' sanitises the SVG with DOMPurify before it is returned.
      state.canvas.innerHTML = svg;
      state.theme = theme;
      state.error = null;
    } catch (err) {
      document.getElementById(id)?.remove();
      document.getElementById(`d${id}`)?.remove();
      const message = String(err?.message ?? err);
      state.error = message.split('\n')[0];
      state.note.textContent = `Mermaid couldn't render this block: ${state.error}`;
      state.note.title = message;
    }
    applyView(wrapper, state);
  }

  function forget(wrapper, state) {
    state.container.remove();
    wrapper.style?.removeProperty('display');
    blocks.delete(wrapper);
  }

  function scan() {
    for (const [wrapper, state] of blocks) {
      if (!wrapper.isConnected) forget(wrapper, state);
    }
    for (const { selector, wrapper: wrapperSelector } of CODE_BLOCK_TARGETS) {
      for (const code of document.querySelectorAll(selector)) {
        if (code.closest(`.${CONTAINER_CLASS}, [contenteditable="true"]`)) continue;
        const wrapper = code.closest(wrapperSelector) ?? code;
        const source = code.textContent;
        const existing = blocks.get(wrapper);
        if (existing) {
          if (existing.source === source) {
            // React re-renders can drop our sibling or reset the inline style.
            if (existing.container.previousElementSibling !== wrapper) wrapper.after(existing.container);
            applyView(wrapper, existing);
            continue;
          }
          forget(wrapper, existing);
        }
        if (!isMermaidSource(source)) continue;
        const state = createState(wrapper, source);
        wrapper.after(state.container);
        blocks.set(wrapper, state);
        enqueueRender(wrapper, state);
      }
    }
  }

  function rerenderForTheme() {
    for (const [wrapper, state] of blocks) {
      const wanted = isDark(wrapper.parentElement ?? wrapper) ? 'dark' : 'default';
      if (state.theme !== null && state.theme !== wanted) enqueueRender(wrapper, state);
    }
  }

  let scanTimer = null;
  function scheduleScan() {
    if (scanTimer !== null) return;
    scanTimer = setTimeout(() => {
      scanTimer = null;
      scan();
    }, 150);
  }

  const insideOurs = (node) => {
    const el = node instanceof Element ? node : node.parentElement;
    return !!el?.closest(`.${CONTAINER_CLASS}`);
  };

  new MutationObserver((mutations) => {
    if (mutations.every((m) => insideOurs(m.target))) return;
    scheduleScan();
  }).observe(document.body, { childList: true, subtree: true, characterData: true });

  new MutationObserver(rerenderForTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-color-mode', 'data-theme', 'class', 'style'],
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', rerenderForTheme);

  chrome.storage.sync.get({ theme: 'auto' }).then(({ theme }) => {
    themeSetting = theme;
    scan();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.theme) {
      themeSetting = changes.theme.newValue ?? 'auto';
      rerenderForTheme();
    }
  });
})();
