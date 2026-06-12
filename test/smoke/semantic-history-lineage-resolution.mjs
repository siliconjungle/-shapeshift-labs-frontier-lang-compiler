import { assert } from './helpers.mjs';
import {
  createSemanticHistoryRecord,
  createSemanticLineageEvent,
  createSemanticLineageMap,
  createSemanticPatchBundleRecord,
  querySemanticHistoryRecordOverlaps,
  querySemanticPatchBundleRecords,
  resolveSemanticHistoryRecordLineage,
  resolveSemanticHistoryRecordsLineage,
  semanticHistoryRecordsConflict
} from './compiler-api.mjs';

const oldKey = 'source#src/runtime.ts#function#step';
const movedKey = 'source#src/runtime-core.ts#function#step';
const currentKey = 'source#src/runtime-core.ts#function#advance';
const renderKey = 'source#src/runtime.ts#function#render';
const obsoleteKey = 'source#src/runtime.ts#function#obsolete';
const inactiveKey = 'source#src/runtime.ts#function#inactive';
const inactiveReplacementKey = 'source#src/runtime-active.ts#function#inactive';
const cycleKey = 'source#src/runtime.ts#function#cycleA';
const cycleNextKey = 'source#src/runtime.ts#function#cycleB';
const depthKey = 'source#src/runtime.ts#function#depthA';
const depthNextKey = 'source#src/runtime.ts#function#depthB';
const depthCurrentKey = 'source#src/runtime.ts#function#depthC';

const oldWorker = history('worker_old_step', oldKey, 'base_old');
const currentWorker = history('worker_current_advance', currentKey, 'base_current');
const renderWorker = history('worker_render', renderKey, 'base_render');
const obsoleteWorker = history('worker_obsolete', obsoleteKey, 'base_obsolete');
const inactiveWorker = history('worker_inactive', inactiveKey, 'base_inactive');
const cycleWorker = history('worker_cycle', cycleKey, 'base_cycle');
const depthWorker = history('worker_depth', depthKey, 'base_depth');

const lineage = createSemanticLineageMap([
  createSemanticLineageEvent({
    id: 'lineage_step_move',
    eventKind: 'moved',
    from: { key: oldKey, sourcePath: 'src/runtime.ts' },
    to: { key: movedKey, sourcePath: 'src/runtime-core.ts' },
    evidenceIds: ['evidence_move'],
    metadata: { reasonCodes: ['source-hash-match', 'body-hash-match', 'source-path-moved'] }
  }),
  createSemanticLineageEvent({
    id: 'lineage_step_rename',
    eventKind: 'renamed',
    from: { key: movedKey, sourcePath: 'src/runtime-core.ts' },
    to: { key: currentKey, sourcePath: 'src/runtime-core.ts' },
    evidenceIds: ['evidence_rename'],
    metadata: { reasonCodes: ['source-identity-hash-match', 'signature-hash-match'] }
  }),
  createSemanticLineageEvent({
    id: 'lineage_render_split',
    eventKind: 'split',
    from: { key: renderKey, sourcePath: 'src/runtime.ts' },
    to: [
      { key: 'source#src/runtime.ts#function#renderCanvas', sourcePath: 'src/runtime.ts' },
      { key: 'source#src/runtime.ts#function#renderDebug', sourcePath: 'src/runtime.ts' }
    ]
  }),
  createSemanticLineageEvent({
    id: 'lineage_obsolete_deleted',
    eventKind: 'deleted',
    from: { key: obsoleteKey, sourcePath: 'src/runtime.ts' }
  }),
  createSemanticLineageEvent({
    id: 'lineage_inactive_deleted',
    createdAt: 1,
    eventKind: 'deleted',
    from: { key: inactiveKey, sourcePath: 'src/runtime.ts' }
  }),
  createSemanticLineageEvent({
    id: 'lineage_inactive_reused',
    createdAt: 2,
    eventKind: 'moved',
    from: { key: inactiveKey, sourcePath: 'src/runtime.ts' },
    to: { key: inactiveReplacementKey, sourcePath: 'src/runtime-active.ts' }
  }),
  createSemanticLineageEvent({
    id: 'lineage_cycle_a',
    eventKind: 'renamed',
    from: { key: cycleKey, sourcePath: 'src/runtime.ts' },
    to: { key: cycleNextKey, sourcePath: 'src/runtime.ts' }
  }),
  createSemanticLineageEvent({
    id: 'lineage_cycle_b',
    eventKind: 'renamed',
    from: { key: cycleNextKey, sourcePath: 'src/runtime.ts' },
    to: { key: cycleKey, sourcePath: 'src/runtime.ts' }
  }),
  createSemanticLineageEvent({
    id: 'lineage_depth_a',
    eventKind: 'renamed',
    from: { key: depthKey, sourcePath: 'src/runtime.ts' },
    to: { key: depthNextKey, sourcePath: 'src/runtime.ts' }
  }),
  createSemanticLineageEvent({
    id: 'lineage_depth_b',
    eventKind: 'renamed',
    from: { key: depthNextKey, sourcePath: 'src/runtime.ts' },
    to: { key: depthCurrentKey, sourcePath: 'src/runtime.ts' }
  })
]);

