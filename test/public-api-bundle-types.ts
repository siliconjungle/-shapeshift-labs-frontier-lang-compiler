import * as compilerApi from '../src/index.js';

const semanticPatchBundle = compilerApi.createSemanticPatchBundleRecord({
  language: 'javascript',
  sourcePath: 'src/example.js',
  baseHash: 'base_hash',
  targetHash: 'target_hash',
  changedRegions: [{ key: 'source#src/example.js#function#run', conflictKey: 'source#src/example.js#function#run' }],
  evidenceIds: ['evidence_example'],
  proofIds: ['proof_example'],
  historyIds: ['history_example'],
  admission: { status: 'queued', readiness: 'needs-review' }
});
const typedSemanticPatchBundle: compilerApi.SemanticPatchBundleRecord = semanticPatchBundle;
const typedSemanticPatchBundleIndex: compilerApi.SemanticPatchBundleRecordIndex = typedSemanticPatchBundle.index;
const semanticEditBundleAdmission = compilerApi.createSemanticEditBundleAdmission({ replays: [] });
const typedSemanticEditBundleAdmission: compilerApi.SemanticEditBundleAdmission = semanticEditBundleAdmission;
const semanticEditBundleStatus: compilerApi.SemanticEditBundleAdmissionStatus = 'ready';
const semanticPatchBundleOptions: compilerApi.CreateSemanticPatchBundleRecordOptions = {
  semanticEditReplays: [],
  semanticEditAdmission: typedSemanticEditBundleAdmission,
  targetPortability: { status: 'portable', action: 'port-with-source-map-review' },
  admission: { status: 'queued', readiness: 'needs-review' }
};
const semanticPatchBundleQuery: compilerApi.SemanticPatchBundleRecordQuery = {
  semanticEditReplayStatus: 'accepted-clean',
  semanticEditReplayAction: 'apply',
  semanticEditAdmissionStatus: 'ready',
  semanticEditAdmissionAction: 'admit',
  semanticEditAdmissionReadiness: 'ready',
  targetPortabilityStatus: 'portable'
};
const semanticPatchBundleOverlapQuery: compilerApi.SemanticPatchBundleOverlapQuery = {
  overlapKind: 'replay-output',
  semanticEditReplayOutputHash: 'output_hash'
};
const queriedSemanticPatchBundles: readonly compilerApi.SemanticPatchBundleRecord[] = compilerApi.querySemanticPatchBundleRecords(
  [typedSemanticPatchBundle],
  { ...semanticPatchBundleQuery, regionKey: 'source#src/example.js#function#run', evidenceId: 'evidence_example', admissionStatus: 'queued' }
);

void queriedSemanticPatchBundles;
void typedSemanticPatchBundleIndex;
void typedSemanticEditBundleAdmission;
void semanticEditBundleStatus;
void semanticPatchBundleOptions;
void semanticPatchBundleOverlapQuery;
