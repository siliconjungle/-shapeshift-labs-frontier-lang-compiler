import { assert } from './helpers.mjs';
import {
  createSemanticLineageEvent,
  createSemanticLineageMap,
  createSemanticHistoryRecord,
  querySemanticLineageEvents,
  querySemanticHistoryRecordOverlaps,
  resolveSemanticLineage,
  resolveSemanticLineageBatch,
  SemanticHistoryAdmissionStatuses,
  SemanticLineageResolutionStatuses,
  SemanticHistoryOverlapKinds,
  semanticHistoryRecordsConflict,
  semanticHistoryRecordsOverlap
} from './compiler-api.mjs';

assert.equal(SemanticHistoryAdmissionStatuses.includes('queued'), true);
assert.equal(SemanticHistoryOverlapKinds.includes('ownership'), true);
assert.equal(SemanticHistoryOverlapKinds.includes('semantic-anchor'), true);
assert.equal(SemanticLineageResolutionStatuses.includes('resolved'), true);

const stepKey = 'source#src/runtime.ts#function#step';
const coreStepKey = 'source#src/runtime-core.ts#function#step';
const renderKey = 'source#src/runtime.ts#function#render';

const leftRecord = createSemanticHistoryRecord({
  id: 'history_left_step',
  createdAt: 1,
  baseHash: 'base_hash_a',
  targetHash: 'target_hash_left',
  sourceId: 'source_runtime',
  importId: 'import_left',
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  sourceHash: 'source_hash_left',
  ownershipRegions: [{
    id: 'region_left_step',
    key: stepKey,
    granularity: 'symbol',
    symbolName: 'step',
    sourcePath: 'src/runtime.ts',
    sourceHash: 'source_hash_left'
  }],
  semanticCandidates: [{
    id: 'candidate_left_step',
    readiness: 'needs-review',
    conflictKeys: [stepKey],
    evidenceIds: ['evidence_left_test'],
    proofIds: ['proof_left_replay'],
    replayIds: ['replay_left_patch']
  }],
  evidenceIds: ['evidence_left_test'],
  proofIds: ['proof_left_replay'],
  reviewer: { status: 'approved', reviewerId: 'reviewer_a', evidenceIds: ['evidence_left_test'] },
  admission: { status: 'queued', readiness: 'needs-review', reasonCodes: ['awaiting-peer-history'] },
  replayLinks: [{ id: 'replay_left_patch', kind: 'patch', path: 'patches/left.json', hash: 'patch_hash_left' }]
});

const rightRecord = createSemanticHistoryRecord({
  id: 'history_right_step',
  createdAt: 2,
  baseHash: 'base_hash_b',
  targetHash: 'target_hash_right',
  sourceId: 'source_runtime',
  importId: 'import_right',
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  sourceHash: 'source_hash_right',
  ownershipRegions: [{
    id: 'region_right_step',
    key: stepKey,
    granularity: 'symbol',
    symbolName: 'step',
    sourcePath: 'src/runtime.ts',
    sourceHash: 'source_hash_right'
  }],
  semanticCandidates: [{
    id: 'candidate_right_step',
    readiness: 'needs-review',
    conflictKeys: [stepKey],
    evidenceIds: ['evidence_right_test'],
    replayIds: ['replay_right_patch']
  }],
  reviewer: { status: 'reviewed', reviewerId: 'reviewer_b' },
  admission: { status: 'needs-review', readiness: 'needs-review', reasonCodes: ['parallel-region-touch'] },
  replayLinks: [{ id: 'replay_right_patch', kind: 'patch', path: 'patches/right.json' }]
});

const renderRecord = createSemanticHistoryRecord({
  id: 'history_render',
  createdAt: 3,
  baseHash: 'base_hash_a',
  targetHash: 'target_hash_render',
  sourceId: 'source_runtime',
  importId: 'import_render',
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  ownershipRegions: [{
    id: 'region_render',
    key: renderKey,
    granularity: 'symbol',
    symbolName: 'render',
    sourcePath: 'src/runtime.ts'
  }],
  semanticCandidates: [{
    id: 'candidate_render',
    readiness: 'ready',
    conflictKeys: [renderKey],
    evidenceIds: ['evidence_render_test']
  }],
  admission: { status: 'admitted', readiness: 'ready' },
  replayLinks: ['patches/render.json']
});

