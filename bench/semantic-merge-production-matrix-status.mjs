import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const matrixUrl = new URL('../research/semantic-merge-production-matrix.md', import.meta.url);
const rootUrl = new URL('../', import.meta.url);

const sourceAnchorUrls = Object.freeze({
  'JavaScript syntax and runtime semantics': [
    'https://tc39.es/ecma262/',
    'https://github.com/estree/estree',
    'https://babeljs.io/docs/babel-parser',
    'https://github.com/acornjs/acorn'
  ],
  'TypeScript symbols, types, and diagnostics': [
    'https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API',
    'https://github.com/microsoft/TypeScript'
  ],
  'JSX/TSX parser and React-like layout hazards': [
    'https://babeljs.io/docs/babel-parser',
    'https://github.com/microsoft/TypeScript',
    'https://react.dev/reference/react'
  ],
  'HTML tree construction and runtime boundaries': [
    'https://html.spec.whatwg.org/multipage/parsing.html',
    'https://parse5.js.org/'
  ],
  'CSS syntax, selectors, cascade, and at-rules': [
    'https://www.w3.org/TR/css-syntax-3/',
    'https://www.w3.org/TR/selectors-4/',
    'https://www.w3.org/TR/css-cascade-5/',
    'https://postcss.org/api/'
  ],
  'CSS Modules contracts': [
    'https://github.com/css-modules/css-modules',
    'https://github.com/webpack-contrib/css-loader'
  ]
});

const jsTsAnchors = ['JavaScript syntax and runtime semantics', 'TypeScript symbols, types, and diagnostics'];
const jsxAnchors = ['JSX/TSX parser and React-like layout hazards', ...jsTsAnchors];
const htmlCssAnchors = ['HTML tree construction and runtime boundaries', 'CSS syntax, selectors, cascade, and at-rules'];
const cssModulesAnchors = ['CSS Modules contracts', 'CSS syntax, selectors, cascade, and at-rules', 'JSX/TSX parser and React-like layout hazards'];

const rowProofs = new Map([
  ['JS/TS parser, source spans, and trivia', {
    anchors: jsTsAnchors,
    evidence: ['test/smoke/js-ts-syntax-parser-trivia-evidence.mjs', 'test/smoke/js-ts-source-span-parser-trivia-exactness.mjs'],
    remaining: ['Live real-repo checkout proof']
  }],
  ['JS/TS scope and use-def graph', {
    anchors: jsTsAnchors,
    evidence: ['test/smoke/js-ts-safe-merge-binding-patterns.mjs', 'test/smoke/js-ts-safe-project-merge-scope-use-def-graph.mjs'],
    remaining: ['Live real-repo checkout proof']
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
    remaining: ['Live real-repo checkout proof']
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
    evidence: ['test/smoke/js-ts-safe-project-merge-jsx-prop-values.mjs', 'test/smoke/js-ts-safe-project-merge-jsx-prop-contracts.mjs', 'test/smoke/js-ts-safe-project-merge-jsx-proof-bridges.mjs'],
    remaining: ['Live real-repo checkout proof']
  }],
  ['JSX/TSX child order and render layout', {
    anchors: jsxAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-jsx-render-returns.mjs', 'test/smoke/js-ts-safe-project-merge-jsx-render-branch-proof.mjs', 'test/smoke/js-ts-safe-project-merge-jsx-proof-bridges.mjs'],
    remaining: ['JSX context/wrapper render proof corpus', 'Live real-repo checkout proof']
  }],
  ['JSX/TSX hook/context/render-risk graph', {
    anchors: jsxAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-jsx-hook-dependencies.mjs', 'test/smoke/js-ts-safe-project-merge-jsx-context-values.mjs', 'test/smoke/js-ts-safe-project-merge-jsx-proof-bridges.mjs'],
    remaining: ['JSX context/wrapper render proof corpus', 'Live real-repo checkout proof']
  }],
  ['HTML static structure', {
    anchors: htmlCssAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-html-css.mjs', 'test/smoke/js-ts-safe-project-merge-html-css-parser-source-evidence.mjs', 'test/smoke/js-ts-safe-project-merge-html-css-runtime-proof-corpus.mjs'],
    remaining: []
  }],
  ['HTML runtime/browser boundaries', {
    anchors: ['HTML tree construction and runtime boundaries'],
    evidence: ['test/smoke/js-ts-safe-project-merge-html-runtime-boundary.mjs', 'test/smoke/js-ts-safe-project-merge-html-runtime-proof-admission.mjs', 'test/smoke/js-ts-safe-project-merge-html-css-runtime-proof-corpus.mjs'],
    remaining: []
  }],
  ['CSS selectors, cascade, and static declarations', {
    anchors: htmlCssAnchors,
    evidence: ['test/smoke/js-ts-safe-project-merge-html-css-selectors.mjs', 'test/smoke/js-ts-safe-project-merge-html-css-cascade-proof.mjs', 'test/smoke/js-ts-safe-project-merge-html-css-runtime-proof-corpus.mjs'],
    remaining: []
  }],
  ['CSS dependencies and runtime descriptors', {
    anchors: ['CSS syntax, selectors, cascade, and at-rules'],
    evidence: ['test/smoke/js-ts-safe-project-merge-html-css-dependencies.mjs', 'test/smoke/js-ts-safe-project-merge-html-css-at-rules.mjs', 'test/smoke/js-ts-safe-project-merge-html-css-runtime-proof-corpus.mjs'],
    remaining: []
  }],
  ['Nested/scoped CSS', {
    anchors: ['CSS syntax, selectors, cascade, and at-rules'],
    evidence: ['test/smoke/js-ts-safe-project-merge-html-css-scoped-basic.mjs', 'test/smoke/js-ts-safe-project-merge-html-css-scoped-nested.mjs'],
    remaining: ['Nested/scoped CSS parser-backed expansion']
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
    remaining: []
  }]
]);

