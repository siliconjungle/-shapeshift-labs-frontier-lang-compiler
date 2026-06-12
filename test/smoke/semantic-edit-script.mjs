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
assert.equal(candidateOnly.operations[0].kind, 'replaceControlFlow');
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
assert.equal(cleanHead.operations[0].semanticKey, 'semantic-edit:replaceControlFlow:modified:controlFlow:step:controlFlow:exit#1');
assert.ok(cleanHead.operations[0].semanticIdentityHash);
assert.ok(cleanHead.operations[0].sourceIdentityHash);
assert.ok(cleanHead.operations[0].operationContentHash);
assert.deepEqual(cleanHead.summary.semanticKeys, cleanHead.operations.map((operation) => operation.semanticKey));
assert.deepEqual(cleanHead.summary.operationContentHashes, cleanHead.operations.map((operation) => operation.operationContentHash));
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
assert.deepEqual(cleanProjection.skippedOperations, []);
assert.equal(cleanProjection.edits.length, 1);
assert.equal(cleanProjection.edits[0].operationId, cleanHead.operations[0].id);
assert.equal(cleanProjection.edits[0].status, 'applied');
assert.equal(cleanProjection.edits[0].anchorKey, cleanHead.operations[0].anchor.key);
assert.equal(cleanProjection.edits[0].conflictKey, cleanHead.operations[0].anchor.conflictKey);
assert.equal(cleanProjection.edits[0].symbolName, 'step:controlFlow:exit#1');
assert.equal(cleanProjection.edits[0].sourcePath, 'src/runtime.ts');
assert.equal(cleanProjection.edits[0].semanticKey, 'semantic-edit:replaceControlFlow:modified:controlFlow:step:controlFlow:exit#1');
assert.equal(cleanProjection.edits[0].semanticIdentityHash, cleanHead.operations[0].semanticIdentityHash);
assert.equal(cleanProjection.edits[0].sourceIdentityHash, cleanHead.operations[0].sourceIdentityHash);
assert.equal(cleanProjection.edits[0].operationContentHash, cleanHead.operations[0].operationContentHash);
assert.ok(cleanProjection.edits[0].semanticIdentityHash);
assert.ok(cleanProjection.edits[0].sourceIdentityHash);
assert.ok(cleanProjection.edits[0].editContentHash);
assert.equal(cleanProjection.edits[0].sourceRangeKind, undefined);
assert.equal(cleanProjection.edits[0].replacementText, 'return value + 2;');
assert.equal(cleanProjection.edits[0].deletedBytes, 'return value + 1;'.length);
assert.ok(cleanProjection.edits[0].replacementTextHash);
assert.ok(cleanProjection.edits[0].deletedTextHash);
assert.ok(cleanProjection.edits[0].replacementSpanTextHash);
assert.equal(cleanProjection.admission.status, 'auto-merge-candidate');
assert.equal(cleanProjection.admission.autoMergeClaim, false);
assert.equal(cleanProjection.admission.semanticEquivalenceClaim, false);
const shiftedProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_shifted_projection',
  script: cleanHead,
  workerSourceText: workerSource,
  headSourceText: '\n' + baseSource
});
assert.equal(shiftedProjection.status, 'projected');
assert.equal(shiftedProjection.sourceText, '\n' + workerSource);
assert.equal(shiftedProjection.edits[0].headStart, cleanProjection.edits[0].headStart + 1);
assert.equal(shiftedProjection.edits[0].replacementText, cleanProjection.edits[0].replacementText);
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
const shiftedSignatureSource = 'export function step(value: string | number) { return value + 1; }\n';
const shiftedSignatureExpected = 'export function step(value: string | number) { return value + 2; }\n';
const shiftedSignatureReplay = replaySemanticEditProjection({
  id: 'semantic_edit_shifted_signature_replay',
  projection: cleanProjection,
  currentSourceText: '\n' + shiftedSignatureSource
});
assert.equal(shiftedSignatureReplay.status, 'accepted-clean');
assert.equal(shiftedSignatureReplay.outputSourceText, '\n' + shiftedSignatureExpected);
assert.equal(shiftedSignatureReplay.edits[0].reasonCodes.includes('current-symbol-anchor-matches-deleted'), true);
assert.equal(shiftedSignatureReplay.edits[0].sourceRangeKind, undefined);
const shiftedSignatureBodyConflict = replaySemanticEditProjection({
  id: 'semantic_edit_shifted_signature_body_conflict',
  projection: cleanProjection,
  currentSourceText: '\n' + 'export function step(value: string | number) { return value + 3; }\n'
});
assert.equal(shiftedSignatureBodyConflict.status, 'conflict');
assert.equal(shiftedSignatureBodyConflict.outputSourceText, undefined);
assert.equal(shiftedSignatureBodyConflict.edits[0].reasonCodes.includes('current-symbol-anchor-content-mismatch'), true);
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
const lfNoFinalCrlfBaseEquivalent = 'export function crlf(value) {\n  return value + 1;\n}';
const lfNoFinalCrlfWorkerEquivalent = 'export function crlf(value) {\n  return value + 2;\n}';
const lfNoFinalCrlfReplay = replaySemanticEditProjection({
  id: 'semantic_edit_crlf_lf_no_final_replay',
  projection: crlfProjection,
  currentSourceText: lfNoFinalCrlfBaseEquivalent
});
assert.equal(lfNoFinalCrlfReplay.status, 'accepted-clean');
assert.equal(lfNoFinalCrlfReplay.summary.conflicts, 0);
assert.equal(lfNoFinalCrlfReplay.edits[0].reasonCodes.includes('current-symbol-anchor-matches-deleted'), true);
const lfNoFinalCrlfAlreadyApplied = replaySemanticEditProjection({
  id: 'semantic_edit_crlf_lf_no_final_already_applied',
  projection: crlfProjection,
  currentSourceText: lfNoFinalCrlfWorkerEquivalent
});
assert.equal(lfNoFinalCrlfAlreadyApplied.status, 'already-applied');
assert.equal(lfNoFinalCrlfAlreadyApplied.summary.alreadyApplied, 1);
assert.equal(lfNoFinalCrlfAlreadyApplied.edits[0].reasonCodes.includes('current-symbol-anchor-matches-replacement-span'), true);
const lfNoFinalCrlfConflict = replaySemanticEditProjection({
  id: 'semantic_edit_crlf_lf_no_final_conflict',
  projection: crlfProjection,
  currentSourceText: 'export function crlf(value) {\n  return value + 3;\n}'
});
assert.equal(lfNoFinalCrlfConflict.status, 'conflict');
assert.equal(lfNoFinalCrlfConflict.outputSourceText, undefined);
assert.equal(lfNoFinalCrlfConflict.edits[0].reasonCodes.includes('current-symbol-anchor-content-mismatch'), true);
const crlfInsertionLine = 'export function existing() { return 1; }';
const crlfInsertionBase = `${crlfInsertionLine}\r\n`;
const crlfInsertionWorker = `${crlfInsertionLine}\r\nexport function added() { return 2; }\r\n`;
const crlfInsertionScript = createSemanticEditScript({
  id: 'semantic_edit_crlf_insertion',
  language: 'typescript',
  sourcePath: 'src/crlf-insertion.ts',
  baseSourceText: crlfInsertionBase,
  workerSourceText: crlfInsertionWorker,
  headSourceText: crlfInsertionBase,
  generatedAt: 26
});
assert.equal(crlfInsertionScript.admission.status, 'auto-merge-candidate');
const crlfInsertionOperation = crlfInsertionScript.operations.find((operation) => operation.kind === 'addBody');
assert.equal(crlfInsertionOperation.insertion.mode, 'after');
assert.equal(crlfInsertionOperation.insertion.headSpan.startColumn, 1);
assert.equal(crlfInsertionOperation.insertion.headSpan.endColumn, crlfInsertionLine.length + 1);
const crlfInsertionProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_crlf_insertion_projection',
  script: crlfInsertionScript,
  workerSourceText: crlfInsertionWorker,
  headSourceText: crlfInsertionBase
});
assert.equal(crlfInsertionProjection.status, 'projected');
assert.equal(crlfInsertionProjection.sourceText, crlfInsertionWorker);
assert.equal(crlfInsertionProjection.edits[0].headStart, crlfInsertionBase.length);
assert.equal(crlfInsertionProjection.edits[0].replacementText.endsWith('\r\n'), true);
const crlfRemovalKeepLine = 'export function keep() { return 1; }';
const crlfRemovalRemovedLine = 'export function removed() { return 2; }';
const crlfRemovalBase = `${crlfRemovalKeepLine}\r\n${crlfRemovalRemovedLine}\r\n`;
const crlfRemovalWorker = `${crlfRemovalKeepLine}\r\n`;
const crlfRemovalScript = createSemanticEditScript({
  id: 'semantic_edit_crlf_removal',
  language: 'typescript',
  sourcePath: 'src/crlf-removal.ts',
  baseSourceText: crlfRemovalBase,
  workerSourceText: crlfRemovalWorker,
  headSourceText: crlfRemovalBase,
  generatedAt: 27
});
assert.equal(crlfRemovalScript.admission.status, 'auto-merge-candidate');
const crlfRemovalOperation = crlfRemovalScript.operations.find((operation) => operation.kind === 'removeBody');
assert.equal(crlfRemovalOperation.spans.head.startColumn, 1);
assert.equal(crlfRemovalOperation.spans.head.endColumn, crlfRemovalRemovedLine.length + 1);
const crlfRemovalProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_crlf_removal_projection',
  script: crlfRemovalScript,
  workerSourceText: crlfRemovalWorker,
  headSourceText: crlfRemovalBase
});
assert.equal(crlfRemovalProjection.status, 'projected');
assert.equal(crlfRemovalProjection.sourceText, crlfRemovalWorker);
assert.equal(crlfRemovalProjection.edits[0].deletedBytes, `${crlfRemovalRemovedLine}\r\n`.length);
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
assert.equal(conflictingHead.operations[0].anchor.regionKind, 'controlFlow');
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
assert.equal(movedHead.operations[0].anchor.regionKind, 'controlFlow');
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
