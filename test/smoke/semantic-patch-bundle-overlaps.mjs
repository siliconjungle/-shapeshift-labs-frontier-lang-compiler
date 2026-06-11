import { assert } from './helpers.mjs';
import {
  compareSemanticPatchBundleRecords,
  createSemanticEditScript,
  createSemanticPatchBundleRecord,
  diffNativeSources,
  projectSemanticEditScriptToSource,
  querySemanticPatchBundleOverlaps,
  SemanticPatchBundleOverlapKinds,
  SemanticPatchBundleOverlapStatuses
} from './compiler-api.mjs';

assert.equal(SemanticPatchBundleOverlapKinds.includes('operation-content'), true);
assert.equal(SemanticPatchBundleOverlapStatuses.includes('semantic-overlap'), true);

const baseSource = 'export function score(value) { return value + 1; }\n';
const workerSource = 'export function score(value) { return value + 2; }\n';
const alternateSource = 'export function score(value) { return value + 3; }\n';
const changeSet = diffNativeSources({
  id: 'score_overlap_change',
  language: 'javascript',
  sourcePath: 'src/score.js',
  beforeSourceText: baseSource,
  afterSourceText: workerSource
});
const script = createSemanticEditScript({
  id: 'score_overlap_script',
  language: 'javascript',
  sourcePath: 'src/score.js',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: baseSource,
  generatedAt: 20
});
const projection = projectSemanticEditScriptToSource({
  id: 'score_overlap_projection',
  script,
  workerSourceText: workerSource,
  headSourceText: baseSource
});
const duplicateA = createSemanticPatchBundleRecord(changeSet, {
  id: 'score_overlap_bundle_a',
  semanticEditScripts: [script],
  semanticEditProjections: [projection]
});
const duplicateB = createSemanticPatchBundleRecord(changeSet, {
  id: 'score_overlap_bundle_b',
  semanticEditScripts: [script],
  semanticEditProjections: [projection]
});
const duplicateOverlap = compareSemanticPatchBundleRecords(duplicateA, duplicateB);

assert.equal(duplicateOverlap.kind, 'frontier.lang.semanticPatchBundleOverlapRecord');
assert.equal(duplicateOverlap.admission.status, 'duplicate');
assert.equal(duplicateOverlap.admission.autoMergeClaim, false);
assert.equal(duplicateOverlap.admission.reviewRequired, true);
assert.equal(duplicateOverlap.overlapKinds.includes('operation-content'), true);
assert.equal(duplicateOverlap.overlapKinds.includes('edit-content'), true);
assert.equal(duplicateOverlap.shared.operationContentHashes.length, 1);
assert.equal(duplicateOverlap.shared.editContentHashes.length, 1);
assert.equal(duplicateOverlap.score >= 100, true);

const alternateChangeSet = diffNativeSources({
  id: 'score_overlap_alternate_change',
  language: 'javascript',
  sourcePath: 'src/score.js',
  beforeSourceText: baseSource,
  afterSourceText: alternateSource
});
const sourceOnly = createSemanticPatchBundleRecord(alternateChangeSet, {
  id: 'score_overlap_bundle_source_only'
});
const sourceOverlap = compareSemanticPatchBundleRecords(duplicateA, sourceOnly);

assert.equal(sourceOverlap.admission.status, 'source-overlap');
assert.equal(sourceOverlap.overlapKinds.includes('source-path'), true);
assert.equal(sourceOverlap.admission.reasonCodes.includes('same-source-path'), true);
assert.equal(sourceOverlap.admission.reasonCodes.includes('target-hash-mismatch'), true);

const queriedDuplicates = querySemanticPatchBundleOverlaps(
  [duplicateA, duplicateB, sourceOnly],
  { status: 'duplicate', operationContentHash: script.operations[0].operationContentHash }
);
assert.equal(queriedDuplicates.length, 1);
assert.equal(queriedDuplicates[0].leftBundleId, 'score_overlap_bundle_a');
assert.equal(queriedDuplicates[0].rightBundleId, 'score_overlap_bundle_b');

const queriedSourceOverlaps = querySemanticPatchBundleOverlaps(
  [duplicateA, duplicateB, sourceOnly],
  { status: 'source-overlap', reasonCode: 'same-source-path' }
);
assert.equal(queriedSourceOverlaps.length, 2);

const independentBundle = createSemanticPatchBundleRecord({
  id: 'score_overlap_independent_change',
  language: 'javascript',
  sourcePath: 'src/other.js',
  baseHash: 'other_base',
  targetHash: 'other_target'
}, { id: 'score_overlap_bundle_independent' });
const independent = compareSemanticPatchBundleRecords(duplicateA, independentBundle);
assert.equal(independent.admission.status, 'independent');
assert.equal(independent.admission.reviewRequired, false);
assert.equal(querySemanticPatchBundleOverlaps([duplicateA, independentBundle], { includeIndependent: true }).length, 1);