const resolvedOld = resolveSemanticHistoryRecordLineage(oldWorker, lineage, { generatedAt: 100 });
assert.equal(resolvedOld.kind, 'frontier.lang.semanticHistoryRecordLineageResolution');
assert.equal(resolvedOld.admission.autoMergeClaim, false);
assert.equal(resolvedOld.admission.semanticEquivalenceClaim, false);
assert.equal(resolvedOld.summary.resolved, 1);
assert.equal(resolvedOld.summary.currentAnchorKeys.includes(currentKey), true);
assert.equal(resolvedOld.summary.activeAnchorKeys.includes(currentKey), true);
assert.equal(resolvedOld.anchorInventory.active[0].key, currentKey);
assert.equal(resolvedOld.resolutions[0].sourcePaths.includes('src/runtime.ts'), true);
assert.equal(resolvedOld.resolutions[0].sourcePaths.includes('src/runtime-core.ts'), true);
assert.equal(resolvedOld.resolutions[0].currentAnchors[0].evidenceIds.includes('evidence_move'), true);
assert.equal(resolvedOld.resolutions[0].currentAnchors[0].evidenceIds.includes('evidence_rename'), true);
assert.equal(resolvedOld.anchorInventory.active[0].evidenceIds.includes('evidence_rename'), true);
assert.equal(resolvedOld.anchorInventory.active[0].sourcePaths.includes('src/runtime.ts'), true);
assert.equal(resolvedOld.resolutions[0].reasonCodes.includes('source-hash-match'), true);
assert.equal(resolvedOld.resolutions[0].reasonCodes.includes('source-identity-hash-match'), true);
assert.equal(resolvedOld.anchorInventory.active[0].reasonCodes.includes('source-identity-hash-match'), true);
assert.equal(resolvedOld.summary.reasonCodes.includes('source-hash-match'), true);
assert.equal(resolvedOld.summary.lineageResolutionIds.includes(resolvedOld.resolutions[0].id), true);
assert.equal(resolvedOld.resolvedRecord.index.ownershipKeys.includes(currentKey), true);
assert.equal(resolvedOld.resolvedRecord.index.ownershipKeys.includes(oldKey), false);
assert.equal(resolvedOld.resolvedRecord.index.lineageResolutionIds.includes(resolvedOld.resolutions[0].id), true);
assert.equal(resolvedOld.resolvedRecord.index.evidenceIds.includes('evidence_rename'), true);
assert.equal(resolvedOld.resolvedRecord.metadata.semanticHistoryLineageResolution.evidenceIds.includes('evidence_move'), true);
assert.equal(resolvedOld.resolvedRecord.metadata.semanticHistoryLineageResolution.sourcePaths.includes('src/runtime-core.ts'), true);
assert.equal(resolvedOld.resolvedRecord.metadata.semanticHistoryLineageResolution.anchorSummary.activeAnchorKeys.includes(currentKey), true);
assert.equal(resolvedOld.resolvedRecord.metadata.semanticHistoryLineageResolution.reasonCodes.includes('source-identity-hash-match'), true);

