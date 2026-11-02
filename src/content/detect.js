/**
 * Pure detection helpers, shared by the content script and the unit tests.
 * Loaded as a classic content script, so it publishes to globalThis rather
 * than using ES module exports.
 */
(() => {
  'use strict';

  /**
   * Where Atlassian products render code blocks, and which ancestor to hide
   * when a block is replaced by its diagram.
   *
   * Atlassian strips the `mermaid` language tag (it renders as `language-text`),
   * so these selectors find candidate blocks and isMermaidSource() decides.
   */
  const CODE_BLOCK_TARGETS = [
    // Jira, Confluence and Bitbucket PR descriptions/comments (Atlassian editor renderer).
    { selector: '[data-testid="renderer-code-block"] code', wrapper: '.code-block, [data-testid="renderer-code-block"]' },
    // Bitbucket file view and READMEs (Markdown renderer).
    { selector: 'div.codehilite > pre', wrapper: 'div.codehilite' },
  ];

  /** First-line keywords that declare a Mermaid diagram type. */
  const DIAGRAM_TYPES = new Set([
    'graph', 'flowchart', 'flowchart-elk',
    'sequenceDiagram',
    'classDiagram', 'classDiagram-v2',
    'stateDiagram', 'stateDiagram-v2',
    'erDiagram',
    'journey',
    'gantt',
    'pie',
    'quadrantChart',
    'requirementDiagram',
    'gitGraph',
    'C4Context', 'C4Container', 'C4Component', 'C4Dynamic', 'C4Deployment',
    'mindmap',
    'timeline',
    'zenuml',
    'sankey', 'sankey-beta',
    'xychart', 'xychart-beta',
    'block', 'block-beta',
    'packet', 'packet-beta',
    'kanban',
    'architecture', 'architecture-beta',
    'radar-beta',
    'treemap', 'treemap-beta',
  ]);

  const FLOW_DIRECTIONS = new Set(['TB', 'TD', 'BT', 'RL', 'LR']);

  /**
   * Returns the first line that declares the diagram, skipping YAML front
   * matter, `%%` comments and `%%{init}%%` directives, and blank lines.
   * @param {string} text
   * @returns {string|null}
   */
  function declarationLine(text) {
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    let i = 0;
    while (i < lines.length && lines[i].trim() === '') i++;
    if (lines[i]?.trim() === '---') {
      const end = lines.findIndex((l, j) => j > i && l.trim() === '---');
      if (end === -1) return null;
      i = end + 1;
    }
    for (; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '' || line.startsWith('%%')) continue;
      return line;
    }
    return null;
  }

  /**
   * True when the text is Mermaid source. Strict enough that prose such as
   * "graph of response times" is not mistaken for a diagram: `graph` and
   * `flowchart` need a direction or nothing after them; other types must be
   * the first word exactly.
   * @param {string} text
   * @returns {boolean}
   */
  function isMermaidSource(text) {
    const line = declarationLine(text);
    if (!line) return false;
    const [keyword, next] = line.split(/\s+/);
    if (!DIAGRAM_TYPES.has(keyword)) return false;
    if (keyword === 'graph' || keyword.startsWith('flowchart')) {
      return next === undefined || FLOW_DIRECTIONS.has(next.replace(/;$/, ''));
    }
    return true;
  }

  globalThis.MermaidRenderDetect = { CODE_BLOCK_TARGETS, DIAGRAM_TYPES, declarationLine, isMermaidSource };
})();
