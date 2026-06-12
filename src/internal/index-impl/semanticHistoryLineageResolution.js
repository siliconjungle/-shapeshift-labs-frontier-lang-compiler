import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, uniqueStrings as uniqueRawStrings } from '../../native-import-utils.js';
import { resolveSemanticLineage } from './semanticLineageResolutionRecords.js';

export function resolveSemanticHistoryRecordLineage(record = {}, eventsOrMap = [], options = {}) {
  const generatedAt = options.generatedAt ?? Date.now();
  const sourceIndex = record.index ?? {};
  const anchorKeys = uniqueStrings([
    ...array(sourceIndex.semanticAnchorKeys),
    ...array(sourceIndex.ownershipKeys),
    ...array(sourceIndex.conflictKeys)
  ]);
  const resolutions = anchorKeys.map((anchorKey) => resolveSemanticLineage(eventsOrMap, {
    anchorKey,
    generatedAt
  }, { maxDepth: options.maxDepth }));
  const byAnchorKey = new Map(resolutions.map((resolution) => [resolution.query.anchorKey, resolution]));
  const resolvedIndex = {
    ...sourceIndex,
    ownershipKeys: resolveIndexKeys(sourceIndex.ownershipKeys, byAnchorKey, options),
    conflictKeys: resolveIndexKeys(sourceIndex.conflictKeys, byAnchorKey, options),
    semanticAnchorKeys: resolveIndexKeys(sourceIndex.semanticAnchorKeys, byAnchorKey, options),
    sourcePaths: uniqueStrings([
      ...array(sourceIndex.sourcePaths),
      ...resolutions.flatMap((resolution) => resolutionSourcePaths(resolution))
    ]),
    lineageResolutionIds: uniqueStrings([
      ...array(sourceIndex.lineageResolutionIds),
      ...resolutions.map((resolution) => resolution.id)
    ]),
    lineageEventIds: uniqueStrings([
      ...array(sourceIndex.lineageEventIds),
      ...resolutions.flatMap((resolution) => resolution.traversedEventIds)
    ]),
    semanticLineageKinds: uniqueStrings([
      ...array(sourceIndex.semanticLineageKinds),
      ...resolutions.flatMap((resolution) => resolution.lineageEventKinds)
    ]),
    crdtOperationIds: uniqueStrings([
      ...array(sourceIndex.crdtOperationIds),
      ...resolutions.flatMap((resolution) => resolution.crdtOperationIds)
    ]),
    crdtHeads: uniqueStrings([
      ...array(sourceIndex.crdtHeads),
      ...resolutions.flatMap((resolution) => resolution.crdtHeads)
    ]),
    evidenceIds: uniqueStrings([
      ...array(sourceIndex.evidenceIds),
      ...resolutions.flatMap((resolution) => resolution.evidenceIds)
    ]),
    proofIds: uniqueStrings([
      ...array(sourceIndex.proofIds),
      ...resolutions.flatMap((resolution) => resolution.proofIds)
    ])
  };
  const anchorInventory = createAnchorInventory(resolutions);
  const summary = summarizeSemanticHistoryLineageResolutions(resolutions, resolvedIndex, anchorInventory);
  const readiness = summary.cycle > 0 || summary.maxDepth > 0 ? 'blocked' : summary.resolved > 0 || summary.ambiguous > 0 || summary.deleted > 0 || summary.recreated > 0 ? 'needs-review' : 'ready';
  const resolutionCore = {
    kind: 'frontier.lang.semanticHistoryRecordLineageResolution',
    version: 1,
    sourceRecordId: record.id,
    sourceRecordStableId: record.stableId,
    sourceRecordHash: record.hash,
    generatedAt,
    resolutions,
    anchorInventory,
    summary,
    admission: {
      readiness,
      reviewRequired: readiness !== 'ready',
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    },
    metadata: compactRecord(options.metadata)
  };
  const hash = hashSemanticValue(resolutionCore);
  const id = options.id ?? `semantic_history_lineage_resolution_${idFragment(firstString(record.id, record.stableId, hash))}`;
  const resolvedRecord = createResolvedHistoryRecord(record, resolvedIndex, { id, hash, generatedAt, summary, readiness });
  return {
    ...resolutionCore,
    id,
    stableId: `semantic_history_lineage_resolution_${idFragment(hash)}`,
    hash,
    resolvedRecord
  };
}

export function resolveSemanticHistoryRecordsLineage(records = [], eventsOrMap = [], options = {}) {
  return array(records).map((record) => resolveSemanticHistoryRecordLineage(record, eventsOrMap, options));
}

