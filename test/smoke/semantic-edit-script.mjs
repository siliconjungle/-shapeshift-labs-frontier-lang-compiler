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
assert.equal(cleanProjection.edits[0].sourceRangeKind, 'body-content');
assert.equal(cleanProjection.edits[0].replacementText, ' return value + 2; ');
assert.equal(cleanProjection.edits[0].deletedBytes, ' return value + 1; '.length);
assert.ok(cleanProjection.edits[0].replacementTextHash);
assert.ok(cleanProjection.edits[0].anchorDeletedTextHash);
assert.ok(cleanProjection.edits[0].anchorReplacementTextHash);
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
assert.equal(shiftedReplay.edits[0].reasonCodes.includes('current-symbol-body-matches-deleted'), true);
assert.equal(shiftedReplay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);

const shiftedSignatureSource = 'export function step(value: string | number) { return value + 1; }\n';
const shiftedSignatureExpected = 'export function step(value: string | number) { return value + 2; }\n';
const shiftedSignatureReplay = replaySemanticEditProjection({
  id: 'semantic_edit_shifted_signature_replay',
  projection: cleanProjection,
  currentSourceText: '\n' + shiftedSignatureSource
});
assert.equal(shiftedSignatureReplay.status, 'accepted-clean');
assert.equal(shiftedSignatureReplay.outputSourceText, '\n' + shiftedSignatureExpected);
assert.equal(shiftedSignatureReplay.edits[0].reasonCodes.includes('current-symbol-body-matches-deleted'), true);
assert.equal(shiftedSignatureReplay.edits[0].sourceRangeKind, 'body-content');

const shiftedSignatureBodyConflict = replaySemanticEditProjection({
  id: 'semantic_edit_shifted_signature_body_conflict',
  projection: cleanProjection,
  currentSourceText: '\n' + 'export function step(value: string | number) { return value + 3; }\n'
});
assert.equal(shiftedSignatureBodyConflict.status, 'conflict');
assert.equal(shiftedSignatureBodyConflict.outputSourceText, undefined);
assert.equal(shiftedSignatureBodyConflict.edits[0].reasonCodes.includes('current-symbol-body-content-mismatch'), true);

const crlfBaseSource = 'export function crlf(value) {\r\n  return value + 1;\r\n}\r\n';
const crlfWorkerSource = 'export function crlf(value) {\r\n  return value + 2;\r\n}\r\n';
const crlfScript = createSemanticEditScript({
  id: 'semantic_edit_crlf_source',
  language: 'typescript',
  sourcePath: 'src/crlf.ts',
  baseSourceText: crlfBaseSource,
  workerSourceText: crlfWorkerSource,
  headSourceText: crlfBaseSource,
  generatedAt: 24
});
assert.equal(crlfScript.admission.status, 'auto-merge-candidate');
const crlfProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_crlf_projection',
  script: crlfScript,
  workerSourceText: crlfWorkerSource,
  headSourceText: crlfBaseSource
});
assert.equal(crlfProjection.status, 'projected');
assert.equal(crlfProjection.sourceText, crlfWorkerSource);

const sameContentAnchorBase = 'export class A {\n  run() { return 1; }\n}\nexport class B {\n  run() { return 1; }\n}\n';
const sameContentAnchorWorker = 'export class A {\n  run() { return 1; }\n}\nexport class B {\n  run() { return 2; }\n}\n';
const sameContentAnchorCurrent = 'export class B {\n  run() { return 1; }\n}\nexport class A {\n  run() { return 1; }\n}\n';
const sameContentAnchorExpected = 'export class B {\n  run() { return 2; }\n}\nexport class A {\n  run() { return 1; }\n}\n';
const sameContentAnchorScript = createSemanticEditScript({
  id: 'semantic_edit_same_content_anchor',
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  baseSourceText: sameContentAnchorBase,
  workerSourceText: sameContentAnchorWorker,
  headSourceText: sameContentAnchorBase,
  generatedAt: 25
});
assert.equal(sameContentAnchorScript.admission.status, 'auto-merge-candidate');
assert.equal(sameContentAnchorScript.summary.covered, 1);
const sameContentAnchorProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_same_content_anchor_projection',
  script: sameContentAnchorScript,
  workerSourceText: sameContentAnchorWorker,
  headSourceText: sameContentAnchorBase
});
const sameContentAnchorReplay = replaySemanticEditProjection({
  id: 'semantic_edit_same_content_anchor_replay',
  projection: sameContentAnchorProjection,
  currentSourceText: sameContentAnchorCurrent
});
assert.equal(sameContentAnchorReplay.status, 'accepted-clean');
assert.equal(sameContentAnchorReplay.outputSourceText, sameContentAnchorExpected);
assert.equal(sameContentAnchorReplay.edits[0].reasonCodes.includes('current-symbol-body-matches-deleted'), true);
assert.equal(sameContentAnchorReplay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);

const sameContentAnchorChanged = 'export class B {\n  run() { return 3; }\n}\nexport class A {\n  run() { return 1; }\n}\n';
const sameContentAnchorConflict = replaySemanticEditProjection({
  id: 'semantic_edit_same_content_anchor_conflict',
  projection: sameContentAnchorProjection,
  currentSourceText: sameContentAnchorChanged
});
assert.equal(sameContentAnchorConflict.status, 'conflict');
assert.equal(sameContentAnchorConflict.outputSourceText, undefined);
assert.equal(sameContentAnchorConflict.edits[0].reasonCodes.includes('current-symbol-body-content-mismatch'), true);

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
