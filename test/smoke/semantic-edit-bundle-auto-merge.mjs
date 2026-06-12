import { assert } from './helpers.mjs';
import {
  createSemanticEditBundleAdmission,
  createSemanticEditScript,
  diffNativeSources,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

function semanticEditFlow(input) {
  const script = createSemanticEditScript({
    id: `${input.id}_script`,
    language: 'javascript',
    sourcePath: input.sourcePath,
    baseSourceText: input.base,
    workerSourceText: input.worker,
    headSourceText: input.head ?? input.base,
    generatedAt: 80
  });
  const projection = projectSemanticEditScriptToSource({
    id: `${input.id}_projection`,
    script,
    workerSourceText: input.worker,
    headSourceText: input.head ?? input.base
  });
  const replay = replaySemanticEditProjection({
    id: `${input.id}_replay`,
    projection,
    currentSourceText: input.current ?? input.head ?? input.base
  });
  return { script, projection, replay };
}

const nonOverlappingBase = [
  'export function untouched(value) { return value + 1; }\n',
  'export function portable(value) { return value * 2; }\n'
].join('');
const nonOverlappingWorker = [
  'export function untouched(value) { return value + 1; }\n',
  'export function portable(value) { return value * 3; }\n'
].join('');
const nonOverlappingHead = [
  'export function untouched(value) { return value + 10; }\n',
  'export function portable(value) { return value * 2; }\n'
].join('');
const nonOverlappingExpected = [
  'export function untouched(value) { return value + 10; }\n',
  'export function portable(value) { return value * 3; }\n'
].join('');
const nonOverlapping = semanticEditFlow({
  id: 'bundle_non_overlapping_portable',
  sourcePath: 'src/non-overlapping.js',
  base: nonOverlappingBase,
  worker: nonOverlappingWorker,
  head: nonOverlappingHead,
  current: nonOverlappingHead
});
const nonOverlappingWorkerDiff = diffNativeSources({
  id: 'bundle_non_overlapping_portable_worker_diff',
  language: 'javascript',
  sourcePath: 'src/non-overlapping.js',
  beforeSourceText: nonOverlappingBase,
  afterSourceText: nonOverlappingWorker
});
const nonOverlappingHeadDiff = diffNativeSources({
  id: 'bundle_non_overlapping_portable_head_diff',
  language: 'javascript',
  sourcePath: 'src/non-overlapping.js',
  beforeSourceText: nonOverlappingBase,
  afterSourceText: nonOverlappingHead
});
const workerConflictKeys = nonOverlappingWorkerDiff.changedRegions.map((region) => region.conflictKey);
const headConflictKeys = nonOverlappingHeadDiff.changedRegions.map((region) => region.conflictKey);
const nonOverlappingWorkerEdit = nonOverlapping.script.operations[0];
const nonOverlappingReplayEdit = nonOverlapping.replay.edits[0];
const focusedAutoMergeProof = {
  id: 'evidence_semantic_edit_bundle_focused_checks',
  kind: 'check',
  status: 'passed',
  scope: 'semantic-edit:focused-checks',
  summary: 'Focused semantic edit checks passed because the worker and head touched different semantic conflict keys and replay matched the preserved head anchor.',
  reasonCodes: [
    'focused-semantic-edit-checks-passed',
    'semantic-keys-do-not-overlap',
    'head-anchor-matches-base',
    'head-offset-matches-deleted'
  ],
  metadata: {
    workerConflictKeys,
    headConflictKeys,
    workerReasonCodes: nonOverlappingWorkerEdit.reasonCodes,
    replayReasonCodes: nonOverlapping.replay.summary.reasonCodes,
    replayStatus: nonOverlapping.replay.status
  }
};
assert.deepEqual(workerConflictKeys, [
  'region:source#src/non-overlapping.js#body#portable',
  'region:source#src/non-overlapping.js#export#portable'
]);
assert.deepEqual(headConflictKeys, [
  'region:source#src/non-overlapping.js#body#untouched'
]);
assert.deepEqual(workerConflictKeys.filter((key) => headConflictKeys.includes(key)), []);
assert.equal(nonOverlappingWorkerEdit.status, 'portable');
assert.equal(nonOverlappingWorkerEdit.readiness, 'ready');
assert.equal(nonOverlappingWorkerEdit.anchor.conflictKey, workerConflictKeys[0]);
assert.notEqual(nonOverlappingWorkerEdit.anchor.conflictKey, headConflictKeys[0]);
assert.equal(nonOverlappingWorkerEdit.reasonCodes.includes('head-anchor-matches-base'), true);
assert.equal(nonOverlappingWorkerEdit.hashes.headSpanHash, nonOverlappingWorkerEdit.hashes.baseSpanHash);
assert.notEqual(nonOverlappingWorkerEdit.hashes.workerSpanHash, nonOverlappingWorkerEdit.hashes.baseSpanHash);
assert.equal(nonOverlappingReplayEdit.status, 'applied');
assert.equal(nonOverlappingReplayEdit.sourceRangeKind, 'body-content');
assert.equal(nonOverlappingReplayEdit.reasonCodes.includes('head-offset-matches-deleted'), true);
assert.equal(focusedAutoMergeProof.metadata.workerReasonCodes.includes('head-anchor-matches-base'), true);
assert.equal(focusedAutoMergeProof.metadata.replayReasonCodes.includes('head-offset-matches-deleted'), true);
assert.equal(nonOverlapping.script.admission.status, 'auto-merge-candidate');
assert.equal(nonOverlapping.script.admission.autoApplyCandidate, true);
assert.equal(nonOverlapping.projection.status, 'projected');
assert.equal(nonOverlapping.projection.admission.status, 'auto-merge-candidate');
assert.equal(nonOverlapping.replay.status, 'accepted-clean');
assert.notEqual(nonOverlapping.replay.status, 'stale');
assert.notEqual(nonOverlapping.replay.status, 'conflict');
assert.equal(nonOverlapping.replay.outputSourceText, nonOverlappingExpected);
assert.equal(nonOverlapping.replay.admission.autoApplyCandidate, true);
const nonOverlappingSecondReplay = replaySemanticEditProjection({
  id: 'bundle_non_overlapping_portable_second_replay',
  projection: nonOverlapping.projection,
  currentSourceText: nonOverlapping.replay.outputSourceText
});
assert.equal(nonOverlappingSecondReplay.status, 'already-applied');
assert.equal(nonOverlappingSecondReplay.outputSourceText, nonOverlappingExpected);
assert.equal(nonOverlappingSecondReplay.admission.action, 'skip');
assert.equal(nonOverlappingSecondReplay.summary.applied, 0);
assert.equal(nonOverlappingSecondReplay.summary.alreadyApplied, 1);
assert.deepEqual(nonOverlappingSecondReplay.appliedOperations, []);
assert.deepEqual(nonOverlappingSecondReplay.skippedOperations, [nonOverlapping.script.operations[0].id]);
assert.equal(nonOverlappingSecondReplay.edits[0].reasonCodes.includes('head-offset-matches-replacement-span'), true);
const nonOverlappingAdmission = createSemanticEditBundleAdmission({
  semanticEditScripts: [nonOverlapping.script],
  semanticEditProjections: [nonOverlapping.projection],
  semanticEditReplays: [nonOverlapping.replay],
  evidence: [focusedAutoMergeProof]
});
assert.equal(nonOverlappingAdmission.status, 'ready');
assert.notEqual(nonOverlappingAdmission.status, 'stale');
assert.notEqual(nonOverlappingAdmission.status, 'conflict');
assert.equal(nonOverlappingAdmission.action, 'admit');
assert.equal(nonOverlappingAdmission.autoApplyCandidate, true);
assert.equal(nonOverlappingAdmission.reviewRequired, false);
assert.equal(nonOverlappingAdmission.summary.acceptedClean, 1);
assert.equal(nonOverlappingAdmission.summary.conflictEvidence, 0);
assert.equal(nonOverlappingAdmission.summary.staleEvidence, 0);
assert.equal(nonOverlappingAdmission.reasonCodes.includes('focused-semantic-edit-checks-passed'), true);
assert.equal(nonOverlappingAdmission.reasonCodes.includes('semantic-keys-do-not-overlap'), true);
assert.equal(nonOverlappingAdmission.reasonCodes.includes('head-anchor-matches-base'), true);
assert.equal(nonOverlappingAdmission.reasonCodes.includes('head-offset-matches-deleted'), true);
assert.equal(nonOverlappingAdmission.reasonCodes.includes('semantic-edit-positive-auto-merge-proof'), true);

const sameAnchorConflict = semanticEditFlow({
  id: 'bundle_same_anchor_conflict_guard',
  sourcePath: 'src/non-overlapping.js',
  base: nonOverlappingBase,
  worker: nonOverlappingWorker,
  head: [
    'export function untouched(value) { return value + 1; }\n',
    'export function portable(value) { return value * 4; }\n'
  ].join('')
});
assert.equal(sameAnchorConflict.script.admission.status, 'conflict');
assert.equal(sameAnchorConflict.script.admission.autoApplyCandidate, false);
assert.equal(sameAnchorConflict.script.summary.conflicts, 2);
assert.equal(sameAnchorConflict.script.operations[0].reasonCodes.includes('head-anchor-changed-since-base'), true);
assert.equal(sameAnchorConflict.script.operations[1].anchor.regionKind, 'export');
assert.equal(sameAnchorConflict.script.operations[1].reasonCodes.includes('head-anchor-changed-since-base'), true);
const sameAnchorConflictAdmission = createSemanticEditBundleAdmission({
  semanticEditScripts: [sameAnchorConflict.script],
  evidence: [focusedAutoMergeProof]
});
assert.equal(sameAnchorConflictAdmission.status, 'conflict');
assert.equal(sameAnchorConflictAdmission.autoApplyCandidate, false);
assert.equal(sameAnchorConflictAdmission.reasonCodes.includes('semantic-edit-conflict'), true);
assert.equal(sameAnchorConflictAdmission.reasonCodes.includes('semantic-edit-positive-auto-merge-proof'), false);

const missingHeadNeedsPort = createSemanticEditScript({
  id: 'bundle_missing_head_needs_port_guard_script',
  language: 'javascript',
  sourcePath: 'src/non-overlapping.js',
  baseSourceText: nonOverlappingBase,
  workerSourceText: nonOverlappingWorker,
  generatedAt: 80
});
assert.equal(missingHeadNeedsPort.admission.status, 'needs-port');
assert.equal(missingHeadNeedsPort.admission.autoApplyCandidate, false);
assert.equal(missingHeadNeedsPort.operations[0].reasonCodes.includes('head-source-not-provided'), true);
const missingHeadNeedsPortAdmission = createSemanticEditBundleAdmission({
  semanticEditScripts: [missingHeadNeedsPort],
  evidence: [focusedAutoMergeProof]
});
assert.equal(missingHeadNeedsPortAdmission.status, 'needs-review');
assert.equal(missingHeadNeedsPortAdmission.autoApplyCandidate, false);
assert.equal(missingHeadNeedsPortAdmission.reasonCodes.includes('semantic-edit-script-not-portable'), true);
assert.equal(missingHeadNeedsPortAdmission.reasonCodes.includes('semantic-edit-positive-auto-merge-proof'), false);
