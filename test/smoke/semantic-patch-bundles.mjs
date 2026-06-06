import { assert } from './helpers.mjs';
import {
  createSemanticHistoryRecord,
  createSemanticPatchBundleRecord,
  diffNativeSources,
  querySemanticPatchBundleRecords,
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
