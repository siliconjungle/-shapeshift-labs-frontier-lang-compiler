import { existsSync, readFileSync } from 'node:fs';
import { assert } from './helpers.mjs';

const matrixUrl = new URL('../../research/semantic-merge-production-matrix.md', import.meta.url);
const rootUrl = new URL('../../', import.meta.url);
const matrixMarkdown = readFileSync(matrixUrl, 'utf8');

const jsTsAnchors = ['JavaScript syntax and runtime semantics', 'TypeScript symbols, types, and diagnostics'];
const jsxAnchors = ['JSX/TSX parser and React-like layout hazards', ...jsTsAnchors];
const htmlCssAnchors = ['HTML tree construction and runtime boundaries', 'CSS syntax, selectors, cascade, and at-rules'];
const cssModulesAnchors = ['CSS Modules contracts', 'CSS syntax, selectors, cascade, and at-rules', 'JSX/TSX parser and React-like layout hazards'];
const rowProofs = new Map([
  ['JS/TS parser, source spans, and trivia', {
    anchors: jsTsAnchors,
    evidence: ['test/smoke/js-ts-syntax-parser-trivia-evidence.mjs', 'test/smoke/js-ts-source-span-parser-trivia-exactness.mjs'],
    remaining: ['Live real-repo checkout proof', 'Row-level source citations and CI extraction']
  }],
  ['JS/TS scope and use-def graph', {
    anchors: jsTsAnchors,
    evidence: ['test/smoke/js-ts-safe-merge-binding-patterns.mjs', 'test/smoke/js-ts-safe-project-merge-scope-use-def-graph.mjs'],
    remaining: ['Live real-repo checkout proof', 'Row-level source citations and CI extraction']
  }],
  ['JS/TS module/export/import graph', {
    anchors: jsTsAnchors,
    evidence: ['test/smoke/js-ts-safe-merge-import-shapes.mjs', 'test/smoke/project-symbol-graph-commonjs-interop.mjs'],
    remaining: ['Live real-repo checkout proof', 'JS/TS live project diagnostics/declaration proof']
  }],
  ['JS/TS public API and type graph', {
    anchors: jsTsAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-compiler-type-graph.mjs', 'test/smoke/js-ts-safe-project-merge-public-api-declaration-emit-parity.mjs'],
    remaining: ['JS/TS live project diagnostics/declaration proof']
  }],
  ['JS/TS control-flow and effect graph', {
    anchors: jsTsAnchors,
    evidence: ['test/smoke/semantic-effect-runtime-order-evidence.mjs', 'test/smoke/semantic-effect-runtime-resource-management.mjs'],
    remaining: ['Live real-repo checkout proof', 'Row-level source citations and CI extraction']
  }],
  ['Generic semantic edit admission and replay', {
    anchors: jsTsAnchors,
    evidence: ['test/smoke/semantic-edit-script.mjs', 'test/smoke/js-ts-safe-project-merge-semantic-replay-proof.mjs'],
    remaining: ['Live real-repo checkout proof']
  }],
  ['Symbol move between files', {
    anchors: jsTsAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-symbol-move-default-admission.mjs', 'test/smoke/semantic-edit-rename-move-source-replay.mjs'],
    remaining: ['Live real-repo checkout proof']
  }],
  ['Split/merge modules and classes', {
    anchors: jsTsAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-split-merge-classifier.mjs', 'test/smoke/js-ts-safe-project-merge-admission-routes.mjs'],
    remaining: ['Live real-repo checkout proof']
  }],
  ['JSX/TSX prop graph', {
    anchors: jsxAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-jsx-prop-values.mjs', 'test/smoke/js-ts-safe-project-merge-jsx-prop-contracts.mjs'],
    remaining: ['Live real-repo checkout proof', 'Event-handler proof bridge']
  }],
  ['JSX/TSX child order and render layout', {
    anchors: jsxAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-jsx-render-returns.mjs', 'test/smoke/js-ts-safe-project-merge-jsx-render-branch-proof.mjs'],
    remaining: ['Hook dependency proof bridge', 'Event-handler proof bridge']
  }],
  ['JSX/TSX hook/context/render-risk graph', {
    anchors: jsxAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-jsx-hook-dependencies.mjs', 'test/smoke/js-ts-safe-project-merge-jsx-context-values.mjs'],
    remaining: ['Hook dependency proof bridge', 'Live real-repo checkout proof']
  }],
  ['HTML static structure', {
    anchors: htmlCssAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-html-css.mjs', 'test/smoke/js-ts-safe-project-merge-html-css-parser-source-evidence.mjs'],
    remaining: ['HTML/CSS browser runtime proof', 'Row-level source citations and CI extraction']
  }],
  ['HTML runtime/browser boundaries', {
    anchors: ['HTML tree construction and runtime boundaries'],
    evidence: ['test/smoke/js-ts-safe-project-merge-html-runtime-boundary.mjs', 'test/smoke/js-ts-safe-project-merge-html-runtime-proof-admission.mjs'],
    remaining: ['HTML/CSS browser runtime proof']
  }],
  ['CSS selectors, cascade, and static declarations', {
    anchors: htmlCssAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-html-css-selectors.mjs', 'test/smoke/js-ts-safe-project-merge-html-css-cascade-proof.mjs'],
    remaining: ['HTML/CSS browser runtime proof', 'Row-level source citations and CI extraction']
  }],
  ['CSS dependencies and runtime descriptors', {
    anchors: ['CSS syntax, selectors, cascade, and at-rules'],
    evidence: ['test/smoke/js-ts-safe-project-merge-html-css-dependencies.mjs', 'test/smoke/js-ts-safe-project-merge-css-modules-dependencies.mjs'],
    remaining: ['Keyframes/animation dependency proof']
  }],
  ['Nested/scoped CSS', {
    anchors: ['CSS syntax, selectors, cascade, and at-rules'],
    evidence: ['test/smoke/js-ts-safe-project-merge-html-css-scoped-basic.mjs', 'test/smoke/js-ts-safe-project-merge-html-css-scoped-nested.mjs'],
    remaining: ['HTML/CSS browser runtime proof', 'Row-level source citations and CI extraction']
  }],
  ['CSS Modules import/use-site graph', {
    anchors: cssModulesAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-css-modules-use-sites.mjs', 'test/smoke/js-ts-safe-project-merge-css-modules-import-shapes.mjs'],
    remaining: ['CSS Modules real bundler source-map corpus']
  }],
  ['CSS Modules transform/source-map identity', {
    anchors: cssModulesAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-css-modules-source-map-proof.mjs', 'test/smoke/js-ts-safe-project-merge-css-modules-generated-map-hash.mjs'],
    remaining: ['CSS Modules real bundler source-map corpus']
  }],
  ['Real-repo corpus', {
    anchors: [...jsTsAnchors, 'JSX/TSX parser and React-like layout hazards', 'CSS Modules contracts'],
    evidence: ['bench/real-repo-corpus-suite.mjs', 'test/smoke/js-ts-real-repo-corpus-command-execution-proof.mjs'],
    remaining: ['Live real-repo checkout proof', 'JS/TS live project diagnostics/declaration proof']
  }],
  ['Source-backed completeness matrix', {
    anchors: ['JavaScript syntax and runtime semantics', 'HTML tree construction and runtime boundaries', 'CSS Modules contracts'],
    evidence: ['research/semantic-merge-production-matrix.md', 'test/smoke/semantic-merge-production-matrix-denominator.mjs'],
    remaining: ['Row-level source citations and CI extraction']
  }]
]);