function createResolvedHistoryRecord(record, index, resolution) {
  const core = {
    ...record,
    id: `${record.id ?? 'semantic_history'}#lineage-resolved`,
    index,
    metadata: {
      ...(record.metadata ?? {}),
      semanticHistoryLineageResolution: {
        id: resolution.id,
        sourceRecordId: record.id,
        sourceRecordHash: record.hash,
        readiness: resolution.readiness,
        summary: resolution.summary,
        anchorSummary: {
          activeAnchorKeys: resolution.summary.activeAnchorKeys,
          candidateAnchorKeys: resolution.summary.candidateAnchorKeys,
          inactiveAnchorKeys: resolution.summary.inactiveAnchorKeys,
          blockedAnchorKeys: resolution.summary.blockedAnchorKeys
        },
        lineageResolutionIds: resolution.summary.lineageResolutionIds,
        lineageEventIds: resolution.summary.traversedEventIds,
        terminalEventIds: resolution.summary.terminalEventIds,
        sourcePaths: resolution.summary.sourcePaths,
        evidenceIds: resolution.summary.evidenceIds,
        proofIds: resolution.summary.proofIds,
        reasonCodes: resolution.summary.reasonCodes,
        autoMergeClaim: false,
        semanticEquivalenceClaim: false
      }
    }
  };
  const stableCore = { ...core };
  delete stableCore.hash;
  delete stableCore.stableId;
  const hash = hashSemanticValue(stableCore);
  return {
    ...core,
    stableId: `semantic_history_${idFragment(hash)}`,
    hash
  };
}

function resolveIndexKeys(values, resolutions, options) {
  return uniqueStrings(array(values).flatMap((value) => {
    const key = String(value);
    const resolution = resolutions.get(key);
    if (!resolution) return [key];
    const current = resolution.currentAnchors.map((anchor) => anchor.key).filter(Boolean);
    if (resolution.status === 'deleted' && options.keepDeletedAnchors !== true) return [];
    if (resolution.status === 'cycle' && options.keepBlockedAnchors !== true) return [];
    if (resolution.status === 'max-depth' && options.keepBlockedAnchors !== true) return [];
    if (resolution.status === 'not-found' && options.keepUnresolvedAnchors !== true) return [];
    if (resolution.status === 'ambiguous' && resolutionHasInactiveTerminal(resolution)) {
      if (options.keepCandidateAnchors === true) return current.length ? current : [key];
      if (options.keepDeletedAnchors === true || options.keepInactiveAnchors === true) return [key];
      return [];
    }
    if (resolution.status === 'ambiguous' && options.keepCandidateAnchors === false) return [];
    return current.length ? current : [key];
  }));
}

function summarizeSemanticHistoryLineageResolutions(resolutions, index, anchorInventory) {
  const byStatus = {};
  for (const resolution of resolutions) byStatus[resolution.status] = (byStatus[resolution.status] ?? 0) + 1;
  return {
    anchorCount: resolutions.length,
    unchanged: byStatus.unchanged ?? 0,
    resolved: byStatus.resolved ?? 0,
    ambiguous: byStatus.ambiguous ?? 0,
    deleted: byStatus.deleted ?? 0,
    recreated: byStatus.recreated ?? 0,
    cycle: byStatus.cycle ?? 0,
    maxDepth: byStatus['max-depth'] ?? 0,
    notFound: byStatus['not-found'] ?? 0,
    currentAnchorKeys: uniqueStrings(index.semanticAnchorKeys),
    ownershipKeys: uniqueStrings(index.ownershipKeys),
    conflictKeys: uniqueStrings(index.conflictKeys),
    sourcePaths: uniqueStrings(index.sourcePaths),
    activeAnchorKeys: uniqueStrings(anchorInventory.active.map((anchor) => anchor.key)),
    candidateAnchorKeys: uniqueStrings(anchorInventory.candidate.map((anchor) => anchor.key)),
    inactiveAnchorKeys: uniqueStrings(anchorInventory.inactive.map((anchor) => anchor.key)),
    deletedAnchorKeys: uniqueStrings(anchorInventory.deleted.map((anchor) => anchor.key)),
    unresolvedAnchorKeys: uniqueStrings(anchorInventory.unresolved.map((anchor) => anchor.key)),
    blockedAnchorKeys: uniqueStrings(anchorInventory.blocked.map((anchor) => anchor.key)),
    lineageResolutionIds: uniqueStrings(resolutions.map((resolution) => resolution.id)),
    traversedEventIds: uniqueStrings(resolutions.flatMap((resolution) => resolution.traversedEventIds)),
    terminalEventIds: uniqueStrings(resolutions.flatMap((resolution) => resolution.terminalEventIds)),
    evidenceIds: uniqueStrings(resolutions.flatMap((resolution) => resolution.evidenceIds)),
    proofIds: uniqueStrings(resolutions.flatMap((resolution) => resolution.proofIds)),
    reasonCodes: uniqueStrings(resolutions.flatMap((resolution) => resolution.reasonCodes))
  };
}

