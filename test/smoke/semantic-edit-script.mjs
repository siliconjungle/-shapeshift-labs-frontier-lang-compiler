import { assert } from './helpers.mjs';
import { createSemanticEditScript, projectSemanticEditScriptToSource, replaySemanticEditProjection } from './compiler-api.mjs';

const baseSource = 'export function step(value: number) { return value + 1; }\n';
const workerSource = 'export function step(value: number) { return value + 2; }\n';

const candidateOnly = createSemanticEditScript({
  id: 'semantic_edit_candidate_only',
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  generatedAt: 10
});
assert.equal(candidateOnly.kind, 'frontier.lang.semanticEditScript');
assert.equal(candidateOnly.summary.operations, 1);
assert.equal(candidateOnly.summary.candidates, 1);
assert.equal(candidateOnly.admission.status, 'needs-port');
assert.equal(candidateOnly.operations[0].status, 'candidate');
assert.equal(candidateOnly.admission.autoMergeClaim, false);
assert.equal(candidateOnly.admission.semanticEquivalenceClaim, false);

const cleanHead = createSemanticEditScript({
  id: 'semantic_edit_clean_head',
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: baseSource,
  generatedAt: 20
});
assert.equal(cleanHead.admission.status, 'auto-merge-candidate');
assert.equal(cleanHead.admission.autoApplyCandidate, true);
assert.equal(cleanHead.summary.autoMergeCandidates, 1);
assert.equal(cleanHead.operations[0].status, 'portable');
assert.equal(cleanHead.operations[0].reasonCodes.includes('head-source-matches-base'), true);
assert.equal(cleanHead.operations[0].semanticKey, 'semantic-edit:replaceBody:modified:function:step');
assert.ok(cleanHead.operations[0].semanticIdentityHash);
assert.ok(cleanHead.operations[0].sourceIdentityHash);
assert.ok(cleanHead.operations[0].operationContentHash);
assert.deepEqual(cleanHead.summary.semanticKeys, [cleanHead.operations[0].semanticKey]);
assert.deepEqual(cleanHead.summary.operationContentHashes, [cleanHead.operations[0].operationContentHash]);
assert.ok(cleanHead.operations[0].spans.worker);
assert.ok(cleanHead.operations[0].hashes.headTextHash);

const cleanProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_clean_projection',
  script: cleanHead,
  workerSourceText: workerSource,
  headSourceText: baseSource
});
assert.equal(cleanProjection.kind, 'frontier.lang.semanticEditProjection');
assert.equal(cleanProjection.status, 'projected');
assert.equal(cleanProjection.sourceText, workerSource);
assert.deepEqual(cleanProjection.appliedOperations, [cleanHead.operations[0].id]);
assert.equal(cleanProjection.edits.length, 1);
assert.equal(cleanProjection.edits[0].operationId, cleanHead.operations[0].id);
assert.equal(cleanProjection.edits[0].status, 'applied');
assert.equal(cleanProjection.edits[0].anchorKey, cleanHead.operations[0].anchor.key);
assert.equal(cleanProjection.edits[0].conflictKey, cleanHead.operations[0].anchor.conflictKey);
assert.equal(cleanProjection.edits[0].symbolName, 'step');
assert.equal(cleanProjection.edits[0].sourcePath, 'src/runtime.ts');
assert.equal(cleanProjection.edits[0].semanticKey, 'semantic-edit:replaceBody:modified:function:step');
assert.equal(cleanProjection.edits[0].semanticIdentityHash, cleanHead.operations[0].semanticIdentityHash);
assert.equal(cleanProjection.edits[0].sourceIdentityHash, cleanHead.operations[0].sourceIdentityHash);
assert.equal(cleanProjection.edits[0].operationContentHash, cleanHead.operations[0].operationContentHash);
assert.ok(cleanProjection.edits[0].semanticIdentityHash);
assert.ok(cleanProjection.edits[0].sourceIdentityHash);
assert.ok(cleanProjection.edits[0].editContentHash);
assert.equal(cleanProjection.edits[0].replacementText, 'export function step(value: number) { return value + 2; }');
assert.equal(cleanProjection.edits[0].deletedBytes, 'export function step(value: number) { return value + 1; }'.length);
assert.ok(cleanProjection.edits[0].replacementTextHash);
assert.equal(cleanProjection.admission.status, 'auto-merge-candidate');
assert.equal(cleanProjection.admission.autoMergeClaim, false);
assert.equal(cleanProjection.admission.semanticEquivalenceClaim, false);

