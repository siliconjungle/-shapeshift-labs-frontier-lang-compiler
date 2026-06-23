import { assert } from './helpers.mjs';
import { JsTsSafeMergeConflictCodes, safeMergeJsTsSource } from './compiler-api.mjs';

const topLevelRenameBase = [
  'export function step(v: number) {',
  '  return v + 1;',
  '}',
  'export function keep() {',
  '  return 0;',
  '}',
  ''
].join('\n');

const topLevelRenameWorker = topLevelRenameBase.replace('function step', 'function renamedStep');
const topLevelRenameHead = topLevelRenameBase.replace('return 0;', 'return 10;');
const topLevelRenameWithSibling = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_semantic_edit_fallback_top_level_rename_sibling',
  language: 'typescript',
  sourcePath: 'src/top-level-rename.ts',
  baseSourceText: topLevelRenameBase,
  workerSourceText: topLevelRenameWorker,
  headSourceText: topLevelRenameHead
});

assert.equal(topLevelRenameWithSibling.status, 'blocked');
assert.equal(topLevelRenameWithSibling.admission.reasonCodes.includes(JsTsSafeMergeConflictCodes.topLevelOrderChanged), true);
assert.equal(topLevelRenameWithSibling.admission.reasonCodes.includes(JsTsSafeMergeConflictCodes.changedExistingDeclaration), true);
assert.equal(topLevelRenameWithSibling.semanticArtifacts, undefined);

const classMethodRenameBase = [
  'export class Service {',
  '  step(v: number) {',
  '    return v + 1;',
  '  }',
  '  keep() {',
  '    return 0;',
  '  }',
  '}',
  ''
].join('\n');

const classMethodRenameWorker = classMethodRenameBase.replace('step(v: number)', 'renamedStep(v: number)');
const classMethodRenameHead = classMethodRenameBase.replace('return 0;', 'return 10;');
const classMethodRenameExpected = [
  'export class Service {',
  '  renamedStep(v: number) {',
  '    return v + 1;',
  '  }',
  '  keep() {',
  '    return 10;',
  '  }',
  '}',
  ''
].join('\n');

const classMethodRenameWithSibling = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_semantic_edit_fallback_class_method_rename_sibling',
  language: 'typescript',
  sourcePath: 'src/service.ts',
  baseSourceText: classMethodRenameBase,
  workerSourceText: classMethodRenameWorker,
  headSourceText: classMethodRenameHead
});

assert.equal(classMethodRenameWithSibling.status, 'merged');
assert.equal(classMethodRenameWithSibling.mergedSourceText, classMethodRenameExpected);
assert.equal(classMethodRenameWithSibling.metadata.composed.phase, 'staged-top-level-direct-semantic-edit-fallback');
assert.equal(classMethodRenameWithSibling.summary.semanticEditOperations, 4);
assert.equal(classMethodRenameWithSibling.summary.semanticEditAppliedOperations, 2);
assert.equal(classMethodRenameWithSibling.semanticArtifacts.status, 'verified');
assert.equal(classMethodRenameWithSibling.semanticArtifacts.replay.status, 'accepted-clean');
assert.equal(classMethodRenameWithSibling.semanticArtifacts.alreadyAppliedReplay.status, 'already-applied');
assert.equal(classMethodRenameWithSibling.semanticArtifacts.alreadyAppliedReplay.summary.stale, 0);
assert.equal(classMethodRenameWithSibling.semanticArtifacts.alreadyAppliedReplay.metadata.normalizedAlreadyAppliedReplay, 'projected-delete-anchor-absent');
assert.equal(classMethodRenameWithSibling.gates.every((gate) => gate.status === 'passed'), true);

const classMethodRenameConflict = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_semantic_edit_fallback_class_method_rename_conflict',
  language: 'typescript',
  sourcePath: 'src/service.ts',
  baseSourceText: classMethodRenameBase,
  workerSourceText: classMethodRenameWorker,
  headSourceText: classMethodRenameBase.replace('return v + 1;', 'return v + 3;')
});

assert.equal(classMethodRenameConflict.status, 'blocked');
assert.equal(classMethodRenameConflict.semanticArtifacts.status, 'blocked');
assert.equal(classMethodRenameConflict.semanticArtifacts.script.admission.status, 'conflict');
assert.equal(classMethodRenameConflict.admission.reasonCodes.includes('head-anchor-changed-since-base'), true);

