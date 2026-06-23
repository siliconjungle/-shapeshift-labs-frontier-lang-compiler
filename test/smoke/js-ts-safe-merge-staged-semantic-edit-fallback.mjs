import { assert } from './helpers.mjs';
import {
  JsTsSafeMergeConflictCodes,
  safeMergeJsTsSource
} from './compiler-api.mjs';

const functionImportBase = [
  'import { readFile } from \'node:fs\';',
  'export function step(v: number) {',
  '  return v + 1;',
  '}',
  ''
].join('\n');

const functionImportWorker = [
  'import { readFile, writeFile } from \'node:fs\';',
  'export function step(v: number) {',
  '  writeFile;',
  '  return v + 2;',
  '}',
  ''
].join('\n');

const functionImportHead = [
  'import { readFile, stat } from \'node:fs\';',
  'export function step(v: number) {',
  '  return v + 1;',
  '}',
  ''
].join('\n');

const functionImportsAndBody = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_staged_function_imports_and_body',
  language: 'typescript',
  sourcePath: 'src/function-imports.ts',
  baseSourceText: functionImportBase,
  workerSourceText: functionImportWorker,
  headSourceText: functionImportHead
});

assert.equal(functionImportsAndBody.status, 'merged');
assert.equal(functionImportsAndBody.mergedSourceText, [
  'import { readFile, stat, writeFile } from \'node:fs\';',
  'export function step(v: number) {',
  '  writeFile;',
  '  return v + 2;',
  '}',
  ''
].join('\n'));
assert.equal(functionImportsAndBody.metadata.composed.phase, 'staged-top-level-semantic-edit-fallback');
assert.deepEqual(functionImportsAndBody.metadata.composed.phases, ['top-level-neutralization', 'top-level-ledger', 'semantic-edit']);
assert.equal(functionImportsAndBody.summary.importSpecifierAdditions, 2);
assert.equal(functionImportsAndBody.summary.semanticEditAppliedOperations, 1);
assert.equal(functionImportsAndBody.semanticArtifacts.projection.metadata.source, 'js-ts-staged-declaration-replay');
assert.equal(functionImportsAndBody.semanticArtifacts.projection.edits[0].kind, 'replaceDeclaration');
assert.equal(functionImportsAndBody.semanticArtifacts.replay.status, 'accepted-clean');
assert.equal(functionImportsAndBody.semanticArtifacts.alreadyAppliedReplay.status, 'already-applied');

const classBase = [
  'import { readFile } from \'node:fs\';',
  'export class Counter {',
  '  step(v: number) {',
  '    return v + 1;',
  '  }',
  '}',
  ''
].join('\n');

const classWorker = [
  'import { readFile, writeFile } from \'node:fs\';',
  'export class Counter {',
  '  step(v: number) {',
  '    writeFile;',
  '    return v + 2;',
  '  }',
  '}',
  ''
].join('\n');

const classHead = [
  'import { readFile, stat } from \'node:fs\';',
  'export class Counter {',
  '  step(v: number) {',
  '    return v + 1;',
  '  }',
  '}',
  ''
].join('\n');

const classImportsAndMethod = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_staged_class_imports_and_method',
  language: 'typescript',
  sourcePath: 'src/class-imports.ts',
  baseSourceText: classBase,
  workerSourceText: classWorker,
  headSourceText: classHead
});

assert.equal(classImportsAndMethod.status, 'merged');
assert.equal(classImportsAndMethod.mergedSourceText, [
  'import { readFile, stat, writeFile } from \'node:fs\';',
  'export class Counter {',
  '  step(v: number) {',
  '    writeFile;',
  '    return v + 2;',
  '  }',
  '}',
  ''
].join('\n'));
assert.equal(classImportsAndMethod.summary.semanticEditOperations, 2);
assert.equal(classImportsAndMethod.summary.semanticEditAppliedOperations, 1);
assert.equal(classImportsAndMethod.semanticArtifacts.projection.edits[0].kind, 'replaceDeclaration');

const newImportBase = [
  'export function step(v: number) {',
  '  return v + 1;',
  '}',
  ''
].join('\n');

const newImportWorker = [
  'import { writeFile } from \'node:fs\';',
  'export function step(v: number) {',
  '  writeFile;',
  '  return v + 2;',
  '}',
  ''
].join('\n');

const newImportHead = [
  'import { stat } from \'node:fs\';',
  'export function step(v: number) {',
  '  return v + 1;',
  '}',
  ''
].join('\n');

const newImportsAndBody = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_staged_new_imports_and_body',
  language: 'typescript',
  sourcePath: 'src/new-imports.ts',
  baseSourceText: newImportBase,
  workerSourceText: newImportWorker,
  headSourceText: newImportHead
});

assert.equal(newImportsAndBody.status, 'merged');
assert.equal(newImportsAndBody.mergedSourceText, [
  'import { stat, writeFile } from \'node:fs\';',
  'export function step(v: number) {',
  '  writeFile;',
  '  return v + 2;',
  '}',
  ''
].join('\n'));
assert.equal(newImportsAndBody.summary.importDeclarationAdditions, 1);

const headDeclaration = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_staged_head_declaration_and_body',
  language: 'typescript',
  sourcePath: 'src/head-declaration.ts',
  baseSourceText: functionImportBase,
  workerSourceText: functionImportWorker,
  headSourceText: [
    'import { readFile } from \'node:fs\';',
    'export function step(v: number) {',
    '  return v + 1;',
    '}',
    'export function status() {',
    '  return "ok";',
    '}',
    ''
  ].join('\n')
});

assert.equal(headDeclaration.status, 'merged');
assert.equal(headDeclaration.mergedSourceText, [
  'import { readFile, writeFile } from \'node:fs\';',
  'export function step(v: number) {',
  '  writeFile;',
  '  return v + 2;',
  '}',
  'export function status() {',
  '  return "ok";',
  '}',
  ''
].join('\n'));
assert.equal(headDeclaration.summary.topLevelDeclarationAdditions, 1);
assert.equal((headDeclaration.mergedSourceText.match(/import \{ readFile, writeFile \}/g) ?? []).length, 1);

const conflictingBody = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_staged_conflicting_body',
  language: 'typescript',
  sourcePath: 'src/conflict.ts',
  baseSourceText: functionImportBase,
  workerSourceText: functionImportWorker,
  headSourceText: [
    'import { readFile, stat } from \'node:fs\';',
    'export function step(v: number) {',
    '  return v + 3;',
    '}',
    ''
  ].join('\n')
});

assert.equal(conflictingBody.status, 'blocked');
assert.equal(conflictingBody.semanticArtifacts.status, 'blocked');
assert.equal(conflictingBody.semanticArtifacts.projection.status, 'blocked');
assert.equal(conflictingBody.admission.reasonCodes.includes('semantic-edit-script-conflict'), true);
assert.equal(conflictingBody.admission.reasonCodes.includes('head-anchor-changed-since-base'), true);
assert.equal(
  conflictingBody.admission.reasonCodes.some((reason) => reason.startsWith('head-anchor-changed-since-base:declaration:step')),
  true
);
assert.equal(conflictingBody.conflicts[0].code, JsTsSafeMergeConflictCodes.changedExistingDeclaration);