const movedLineage = createSemanticLineageEvent({
  id: 'lineage_step_move',
  createdAt: 1,
  eventKind: 'moved',
  from: {
    key: stepKey,
    sourcePath: 'src/runtime.ts',
    sourceHash: 'source_hash_old',
    symbolName: 'step',
    bodyHash: 'body_step'
  },
  to: {
    key: coreStepKey,
    sourcePath: 'src/runtime-core.ts',
    sourceHash: 'source_hash_new',
    symbolName: 'step',
    bodyHash: 'body_step'
  },
  confidence: 0.94,
  actorId: 'worker-17',
  operationId: 'worker-17:4',
  deps: ['worker-17:3'],
  heads: ['worker-17:4'],
  stateVector: { 'worker-17': 4 },
  evidenceIds: ['evidence_lineage_scan'],
  pathMatch: false,
  bodyHashMatch: true
});

const lineageMap = createSemanticLineageMap([movedLineage], { id: 'lineage_map_runtime' });
assert.equal(lineageMap.byAnchorKey[stepKey].includes('lineage_step_move'), true);
assert.equal(querySemanticLineageEvents(lineageMap.events, { operationId: 'worker-17:4' }).length, 1);
assert.equal(querySemanticLineageEvents(lineageMap.events, { sourcePath: 'src/runtime-core.ts' }).length, 1);

const renameLineage = createSemanticLineageEvent({
  id: 'lineage_step_rename',
  createdAt: 2,
  eventKind: 'renamed',
  from: { key: coreStepKey, sourcePath: 'src/runtime-core.ts', symbolName: 'step' },
  to: { key: 'source#src/runtime-core.ts#function#advance', sourcePath: 'src/runtime-core.ts', symbolName: 'advance' },
  confidence: 0.87,
  operationId: 'worker-17:5',
  heads: ['worker-17:5'],
  evidenceIds: ['evidence_rename_scan']
});
const splitLineage = createSemanticLineageEvent({
  id: 'lineage_render_split',
  createdAt: 1,
  eventKind: 'split',
  from: { key: renderKey, sourcePath: 'src/runtime.ts', symbolName: 'render' },
  to: [
    { key: 'source#src/runtime.ts#function#renderCanvas', sourcePath: 'src/runtime.ts', symbolName: 'renderCanvas' },
    { key: 'source#src/runtime.ts#function#renderDebug', sourcePath: 'src/runtime.ts', symbolName: 'renderDebug' }
  ],
  confidence: 0.72
});
const deleteLineage = createSemanticLineageEvent({
  id: 'lineage_obsolete_delete',
  createdAt: 1,
  eventKind: 'deleted',
  from: { key: 'source#src/runtime.ts#function#obsolete', sourcePath: 'src/runtime.ts', symbolName: 'obsolete' },
  confidence: 0.98
});
const recreateLineage = createSemanticLineageEvent({
  id: 'lineage_boot_recreate',
  createdAt: 1,
  eventKind: 'recreated',
  from: { key: 'source#src/runtime.ts#function#boot', sourcePath: 'src/runtime.ts', symbolName: 'boot' },
  to: { key: 'source#src/bootstrap.ts#function#boot', sourcePath: 'src/bootstrap.ts', symbolName: 'boot' },
  confidence: 0.68
});
const cycleA = createSemanticLineageEvent({
  id: 'lineage_cycle_a',
  createdAt: 1,
  eventKind: 'moved',
  from: { key: 'cycle#a' },
  to: { key: 'cycle#b' }
});
const cycleB = createSemanticLineageEvent({
  id: 'lineage_cycle_b',
  createdAt: 2,
  eventKind: 'moved',
  from: { key: 'cycle#b' },
  to: { key: 'cycle#a' }
});
const extendedLineageMap = createSemanticLineageMap([
  movedLineage,
  renameLineage,
  splitLineage,
  deleteLineage,
  recreateLineage,
  cycleA,
  cycleB
]);
const stepResolution = resolveSemanticLineage(extendedLineageMap, stepKey);
assert.equal(stepResolution.kind, 'frontier.lang.semanticLineageResolution');
assert.equal(stepResolution.status, 'resolved');
assert.equal(stepResolution.currentAnchors[0].key, 'source#src/runtime-core.ts#function#advance');
assert.equal(stepResolution.traversedEventIds.join(','), 'lineage_step_move,lineage_step_rename');
assert.equal(stepResolution.confidence, 0.87);
assert.equal(stepResolution.crdtOperationIds.includes('worker-17:5'), true);
assert.equal(stepResolution.evidenceIds.includes('evidence_rename_scan'), true);

const splitResolution = resolveSemanticLineage(extendedLineageMap, { anchorKey: renderKey });
assert.equal(splitResolution.status, 'ambiguous');
assert.equal(splitResolution.currentAnchors.length, 2);
assert.equal(splitResolution.reasonCodes.includes('anchor-split'), true);

