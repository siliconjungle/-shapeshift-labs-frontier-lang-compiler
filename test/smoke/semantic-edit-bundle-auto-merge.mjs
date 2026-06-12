import { assert } from './helpers.mjs';
import {
  createSemanticEditBundleAdmission,
  createSemanticEditScript,
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

const focusedAutoMergeProof = {
  id: 'evidence_semantic_edit_bundle_focused_checks',
  kind: 'check',
  status: 'passed',
  scope: 'semantic-edit:focused-checks',
  summary: 'Focused semantic edit checks passed for a non-overlapping portable edit.',
  reasonCodes: ['focused-semantic-edit-checks-passed']
};
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
assert.equal(nonOverlapping.script.admission.status, 'auto-merge-candidate');
assert.equal(nonOverlapping.script.admission.autoApplyCandidate, true);
assert.equal(nonOverlapping.projection.status, 'projected');
assert.equal(nonOverlapping.projection.admission.status, 'auto-merge-candidate');
assert.equal(nonOverlapping.replay.status, 'accepted-clean');
assert.notEqual(nonOverlapping.replay.status, 'stale');
assert.notEqual(nonOverlapping.replay.status, 'conflict');
assert.equal(nonOverlapping.replay.outputSourceText, nonOverlappingExpected);
assert.equal(nonOverlapping.replay.admission.autoApplyCandidate, true);
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
assert.equal(nonOverlappingAdmission.reasonCodes.includes('semantic-edit-positive-auto-merge-proof'), true);
