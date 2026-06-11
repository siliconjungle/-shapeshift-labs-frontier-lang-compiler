import { assert } from './helpers.mjs';
import {
  compareSemanticPatchBundleRecords,
  createSemanticEditScript,
  createSemanticPatchBundleRecord,
  createSemanticTransformIdentityRecord,
  diffNativeSources,
  projectSemanticEditScriptToSource,
  querySemanticPatchBundleOverlaps,
  replaySemanticEditProjection,
  SemanticPatchBundleOverlapKinds,
  SemanticPatchBundleOverlapStatuses
} from './compiler-api.mjs';

assert.equal(SemanticPatchBundleOverlapKinds.includes('operation-content'), true);
assert.equal(SemanticPatchBundleOverlapKinds.includes('replay-output'), true);
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
const replay = replaySemanticEditProjection({
  id: 'score_overlap_replay',
  projection,
  currentSourceText: baseSource
});
const duplicateA = createSemanticPatchBundleRecord(changeSet, {
  id: 'score_overlap_bundle_a',
  semanticEditScripts: [script],
  semanticEditProjections: [projection],
  semanticEditReplays: [replay]
});
const duplicateB = createSemanticPatchBundleRecord(changeSet, {
  id: 'score_overlap_bundle_b',
  semanticEditScripts: [script],
  semanticEditProjections: [projection],
  semanticEditReplays: [replay]
});
const duplicateOverlap = compareSemanticPatchBundleRecords(duplicateA, duplicateB);

assert.equal(duplicateOverlap.kind, 'frontier.lang.semanticPatchBundleOverlapRecord');
assert.equal(duplicateOverlap.admission.status, 'duplicate');
assert.equal(duplicateOverlap.admission.autoMergeClaim, false);
assert.equal(duplicateOverlap.admission.reviewRequired, true);
assert.equal(duplicateOverlap.overlapKinds.includes('operation-content'), true);
assert.equal(duplicateOverlap.overlapKinds.includes('edit-content'), true);
assert.equal(duplicateOverlap.overlapKinds.includes('semantic-edit-replay'), true);
assert.equal(duplicateOverlap.overlapKinds.includes('replay-output'), true);
assert.equal(duplicateOverlap.shared.operationContentHashes.length, 1);
assert.equal(duplicateOverlap.shared.editContentHashes.length, 1);
assert.equal(duplicateOverlap.shared.semanticEditReplayIds.includes(replay.id), true);
assert.equal(duplicateOverlap.shared.semanticEditReplayOutputHashes.includes(replay.outputHash), true);
assert.equal(duplicateOverlap.admission.reasonCodes.includes('same-replay-output'), true);
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
  { status: 'duplicate', operationContentHash: script.operations[0].operationContentHash, semanticEditReplayStatus: 'accepted-clean' }
);
assert.equal(queriedDuplicates.length, 1);
assert.equal(queriedDuplicates[0].leftBundleId, 'score_overlap_bundle_a');
assert.equal(queriedDuplicates[0].rightBundleId, 'score_overlap_bundle_b');

const queriedSourceOverlaps = querySemanticPatchBundleOverlaps(
  [duplicateA, duplicateB, sourceOnly],
  { status: 'source-overlap', reasonCode: 'same-source-path' }
);
assert.equal(queriedSourceOverlaps.length, 2);

const alternateScript = createSemanticEditScript({
  id: 'score_overlap_alternate_script',
  language: 'javascript',
  sourcePath: 'src/score.js',
  baseSourceText: baseSource,
  workerSourceText: alternateSource,
  headSourceText: baseSource,
  generatedAt: 21
});
const alternateProjection = projectSemanticEditScriptToSource({
  id: 'score_overlap_alternate_projection',
  script: alternateScript,
  workerSourceText: alternateSource,
  headSourceText: baseSource
});
const alternateReplay = replaySemanticEditProjection({
  id: 'score_overlap_alternate_replay',
  projection: alternateProjection,
  currentSourceText: baseSource
});
const replayCurrentBundle = createSemanticPatchBundleRecord(alternateChangeSet, {
  id: 'score_overlap_bundle_replay_current',
  semanticEditScripts: [alternateScript],
  semanticEditProjections: [alternateProjection],
  semanticEditReplays: [alternateReplay]
});
const replayCurrentOverlap = compareSemanticPatchBundleRecords(duplicateA, replayCurrentBundle, { includeSourcePaths: false });
assert.equal(replayCurrentOverlap.overlapKinds.includes('replay-current'), true);
assert.equal(replayCurrentOverlap.admission.reasonCodes.includes('same-replay-current'), true);
assert.equal(querySemanticPatchBundleOverlaps([duplicateA, replayCurrentBundle], {
  semanticEditReplayCurrentHash: replay.currentHash
}).length, 1);

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

const transformBase = createSemanticTransformIdentityRecord(script.operations[0], {
  id: 'score_js_to_rust_transform',
  sourceLanguage: 'javascript',
  targetLanguage: 'rust',
  sourcePath: 'src/score.js',
  targetPath: 'src/score.rs',
  editContentHash: projection.edits[0].editContentHash
});
const transformDuplicateA = createSemanticPatchBundleRecord(changeSet, {
  id: 'score_overlap_bundle_transform_a',
  semanticTransformIdentities: [transformBase],
  sourcePath: 'src/score.js'
});
const transformDuplicateB = createSemanticPatchBundleRecord(changeSet, {
  id: 'score_overlap_bundle_transform_b',
  semanticTransformIdentities: [transformBase],
  sourcePath: 'src/score.rs'
});
const transformDuplicate = compareSemanticPatchBundleRecords(transformDuplicateA, transformDuplicateB, { includeSourcePaths: false });
assert.equal(transformDuplicate.admission.status, 'duplicate');
assert.equal(transformDuplicate.overlapKinds.includes('transform-content'), true);
assert.equal(transformDuplicate.admission.reasonCodes.includes('same-transform-content'), true);
assert.equal(transformDuplicate.shared.semanticTransformContentHashes.length, 1);

const transformIdentityOnly = createSemanticTransformIdentityRecord(script.operations[0], {
  id: 'score_js_to_rust_transform_identity_only',
  sourceLanguage: 'javascript',
  targetLanguage: 'rust',
  sourcePath: 'src/score.js',
  targetPath: 'src/score.rs',
  editContentHash: 'different_edit_content'
});
const transformSemanticBundle = createSemanticPatchBundleRecord(changeSet, {
  id: 'score_overlap_bundle_transform_semantic',
  semanticTransformIdentities: [transformIdentityOnly]
});
const transformSemantic = compareSemanticPatchBundleRecords(transformDuplicateA, transformSemanticBundle, { includeSourcePaths: false });
assert.equal(transformSemantic.admission.status, 'semantic-overlap');
assert.equal(transformSemantic.overlapKinds.includes('semantic-transform'), true);
assert.equal(transformSemantic.overlapKinds.includes('projection-identity'), true);
assert.equal(transformSemantic.admission.reasonCodes.includes('same-semantic-transform'), true);

const queriedTransformOverlaps = querySemanticPatchBundleOverlaps(
  [transformDuplicateA, transformDuplicateB, transformSemanticBundle],
  { semanticTransformContentHash: transformBase.transformContentHash }
);
assert.equal(queriedTransformOverlaps.length, 1);
