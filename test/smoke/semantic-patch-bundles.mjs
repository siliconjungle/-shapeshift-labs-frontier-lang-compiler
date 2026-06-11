import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticHistoryRecord,
  createSemanticPatchBundleRecord,
  createSemanticTransformIdentityRecord,
  deriveSemanticTransformIdentityRecords,
  diffNativeSources,
  projectSemanticEditScriptToSource,
  querySemanticPatchBundleRecords,
  replaySemanticEditProjection,
  SemanticPatchBundleAdmissionStatuses
} from './compiler-api.mjs';

assert.equal(SemanticPatchBundleAdmissionStatuses.includes('queued'), true);

const beforeSourceText = 'export function add(count) { return count + 1; }\n';
const afterSourceText = 'export function add(count, step) { return count + step; }\n';
const changeSet = diffNativeSources({
  id: 'counter_patch_bundle_change',
  language: 'javascript',
  sourcePath: 'src/counter.js',
  beforeSourceText,
  afterSourceText,
  evidenceId: 'evidence_counter_native_diff',
  patchId: 'patch_counter_native_diff',
  mergeCandidateId: 'merge_candidate_counter_native_diff'
});
const history = createSemanticHistoryRecord({
  id: 'history_counter_patch_bundle',
  changeSet,
  proofIds: ['proof_counter_patch_bundle_replay'],
  admission: { status: 'queued', readiness: changeSet.readiness }
});
const bundle = createSemanticPatchBundleRecord(changeSet, {
  id: 'bundle_counter_patch',
  historyIds: [history.id],
  proofIds: history.proofIds,
  semanticOperationIds: ['semantic_operation_counter_patch'],
  admission: { status: 'queued', readiness: changeSet.readiness }
});

assert.equal(bundle.kind, 'frontier.lang.semanticPatchBundleRecord');
assert.equal(bundle.patchId, 'patch_counter_native_diff');
assert.equal(bundle.mergeCandidateId, 'merge_candidate_counter_native_diff');
assert.equal(bundle.baseHash, changeSet.beforeHash);
assert.equal(bundle.targetHash, changeSet.afterHash);
assert.equal(bundle.changedRegions.length > 0, true);
assert.equal(bundle.sourceMapLinks.length > 0, true);
assert.equal(bundle.evidenceIds.includes('evidence_counter_native_diff'), true);
assert.equal(bundle.proofIds.includes('proof_counter_patch_bundle_replay'), true);
assert.equal(bundle.historyIds.includes('history_counter_patch_bundle'), true);
assert.equal(bundle.semanticOperationIds.includes('semantic_operation_counter_patch'), true);
assert.equal(bundle.index.semanticOperationIds.includes('semantic_operation_counter_patch'), true);
assert.equal(bundle.admission.status, 'queued');
assert.equal(bundle.admission.autoMergeClaim, false);
assert.equal(bundle.summary.reviewRequired, true);
assert.equal(bundle.sources.every((source) => source.sourceText === undefined && source.document === undefined), true);
assert.equal(Object.hasOwn(bundle, 'before'), false);
assert.equal(Object.hasOwn(bundle, 'after'), false);
assert.equal(JSON.stringify(bundle).includes(beforeSourceText.trim()), false);
assert.equal(JSON.stringify(bundle).includes(afterSourceText.trim()), false);

const regionKey = bundle.changedRegions[0].key;
const conflictKey = bundle.changedRegions[0].conflictKey;
const sourceMapId = bundle.sourceMapLinks[0].sourceMapId;
const sourceMapMappingId = bundle.sourceMapLinks[0].sourceMapMappingId;
const sourceMapLinkId = bundle.sourceMapLinks[0].id;
const records = [bundle];

assert.equal(querySemanticPatchBundleRecords(records, { baseHash: changeSet.beforeHash }).length, 1);
assert.equal(querySemanticPatchBundleRecords(records, { targetHash: changeSet.afterHash }).length, 1);
assert.equal(querySemanticPatchBundleRecords(records, { sourcePath: 'src/counter.js' }).length, 1);
assert.equal(querySemanticPatchBundleRecords(records, { regionKey }).length, 1);
assert.equal(querySemanticPatchBundleRecords(records, { conflictKey }).length, 1);
assert.equal(querySemanticPatchBundleRecords(records, { sourceMapId }).length, 1);
assert.equal(querySemanticPatchBundleRecords(records, { sourceMapMappingId }).length, 1);
assert.equal(querySemanticPatchBundleRecords(records, { sourceMapLinkId }).length, 1);
assert.equal(querySemanticPatchBundleRecords(records, { evidenceId: 'evidence_counter_native_diff' }).length, 1);
assert.equal(querySemanticPatchBundleRecords(records, { proofId: 'proof_counter_patch_bundle_replay' }).length, 1);
assert.equal(querySemanticPatchBundleRecords(records, { historyId: 'history_counter_patch_bundle' }).length, 1);
assert.equal(querySemanticPatchBundleRecords(records, { semanticOperationId: 'semantic_operation_counter_patch' }).length, 1);
assert.equal(querySemanticPatchBundleRecords(records, { readiness: changeSet.readiness }).length, 1);
assert.equal(querySemanticPatchBundleRecords(records, { admissionStatus: 'queued' }).length, 1);
assert.equal(querySemanticPatchBundleRecords(records, { sourceHash: 'not_present' }).length, 0);

