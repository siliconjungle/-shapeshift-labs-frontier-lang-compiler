import { assert } from './helpers.mjs';
import { createSemanticEditScript, projectSemanticEditScriptToSource, replaySemanticEditProjection } from './compiler-api.mjs';

const sourceTopLevelRenameBase = [
  'export function step(v: number) {',
  '  return v + 1;',
  '}',
  'export function keep() {',
  '  return 0;',
  '}',
  ''
].join('\n');
const sourceTopLevelRenameWorker = sourceTopLevelRenameBase.replace('function step', 'function renamedStep');
const sourceTopLevelRenameHead = sourceTopLevelRenameBase.replace('return 0;', 'return 10;');
const sourceTopLevelRenameExpected = [
  'export function renamedStep(v: number) {',
  '  return v + 1;',
  '}',
  'export function keep() {',
  '  return 10;',
  '}',
  ''
].join('\n');

const sourceTopLevelRenameScript = createSemanticEditScript({
  id: 'semantic_edit_source_top_level_rename_sibling',
  language: 'typescript',
  sourcePath: 'src/source-top-level.ts',
  baseSourceText: sourceTopLevelRenameBase,
  workerSourceText: sourceTopLevelRenameWorker,
  headSourceText: sourceTopLevelRenameHead
});

assert.equal(sourceTopLevelRenameScript.admission.status, 'auto-merge-candidate');
assert.equal(sourceTopLevelRenameScript.summary.byKind.removeBody, 1);
assert.equal(sourceTopLevelRenameScript.summary.byKind.addBody, 1);
assert.equal(sourceTopLevelRenameScript.operations.some((operation) => operation.anchor?.symbolName === 'step'), true);
assert.equal(sourceTopLevelRenameScript.operations.some((operation) => operation.anchor?.symbolName === 'renamedStep'), true);

const sourceTopLevelRenameProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_source_top_level_rename_sibling_projection',
  script: sourceTopLevelRenameScript,
  workerSourceText: sourceTopLevelRenameWorker,
  headSourceText: sourceTopLevelRenameHead,
  headSourcePath: 'src/source-top-level.ts'
});
assert.equal(sourceTopLevelRenameProjection.status, 'projected');
assert.equal(sourceTopLevelRenameProjection.sourceText, sourceTopLevelRenameExpected);

const sourceTopLevelRenameReplay = replaySemanticEditProjection({
  id: 'semantic_edit_source_top_level_rename_sibling_replay',
  projection: sourceTopLevelRenameProjection,
  currentSourceText: sourceTopLevelRenameHead,
  currentSourcePath: 'src/source-top-level.ts',
  language: 'typescript'
});
assert.equal(sourceTopLevelRenameReplay.status, 'accepted-clean');
assert.equal(sourceTopLevelRenameReplay.outputSourceText, sourceTopLevelRenameExpected);

const sourceClassMethodRenameBase = [
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
const sourceClassMethodRenameWorker = sourceClassMethodRenameBase.replace('step(v: number)', 'renamedStep(v: number)');
const sourceClassMethodRenameHead = sourceClassMethodRenameBase.replace('return 0;', 'return 10;');
const sourceClassMethodRenameExpected = [
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

const sourceClassMethodRenameScript = createSemanticEditScript({
  id: 'semantic_edit_source_class_method_rename_sibling',
  language: 'typescript',
  sourcePath: 'src/service.ts',
  baseSourceText: sourceClassMethodRenameBase,
  workerSourceText: sourceClassMethodRenameWorker,
  headSourceText: sourceClassMethodRenameHead
});

assert.equal(sourceClassMethodRenameScript.admission.status, 'auto-merge-candidate');
assert.equal(sourceClassMethodRenameScript.summary.byKind.removeBody, 1);
assert.equal(sourceClassMethodRenameScript.summary.byKind.addBody, 1);
assert.equal(sourceClassMethodRenameScript.operations.some((operation) => operation.anchor?.symbolName === 'Service.step'), true);
assert.equal(sourceClassMethodRenameScript.operations.some((operation) => operation.anchor?.symbolName === 'Service.renamedStep'), true);

const sourceClassMethodRenameProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_source_class_method_rename_sibling_projection',
  script: sourceClassMethodRenameScript,
  workerSourceText: sourceClassMethodRenameWorker,
  headSourceText: sourceClassMethodRenameHead,
  headSourcePath: 'src/service.ts'
});
assert.equal(sourceClassMethodRenameProjection.status, 'projected');
assert.equal(sourceClassMethodRenameProjection.sourceText, sourceClassMethodRenameExpected);

