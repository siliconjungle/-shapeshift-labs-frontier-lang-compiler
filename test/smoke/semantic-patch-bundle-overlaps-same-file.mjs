import { assert } from './helpers.mjs';
import {
  composeSemanticPatchBundleProjections,
  compareSemanticPatchBundleRecords,
  createSemanticEditScript,
  createSemanticPatchBundleRecord,
  diffNativeSources,
  projectSemanticEditScriptToSource,
  querySemanticPatchBundleOverlaps,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const sameFileDisjointBaseSource = [
  'export function score(value) { return value + 1; }',
  'export function total(value) { return value * 2; }',
  ''
].join('\n');
const sameFileScoreWorkerSource = [
  'export function score(value) { return value + 2; }',
  'export function total(value) { return value * 2; }',
  ''
].join('\n');
const sameFileTotalWorkerSource = [
  'export function score(value) { return value + 1; }',
  'export function total(value) { return value * 3; }',
  ''
].join('\n');
const sameFileScore = createProjectedEditBundle({
  id: 'same_file_disjoint_score',
  sourcePath: 'src/same-file-disjoint.js',
  baseSourceText: sameFileDisjointBaseSource,
  workerSourceText: sameFileScoreWorkerSource,
  generatedAt: 23
});
const sameFileTotal = createProjectedEditBundle({
  id: 'same_file_disjoint_total',
  sourcePath: 'src/same-file-disjoint.js',
  baseSourceText: sameFileDisjointBaseSource,
  workerSourceText: sameFileTotalWorkerSource,
  generatedAt: 24
});

assert.equal(
  sameFileScore.bundle.index.semanticEditKeys.some((key) => sameFileTotal.bundle.index.semanticEditKeys.includes(key)),
  false
);
const sameFileDisjointKeyOverlap = compareSemanticPatchBundleRecords(sameFileScore.bundle, sameFileTotal.bundle);
assert.equal(sameFileDisjointKeyOverlap.admission.status, 'independent');
assert.equal(sameFileDisjointKeyOverlap.admission.reviewRequired, false);
assert.equal(sameFileDisjointKeyOverlap.overlapKinds.includes('source-path'), false);
assert.equal(sameFileDisjointKeyOverlap.overlapKinds.includes('replay-current'), false);
assert.equal(sameFileDisjointKeyOverlap.admission.reasonCodes.includes('same-source-path'), false);
assert.equal(sameFileDisjointKeyOverlap.admission.reasonCodes.includes('target-hash-mismatch'), false);
assert.equal(querySemanticPatchBundleOverlaps([sameFileScore.bundle, sameFileTotal.bundle]).length, 0);

const queriedSameFileDisjoint = querySemanticPatchBundleOverlaps(
  [sameFileScore.bundle, sameFileTotal.bundle],
  { includeIndependent: true, reviewRequired: false }
);
assert.equal(queriedSameFileDisjoint.length, 1);
assert.equal(queriedSameFileDisjoint[0].admission.status, 'independent');

const sameFileComposition = composeSemanticPatchBundleProjections({
  id: 'same_file_disjoint_composition',
  sourcePath: 'src/same-file-disjoint.js',
  language: 'javascript',
  currentSourceText: sameFileDisjointBaseSource,
  bundles: [sameFileScore.bundle, sameFileTotal.bundle],
  projections: [sameFileScore.projection, sameFileTotal.projection]
});
assert.equal(sameFileComposition.status, 'verified');
assert.equal(sameFileComposition.outputSourceText, [
  'export function score(value) { return value + 2; }',
  'export function total(value) { return value * 3; }',
  ''
].join('\n'));
assert.equal(sameFileComposition.summary.appliedEdits, 2);
assert.equal(sameFileComposition.summary.boundedCurrentHeadReplays, 2);
assert.equal(sameFileComposition.summary.sourceBoundVerificationReplays, 2);
assert.equal(sameFileComposition.replays.every((replay) => replay.metadata.currentSourceBindingStatus === 'bound'), true);
assert.equal(sameFileComposition.replays.every((replay) => replay.metadata.outputBindingStatus === 'bound'), true);
assert.equal(sameFileComposition.replays.every((replay) => replay.admission.proofRoute.routeId === 'admit-independent-semantic-edit-current-head-commutation'), true);
assert.equal(sameFileComposition.verificationReplays.every((replay) => replay.status === 'already-applied'), true);
assert.equal(sameFileComposition.verificationReplays.every((replay) => replay.metadata.currentSourceBindingStatus === 'bound'), true);
assert.equal(sameFileComposition.verificationReplays.every((replay) => replay.metadata.expectedOutputHash === sameFileComposition.outputHash), true);

const staleCurrentComposition = composeSemanticPatchBundleProjections({
  id: 'same_file_stale_current_composition',
  sourcePath: 'src/same-file-disjoint.js',
  language: 'javascript',
  currentSourceText: sameFileDisjointBaseSource.replace('value + 1', 'value + 9'),
  bundles: [sameFileScore.bundle, sameFileTotal.bundle],
  projections: [sameFileScore.projection, sameFileTotal.projection]
});
assert.equal(staleCurrentComposition.status, 'blocked');
assert.equal(staleCurrentComposition.admission.reasonCodes.includes('current-source-hash-mismatch'), true);
assert.equal(staleCurrentComposition.admission.autoApplyCandidate, false);

const unboundCurrentComposition = composeSemanticPatchBundleProjections({
  id: 'same_file_unbound_current_composition',
  sourcePath: 'src/same-file-disjoint.js',
  language: 'javascript',
  currentSourceText: sameFileDisjointBaseSource,
  projections: [{ ...sameFileScore.projection, headHash: undefined, metadata: {} }]
});
assert.equal(unboundCurrentComposition.status, 'blocked');
assert.equal(unboundCurrentComposition.admission.reasonCodes.includes('projection-current-source-hash-missing:1'), true);

const duplicateComposition = composeSemanticPatchBundleProjections({
  id: 'same_file_duplicate_composition',
  sourcePath: 'src/same-file-disjoint.js',
  language: 'javascript',
  currentSourceText: sameFileDisjointBaseSource,
  bundles: [sameFileScore.bundle, sameFileScore.bundle],
  projections: [sameFileScore.projection, sameFileScore.projection]
});
assert.equal(duplicateComposition.status, 'blocked');
assert.equal(duplicateComposition.admission.reasonCodes.includes('bundle-overlap:duplicate'), true);

function createProjectedEditBundle({ id, sourcePath, baseSourceText, workerSourceText, generatedAt }) {
  const changeSet = diffNativeSources({
    id: `${id}_change`,
    language: 'javascript',
    sourcePath,
    beforeSourceText: baseSourceText,
    afterSourceText: workerSourceText
  });
  const script = createSemanticEditScript({
    id: `${id}_script`,
    language: 'javascript',
    sourcePath,
    baseSourceText,
    workerSourceText,
    headSourceText: baseSourceText,
    generatedAt
  });
  const projection = projectSemanticEditScriptToSource({
    id: `${id}_projection`,
    script,
    workerSourceText,
    headSourceText: baseSourceText
  });
  const replay = replaySemanticEditProjection({
    id: `${id}_replay`,
    projection,
    currentSourceText: baseSourceText
  });
  const bundle = createSemanticPatchBundleRecord(changeSet, {
    id: `${id}_bundle`,
    semanticEditScripts: [script],
    semanticEditProjections: [projection],
    semanticEditReplays: [replay]
  });
  return { changeSet, script, projection, replay, bundle };
}
