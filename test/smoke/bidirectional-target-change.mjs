import { assert } from './helpers.mjs';
import {
  createBidirectionalTargetChangeRecord,
  createSemanticImportSidecar,
  createSemanticLineageEvent,
  importNativeSource,
  querySemanticPatchBundleRecords
} from './compiler-api.mjs';

const sourceImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/counter.ts',
  sourceText: 'export function add(count: number): number { return count + 1; }\n'
});
const sourceSidecar = createSemanticImportSidecar(sourceImport);
const sourceKey = sourceSidecar.ownershipRegions.find((region) => region.symbolName === 'add')?.key;
const movedKey = 'source#src/counter-core.ts#body#addCounter';
const lineage = [createSemanticLineageEvent({
  id: 'lineage_counter_add_move',
  eventKind: 'moved',
  from: { key: sourceKey, sourcePath: 'src/counter.ts', symbolName: 'add' },
  to: { key: movedKey, sourcePath: 'src/counter-core.ts', symbolName: 'addCounter' },
  confidence: 0.9,
  evidenceIds: ['evidence_counter_move']
})];

const record = createBidirectionalTargetChangeRecord({
  id: 'counter_rust_target_change',
  source: sourceImport,
  targetLanguage: 'rust',
  targetPath: 'src/counter.rs',
  baseTarget: {
    language: 'rust',
    sourcePath: 'src/counter.rs',
    sourceText: 'pub fn add(count: i32) -> i32 { count + 1 }\n'
  },
  editedTarget: {
    language: 'rust',
    sourcePath: 'src/counter.rs',
    sourceText: 'pub fn add(count: i32, step: i32) -> i32 { count + step }\n'
  },
  sourceAnchorMappings: [{ targetSymbolName: 'add', sourceSymbolName: 'add' }],
  lineage
});

assert.equal(record.kind, 'frontier.lang.bidirectionalTargetChangeRecord');
assert.equal(record.targetLanguage, 'rust');
assert.equal(record.sourceLanguage, 'typescript');
assert.equal(record.readiness, 'needs-review');
assert.equal(record.metadata.autoMergeClaim, false);
assert.equal(record.metadata.semanticEquivalenceClaim, false);
assert.equal(record.targetPortability.kind, 'frontier.lang.bidirectionalTargetPortability');
assert.equal(record.targetPortability.status, 'needs-port');
assert.equal(record.targetPortability.action, 'human-port');
assert.equal(record.targetPortability.autoMergeClaim, false);
assert.equal(record.targetPortability.semanticEquivalenceClaim, false);
assert.equal(record.summary.targetChangedRegions > 0, true);
assert.equal(record.summary.sourceAnchorMatches, 1);
assert.equal(record.summary.unmatchedTargetRegions, 0);
assert.equal(record.summary.targetPortabilityStatus, 'needs-port');
assert.equal(record.sourceAnchorMatches[0].status, 'matched');
assert.equal(record.sourceAnchorMatches[0].portability.status, 'needs-port');
assert.equal(record.sourceAnchorMatches[0].sourceAnchors[0].key, movedKey);
assert.equal(record.sourceAnchorMatches[0].lineageResolutions[0].status, 'resolved');
assert.equal(record.sourcePatchBundle.kind, 'frontier.lang.semanticPatchBundleRecord');
assert.equal(record.sourcePatchBundle.admission.autoMergeClaim, false);
assert.equal(record.sourcePatchBundle.admission.reviewRequired, true);
assert.equal(record.sourcePatchBundle.index.conflictKeys.includes(movedKey), true);
assert.equal(record.historyRecord.kind, 'frontier.lang.semanticHistoryRecord');
assert.equal(record.historyRecord.index.ownershipKeys.includes(movedKey), true);
assert.equal(record.historyRecord.index.evidenceIds.includes(record.evidence[0].id), true);
assert.equal(record.evidence[0].metadata.autoMergeClaim, false);
assert.equal(record.evidence[0].metadata.semanticEquivalenceClaim, false);
assert.equal(record.roundtripEvidence.schema, 'frontier.lang.bidirectionalTargetChangeRoundtripEvidence.v1');
assert.equal(record.roundtripEvidence.source.importId, sourceImport.id);
assert.equal(record.roundtripEvidence.target.changeSetId, record.targetChangeSet.id);
assert.equal(record.roundtripEvidence.target.patchId, record.targetChangeSet.patch.id);
assert.equal(record.roundtripEvidence.sourcePatchBundleId, record.sourcePatchBundle.id);
assert.equal(record.roundtripEvidence.historyRecordId, record.historyRecord.id);
assert.equal(record.roundtripEvidence.sourceAnchors[0].key, movedKey);
assert.equal(record.roundtripEvidence.lineageEvidence.lineageResolutionIds.includes(record.sourceAnchorMatches[0].lineageResolutions[0].id), true);
assert.equal(record.roundtripEvidence.admission.evidenceIds.includes(record.evidence[0].id), true);
assert.equal(record.roundtripEvidence.admission.autoMergeClaim, false);
assert.equal(record.summary.lineageResolutions, 1);
assert.equal(record.evidence[0].metadata.roundtripEvidenceId, record.roundtripEvidence.id);
assert.equal(record.evidence[0].metadata.semanticMergeAdmission.sourcePatchBundleId, record.sourcePatchBundle.id);
assert.equal(record.sourcePatchBundle.metadata.roundtripEvidenceId, record.roundtripEvidence.id);
assert.equal(record.historyRecord.metadata.roundtripEvidenceId, record.roundtripEvidence.id);