const sourceClassMethodRenameReplay = replaySemanticEditProjection({
  id: 'semantic_edit_source_class_method_rename_sibling_replay',
  projection: sourceClassMethodRenameProjection,
  currentSourceText: sourceClassMethodRenameHead,
  currentSourcePath: 'src/service.ts',
  language: 'typescript'
});
assert.equal(sourceClassMethodRenameReplay.status, 'accepted-clean');
assert.equal(sourceClassMethodRenameReplay.outputSourceText, sourceClassMethodRenameExpected);

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
const movedDeclarationHead = movedDeclarationBase.replace('return 1;', 'return 10;');
const movedDeclarationExpected = [
  'export function first() {',
  '  return 10;',
  '}',
  'export function second() {',
  '  return 20;',
  '}',
  'export function third() {',
  '  return 3;',
  '}',
  ''
].join('\n');

const movedDeclarationScript = createSemanticEditScript({
  id: 'semantic_edit_moved_declaration_sibling',
  language: 'typescript',
  sourcePath: 'src/move.ts',
  baseSourceText: movedDeclarationBase,
  workerSourceText: movedDeclarationWorker,
  headSourceText: movedDeclarationHead
});

assert.equal(movedDeclarationScript.admission.status, 'auto-merge-candidate');
assert.equal(movedDeclarationScript.summary.byKind.replaceBody, 2);
assert.equal(movedDeclarationScript.operations.some((operation) => operation.anchor?.symbolName === 'second'), true);
assert.equal(movedDeclarationScript.operations.some((operation) => operation.anchor?.symbolName === 'third'), true);

const movedDeclarationProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_moved_declaration_sibling_projection',
  script: movedDeclarationScript,
  workerSourceText: movedDeclarationWorker,
  headSourceText: movedDeclarationHead,
  headSourcePath: 'src/move.ts'
});
assert.equal(movedDeclarationProjection.status, 'projected');
assert.equal(movedDeclarationProjection.sourceText, movedDeclarationExpected);
assert.equal(movedDeclarationProjection.sourceText === movedDeclarationWorker.replace('return 1;', 'return 10;'), false);
assert.equal(movedDeclarationWorker.indexOf('export function third()') < movedDeclarationWorker.indexOf('export function second()'), true);
assert.equal(movedDeclarationProjection.sourceText.indexOf('export function second()') < movedDeclarationProjection.sourceText.indexOf('export function third()'), true);
assert.equal(movedDeclarationProjection.edits.length, 1);
assert.equal(movedDeclarationProjection.edits[0].symbolName, 'second');
assert.equal(movedDeclarationProjection.edits[0].sourceRangeKind, 'body-content');
assert.equal(movedDeclarationProjection.edits[0].replacementText, '\n  return 20;\n');

const movedDeclarationReplay = replaySemanticEditProjection({
  id: 'semantic_edit_moved_declaration_sibling_replay',
  projection: movedDeclarationProjection,
  currentSourceText: movedDeclarationHead,
  currentSourcePath: 'src/move.ts',
  language: 'typescript'
});
assert.equal(movedDeclarationReplay.status, 'accepted-clean');
assert.equal(movedDeclarationReplay.outputSourceText, movedDeclarationExpected);
assert.equal(movedDeclarationReplay.outputSourceText.indexOf('export function second()') < movedDeclarationReplay.outputSourceText.indexOf('export function third()'), true);
assert.equal(movedDeclarationReplay.edits.length, 1);
assert.equal(movedDeclarationReplay.edits[0].symbolName, 'second');
assert.equal(movedDeclarationReplay.edits[0].sourceRangeKind, 'body-content');