const cleanReplay = replaySemanticEditProjection({
  id: 'semantic_edit_clean_replay',
  projection: cleanProjection,
  currentSourceText: baseSource
});
assert.equal(cleanReplay.kind, 'frontier.lang.semanticEditReplay');
assert.equal(cleanReplay.status, 'accepted-clean');
assert.equal(cleanReplay.outputSourceText, workerSource);
assert.equal(cleanReplay.admission.action, 'apply');
assert.equal(cleanReplay.admission.autoApplyCandidate, true);
assert.equal(cleanReplay.admission.autoMergeClaim, false);
assert.equal(cleanReplay.admission.semanticEquivalenceClaim, false);
assert.deepEqual(cleanReplay.appliedOperations, [cleanHead.operations[0].id]);
assert.equal(cleanReplay.edits[0].reasonCodes.includes('head-offset-matches-deleted'), true);

const shiftedBaseSource = '\n\n' + baseSource;
const shiftedWorkerSource = '\n\n' + workerSource;
const shiftedReplay = replaySemanticEditProjection({
  id: 'semantic_edit_shifted_replay',
  projection: cleanProjection,
  currentSourceText: shiftedBaseSource
});
assert.equal(shiftedReplay.status, 'accepted-clean');
assert.equal(shiftedReplay.outputSourceText, shiftedWorkerSource);
assert.equal(shiftedReplay.edits[0].reasonCodes.includes('current-symbol-anchor-matches-deleted'), true);
assert.equal(shiftedReplay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);

const alreadyAppliedReplay = replaySemanticEditProjection({
  id: 'semantic_edit_already_applied_replay',
  projection: cleanProjection,
  currentSourceText: workerSource
});
assert.equal(alreadyAppliedReplay.status, 'already-applied');
assert.equal(alreadyAppliedReplay.outputSourceText, workerSource);
assert.equal(alreadyAppliedReplay.admission.action, 'skip');

const conflictReplay = replaySemanticEditProjection({
  id: 'semantic_edit_conflict_replay',
  projection: cleanProjection,
  currentSourceText: 'export function step(value: number) { return value + 3; }\n'
});
assert.equal(conflictReplay.status, 'conflict');
assert.equal(conflictReplay.outputSourceText, undefined);
assert.equal(conflictReplay.summary.conflicts, 1);

const conflictingHead = createSemanticEditScript({
  id: 'semantic_edit_conflicting_head',
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: 'export function step(value: number) { return value + 3; }\n',
  generatedAt: 30
});
assert.equal(conflictingHead.admission.status, 'conflict');
assert.equal(conflictingHead.summary.conflicts, 1);
assert.equal(conflictingHead.operations[0].reasonCodes.includes('head-anchor-changed-since-base'), true);
const blockedProjection = projectSemanticEditScriptToSource({
  script: conflictingHead,
  workerSourceText: workerSource,
  headSourceText: 'export function step(value: number) { return value + 3; }\n'
});
assert.equal(blockedProjection.status, 'blocked');
assert.equal(blockedProjection.sourceText, undefined);
assert.equal(blockedProjection.admission.reasonCodes.includes('script-not-auto-merge-candidate'), true);

const movedHead = createSemanticEditScript({
  id: 'semantic_edit_moved_head',
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourcePath: 'src/runtime-core.ts',
  headSourceText: baseSource,
  generatedAt: 40
});
assert.equal(movedHead.admission.status, 'auto-merge-candidate');
assert.equal(movedHead.summary.portable, 1);
assert.equal(movedHead.operations[0].reanchor.toAnchorKey.includes('src/runtime-core.ts'), true);
assert.equal(movedHead.operations[0].reanchor.toSourcePath, 'src/runtime-core.ts');
assert.equal(movedHead.operations[0].reasonCodes.includes('anchor-reanchored-head-matches-base'), true);

const movedProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_moved_projection',
  script: movedHead,
  workerSourceText: workerSource,
  headSourceText: baseSource,
  headSourcePath: 'src/runtime-core.ts'
});
assert.equal(movedProjection.status, 'projected');
assert.equal(movedProjection.sourcePath, 'src/runtime-core.ts');
assert.equal(movedProjection.sourceText, workerSource);
assert.equal(movedProjection.edits[0].sourcePath, 'src/runtime-core.ts');
assert.equal(movedProjection.edits[0].originalSourcePath, 'src/runtime.ts');
assert.equal(movedProjection.edits[0].targetSourcePath, 'src/runtime-core.ts');
assert.equal(movedProjection.edits[0].targetAnchorKey, movedHead.operations[0].reanchor.toAnchorKey);
assert.equal(movedProjection.edits[0].operationContentHash, movedHead.operations[0].operationContentHash);

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
