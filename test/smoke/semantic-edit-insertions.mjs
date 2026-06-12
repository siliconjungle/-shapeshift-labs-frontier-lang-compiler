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

const siblingAnchorBase = 'export function alpha() { return 1; }\nexport function omega() { return 3; }\n';
const siblingAnchorWorker = 'export function alpha() { return 1; }\nexport function beta() { return 2; }\nexport function omega() { return 3; }\n';
const siblingAnchorScript = createSemanticEditScript({
  id: 'semantic_edit_sibling_anchor_candidates',
  language: 'typescript',
  sourcePath: 'src/siblings.ts',
  baseSourceText: siblingAnchorBase,
  workerSourceText: siblingAnchorWorker,
  headSourceText: siblingAnchorBase,
  generatedAt: 52
});
const betaInsertion = siblingAnchorScript.operations.find((operation) => operation.anchor.symbolName === 'beta');
assert.equal(betaInsertion.insertion.anchorCandidates.some((candidate) => candidate.mode === 'after' && candidate.anchorSymbolName === 'alpha'), true);
assert.equal(betaInsertion.insertion.anchorCandidates.some((candidate) => candidate.mode === 'before' && candidate.anchorSymbolName === 'omega'), true);

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

const importAlreadyPresentHead = "import { helper } from './helper.js';\n" + insertionBase;
const importAlreadyPresentScript = {
  ...insertionScript,
  id: 'semantic_edit_import_already_present',
  operations: insertionScript.operations.filter((operation) => operation.kind === 'addImport'),
  admission: {
    ...insertionScript.admission,
    status: 'auto-merge-candidate'
  }
};
const importAlreadyPresentProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_import_already_present_projection',
  script: importAlreadyPresentScript,
  workerSourceText: insertionWorker,
  headSourceText: importAlreadyPresentHead
});
assert.equal(importAlreadyPresentProjection.status, 'projected');
assert.equal(importAlreadyPresentProjection.sourceText, importAlreadyPresentHead);
assert.equal((importAlreadyPresentProjection.sourceText.match(/import \{ helper \} from '\.\/helper\.js';/g) ?? []).length, 1);
assert.equal(importAlreadyPresentProjection.edits.length, 2);
assert.equal(importAlreadyPresentProjection.edits.every((edit) => edit.status === 'already-applied'), true);
assert.equal(importAlreadyPresentProjection.metadata.alreadyAppliedEditCount, 2);

const importAlreadyPresentReplay = replaySemanticEditProjection({
  id: 'semantic_edit_import_already_present_replay',
  projection: importAlreadyPresentProjection,
  currentSourceText: importAlreadyPresentHead
});
assert.equal(importAlreadyPresentReplay.status, 'already-applied');
assert.equal(importAlreadyPresentReplay.outputSourceText, importAlreadyPresentHead);
assert.equal((importAlreadyPresentReplay.outputSourceText.match(/import \{ helper \} from '\.\/helper\.js';/g) ?? []).length, 1);

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

const shiftedAnchorBase = "export function buildRoutes(app) {\n  app.get('/ready', ready);\n}\n";
const shiftedAnchorWorker = "export function buildRoutes(app) {\n  app.get('/ready', ready);\n}\nexport function installHealthRoutes(app) {\n  app.get('/healthz', healthz);\n}\n";
const shiftedAnchorHead = "import { metrics } from './metrics.js';\n\nexport function buildRoutes(app) {\n  metrics.count('routes:init');\n  app.get('/ready', ready);\n}\n";
const shiftedAnchorExpected = "import { metrics } from './metrics.js';\n\nexport function buildRoutes(app) {\n  metrics.count('routes:init');\n  app.get('/ready', ready);\n}\nexport function installHealthRoutes(app) {\n  app.get('/healthz', healthz);\n}\n";
const shiftedAnchorScript = createSemanticEditScript({
  id: 'semantic_edit_shifted_semantic_anchor_projection',
  language: 'typescript',
  sourcePath: 'src/server.ts',
  baseSourceText: shiftedAnchorBase,
  workerSourceText: shiftedAnchorWorker,
  headSourceText: shiftedAnchorBase,
  generatedAt: 58
});
const shiftedAnchorProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_shifted_semantic_anchor_projection',
  script: shiftedAnchorScript,
  workerSourceText: shiftedAnchorWorker,
  headSourceText: shiftedAnchorHead
});
assert.equal(shiftedAnchorProjection.status, 'projected');
assert.equal(shiftedAnchorProjection.sourceText, shiftedAnchorExpected);
assert.equal(shiftedAnchorProjection.edits[0].insertionAnchorSymbolName, 'buildRoutes');
assert.equal(Array.isArray(shiftedAnchorProjection.edits[0].insertionAnchorCandidates), true);
const shiftedAnchorReplay = replaySemanticEditProjection({
  id: 'semantic_edit_shifted_semantic_anchor_replay',
  projection: shiftedAnchorProjection,
  currentSourceText: shiftedAnchorHead
});
assert.equal(shiftedAnchorReplay.status, 'accepted-clean');
assert.equal(shiftedAnchorReplay.outputSourceText, shiftedAnchorExpected);
assert.equal(shiftedAnchorReplay.edits.some((edit) => edit.reasonCodes.includes('current-insertion-anchor')), true);

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
    skippedKind: undefined,
    insertedName: 'Store.set'
  },
  {
    id: 'interface_property',
    base: 'export interface User {\n  id: string;\n}\n',
    worker: 'export interface User {\n  id: string;\n  name: string;\n}\n',
    skippedKind: undefined,
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
  assert.equal(script.operations.some((operation) => operation.kind === fixture.skippedKind), fixture.skippedKind !== undefined);
  assert.equal(script.operations.some((operation) => operation.anchor.symbolName === fixture.insertedName), true);
  const projection = projectSemanticEditScriptToSource({ script, workerSourceText: fixture.worker, headSourceText: fixture.base });
  assert.equal(projection.status, 'projected');
  assert.equal(projection.sourceText, fixture.worker);
  assert.equal(projection.skippedOperations.length, fixture.skippedKind === undefined ? 0 : 1);
  assert.equal(projection.edits.length, 1);
  assert.equal(projection.edits[0].editKind, 'insert');
  assert.equal(projection.edits[0].symbolName, fixture.insertedName);
  const replay = replaySemanticEditProjection({ projection, currentSourceText: fixture.base });
  assert.equal(replay.status, 'accepted-clean');
  assert.equal(replay.outputSourceText, fixture.worker);
}
