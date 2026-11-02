import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/content/detect.js';

const { isMermaidSource } = globalThis.MermaidRenderDetect;

test('recognises common diagram types', () => {
  for (const src of [
    'flowchart LR\n  a --> b',
    'graph TD;\n  a --> b',
    'graph\n  a --> b',
    'sequenceDiagram\n  participant A\n  A->>B: hi',
    'classDiagram\n  class A',
    'stateDiagram-v2\n  [*] --> A',
    'erDiagram\n  A ||--o{ B : has',
    'gantt\n  title Plan',
    'pie title Pets\n  "Dogs" : 3',
    'mindmap\n  root',
    'timeline\n  2024 : a',
    'xychart-beta\n  x-axis [a, b]',
    'architecture-beta\n  service a(server)[A]',
    'C4Context\n  Person(a, "A")',
  ]) {
    assert.equal(isMermaidSource(src), true, src);
  }
});

test('skips front matter, directives, comments and blank lines', () => {
  assert.equal(isMermaidSource('---\ntitle: Flow\n---\nflowchart LR\n  a --> b'), true);
  assert.equal(isMermaidSource('%%{init: {"theme": "forest"}}%%\nsequenceDiagram\n  A->>B: x'), true);
  assert.equal(isMermaidSource('\n\n%% a comment\n  flowchart TB\n  a --> b'), true);
});

test('handles the line-per-span text Atlassian renders, with trailing newlines', () => {
  assert.equal(isMermaidSource('flowchart TD\n    A[Start] --> B{Does it render?}\n'), true);
});

test('rejects ordinary code and prose', () => {
  for (const src of [
    '',
    '   ',
    'long maxFileSizeMb = (long) convertBytesToMb(x);',
    'graph of response times over the last week',
    'flowchart notes: see the wiki',
    'pieces of the puzzle',
    'The Data Source exceeds the 0 Mb size limit.',
    '{\n  "prompt": "is checkout slow"\n}',
    '$ git status',
    '---\ntitle: unterminated front matter',
  ]) {
    assert.equal(isMermaidSource(src), false, src);
  }
});
