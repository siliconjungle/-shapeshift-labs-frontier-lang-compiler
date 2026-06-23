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
typedSemanticPatchBundleIndex.sourceBackprojectionModes satisfies readonly string[];
typedSemanticPatchBundleIndex.transformCrossLanguages satisfies readonly string[];
typedSemanticPatchBundleIndex.transformSourceMapMappingIds satisfies readonly string[];
typedSemanticPatchBundleIndex.lineageResolutionIds satisfies readonly string[];
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
  sourceBackprojectionMode: 'cross-language-explicit-source-replacement',
  targetPortabilityStatus: 'portable'
};
const semanticPatchBundleOverlapQuery: compilerApi.SemanticPatchBundleOverlapQuery = {
  overlapKind: 'replay-output',
  semanticEditReplayOutputHash: 'output_hash'
};
const semanticPatchBundleComposition: compilerApi.SemanticPatchBundleComposition = compilerApi.composeSemanticPatchBundleProjections({
  currentSourceText: 'export const value = 1;\n',
  bundles: [typedSemanticPatchBundle],
  projections: []
});
const queriedSemanticPatchBundles: readonly compilerApi.SemanticPatchBundleRecord[] = compilerApi.querySemanticPatchBundleRecords(
  [typedSemanticPatchBundle],
  { ...semanticPatchBundleQuery, regionKey: 'source#src/example.js#function#run', evidenceId: 'evidence_example', admissionStatus: 'queued' }
);
semanticPatchBundleComposition.status satisfies compilerApi.SemanticPatchBundleCompositionStatus;

void queriedSemanticPatchBundles;
void typedSemanticPatchBundleIndex;
void semanticPatchBundleQuery;
void typedSemanticEditBundleAdmission;
void semanticEditBundleStatus;
void semanticPatchBundleOptions;
void semanticPatchBundleOverlapQuery;
void semanticPatchBundleComposition;