const duplicateTargetRenameBase = [
  'export class Service {',
  '  step(v: number) { return v + 1; }',
  '  renamedStep(v: number) { return v + 2; }',
  '  keep() { return 0; }',
  '}',
  ''
].join('\n');

const duplicateTargetRenameWorker = [
  'export class Service {',
  '  renamedStep(v: number) { return v + 1; }',
  '  renamedStep(v: number) { return v + 2; }',
  '  keep() { return 0; }',
  '}',
  ''
].join('\n');

const duplicateTargetRenameHead = duplicateTargetRenameBase.replace('return 0;', 'return 10;');
const duplicateTargetRenameBlocked = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_semantic_edit_fallback_class_method_rename_duplicate_target_blocked',
  language: 'typescript',
  sourcePath: 'src/service.ts',
  baseSourceText: duplicateTargetRenameBase,
  workerSourceText: duplicateTargetRenameWorker,
  headSourceText: duplicateTargetRenameHead
});

assert.equal(duplicateTargetRenameBlocked.status, 'blocked');
assert.equal(duplicateTargetRenameBlocked.semanticArtifacts.status, 'blocked');
assert.equal(duplicateTargetRenameBlocked.admission.reasonCodes.includes('semantic-edit-already-applied-stale'), true);
assert.equal(duplicateTargetRenameBlocked.admission.reasonCodes.includes('current-symbol-anchor-missing'), true);

const duplicateTargetSameBodyRenameBase = [
  'export class Service {',
  '  step(v: number) { return v + 1; }',
  '  renamedStep(v: number) { return v + 1; }',
  '  keep() { return 0; }',
  '}',
  ''
].join('\n');

const duplicateTargetSameBodyRenameWorker = [
  'export class Service {',
  '  renamedStep(v: number) { return v + 1; }',
  '  renamedStep(v: number) { return v + 1; }',
  '  keep() { return 0; }',
  '}',
  ''
].join('\n');

const duplicateTargetSameBodyRenameBlocked = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_semantic_edit_fallback_class_method_rename_duplicate_target_same_body_blocked',
  language: 'typescript',
  sourcePath: 'src/service.ts',
  baseSourceText: duplicateTargetSameBodyRenameBase,
  workerSourceText: duplicateTargetSameBodyRenameWorker,
  headSourceText: duplicateTargetSameBodyRenameBase.replace('return 0;', 'return 10;')
});

assert.equal(duplicateTargetSameBodyRenameBlocked.status, 'blocked');
assert.equal(duplicateTargetSameBodyRenameBlocked.semanticArtifacts.status, 'blocked');
assert.equal(duplicateTargetSameBodyRenameBlocked.admission.reasonCodes.includes('semantic-edit-already-applied-stale'), true);
assert.equal(duplicateTargetSameBodyRenameBlocked.admission.reasonCodes.includes('current-symbol-anchor-missing'), true);

const movedDeclarationBase = [
  'export function first() {',
  '  return 1;',
  '}',
  'export function second() {',
  '  return 2;',
  '}',
  'export function third() {',
  '  return 3;',
  '}',
  ''
].join('\n');

const movedDeclarationWorker = [
  'export function first() {',
  '  return 1;',
  '}',
  'export function third() {',
  '  return 3;',
  '}',
  'export function second() {',
  '  return 20;',
  '}',
  ''
].join('\n');

const movedDeclarationWithSibling = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_semantic_edit_fallback_moved_declaration_sibling',
  language: 'typescript',
  sourcePath: 'src/move.ts',
  baseSourceText: movedDeclarationBase,
  workerSourceText: movedDeclarationWorker,
  headSourceText: movedDeclarationBase.replace('return 1;', 'return 10;')
});

assert.equal(movedDeclarationWithSibling.status, 'blocked');
assert.equal(movedDeclarationWithSibling.admission.reasonCodes.includes(JsTsSafeMergeConflictCodes.topLevelOrderChanged), true);
assert.equal(movedDeclarationWithSibling.admission.reasonCodes.includes(JsTsSafeMergeConflictCodes.changedExistingDeclaration), true);
assert.equal(movedDeclarationWithSibling.semanticArtifacts, undefined);
