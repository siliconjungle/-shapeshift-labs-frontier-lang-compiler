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
const semanticPatchBundleOptions: compilerApi.CreateSemanticPatchBundleRecordOptions = {
  semanticEditReplays: [],
  admission: { status: 'queued', readiness: 'needs-review' }
};
const semanticPatchBundleQuery: compilerApi.SemanticPatchBundleRecordQuery = {
  semanticEditReplayStatus: 'accepted-clean',
  semanticEditReplayAction: 'apply'
};
const queriedSemanticPatchBundles: readonly compilerApi.SemanticPatchBundleRecord[] = compilerApi.querySemanticPatchBundleRecords(
  [typedSemanticPatchBundle],
  { ...semanticPatchBundleQuery, regionKey: 'source#src/example.js#function#run', evidenceId: 'evidence_example', admissionStatus: 'queued' }
);

void queriedSemanticPatchBundles;
void typedSemanticPatchBundleIndex;
void semanticPatchBundleOptions;