function createSemanticMergeProductionMatrixStatus(options = {}) {
  const markdown = readFileSync(options.matrixUrl ?? matrixUrl, 'utf8');
  const sourceRows = rowsForHeading(markdown, 'Source Anchors');
  const matrixRows = rowsForHeading(markdown, 'Current Matrix');
  const remainingRows = rowsForHeading(markdown, 'Current Remaining Work Table');
  const sourceAnchors = new Map(sourceRows.map((row) => [row.Surface, row]));
  const remainingWork = new Map(remainingRows.map((row) => [row['Work item'], row]));
  const matrixAreas = matrixRows.map((row) => row.Area);
  const duplicateAreas = duplicates(matrixAreas);
  const rows = matrixRows.map((row) => matrixStatusRow(row, sourceAnchors, remainingWork));
  const statusCounts = countBy(rows, (row) => row.status);
  const unmappedSourceAnchors = [...sourceAnchors.keys()].filter((anchor) =>
    !rows.some((row) => row.sourceAnchors.some((source) => source.anchor === anchor))
  );
  const unmappedRemainingWork = [...remainingWork.keys()].filter((workItem) =>
    !rows.some((row) => row.remainingWork.some((item) => item.workItem === workItem))
  );
  return {
    kind: 'frontier.lang.semanticMergeProductionMatrixStatus',
    version: 1,
    matrixPath: relativeMatrixPath(options.matrixUrl ?? matrixUrl),
    sourceAnchorCount: sourceRows.length,
    remainingWorkCount: remainingRows.length,
    rowCount: rows.length,
    statusCounts,
    duplicateAreas,
    unmappedMatrixRows: matrixAreas.filter((area) => !rowProofs.has(area)),
    unmappedProofRows: [...rowProofs.keys()].filter((area) => !matrixAreas.includes(area)),
    unmappedSourceAnchors,
    unmappedRemainingWork,
    rows
  };
}

function matrixStatusRow(row, sourceAnchors, remainingWork) {
  const proof = rowProofs.get(row.Area);
  const sourceAnchorRecords = (proof?.anchors ?? []).map((anchor) => ({
    anchor,
    present: sourceAnchors.has(anchor),
    requirementSources: sourceAnchors.get(anchor)?.['Requirement sources'] ?? null,
    urls: sourceAnchorUrls[anchor] ?? []
  }));
  const evidenceFiles = (proof?.evidence ?? []).map((path) => ({
    path,
    present: existsSync(new URL(path, rootUrl))
  }));
  const remaining = (proof?.remaining ?? []).map((workItem) => ({
    workItem,
    present: remainingWork.has(workItem),
    priority: remainingWork.get(workItem)?.Priority ?? null,
    suggestedFirstProof: remainingWork.get(workItem)?.['Suggested first proof'] ?? null
  }));
  return {
    area: row.Area,
    status: row.Status,
    currentExecutableEvidence: row['Current executable evidence'],
    remainingWorkText: row['Remaining work'],
    mapped: Boolean(proof),
    sourceAnchors: sourceAnchorRecords,
    evidenceFiles,
    remainingWork: remaining,
    sourceAnchorsPresent: sourceAnchorRecords.every((anchor) => anchor.present && anchor.urls.length > 0),
    evidenceFilesPresent: evidenceFiles.every((file) => file.present),
    remainingWorkPresent: remaining.every((item) => item.present),
    partialRowOverstatesCompletion: row.Status === 'partial' &&
      /\bproduction[- ]complete\b|\bfully covered\b/i.test(row['Current executable evidence'])
  };
}

function rowsForHeading(markdown, heading) {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start < 0) throw new Error(`missing ${heading} heading`);
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
  if (table.length < 3) throw new Error(`${heading}: expected markdown table`);
  const headers = tableCells(table[0]);
  return table.slice(2).map((line) => Object.fromEntries(headers.map((header, index) => [header, tableCells(line)[index] ?? ''])));
}

function tableCells(line) {
  return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function countBy(values, key) {
  const counts = {};
  for (const value of values) {
    const id = key(value);
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

function duplicates(values) {
  const seen = new Set();
  const duplicate = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicate.add(value);
    seen.add(value);
  }
  return [...duplicate].sort();
}

function relativeMatrixPath(url) {
  const path = fileURLToPath(url);
  const root = fileURLToPath(rootUrl);
  return path.startsWith(root) ? path.slice(root.length) : path;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const pretty = process.argv.includes('--pretty');
  console.log(JSON.stringify(createSemanticMergeProductionMatrixStatus(), null, pretty ? 2 : 0));
}

export {
  createSemanticMergeProductionMatrixStatus,
  rowProofs,
  sourceAnchorUrls
};