function createAnchorInventory(resolutions) {
  const inventory = {
    active: [],
    candidate: [],
    inactive: [],
    deleted: [],
    unresolved: [],
    blocked: []
  };
  for (const resolution of resolutions) {
    const start = anchorEntry(resolution.startAnchor ?? queryAnchor(resolution), resolution);
    const current = resolution.currentAnchors.map((anchor) => anchorEntry(anchor, resolution));
    if (resolution.status === 'ambiguous') {
      inventory.candidate.push(...current);
      if (start) {
        inventory.inactive.push(start);
        if (resolutionHasDeletedTerminal(resolution)) inventory.deleted.push(start);
      }
      continue;
    }
    if (resolution.status === 'deleted') {
      if (start) {
        inventory.inactive.push(start);
        inventory.deleted.push(start);
      }
      continue;
    }
    if (resolution.status === 'cycle' || resolution.status === 'max-depth') {
      if (start) {
        inventory.inactive.push(start);
        inventory.blocked.push(start);
      }
      continue;
    }
    if (resolution.status === 'not-found') {
      if (start) {
        inventory.inactive.push(start);
        inventory.unresolved.push(start);
      }
      continue;
    }
    inventory.active.push(...current);
  }
  return {
    active: uniqueAnchorEntries(inventory.active),
    candidate: uniqueAnchorEntries(inventory.candidate),
    inactive: uniqueAnchorEntries(inventory.inactive),
    deleted: uniqueAnchorEntries(inventory.deleted),
    unresolved: uniqueAnchorEntries(inventory.unresolved),
    blocked: uniqueAnchorEntries(inventory.blocked)
  };
}

function anchorEntry(anchor, resolution) {
  if (!anchor) return undefined;
  return compactRecord({
    key: anchor.key,
    id: anchor.id,
    kind: anchor.kind,
    language: anchor.language,
    sourcePath: anchor.sourcePath,
    symbolId: anchor.symbolId,
    symbolName: anchor.symbolName,
    sourcePaths: resolutionSourcePaths(resolution, anchor),
    lineageEventIds: uniqueStrings(resolution.traversedEventIds),
    terminalEventIds: uniqueStrings(resolution.terminalEventIds),
    evidenceIds: uniqueStrings(resolution.evidenceIds),
    proofIds: uniqueStrings(resolution.proofIds),
    crdtOperationIds: uniqueStrings(resolution.crdtOperationIds),
    crdtHeads: uniqueStrings(resolution.crdtHeads),
    lineageEventKinds: uniqueStrings(resolution.lineageEventKinds),
    status: resolution.status,
    resolutionId: resolution.id,
    confidence: resolution.confidence,
    reasonCodes: uniqueStrings(resolution.reasonCodes)
  });
}

function resolutionHasInactiveTerminal(resolution) {
  return array(resolution.terminalEventIds).length > 0
    || resolutionHasDeletedTerminal(resolution)
    || array(resolution.reasonCodes).some((code) => code === 'lineage-event-without-target-anchor' || code === 'inactive-anchor-has-active-candidates');
}

function resolutionHasDeletedTerminal(resolution) {
  return array(resolution.lineageEventKinds).includes('deleted')
    || array(resolution.reasonCodes).includes('anchor-deleted');
}

function queryAnchor(resolution) {
  return compactRecord({
    key: resolution.query?.anchorKey,
    id: resolution.query?.anchorId,
    sourcePath: resolution.query?.sourcePath,
    symbolName: resolution.query?.symbolName
  });
}

function uniqueAnchorEntries(entries) {
  const seen = new Set();
  return entries.filter(Boolean).filter((entry) => {
    const key = entry.key ?? entry.id ?? `${entry.sourcePath ?? ''}:${entry.symbolName ?? ''}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resolutionSourcePaths(resolution, anchor) {
  return uniqueStrings([
    anchor?.sourcePath,
    ...array(anchor?.lineageSourcePaths),
    resolution.query?.sourcePath,
    resolution.startAnchor?.sourcePath,
    ...array(resolution.sourcePaths),
    ...resolution.currentAnchors.flatMap((entry) => [entry.sourcePath, ...array(entry.lineageSourcePaths)])
  ]);
}

function array(value) { return value === undefined || value === null ? [] : Array.isArray(value) ? value : [value]; }
function uniqueStrings(values) { return uniqueRawStrings(array(values).map((value) => String(value ?? '')).filter(Boolean)); }
function firstString(...values) { return values.map((value) => value === undefined || value === null ? '' : String(value)).find(Boolean); }
function compactRecord(value) { return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined)); }
