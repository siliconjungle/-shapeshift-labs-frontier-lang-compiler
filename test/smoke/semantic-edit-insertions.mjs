import { assert } from './helpers.mjs';
import { createSemanticEditScript, projectSemanticEditScriptToSource, replaySemanticEditProjection } from './compiler-api.mjs';

const insertionBase = 'export function existing() { return 1; }\n';
const insertionWorker = "import { helper } from './helper.js';\nexport function existing() { return 1; }\nexport function added() { return helper(); }\n";
const insertionScript = createSemanticEditScript({
  id: 'semantic_edit_insertions',
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  baseSourceText: insertionBase,
  workerSourceText: insertionWorker,
  headSourceText: insertionBase,
  generatedAt: 50
});
assert.equal(insertionScript.admission.status, 'auto-merge-candidate');
assert.equal(insertionScript.summary.byKind.addImport >= 1, true);
assert.equal(insertionScript.summary.byKind.addBody, 1);
const addImportOperation = insertionScript.operations.find((operation) => operation.kind === 'addImport');
const addBodyOperation = insertionScript.operations.find((operation) => operation.kind === 'addBody');
assert.equal(addImportOperation.insertion.mode, 'before');
assert.equal(addImportOperation.insertion.anchorSymbolName, 'existing');
assert.equal(addBodyOperation.insertion.mode, 'after');
assert.equal(addBodyOperation.insertion.anchorSymbolName, 'existing');

const insertionProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_insertions_projection',
  script: insertionScript,
  workerSourceText: insertionWorker,
  headSourceText: insertionBase
});
assert.equal(insertionProjection.status, 'projected');
assert.equal(insertionProjection.sourceText, insertionWorker);
assert.equal(insertionProjection.edits.filter((edit) => edit.editKind === 'insert').length, 2);
assert.equal(insertionProjection.edits.some((edit) => edit.insertionMode === 'before'), true);
assert.equal(insertionProjection.edits.some((edit) => edit.insertionMode === 'after'), true);
assert.equal(insertionProjection.edits.every((edit) => edit.replacementSpanTextHash), true);

const insertionReplay = replaySemanticEditProjection({
  id: 'semantic_edit_insertions_replay',
  projection: insertionProjection,
  currentSourceText: insertionBase
});
assert.equal(insertionReplay.status, 'accepted-clean');
assert.equal(insertionReplay.outputSourceText, insertionWorker);
assert.equal(insertionReplay.edits.filter((edit) => edit.editKind === 'insert').length, 2);
assert.equal(insertionReplay.edits.some((edit) => edit.reasonCodes.includes('current-insertion-anchor')), true);

const shiftedInsertionReplay = replaySemanticEditProjection({
  id: 'semantic_edit_shifted_insertions_replay',
  projection: insertionProjection,
  currentSourceText: '\n\n' + insertionBase
});
assert.equal(shiftedInsertionReplay.status, 'accepted-clean');
assert.equal(shiftedInsertionReplay.outputSourceText, '\n\n' + insertionWorker);

const alreadyAppliedInsertionReplay = replaySemanticEditProjection({
  id: 'semantic_edit_already_applied_insertions_replay',
  projection: insertionProjection,
  currentSourceText: insertionWorker
});
assert.equal(alreadyAppliedInsertionReplay.status, 'already-applied');
assert.equal(alreadyAppliedInsertionReplay.outputSourceText, insertionWorker);

const shiftedAlreadyAppliedInsertionSource = '// banner\n' + insertionWorker;
const shiftedAlreadyAppliedInsertionReplay = replaySemanticEditProjection({
  id: 'semantic_edit_shifted_already_applied_insertions_replay',
  projection: insertionProjection,
  currentSourceText: shiftedAlreadyAppliedInsertionSource
});
assert.equal(shiftedAlreadyAppliedInsertionReplay.status, 'already-applied');
assert.equal(shiftedAlreadyAppliedInsertionReplay.outputSourceText, shiftedAlreadyAppliedInsertionSource);
assert.equal(shiftedAlreadyAppliedInsertionReplay.edits.some((edit) => edit.reasonCodes.includes('current-inserted-symbol-matches-replacement-span')), true);

const changedInsertedSymbolSource = "export function existing() { return 1; }\nexport function added() { return 'changed'; }\n";
const changedInsertedSymbolReplay = replaySemanticEditProjection({
  id: 'semantic_edit_changed_inserted_symbol_replay',
  projection: insertionProjection,
  currentSourceText: changedInsertedSymbolSource
});
assert.equal(changedInsertedSymbolReplay.status, 'conflict');
assert.equal(changedInsertedSymbolReplay.outputSourceText, undefined);
assert.equal(changedInsertedSymbolReplay.edits.some((edit) => edit.reasonCodes.includes('current-inserted-symbol-content-mismatch')), true);

const memberInsertionFixtures = [
  {
    id: 'class_method',
    base: 'export class Store {\n  get() {\n    return 1;\n  }\n}\n',
    worker: 'export class Store {\n  get() {\n    return 1;\n  }\n  set(value) {\n    return value;\n  }\n}\n',
    skippedKind: 'replaceTypeDeclaration',
    insertedName: 'Store.set'
  },
  {
    id: 'interface_property',
    base: 'export interface User {\n  id: string;\n}\n',
    worker: 'export interface User {\n  id: string;\n  name: string;\n}\n',
    skippedKind: 'replaceTypeDeclaration',
    insertedName: 'User.name'
  },
  {
    id: 'object_property',
    base: "export const config = {\n  mode: 'a',\n};\n",
    worker: "export const config = {\n  mode: 'a',\n  flag: true,\n};\n",
    skippedKind: 'replaceRegion',
    insertedName: 'config.flag'
  }
];

for (const fixture of memberInsertionFixtures) {
  const script = createSemanticEditScript({
    id: `semantic_edit_member_${fixture.id}`,
    language: 'typescript',
    sourcePath: 'src/member.ts',
    baseSourceText: fixture.base,
    workerSourceText: fixture.worker,
    headSourceText: fixture.base,
    generatedAt: 60
  });
  assert.equal(script.admission.status, 'auto-merge-candidate');
  assert.equal(script.operations.some((operation) => operation.kind === fixture.skippedKind), true);
  assert.equal(script.operations.some((operation) => operation.anchor.symbolName === fixture.insertedName), true);
  const projection = projectSemanticEditScriptToSource({ script, workerSourceText: fixture.worker, headSourceText: fixture.base });
  assert.equal(projection.status, 'projected');
  assert.equal(projection.sourceText, fixture.worker);
  assert.equal(projection.skippedOperations.length, 1);
  assert.equal(projection.edits.length, 1);
  assert.equal(projection.edits[0].editKind, 'insert');
  assert.equal(projection.edits[0].symbolName, fixture.insertedName);
  const replay = replaySemanticEditProjection({ projection, currentSourceText: fixture.base });
  assert.equal(replay.status, 'accepted-clean');
  assert.equal(replay.outputSourceText, fixture.worker);
}
