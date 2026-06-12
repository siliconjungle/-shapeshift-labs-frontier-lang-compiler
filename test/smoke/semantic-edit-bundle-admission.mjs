import { assert } from './helpers.mjs';
import {
  createSemanticEditBundleAdmission,
  createSemanticEditScript,
  createSemanticPatchBundleRecord,
  diffNativeSources,
  projectSemanticEditScriptToSource,
  querySemanticPatchBundleRecords,
  replaySemanticEditProjection,
  SemanticEditBundleAdmissionStatuses
} from './compiler-api.mjs';
assert.equal(SemanticEditBundleAdmissionStatuses.includes('ready'), true);
const emptyAdmission = createSemanticEditBundleAdmission({});
assert.equal(emptyAdmission.status, 'none');
assert.equal(emptyAdmission.action, 'none');
assert.equal(emptyAdmission.reviewRequired, false);
assert.equal(emptyAdmission.autoApplyCandidate, false);
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
const passedAutoMergeProof = {
  id: 'evidence_semantic_edit_bundle_auto_merge_tests',
  kind: 'test',
  status: 'passed',
  scope: 'semantic-edit:auto-merge',
  summary: 'Semantic edit bundle replay gate passed.'
};
const staleAutoMergeEvidence = {
  id: 'evidence_semantic_edit_bundle_stale_source',
  kind: 'proof',
  status: 'stale',
  scope: 'semantic-edit:auto-merge',
  reasonCodes: ['stale-source-evidence']
};
const conflictAutoMergeEvidence = {
  id: 'evidence_semantic_edit_bundle_conflict',
  kind: 'proof',
  status: 'conflict',
  scope: 'semantic-edit:auto-merge',
  reasonCodes: ['semantic-conflict-evidence']
};
const first = semanticEditFlow({
  id: 'bundle_first',
  sourcePath: 'src/a.js',
  base: 'export function a() { return 1; }\n',
  worker: 'export function a() { return 2; }\n'
});
const second = semanticEditFlow({
  id: 'bundle_second',
  sourcePath: 'src/b.js',
  base: 'export function b() { return 1; }\n',
  worker: 'export function b() { return 3; }\n'
});
const readyAdmission = createSemanticEditBundleAdmission({
  semanticEditScripts: [first.script, second.script],
  semanticEditProjections: [first.projection, second.projection],
  semanticEditReplays: [first.replay, second.replay],
  evidence: [passedAutoMergeProof]
});
assert.equal(readyAdmission.status, 'ready');
assert.equal(readyAdmission.action, 'admit');
assert.equal(readyAdmission.autoApplyCandidate, true);
assert.equal(readyAdmission.reviewRequired, false);
assert.equal(readyAdmission.summary.files, 2);
assert.equal(readyAdmission.summary.portableScripts, 2);
assert.equal(readyAdmission.summary.portableProjections, 2);
assert.equal(readyAdmission.summary.acceptedClean, 2);
assert.equal(readyAdmission.summary.passedTestEvidence, 1);
assert.equal(readyAdmission.summary.failedTestEvidence, 0);
assert.equal(readyAdmission.summary.conflictEvidence, 0);
assert.equal(readyAdmission.summary.staleEvidence, 0);
assert.equal(readyAdmission.reasonCodes.includes('semantic-edit-replay-accepted-clean'), true);
assert.equal(readyAdmission.reasonCodes.includes('semantic-edit-positive-auto-merge-proof'), true);
const missingTestAdmission = createSemanticEditBundleAdmission({
  semanticEditScripts: [first.script, second.script],
  semanticEditProjections: [first.projection, second.projection],
  semanticEditReplays: [first.replay, second.replay]
});
assert.equal(missingTestAdmission.status, 'needs-review');
assert.equal(missingTestAdmission.autoApplyCandidate, false);
assert.equal(missingTestAdmission.reasonCodes.includes('semantic-edit-tests-passed-evidence-missing'), true);
const forcedReadyWithoutProof = createSemanticEditBundleAdmission({
  status: 'ready',
  action: 'admit',
  autoApplyCandidate: 'true',
  reviewRequired: false,
  semanticEditScripts: [first.script],
  semanticEditProjections: [first.projection],
  semanticEditReplays: [first.replay]
});
assert.equal(forcedReadyWithoutProof.status, 'needs-review');
assert.equal(forcedReadyWithoutProof.action, 'review');
assert.equal(forcedReadyWithoutProof.autoApplyCandidate, false);
assert.equal(forcedReadyWithoutProof.reviewRequired, true);
const evidenceOnlyFailedAdmission = createSemanticEditBundleAdmission({
  evidence: [{ id: 'evidence_only_failed', kind: 'test', status: 'failed' }]
});
assert.equal(evidenceOnlyFailedAdmission.status, 'blocked');
assert.equal(evidenceOnlyFailedAdmission.action, 'block');
assert.equal(evidenceOnlyFailedAdmission.reviewRequired, true);
const unportableProjectionAdmission = createSemanticEditBundleAdmission({
  semanticEditScripts: [first.script],
  semanticEditProjections: [{
    ...first.projection,
    admission: { ...first.projection.admission, status: 'needs-review' }
  }],
  semanticEditReplays: [first.replay],
  evidence: [passedAutoMergeProof]
});
assert.equal(unportableProjectionAdmission.status, 'needs-review');
assert.equal(unportableProjectionAdmission.autoApplyCandidate, false);
assert.equal(unportableProjectionAdmission.reasonCodes.includes('semantic-edit-projection-not-portable'), true);
const staleEvidenceAdmission = createSemanticEditBundleAdmission({
  semanticEditScripts: [first.script],
  semanticEditProjections: [first.projection],
  semanticEditReplays: [first.replay],
  evidence: [passedAutoMergeProof, staleAutoMergeEvidence]
});
assert.equal(staleEvidenceAdmission.status, 'stale');
assert.equal(staleEvidenceAdmission.autoApplyCandidate, false);
assert.equal(staleEvidenceAdmission.reasonCodes.includes('semantic-edit-stale-evidence'), true);
const conflictEvidenceAdmission = createSemanticEditBundleAdmission({
  semanticEditScripts: [first.script],
  semanticEditProjections: [first.projection],
  semanticEditReplays: [first.replay],
  evidence: [passedAutoMergeProof, conflictAutoMergeEvidence]
});
assert.equal(conflictEvidenceAdmission.status, 'conflict');
assert.equal(conflictEvidenceAdmission.autoApplyCandidate, false);
assert.equal(conflictEvidenceAdmission.reasonCodes.includes('semantic-edit-conflict-evidence'), true);
const changeSet = diffNativeSources({
  id: 'semantic_edit_bundle_change',
  language: 'javascript',
  sourcePath: 'src/a.js',
  beforeSourceText: 'export function a() { return 1; }\n',
  afterSourceText: 'export function a() { return 2; }\n'
});
const readyBundle = createSemanticPatchBundleRecord(changeSet, {
  id: 'semantic_edit_bundle_ready',
  semanticEditScripts: [first.script, second.script],
  semanticEditProjections: [first.projection, second.projection],
  semanticEditReplays: [first.replay, second.replay],
  evidence: [passedAutoMergeProof]
});
assert.equal(readyBundle.admission.status, 'admitted');
assert.equal(readyBundle.admission.semanticEditAdmission.status, 'ready');
assert.equal(readyBundle.admission.evidenceAdmission.status, 'ready');
assert.equal(readyBundle.admission.evidenceAdmission.reasonCodes.includes('auto-merge-tests-passed'), true);
assert.equal(readyBundle.admission.evidenceAdmission.reasonCodes.includes('auto-merge-positive-proof'), true);
assert.equal(readyBundle.admission.autoApplyCandidate, true);
assert.equal(readyBundle.summary.semanticEditBundleStatus, 'ready');
assert.equal(readyBundle.index.semanticEditAdmissionStatuses.includes('ready'), true);
assert.equal(readyBundle.index.semanticEditAdmissionReadinesses.includes('ready'), true);
assert.equal(querySemanticPatchBundleRecords([readyBundle], { semanticEditAdmissionStatus: 'ready' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([readyBundle], { semanticEditAdmissionAction: 'admit' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([readyBundle], { semanticEditAdmissionReadiness: 'ready' }).length, 1);
const { index: readyBundleIndex, ...readyBundleWithoutIndex } = readyBundle;
assert.equal(querySemanticPatchBundleRecords([readyBundleWithoutIndex], { semanticEditAdmissionStatus: 'ready' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([readyBundleWithoutIndex], { semanticEditAdmissionAction: 'admit' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([readyBundleWithoutIndex], { semanticEditAdmissionReadiness: 'ready' }).length, 1);
void readyBundleIndex;
const missingTestBundle = createSemanticPatchBundleRecord(changeSet, {
  id: 'semantic_edit_bundle_missing_tests',
  semanticEditScripts: [first.script, second.script],
  semanticEditProjections: [first.projection, second.projection],
  semanticEditReplays: [first.replay, second.replay]
});
assert.equal(missingTestBundle.admission.status, 'needs-review');
assert.equal(missingTestBundle.admission.autoApplyCandidate, false);
assert.equal(missingTestBundle.admission.semanticEditAdmission.status, 'needs-review');
assert.equal(missingTestBundle.admission.evidenceAdmission.status, 'needs-review');
assert.equal(missingTestBundle.admission.reasonCodes.includes('auto-merge-tests-passed-evidence-missing'), true);
const conflictEvidenceBundle = createSemanticPatchBundleRecord(changeSet, {
  id: 'semantic_edit_bundle_conflict_evidence',
  semanticEditScripts: [first.script],
  semanticEditProjections: [first.projection],
  semanticEditReplays: [first.replay],
  evidence: [passedAutoMergeProof, conflictAutoMergeEvidence]
});
assert.equal(conflictEvidenceBundle.admission.status, 'blocked');
assert.equal(conflictEvidenceBundle.admission.autoApplyCandidate, false);
assert.equal(conflictEvidenceBundle.admission.evidenceAdmission.status, 'blocked');
assert.equal(conflictEvidenceBundle.admission.reasonCodes.includes('auto-merge-conflict-evidence'), true);
const already = semanticEditFlow({
  id: 'bundle_already',
  sourcePath: 'src/c.js',
  base: 'export function c() { return 1; }\n',
  worker: 'export function c() { return 2; }\n',
  current: 'export function c() { return 2; }\n'
});
const alreadyAdmission = createSemanticEditBundleAdmission({
  semanticEditScripts: [already.script],
  semanticEditProjections: [already.projection],
  semanticEditReplays: [already.replay]
});
assert.equal(alreadyAdmission.status, 'already-applied');
assert.equal(alreadyAdmission.action, 'skip');
assert.equal(alreadyAdmission.readiness, 'ready');
assert.equal(alreadyAdmission.reviewRequired, false);
assert.equal(alreadyAdmission.autoApplyCandidate, false);
assert.equal(alreadyAdmission.reasonCodes.includes('semantic-edit-replay-already-applied'), true);
const mixedAdmission = createSemanticEditBundleAdmission({
  semanticEditScripts: [first.script, already.script],
  semanticEditProjections: [first.projection, already.projection],
  semanticEditReplays: [first.replay, already.replay],
  evidence: [passedAutoMergeProof]
});
assert.equal(mixedAdmission.status, 'ready');
assert.equal(mixedAdmission.summary.acceptedClean, 1);
assert.equal(mixedAdmission.summary.alreadyApplied, 1);
const alreadyChangeSet = diffNativeSources({
  id: 'semantic_edit_bundle_already_change',
  language: 'javascript',
  sourcePath: 'src/c.js',
  beforeSourceText: 'export function c() { return 1; }\n',
  afterSourceText: 'export function c() { return 2; }\n'
});
const alreadyBundle = createSemanticPatchBundleRecord(alreadyChangeSet, {
  id: 'semantic_edit_bundle_already',
  semanticEditScripts: [already.script],
  semanticEditProjections: [already.projection],
  semanticEditReplays: [already.replay]
});
assert.equal(alreadyBundle.admission.status, 'admitted');
assert.equal(alreadyBundle.admission.readiness, 'ready');
assert.equal(alreadyBundle.admission.reviewRequired, false);
assert.equal(alreadyBundle.admission.autoApplyCandidate, false);
assert.equal(alreadyBundle.admission.semanticEditAdmission.status, 'already-applied');
assert.equal(querySemanticPatchBundleRecords([alreadyBundle], { semanticEditAdmissionStatus: 'already-applied' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([alreadyBundle], { semanticEditAdmissionAction: 'skip' }).length, 1);
const stale = semanticEditFlow({
  id: 'bundle_stale',
  sourcePath: 'src/d.js',
  base: 'export function d() { return 1; }\n',
  worker: 'export function d() { return 2; }\n',
  current: 'export function renamed() { return 1; }\n'
});
const conflict = semanticEditFlow({
  id: 'bundle_conflict',
  sourcePath: 'src/e.js',
  base: 'export function e() { return 1; }\n',
  worker: 'export function e() { return 2; }\n',
  current: 'export function e() { return 4; }\n'
});
assert.equal(createSemanticEditBundleAdmission({ semanticEditReplays: [stale.replay] }).status, 'stale');
assert.equal(createSemanticEditBundleAdmission({ semanticEditReplays: [conflict.replay] }).status, 'conflict');
const blockedAdmission = createSemanticEditBundleAdmission({
  semanticEditProjections: [{
    id: 'bundle_blocked_projection',
    status: 'blocked',
    admission: { status: 'blocked', reasonCodes: ['projection-blocked'] }
  }]
});
assert.equal(blockedAdmission.status, 'blocked');
assert.equal(blockedAdmission.action, 'block');
assert.equal(blockedAdmission.readiness, 'blocked');
assert.equal(blockedAdmission.reasonCodes.includes('semantic-edit-blocked'), true);
const missingReplayAdmission = createSemanticEditBundleAdmission({
  semanticEditScripts: [first.script],
  semanticEditProjections: [first.projection]
});
assert.equal(missingReplayAdmission.status, 'needs-review');
assert.equal(missingReplayAdmission.action, 'review');
assert.equal(missingReplayAdmission.reasonCodes.includes('semantic-edit-replay-missing'), true);
