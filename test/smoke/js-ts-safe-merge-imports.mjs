import { assert } from './helpers.mjs';
import {
  JsTsSafeMergeConflictCodes,
  JsTsSafeMergeGateIds,
  safeMergeJsTsImportsAndDeclarations
} from './compiler-api.mjs';

const acceptedBase = [
  "import { readFile } from 'node:fs';",
  'export function stable() {',
  '  return readFile;',
  '}',
  ''
].join('\n');

const acceptedWorker = [
  "import { readFile, writeFile } from 'node:fs';",
  'export function stable() {',
  '  return readFile;',
  '}',
  'export function workerOnly() {',
  '  return writeFile;',
  '}',
  ''
].join('\n');

const acceptedHead = [
  "import { readFile, stat } from 'node:fs';",
  'export function stable() {',
  '  return readFile;',
  '}',
  'export const headOnly = 1;',
  ''
].join('\n');

const accepted = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_accepts_independent_imports_and_declarations',
  language: 'typescript',
  sourcePath: 'src/example.ts',
  baseSourceText: acceptedBase,
  workerSourceText: acceptedWorker,
  headSourceText: acceptedHead
});

assert.equal(accepted.status, 'merged');
assert.equal(accepted.admission.status, 'auto-merge-candidate');
assert.equal(accepted.summary.importSpecifierAdditions, 2);
assert.equal(accepted.summary.topLevelDeclarationAdditions, 1);
assert.equal(accepted.gates.every((gate) => gate.status === 'passed'), true);
assert.equal(accepted.mergedSourceText, [
  "import { readFile, writeFile, stat } from 'node:fs';",
  'export function stable() {',
  '  return readFile;',
  '}',
  'export function workerOnly() {',
  '  return writeFile;',
  '}',
  'export const headOnly = 1;',
  ''
].join('\n'));

const duplicateDeclaration = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_duplicate_declarations',
  baseSourceText: 'export function stable() { return 1; }\n',
  workerSourceText: 'export function stable() { return 1; }\nexport const duplicate = 1;\n',
  headSourceText: 'export function stable() { return 1; }\nexport const duplicate = 2;\n'
});
assertBlocked(duplicateDeclaration, JsTsSafeMergeConflictCodes.duplicateName, JsTsSafeMergeGateIds.uniqueNames);

const duplicateImport = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_duplicate_import_specifiers',
  baseSourceText: "import { readFile } from 'node:fs';\nexport const stable = readFile;\n",
  workerSourceText: "import { readFile, writeFile } from 'node:fs';\nexport const stable = readFile;\n",
  headSourceText: "import { readFile, writeFile } from 'node:fs';\nexport const stable = readFile;\n"
});
assertBlocked(duplicateImport, JsTsSafeMergeConflictCodes.duplicateName, JsTsSafeMergeGateIds.uniqueNames);

const sideEffectReorder = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_side_effect_import_reorder',
  baseSourceText: "import 'reflect-metadata';\nimport { readFile } from 'node:fs';\nexport const stable = readFile;\n",
  workerSourceText: "import { readFile } from 'node:fs';\nimport 'reflect-metadata';\nexport const stable = readFile;\n",
  headSourceText: "import 'reflect-metadata';\nimport { readFile, stat } from 'node:fs';\nexport const stable = readFile;\n"
});
assertBlocked(sideEffectReorder, JsTsSafeMergeConflictCodes.sideEffectImportReorder, JsTsSafeMergeGateIds.preserveBaseOrder);

const changedExistingDeclaration = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_changed_existing_declaration',
  baseSourceText: 'export function stable() { return 1; }\n',
  workerSourceText: 'export function stable() { return 2; }\n',
  headSourceText: 'export function stable() { return 1; }\nexport const headOnly = 1;\n'
});
assertBlocked(
  changedExistingDeclaration,
  JsTsSafeMergeConflictCodes.changedExistingDeclaration,
  JsTsSafeMergeGateIds.stableExistingDeclarations
);

const parserLedgerLoss = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_parser_ledger_loss',
  baseSourceText: "console.log('unsupported top-level effect');\n",
  workerSourceText: "console.log('unsupported top-level effect');\nexport const workerOnly = 1;\n",
  headSourceText: "console.log('unsupported top-level effect');\n"
});
assertBlocked(parserLedgerLoss, JsTsSafeMergeConflictCodes.parserLedgerLoss, JsTsSafeMergeGateIds.parseLedger);

const malformedSyntax = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_malformed_syntax',
  baseSourceText: 'export const broken = (\n',
  workerSourceText: 'export const broken = (\n',
  headSourceText: 'export const broken = (\n'
});
assertBlocked(malformedSyntax, JsTsSafeMergeConflictCodes.malformedSyntax, JsTsSafeMergeGateIds.parseLedger);