const semanticEditScript = createSemanticEditScript({
  id: 'counter_patch_bundle_semantic_edit',
  language: 'javascript',
  sourcePath: 'src/counter.js',
  baseSourceText: beforeSourceText,
  workerSourceText: afterSourceText,
  headSourcePath: 'src/counter-core.js',
  headSourceText: beforeSourceText,
  generatedAt: 10
});
const semanticEditProjection = projectSemanticEditScriptToSource({
  id: 'counter_patch_bundle_semantic_projection',
  script: semanticEditScript,
  workerSourceText: afterSourceText,
  headSourceText: beforeSourceText,
  headSourcePath: 'src/counter-core.js'
});
const semanticEditReplay = replaySemanticEditProjection({
  id: 'counter_patch_bundle_semantic_replay',
  projection: semanticEditProjection,
  currentSourceText: beforeSourceText,
  currentSourcePath: 'src/counter-core.js'
});
const semanticBundle = createSemanticPatchBundleRecord(changeSet, {
  id: 'bundle_counter_patch_semantic_edit',
  semanticEditScripts: [semanticEditScript],
  semanticEditProjections: [semanticEditProjection],
  semanticEditReplays: [semanticEditReplay],
  admission: { status: 'queued', readiness: changeSet.readiness }
});
const semanticOperation = semanticEditScript.operations[0];
const semanticEdit = semanticEditProjection.edits[0];
assert.equal(semanticBundle.semanticEditScriptIds.includes(semanticEditScript.id), true);
assert.equal(semanticBundle.semanticEditProjectionIds.includes(semanticEditProjection.id), true);
assert.equal(semanticBundle.semanticEditReplayIds.includes(semanticEditReplay.id), true);
assert.equal(semanticBundle.index.semanticEditKeys.includes(semanticOperation.semanticKey), true);
assert.equal(semanticBundle.index.operationContentHashes.includes(semanticOperation.operationContentHash), true);
assert.equal(semanticBundle.index.editContentHashes.includes(semanticEdit.editContentHash), true);
assert.equal(semanticBundle.index.semanticEditReplayStatuses.includes('accepted-clean'), true);
assert.equal(semanticBundle.index.semanticEditReplayActions.includes('apply'), true);
assert.equal(semanticBundle.index.semanticEditReplayOutputHashes.includes(semanticEditReplay.outputHash), true);
assert.equal(semanticBundle.index.sourcePaths.includes('src/counter-core.js'), true);
assert.equal(semanticBundle.summary.semanticEditScripts, 1);
assert.equal(semanticBundle.summary.semanticEditProjections, 1);
assert.equal(semanticBundle.summary.semanticEditReplays, 1);
assert.equal(semanticBundle.summary.semanticEditProjectionEdits, 1);
assert.equal(semanticBundle.summary.semanticEditReplayEdits, 1);
assert.equal(semanticBundle.summary.semanticTransformIdentities, 1);
assert.equal(querySemanticPatchBundleRecords([semanticBundle], { semanticEditScriptId: semanticEditScript.id }).length, 1);
assert.equal(querySemanticPatchBundleRecords([semanticBundle], { semanticEditProjectionId: semanticEditProjection.id }).length, 1);
assert.equal(querySemanticPatchBundleRecords([semanticBundle], { semanticEditReplayId: semanticEditReplay.id }).length, 1);
assert.equal(querySemanticPatchBundleRecords([semanticBundle], { semanticEditReplayStatus: 'accepted-clean' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([semanticBundle], { semanticEditReplayAction: 'apply' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([semanticBundle], { semanticEditReplayOutputHash: semanticEditReplay.outputHash }).length, 1);
const { index: semanticBundleIndex, ...semanticBundleWithoutIndex } = semanticBundle;
assert.equal(querySemanticPatchBundleRecords([semanticBundleWithoutIndex], { semanticEditReplayStatus: 'accepted-clean' }).length, 1);
void semanticBundleIndex;
assert.equal(querySemanticPatchBundleRecords([semanticBundle], { semanticEditKey: semanticOperation.semanticKey }).length, 1);
assert.equal(querySemanticPatchBundleRecords([semanticBundle], { operationContentHash: semanticOperation.operationContentHash }).length, 1);
assert.equal(querySemanticPatchBundleRecords([semanticBundle], { editContentHash: semanticEdit.editContentHash }).length, 1);
assert.equal(querySemanticPatchBundleRecords([semanticBundle], { sourcePath: 'src/counter-core.js' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([semanticBundle], { semanticTransformContentHash: semanticBundle.index.semanticTransformContentHashes[0] }).length, 1);

const derivedTransforms = deriveSemanticTransformIdentityRecords({
  semanticEditProjections: [semanticEditProjection],
  targetLanguage: 'rust'
});
assert.equal(derivedTransforms.length, 1);
assert.equal(derivedTransforms[0].sourceLanguage, 'javascript');
assert.equal(derivedTransforms[0].targetLanguage, 'rust');
assert.equal(derivedTransforms[0].targetPath, 'src/counter-core.js');
assert.equal(derivedTransforms[0].editContentHash, semanticEdit.editContentHash);

const autoTransformBundle = createSemanticPatchBundleRecord(changeSet, {
  id: 'bundle_counter_patch_transform_auto',
  semanticEditProjections: [semanticEditProjection],
  targetLanguage: 'rust',
  evidenceIds: ['evidence_counter_transform_projection']
});
assert.equal(autoTransformBundle.admission.status, 'admitted');
assert.equal(autoTransformBundle.admission.reviewRequired, false);
assert.equal(autoTransformBundle.admission.autoApplyCandidate, true);
assert.equal(autoTransformBundle.admission.autoMergeClaim, false);
assert.equal(autoTransformBundle.admission.transformAdmission.action, 'admit');
assert.equal(autoTransformBundle.admission.transformAdmission.crossLanguage, true);
assert.equal(autoTransformBundle.admission.reasonCodes.includes('transform-auto-apply-candidate'), true);
assert.equal(autoTransformBundle.admission.evidenceIds.includes('evidence_counter_transform_projection'), true);
assert.equal(querySemanticPatchBundleRecords([autoTransformBundle], { semanticTransformReadiness: 'auto-merge-candidate' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([autoTransformBundle], { semanticTransformEvidenceId: 'evidence_counter_transform_projection' }).length, 1);

const semanticTransform = createSemanticTransformIdentityRecord(semanticOperation, {
  id: 'counter_ts_to_rust_transform',
  sourceLanguage: 'typescript',
  targetLanguage: 'rust',
  sourcePath: 'src/counter.ts',
  targetPath: 'src/counter.rs',
  editContentHash: semanticEdit.editContentHash,
  evidenceIds: ['evidence_counter_transform']
});
const transformBundle = createSemanticPatchBundleRecord(changeSet, {
  id: 'bundle_counter_patch_transform',
  semanticTransformIdentities: [semanticTransform],
  targetLanguage: 'rust',
  admission: { status: 'queued', readiness: changeSet.readiness }
});

assert.equal(transformBundle.semanticTransformIdentityIds.includes(semanticTransform.id), true);
assert.equal(transformBundle.index.semanticTransformKeys.includes(semanticTransform.transformKey), true);
assert.equal(transformBundle.index.semanticTransformIdentityHashes.includes(semanticTransform.transformIdentityHash), true);
assert.equal(transformBundle.index.semanticTransformContentHashes.includes(semanticTransform.transformContentHash), true);
assert.equal(transformBundle.index.projectionIdentityHashes.includes(semanticTransform.projectionIdentityHash), true);
assert.equal(transformBundle.index.transformTargetLanguages.includes('rust'), true);
assert.equal(transformBundle.index.sourcePaths.includes('src/counter.rs'), true);
assert.equal(transformBundle.summary.semanticTransformIdentities, 1);
assert.equal(querySemanticPatchBundleRecords([transformBundle], { semanticTransformId: semanticTransform.id }).length, 1);
assert.equal(querySemanticPatchBundleRecords([transformBundle], { semanticTransformKey: semanticTransform.transformKey }).length, 1);
assert.equal(querySemanticPatchBundleRecords([transformBundle], { semanticTransformContentHash: semanticTransform.transformContentHash }).length, 1);
assert.equal(querySemanticPatchBundleRecords([transformBundle], { projectionIdentityHash: semanticTransform.projectionIdentityHash }).length, 1);
assert.equal(querySemanticPatchBundleRecords([transformBundle], { transformTargetLanguage: 'rust' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([transformBundle], { transformTargetPath: 'src/counter.rs' }).length, 1);
