/**
 * Full-screen diagram viewer with zoom and pan. The rendered SVG is moved into
 * the viewer, not cloned, because Mermaid's markers and styles are keyed by
 * element id and a duplicate would resolve to the wrong copy.
 */
(() => {
  'use strict';

  const MIN_SCALE = 0.1;
  const MAX_SCALE = 10;
  const STEP = 1.25;
  const MAX_FIT_SCALE = 2;
  const PAD = 32;

  let current = null;

  const clamp = (s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

  function svgSize(svg) {
    const vb = svg.viewBox?.baseVal;
    if (vb?.width && vb?.height) return { w: vb.width, h: vb.height };
    const r = svg.getBoundingClientRect();
    return { w: r.width || 800, h: r.height || 600 };
  }

  function makeButton(label, title, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mr-viewer-button';
    b.textContent = label;
    b.title = title;
    b.addEventListener('click', onClick);
    return b;
  }

  /**
   * Opens the viewer for a rendered diagram.
   * @param {SVGSVGElement} svg The rendered diagram, currently in the page.
   * @param {{dark: boolean, returnFocus?: HTMLElement}} options
   */
  function open(svg, { dark, returnFocus }) {
    current?.close();

    const home = svg.parentElement;
    const saved = ['width', 'height', 'style'].map((a) => [a, svg.getAttribute(a)]);
    const { w, h } = svgSize(svg);

    const overlay = document.createElement('div');
    overlay.className = `mr-viewer${dark ? ' mr-viewer-dark' : ''}`;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Diagram viewer');
    overlay.tabIndex = -1;

    const stage = document.createElement('div');
    stage.className = 'mr-viewer-stage';
    const content = document.createElement('div');
    content.className = 'mr-viewer-content';
    stage.append(content);

    const level = document.createElement('span');
    level.className = 'mr-viewer-level';

    let scale = 1;
    let x = 0;
    let y = 0;
    let touched = false;

    const apply = () => {
      content.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      level.textContent = `${Math.round(scale * 100)}%`;
    };
    const zoomAt = (factor, cx, cy) => {
      const next = clamp(scale * factor);
      x = cx - ((cx - x) * next) / scale;
      y = cy - ((cy - y) * next) / scale;
      scale = next;
      touched = true;
      apply();
    };
    const zoomCentre = (factor) => zoomAt(factor, stage.clientWidth / 2, stage.clientHeight / 2);
    const setScale = (s) => {
      scale = s;
      x = (stage.clientWidth - w * scale) / 2;
      y = (stage.clientHeight - h * scale) / 2;
      apply();
    };
    const fit = () => {
      touched = false;
      setScale(clamp(Math.min((stage.clientWidth - 2 * PAD) / w, (stage.clientHeight - 2 * PAD) / h, MAX_FIT_SCALE)));
    };

    const toolbar = document.createElement('div');
    toolbar.className = 'mr-viewer-toolbar';
    toolbar.append(
      makeButton('−', 'Zoom out (-)', () => zoomCentre(1 / STEP)),
      level,
      makeButton('+', 'Zoom in (+)', () => zoomCentre(STEP)),
      makeButton('Fit', 'Fit to screen (0)', fit),
      makeButton('100%', 'Actual size (1)', () => {
        touched = true;
        setScale(1);
      }),
      makeButton('Close', 'Close (Esc)', () => close()),
    );

    const hint = document.createElement('div');
    hint.className = 'mr-viewer-hint';
    hint.textContent = 'Scroll or pinch to zoom, drag to pan';

    overlay.append(stage, toolbar, hint);

    stage.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const r = stage.getBoundingClientRect();
        const delta = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
        // Pinch gestures arrive as ctrl+wheel with small deltas.
        zoomAt(Math.exp(-delta * (e.ctrlKey ? 0.01 : 0.002)), e.clientX - r.left, e.clientY - r.top);
      },
      { passive: false },
    );

    let drag = null;
    stage.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      drag = { px: e.clientX, py: e.clientY, x, y };
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('mr-dragging');
    });
    stage.addEventListener('pointermove', (e) => {
      if (!drag) return;
      x = drag.x + e.clientX - drag.px;
      y = drag.y + e.clientY - drag.py;
      touched = true;
      apply();
    });
    const endDrag = () => {
      drag = null;
      stage.classList.remove('mr-dragging');
    };
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    // Stop keys reaching the page, whose single-key shortcuts would fire underneath.
    const swallow = (e) => e.stopPropagation();
    overlay.addEventListener('keyup', swallow);
    overlay.addEventListener('keypress', swallow);
    overlay.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const actions = {
        Escape: () => close(),
        '+': () => zoomCentre(STEP),
        '=': () => zoomCentre(STEP),
        '-': () => zoomCentre(1 / STEP),
        0: fit,
        1: () => {
          touched = true;
          setScale(1);
        },
      };
      const action = actions[e.key];
      if (action) {
        e.preventDefault();
        action();
      }
    });

    const onResize = () => {
      if (!touched) fit();
    };
    let wasFullscreen = false;
    const onFullscreenChange = () => {
      if (document.fullscreenElement === overlay) wasFullscreen = true;
      else if (wasFullscreen) close();
      onResize();
    };

    function close() {
      if (current?.overlay !== overlay) return;
      current = null;
      window.removeEventListener('resize', onResize);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      if (document.fullscreenElement === overlay) document.exitFullscreen().catch(() => {});
      overlay.remove();
      for (const [attr, value] of saved) {
        if (value === null) svg.removeAttribute(attr);
        else svg.setAttribute(attr, value);
      }
      // A re-render while the viewer was open leaves a newer diagram in place.
      if (home.isConnected && !home.querySelector('svg')) home.append(svg);
      returnFocus?.focus({ preventScroll: true });
    }

    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    svg.removeAttribute('style');
    content.append(svg);
    document.body.append(overlay);
    current = { overlay, close };

    window.addEventListener('resize', onResize);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    overlay.focus({ preventScroll: true });
    fit();
    overlay.requestFullscreen?.().catch(() => {});
  }

  globalThis.MermaidRenderViewer = { open };
})();