const decoratorSyntax = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_decorator_anchors',
  baseSourceText: '@sealed\nexport class Widget {}\n',
  workerSourceText: '@sealed\nexport class Widget {}\nexport const workerOnly = 1;\n',
  headSourceText: '@sealed\nexport class Widget {}\n'
});
assertBlocked(decoratorSyntax, JsTsSafeMergeConflictCodes.unsupportedDecorator, JsTsSafeMergeGateIds.parseLedger);

const overloadSyntax = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_overload_anchors',
  baseSourceText: [
    'export function parse(value: string): string;',
    'export function parse(value: string | number): string { return String(value); }',
    ''
  ].join('\n'),
  workerSourceText: [
    'export function parse(value: string): string;',
    'export function parse(value: string | number): string { return String(value); }',
    'export const workerOnly = 1;',
    ''
  ].join('\n'),
  headSourceText: [
    'export function parse(value: string): string;',
    'export function parse(value: string | number): string { return String(value); }',
    ''
  ].join('\n')
});
assertBlocked(overloadSyntax, JsTsSafeMergeConflictCodes.unsupportedOverload, JsTsSafeMergeGateIds.parseLedger);

const computedKeyDeclaration = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_computed_key_declarations',
  baseSourceText: 'export const stable = 1;\n',
  workerSourceText: "export const stable = 1;\nexport const config = {\n  ['flag']: true,\n};\n",
  headSourceText: 'export const stable = 1;\n'
});
assertBlocked(computedKeyDeclaration, JsTsSafeMergeConflictCodes.computedKey, JsTsSafeMergeGateIds.parseLedger);

const typeAliasConflict = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_type_alias_conflicts',
  baseSourceText: 'export type Model = { id: string; };\n',
  workerSourceText: 'export type Model = { id: number; };\n',
  headSourceText: 'export type Model = { id: string; };\n'
});
assertBlocked(typeAliasConflict, JsTsSafeMergeConflictCodes.typeAliasConflict, JsTsSafeMergeGateIds.stableExistingDeclarations);

const staleAnchors = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_stale_source_anchors',
  expectedSourceHash: 'hash_base_widget',
  currentSourceHash: 'hash_head_widget',
  baseSourceText: 'export const stable = 1;\n',
  workerSourceText: 'export const stable = 1;\nexport const workerOnly = 1;\n',
  headSourceText: 'export const stable = 1;\n'
});
assertBlocked(staleAnchors, JsTsSafeMergeConflictCodes.staleSourceHash, JsTsSafeMergeGateIds.parseLedger);

const missingSourceLedgerSpans = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_missing_source_ledger_spans',
  requireSourceLedgerSpans: true,
  sourceLedgers: {
    base: { spans: [{ id: 'base-token', kind: 'identifier' }] },
    worker: { spans: [{ id: 'worker-token', kind: 'identifier', span: { start: 0, end: 6 } }] },
    head: { spans: [{ id: 'head-token', kind: 'identifier', span: { start: 0, end: 6 } }] }
  },
  baseSourceText: 'export const stable = 1;\n',
  workerSourceText: 'export const stable = 1;\nexport const workerOnly = 1;\n',
  headSourceText: 'export const stable = 1;\n'
});
assertBlocked(missingSourceLedgerSpans, JsTsSafeMergeConflictCodes.missingSourceLedgerSpan, JsTsSafeMergeGateIds.parseLedger);

const ambiguousInsertion = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_ambiguous_insertion_point',
  baseSourceText: '',
  workerSourceText: 'export const workerOnly = 1;\n',
  headSourceText: 'export const headOnly = 1;\n'
});
assertBlocked(ambiguousInsertion, JsTsSafeMergeConflictCodes.ambiguousInsertionPoint, JsTsSafeMergeGateIds.resolvedInsertionAnchors);

const importSpecifierReorder = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_import_specifier_reorder',
  baseSourceText: "import { readFile, writeFile } from 'node:fs';\nexport const stable = readFile;\n",
  workerSourceText: "import { writeFile, readFile } from 'node:fs';\nexport const stable = readFile;\n",
  headSourceText: "import { readFile, writeFile, stat } from 'node:fs';\nexport const stable = readFile;\n"
});
assertBlocked(
  importSpecifierReorder,
  JsTsSafeMergeConflictCodes.importSpecifierReordered,
  JsTsSafeMergeGateIds.independentImportSpecifiers
);

function assertBlocked(result, code, gateId) {
  assert.equal(result.status, 'blocked', code);
  assert.equal(result.admission.reviewRequired, true, code);
  assert.equal(result.conflicts.some((conflict) => conflict.code === code), true, code);
  assert.equal(result.gates.some((gate) => gate.id === gateId && gate.status === 'blocked'), true, gateId);
}