const currentOverlap = querySemanticHistoryRecordOverlaps([resolvedOld.resolvedRecord, currentWorker])[0];
assert.equal(currentOverlap.conflict, true);
assert.equal(currentOverlap.overlap.ownership.includes(currentKey), true);
assert.equal(semanticHistoryRecordsConflict(resolvedOld.resolvedRecord, currentWorker), true);

const lineageBundle = createSemanticPatchBundleRecord({
  id: 'bundle_lineage_resolved_history',
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  baseHash: oldWorker.baseHash,
  targetHash: oldWorker.targetHash,
  changedRegions: [{
    id: 'region_lineage_resolved_history',
    key: currentKey,
    sourcePath: 'src/runtime-core.ts',
    metadata: {
      semanticHistoryLineageResolution: resolvedOld.resolvedRecord.metadata.semanticHistoryLineageResolution
    }
  }],
  metadata: {
    semanticHistoryLineageResolution: resolvedOld.resolvedRecord.metadata.semanticHistoryLineageResolution
  },
  admission: { status: 'needs-review', readiness: 'needs-review' }
});
assert.equal(lineageBundle.index.lineageResolutionIds.includes(resolvedOld.resolutions[0].id), true);
assert.equal(lineageBundle.index.lineageEventIds.includes('lineage_step_rename'), true);
assert.equal(lineageBundle.index.evidenceIds.includes('evidence_move'), true);
assert.equal(lineageBundle.index.lineageEvidenceIds.includes('evidence_rename'), true);
assert.equal(lineageBundle.index.sourcePaths.includes('src/runtime-core.ts'), true);
assert.equal(lineageBundle.admission.evidenceIds.includes('evidence_rename'), true);
assert.equal(lineageBundle.admission.reasonCodes.includes('semantic-lineage-resolution-linked'), true);
assert.equal(querySemanticPatchBundleRecords([lineageBundle], { lineageResolutionId: resolvedOld.resolutions[0].id }).length, 1);
assert.equal(querySemanticPatchBundleRecords([lineageBundle], { lineageEventId: 'lineage_step_rename' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([lineageBundle], { lineageEvidenceId: 'evidence_move' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([lineageBundle], { evidenceId: 'evidence_rename' }).length, 1);
assert.equal(querySemanticPatchBundleRecords([lineageBundle], { sourcePath: 'src/runtime-core.ts' }).length, 1);

const resolvedRender = resolveSemanticHistoryRecordLineage(renderWorker, lineage);
assert.equal(resolvedRender.summary.ambiguous, 1);
assert.equal(resolvedRender.summary.reasonCodes.includes('anchor-split'), true);
assert.equal(resolvedRender.summary.candidateAnchorKeys.includes('source#src/runtime.ts#function#renderCanvas'), true);
assert.equal(resolvedRender.summary.inactiveAnchorKeys.includes(renderKey), true);
assert.equal(resolvedRender.resolvedRecord.index.ownershipKeys.includes('source#src/runtime.ts#function#renderCanvas'), true);
assert.equal(resolvedRender.resolvedRecord.index.ownershipKeys.includes('source#src/runtime.ts#function#renderDebug'), true);

const resolvedDeleted = resolveSemanticHistoryRecordLineage(obsoleteWorker, lineage);
assert.equal(resolvedDeleted.summary.deleted, 1);
assert.equal(resolvedDeleted.summary.deletedAnchorKeys.includes(obsoleteKey), true);
assert.equal(resolvedDeleted.summary.inactiveAnchorKeys.includes(obsoleteKey), true);
assert.equal(resolvedDeleted.resolvedRecord.index.ownershipKeys.includes(obsoleteKey), false);
const keptDeleted = resolveSemanticHistoryRecordLineage(obsoleteWorker, lineage, { keepDeletedAnchors: true });
assert.equal(keptDeleted.resolvedRecord.index.ownershipKeys.includes(obsoleteKey), true);

const resolvedInactive = resolveSemanticHistoryRecordLineage(inactiveWorker, lineage, { generatedAt: 200 });
assert.equal(resolvedInactive.summary.ambiguous, 1);
assert.equal(resolvedInactive.admission.readiness, 'needs-review');
assert.equal(resolvedInactive.summary.inactiveAnchorKeys.includes(inactiveKey), true);
assert.equal(resolvedInactive.summary.deletedAnchorKeys.includes(inactiveKey), true);
assert.equal(resolvedInactive.summary.candidateAnchorKeys.includes(inactiveReplacementKey), true);
assert.equal(resolvedInactive.summary.activeAnchorKeys.includes(inactiveReplacementKey), false);
assert.equal(resolvedInactive.summary.reasonCodes.includes('inactive-anchor-has-active-candidates'), true);
assert.equal(resolvedInactive.resolvedRecord.index.ownershipKeys.includes(inactiveKey), false);
assert.equal(resolvedInactive.resolvedRecord.index.ownershipKeys.includes(inactiveReplacementKey), false);
assert.equal(resolvedInactive.resolvedRecord.metadata.semanticHistoryLineageResolution.anchorSummary.inactiveAnchorKeys.includes(inactiveKey), true);
const keptInactiveCandidate = resolveSemanticHistoryRecordLineage(inactiveWorker, lineage, { keepCandidateAnchors: true });
assert.equal(keptInactiveCandidate.resolvedRecord.index.ownershipKeys.includes(inactiveReplacementKey), true);

const resolvedCycle = resolveSemanticHistoryRecordLineage(cycleWorker, lineage);
assert.equal(resolvedCycle.summary.cycle, 1);
assert.equal(resolvedCycle.admission.readiness, 'blocked');
assert.equal(resolvedCycle.summary.blockedAnchorKeys.includes(cycleKey), true);
assert.equal(resolvedCycle.resolvedRecord.index.ownershipKeys.includes(cycleKey), false);
const keptCycle = resolveSemanticHistoryRecordLineage(cycleWorker, lineage, { keepBlockedAnchors: true });
assert.equal(keptCycle.resolvedRecord.index.ownershipKeys.includes(cycleKey), true);

const resolvedDepth = resolveSemanticHistoryRecordLineage(depthWorker, lineage, { maxDepth: 1 });
assert.equal(resolvedDepth.summary.maxDepth, 1);
assert.equal(resolvedDepth.summary.blockedAnchorKeys.includes(depthKey), true);
assert.equal(resolvedDepth.resolvedRecord.index.ownershipKeys.includes(depthKey), false);
assert.equal(resolvedDepth.resolvedRecord.index.ownershipKeys.includes(depthNextKey), false);

const batch = resolveSemanticHistoryRecordsLineage([oldWorker, renderWorker], lineage);
assert.equal(batch.length, 2);
assert.equal(batch[0].summary.currentAnchorKeys.includes(currentKey), true);

function history(id, key, baseHash) {
  return createSemanticHistoryRecord({
    id,
    baseHash,
    targetHash: `${baseHash}_target`,
    sourcePath: 'src/runtime.ts',
    ownershipRegions: [{ key, granularity: 'symbol' }],
    semanticCandidates: [{ id: `${id}_candidate`, conflictKeys: [key] }],
    admission: { status: 'queued', readiness: 'needs-review' }
  });
}