const sourceSymbol = sourceImport.semanticIndex.symbols.find((symbol) => symbol.name === 'add');
const sourceMapping = sourceImport.sourceMaps[0].mappings.find((mapping) => mapping.semanticSymbolId === sourceSymbol.id);
const rustProjectionMap = {
  kind: 'frontier.lang.sourceMap',
  version: 1,
  id: 'source_map_counter_ts_to_rust',
  sourcePath: 'src/counter.ts',
  sourceHash: sourceImport.nativeSource.sourceHash,
  target: 'rust',
  targetPath: 'src/counter.rs',
  mappings: [{
    id: 'map_ts_add_to_rust_add',
    semanticSymbolId: sourceSymbol.id,
    nativeAstNodeId: sourceSymbol.nativeAstNodeId,
    sourceSpan: sourceMapping.sourceSpan,
    generatedSpan: {
      path: 'src/counter.rs',
      target: 'rust',
      targetPath: 'src/counter.rs',
      startLine: 1,
      startColumn: 1,
      endLine: 1,
      endColumn: 58,
      generatedName: 'add'
    },
    target: 'rust',
    generatedName: 'add',
    precision: 'declaration',
    preservation: 'declaration'
  }]
};
const sourceMapRecord = createBidirectionalTargetChangeRecord({
  id: 'counter_rust_target_change_from_source_map',
  source: sourceImport,
  targetLanguage: 'rust',
  targetPath: 'src/counter.rs',
  baseTarget: {
    language: 'rust',
    sourcePath: 'src/counter.rs',
    sourceText: 'pub fn add(count: i32) -> i32 { count + 1 }\n'
  },
  editedTarget: {
    language: 'rust',
    sourcePath: 'src/counter.rs',
    sourceText: 'pub fn add(count: i32, step: i32) -> i32 { count + step }\n'
  },
  sourceMaps: [rustProjectionMap]
});
assert.equal(sourceMapRecord.readiness, 'needs-review');
assert.equal(sourceMapRecord.targetPortability.status, 'portable');
assert.equal(sourceMapRecord.targetPortability.action, 'port-with-source-map-review');
assert.equal(sourceMapRecord.targetPortability.sourceMapMappingIds.includes('map_ts_add_to_rust_add'), true);
assert.equal(sourceMapRecord.targetPortability.reviewRequired, true);
assert.equal(sourceMapRecord.summary.targetPortabilityStatus, 'portable');
assert.equal(sourceMapRecord.summary.portableTargetRegions, sourceMapRecord.summary.targetChangedRegions);
assert.equal(sourceMapRecord.summary.sourceMapBackedMatches, 1);
assert.equal(sourceMapRecord.sourceAnchorMatches[0].status, 'matched');
assert.equal(sourceMapRecord.sourceAnchorMatches[0].portability.status, 'portable');
assert.equal(sourceMapRecord.sourceAnchorMatches[0].portability.sourceMapMappingIds.includes('map_ts_add_to_rust_add'), true);
assert.equal(sourceMapRecord.sourceAnchorMatches[0].reasonCodes.includes('mapped-by-generated-source-map'), true);
assert.equal(sourceMapRecord.sourceAnchorMatches[0].sourceMapLinks[0].sourceMapMappingId, 'map_ts_add_to_rust_add');
assert.equal(sourceMapRecord.sourcePatchBundle.summary.sourceMapLinks, 1);
assert.equal(sourceMapRecord.sourcePatchBundle.index.sourceMapMappingIds.includes('map_ts_add_to_rust_add'), true);
assert.equal(sourceMapRecord.sourcePatchBundle.index.targetPortabilityStatuses.includes('portable'), true);
assert.equal(sourceMapRecord.sourcePatchBundle.index.targetPortabilityActions.includes('port-with-source-map-review'), true);
assert.equal(sourceMapRecord.sourcePatchBundle.changedRegions[0].admission.action, 'port-with-source-map-review');
assert.equal(sourceMapRecord.sourcePatchBundle.changedRegions[0].metadata.bidirectionalTargetChange.targetPortability.status, 'portable');
assert.equal(sourceMapRecord.sourcePatchBundle.metadata.targetPortability.status, 'portable');
assert.equal(sourceMapRecord.historyRecord.metadata.targetPortability.status, 'portable');
assert.equal(sourceMapRecord.evidence[0].metadata.targetPortabilityStatus, 'portable');
assert.equal(sourceMapRecord.roundtripEvidence.sourceMapEvidence.sourceMapMappingIds.includes('map_ts_add_to_rust_add'), true);
assert.equal(sourceMapRecord.roundtripEvidence.sourceMapEvidence.sourceMapLinkIds.includes(sourceMapRecord.sourceAnchorMatches[0].sourceMapLinks[0].id), true);
assert.equal(sourceMapRecord.roundtripEvidence.targetRegions[0].afterIdentity.schema, 'frontier.lang.nativeChangeProjectionEndpointIdentity.v1');
assert.equal(sourceMapRecord.roundtripEvidence.targetRegions[0].afterIdentity.sourceHash, sourceMapRecord.targetChangeSet.afterHash);
assert.equal(sourceMapRecord.evidence[0].metadata.semanticMergeAdmission.sourceMapMappingIds.includes('map_ts_add_to_rust_add'), true);
assert.equal(sourceMapRecord.sourcePatchBundle.metadata.semanticMergeAdmission.sourceMapMappingIds.includes('map_ts_add_to_rust_add'), true);
assert.equal(sourceMapRecord.historyRecord.metadata.semanticMergeAdmission.sourceMapMappingIds.includes('map_ts_add_to_rust_add'), true);
assert.equal(sourceMapRecord.summary.sourceMapLinks, 1);
assert.equal(sourceMapRecord.summary.sourceMapMappingIds, 1);
assert.equal(sourceMapRecord.historyRecord.index.ownershipKeys.includes(sourceKey), true);
assert.equal(sourceMapRecord.evidence[0].metadata.sourceMapBackedMatches, 1);
assert.equal(querySemanticPatchBundleRecords([sourceMapRecord.sourcePatchBundle], { targetPortabilityStatus: 'portable' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([sourceMapRecord.sourcePatchBundle], { targetPortabilityAction: 'port-with-source-map-review' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([sourceMapRecord.sourcePatchBundle], { targetPortabilityReasonCode: 'target-change-source-map-portable' }).length, 1);
const { index: sourcePortIndex, ...sourcePatchBundleWithoutIndex } = sourceMapRecord.sourcePatchBundle;
assert.equal(querySemanticPatchBundleRecords([sourcePatchBundleWithoutIndex], { targetPortabilityStatus: 'portable' }).length, 1);
void sourcePortIndex;

const staleSourceMapRecord = createBidirectionalTargetChangeRecord({
  id: 'counter_stale_rust_target_change_from_source_map',
  source: sourceImport,
  targetLanguage: 'rust',
  targetPath: 'src/counter.rs',
  baseTarget: {
    language: 'rust',
    sourcePath: 'src/counter.rs',
    sourceText: 'pub fn add(count: i32) -> i32 { count + 1 }\n'
  },
  editedTarget: {
    language: 'rust',
    sourcePath: 'src/counter.rs',
    sourceText: 'pub fn add(count: i32, step: i32) -> i32 { count + step }\n'
  },
  sourceMaps: [{ ...rustProjectionMap, mappings: [{ ...rustProjectionMap.mappings[0], sourceSpan: { ...rustProjectionMap.mappings[0].sourceSpan, sourceId: 'fnv1a32:stale' } }] }]
});
assert.equal(staleSourceMapRecord.targetPortability.status, 'stale');
assert.equal(staleSourceMapRecord.sourceAnchorMatches[0].portability.status, 'stale');
assert.equal(staleSourceMapRecord.targetPortability.staleSourceMapLinkIds.length, 1);
assert.equal(staleSourceMapRecord.roundtripEvidence.sourceMapEvidence.staleSourceMapLinkIds.length, 1);

const unmatched = createBidirectionalTargetChangeRecord({
  id: 'counter_unmatched_rust_target_change',
  source: sourceImport,
  targetLanguage: 'rust',
  targetPath: 'src/counter.rs',
  baseTarget: {
    language: 'rust',
    sourcePath: 'src/counter.rs',
    sourceText: 'pub fn subtract(count: i32) -> i32 { count - 1 }\n'
  },
  editedTarget: {
    language: 'rust',
    sourcePath: 'src/counter.rs',
    sourceText: 'pub fn subtract(count: i32, step: i32) -> i32 { count - step }\n'
  }
});

assert.equal(unmatched.readiness, 'blocked');
assert.equal(unmatched.targetPortability.status, 'blocked');
assert.equal(unmatched.targetPortability.action, 'block');
assert.equal(unmatched.sourceAnchorMatches[0].portability.status, 'blocked');
assert.equal(unmatched.summary.sourceAnchorMatches, 0);
assert.equal(unmatched.summary.unmatchedTargetRegions > 0, true);
assert.equal(unmatched.sourceAnchorMatches[0].reasonCodes.includes('source-anchor-not-found'), true);
assert.equal(unmatched.roundtripEvidence.admission.status, 'blocked');
assert.equal(unmatched.evidence[0].metadata.semanticMergeAdmission.status, 'blocked');