const sourceRows = rowsForHeading('Source Anchors');
const matrixRows = rowsForHeading('Current Matrix');
const remainingRows = rowsForHeading('Current Remaining Work Table');
const sourceAnchors = new Map(sourceRows.map((row) => [row.Surface, row]));
const remainingWork = new Map(remainingRows.map((row) => [row['Work item'], row]));
const matrixAreas = matrixRows.map((row) => row.Area);

assert.equal(new Set(matrixAreas).size, matrixAreas.length, 'production matrix areas must be unique');
assert.deepEqual([...rowProofs.keys()].sort(), [...matrixAreas].sort(), 'production matrix row proof mapping must match every current row');

const linkedSourceAnchors = new Set();
const linkedRemainingWork = new Set();
for (const row of matrixRows) {
  const proof = rowProofs.get(row.Area);
  assert.ok(proof, `${row.Area}: missing row proof mapping`);
  assert.equal(['high', 'partial', 'missing'].includes(row.Status), true, `${row.Area}: supported status`);
  assert.notEqual(row['Current executable evidence'], '', `${row.Area}: executable evidence text`);
  assert.notEqual(row['Remaining work'], '', `${row.Area}: remaining work text`);
  assert.equal(proof.anchors.length > 0, true, `${row.Area}: source anchors`);
  assert.equal(proof.evidence.length > 0, true, `${row.Area}: evidence files`);
  assert.equal(proof.remaining.length > 0, true, `${row.Area}: remaining work rows`);
  for (const anchor of proof.anchors) {
    assert.equal(sourceAnchors.has(anchor), true, `${row.Area}: source anchor ${anchor}`);
    linkedSourceAnchors.add(anchor);
  }
  for (const file of proof.evidence) {
    assert.equal(existsSync(new URL(file, rootUrl)), true, `${row.Area}: evidence file ${file}`);
  }
  for (const workItem of proof.remaining) {
    assert.equal(remainingWork.has(workItem), true, `${row.Area}: remaining work row ${workItem}`);
    linkedRemainingWork.add(workItem);
  }
  if (row.Status === 'partial') {
    assert.doesNotMatch(row['Current executable evidence'], /\bproduction[- ]complete\b|\bfully covered\b/i, `${row.Area}: partial row overstates completeness`);
    assert.equal(proof.remaining.length > 0, true, `${row.Area}: partial row must keep remaining work mapped`);
  }
}

for (const source of sourceAnchors.keys()) assert.equal(linkedSourceAnchors.has(source), true, `unmapped source anchor ${source}`);
for (const workItem of remainingWork.keys()) assert.equal(linkedRemainingWork.has(workItem), true, `unmapped remaining work row ${workItem}`);

function rowsForHeading(heading) {
  const lines = matrixMarkdown.split('\n');
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  assert.notEqual(start, -1, `missing ${heading} heading`);
  const table = [];
  for (const line of lines.slice(start + 1)) {
    const trimmed = line.trim();
    if (!trimmed && table.length === 0) continue;
    if (!trimmed.startsWith('|')) {
      if (table.length > 0) break;
      continue;
    }
    table.push(trimmed);
  }
  assert.equal(table.length >= 3, true, `${heading}: expected markdown table`);
  const headers = tableCells(table[0]);
  return table.slice(2).map((line) => Object.fromEntries(headers.map((header, index) => [header, tableCells(line)[index] ?? ''])));
}

function tableCells(line) {
  return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}