const deleteResolution = resolveSemanticLineage(extendedLineageMap, 'source#src/runtime.ts#function#obsolete');
assert.equal(deleteResolution.status, 'deleted');
assert.equal(deleteResolution.currentAnchors.length, 0);
assert.equal(deleteResolution.terminalEventIds.includes('lineage_obsolete_delete'), true);

const recreatedResolution = resolveSemanticLineage(extendedLineageMap, 'source#src/runtime.ts#function#boot');
assert.equal(recreatedResolution.status, 'recreated');
assert.equal(recreatedResolution.currentAnchors[0].sourcePath, 'src/bootstrap.ts');

const cycleResolution = resolveSemanticLineage(extendedLineageMap, 'cycle#a');
assert.equal(cycleResolution.status, 'cycle');
assert.equal(cycleResolution.reasonCodes.includes('lineage-cycle'), true);

const batchResolutions = resolveSemanticLineageBatch(extendedLineageMap, [stepKey, renderKey]);
assert.equal(batchResolutions.length, 2);
assert.equal(batchResolutions[0].status, 'resolved');
assert.equal(batchResolutions[1].status, 'ambiguous');

const annotationLineage = createSemanticLineageEvent({
  id: 'lineage_annotation',
  eventKind: 'unchanged',
  from: { key: renderKey, sourcePath: 'src/runtime.ts' }
});
assert.equal(annotationLineage.crdt, undefined);
assert.equal(querySemanticLineageEvents([annotationLineage], { operationId: 'lineage_annotation' }).length, 0);

const lineageRecord = createSemanticHistoryRecord({
  id: 'history_lineage_move',
  baseHash: 'base_hash_a',
  targetHash: 'target_hash_lineage',
  language: 'typescript',
  lineageEvents: [movedLineage],
  admission: { status: 'queued', readiness: 'needs-review' }
});

assert.equal(leftRecord.kind, 'frontier.lang.semanticHistoryRecord');
assert.equal(leftRecord.index.ownershipKeys.includes(stepKey), true);
assert.equal(leftRecord.index.evidenceIds.includes('evidence_left_test'), true);
assert.equal(leftRecord.index.proofIds.includes('proof_left_replay'), true);
assert.equal(leftRecord.index.replayIds.includes('replay_left_patch'), true);
assert.equal(lineageRecord.index.semanticAnchorKeys.includes(stepKey), true);
assert.equal(lineageRecord.index.crdtOperationIds.includes('worker-17:4'), true);
assert.equal(lineageRecord.index.evidenceIds.includes('evidence_lineage_scan'), true);

const overlaps = querySemanticHistoryRecordOverlaps([leftRecord, rightRecord, renderRecord, lineageRecord], {
  includeReplay: true
});
const stepOverlap = overlaps.find((record) => record.leftId === 'history_left_step' && record.rightId === 'history_right_step');
assert.ok(stepOverlap);
assert.equal(stepOverlap.conflict, true);
assert.equal(stepOverlap.overlap.ownership.includes(stepKey), true);
assert.equal(stepOverlap.conflictReasons.includes('ownership-overlap'), true);
assert.equal(stepOverlap.conflictReasons.includes('semantic-conflict-key-overlap'), true);
assert.equal(stepOverlap.conflictReasons.includes('base-hash-mismatch'), true);

const renderOverlap = overlaps.find((record) => record.leftId === 'history_left_step' && record.rightId === 'history_render');
assert.ok(renderOverlap);
assert.equal(renderOverlap.overlap['source-path'].includes('src/runtime.ts'), true);
assert.equal(renderOverlap.conflict, false);

const lineageOverlap = overlaps.find((record) => record.leftId === 'history_left_step' && record.rightId === 'history_lineage_move');
assert.ok(lineageOverlap);
assert.equal(lineageOverlap.overlap['semantic-anchor'].includes(stepKey), true);
assert.equal(lineageOverlap.conflictReasons.includes('semantic-anchor-overlap'), true);

assert.equal(semanticHistoryRecordsOverlap(leftRecord, rightRecord), true);
assert.equal(semanticHistoryRecordsConflict(leftRecord, rightRecord), true);
assert.equal(semanticHistoryRecordsConflict(leftRecord, renderRecord), false);
assert.equal(querySemanticHistoryRecordOverlaps([leftRecord, renderRecord], { includeSourcePaths: false }).length, 1);
assert.equal(
  querySemanticHistoryRecordOverlaps([leftRecord, renderRecord], { includeSourcePaths: false })[0].conflict,
  false
);
