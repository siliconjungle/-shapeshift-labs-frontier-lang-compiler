import { assert } from './helpers.mjs';
import {
  createSemanticHistoryRecord,
  querySemanticHistoryRecordOverlaps,
  SemanticHistoryAdmissionStatuses,
  SemanticHistoryOverlapKinds,
  semanticHistoryRecordsConflict,
  semanticHistoryRecordsOverlap
} from './compiler-api.mjs';

assert.equal(SemanticHistoryAdmissionStatuses.includes('queued'), true);
assert.equal(SemanticHistoryOverlapKinds.includes('ownership'), true);

const stepKey = 'source#src/runtime.ts#function#step';
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

assert.equal(leftRecord.kind, 'frontier.lang.semanticHistoryRecord');
assert.equal(leftRecord.index.ownershipKeys.includes(stepKey), true);
assert.equal(leftRecord.index.evidenceIds.includes('evidence_left_test'), true);
assert.equal(leftRecord.index.proofIds.includes('proof_left_replay'), true);
assert.equal(leftRecord.index.replayIds.includes('replay_left_patch'), true);

const overlaps = querySemanticHistoryRecordOverlaps([leftRecord, rightRecord, renderRecord], {
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

assert.equal(semanticHistoryRecordsOverlap(leftRecord, rightRecord), true);
assert.equal(semanticHistoryRecordsConflict(leftRecord, rightRecord), true);
assert.equal(semanticHistoryRecordsConflict(leftRecord, renderRecord), false);
assert.equal(querySemanticHistoryRecordOverlaps([leftRecord, renderRecord], { includeSourcePaths: false }).length, 1);
assert.equal(
  querySemanticHistoryRecordOverlaps([leftRecord, renderRecord], { includeSourcePaths: false })[0].conflict,
  false
);
