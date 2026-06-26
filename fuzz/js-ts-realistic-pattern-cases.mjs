import assert from 'node:assert/strict';
import {
  createSemanticEditScript,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection,
  safeMergeJsTsImportsAndDeclarations,
  safeMergeJsTsSource
} from '../dist/index.js';

function runJsTsRealisticPatternFuzzCases() {
  const summary = { accepted: 0, rejected: 0, realisticPatterns: 0, realisticMatrixRows: 0 };
  const rows = new Set();
  assertViteImportShapePattern(summary, rows);
  assertReactTsxChildPattern(summary, rows);
  assertPrettierControlFlowPattern(summary, rows);
  assertTypeScriptOverloadPattern(summary, rows);
  summary.realisticMatrixRows = rows.size;
  assert.deepEqual(summary, { accepted: 3, rejected: 1, realisticPatterns: 4, realisticMatrixRows: 4 });
  return summary;
}

function assertViteImportShapePattern(summary, rows) {
  const result = safeMergeJsTsImportsAndDeclarations({
    id: 'fuzz_realistic_vite_import_shape',
    language: 'typescript',
    sourcePath: 'packages/vite/src/node/config.ts',
    baseSourceText: source(["import { normalize } from 'node:path';", "export const plugin = { name: 'frontier' };", '']),
    workerSourceText: source(["import path, { normalize } from 'node:path';", "export const plugin = { name: 'frontier' };", '']),
    headSourceText: source(["import { normalize, resolve } from 'node:path';", "export const plugin = { name: 'frontier' };", ''])
  });
  assert.equal(result.status, 'merged', 'Vite import-shape pattern merge');
  assert.equal(result.admission.status, 'auto-merge-candidate', 'Vite import-shape admission');
  assert.equal(result.gates.some((gate) => gate.id === 'independent-import-specifiers' && gate.status === 'passed'), true);
  assert.equal(result.mergedSourceText, source(["import path, { normalize, resolve } from 'node:path';", "export const plugin = { name: 'frontier' };", '']));
  record(summary, rows, 'module-export-import', 'accepted');
}

function assertReactTsxChildPattern(summary, rows) {
  const result = safeMergeJsTsSource({
    id: 'fuzz_realistic_react_tsx_children',
    language: 'tsx',
    sourcePath: 'app/components/shell.tsx',
    baseSourceText: source(['export function Shell({ title }) {', '  return <main><h1>{title}</h1></main>;', '}', '']),
    workerSourceText: source(['export function Shell({ title }) {', '  return <main><nav>Docs</nav><h1>{title}</h1></main>;', '}', '']),
    headSourceText: source(['export function Shell({ title }) {', '  return <main><h1>{title}</h1><footer>Ready</footer></main>;', '}', ''])
  });
  assert.equal(result.status, 'merged', 'React TSX child pattern merge');
  assert.equal(result.admission.status, 'auto-merge-candidate', 'React TSX child admission');
  assert.equal(result.summary.jsxChildExpressionElements, 1, 'React TSX child expression elements');
  assert.equal(result.summary.jsxChildAdditions, 1, 'React TSX child additions');
  assert.equal(result.mergedSourceText, source(['export function Shell({ title }) {', '  return <main><nav>Docs</nav><h1>{title}</h1><footer>Ready</footer></main>;', '}', '']));
  record(summary, rows, 'jsx-tsx-element-prop', 'accepted');
}

function assertPrettierControlFlowPattern(summary, rows) {
  const fixture = {
    id: 'fuzz_realistic_prettier_printer_conflict',
    language: 'javascript',
    sourcePath: 'src/language-js/print/doc.js',
    baseSourceText: source(['export function printDoc(node) {', "  return group(['text', node.value]);", '}', '']),
    workerSourceText: source(['export function printDoc(node) {', "  return group(['text', node.value, line]);", '}', '']),
    headSourceText: source(['export function printDoc(node) {', "  return indent(['text', node.value]);", '}', ''])
  };
  const script = createSemanticEditScript({ ...fixture, generatedAt: 'prettier-printer' });
  assert.equal(script.admission.status, 'conflict', 'Prettier printer control-flow admission');
  assert.equal(script.operations.some((operation) => operation.kind === 'replaceControlFlow' && operation.status === 'conflict'), true);
  const projection = projectSemanticEditScriptToSource({ script, workerSourceText: fixture.workerSourceText, headSourceText: fixture.headSourceText });
  assert.equal(projection.status, 'blocked', 'Prettier printer projection');
  record(summary, rows, 'control-flow-effect', 'rejected');
}

function assertTypeScriptOverloadPattern(summary, rows) {
  const fixture = {
    id: 'fuzz_realistic_typescript_overload_body',
    language: 'typescript',
    sourcePath: 'src/compiler/host.ts',
    baseSourceText: overloadSource('  return String(value);'),
    workerSourceText: overloadSource('  return String(value).trim();'),
    headSourceText: source(['// service moved by coordinator', ...overloadSource('  return String(value);').split('\n')])
  };
  const expectedSourceText = source(['// service moved by coordinator', ...overloadSource('  return String(value).trim();').split('\n')]);
  const script = createSemanticEditScript({ ...fixture, generatedAt: 'typescript-services' });
  assert.equal(script.admission.status, 'auto-merge-candidate', 'TypeScript overload admission');
  const projection = projectSemanticEditScriptToSource({ script, workerSourceText: fixture.workerSourceText, headSourceText: fixture.headSourceText });
  assert.equal(projection.status, 'projected', 'TypeScript overload projection');
  assert.equal(projection.sourceText, expectedSourceText, 'TypeScript overload projected source');
  const replay = replaySemanticEditProjection({ projection, currentSourceText: fixture.headSourceText });
  assert.equal(replay.status, 'accepted-clean', 'TypeScript overload replay');
  assert.equal(replay.outputSourceText, expectedSourceText, 'TypeScript overload replay source');
  record(summary, rows, 'type-public-api', 'accepted');
}

function overloadSource(bodyLine) {
  return source([
    'export function toPath(value: string): string;',
    'export function toPath(value: URL): string;',
    'export function toPath(value: string | URL): string {',
    bodyLine,
    '}',
    ''
  ]);
}

function record(summary, rows, row, outcome) {
  summary.realisticPatterns += 1;
  rows.add(row);
  summary[outcome] += 1;
}

function source(lines) { return lines.join('\n'); }

export { runJsTsRealisticPatternFuzzCases };
