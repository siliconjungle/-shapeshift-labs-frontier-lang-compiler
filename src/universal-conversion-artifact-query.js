import { uniqueStrings } from './native-import-utils.js';

export function queryUniversalConversionArtifacts(records, query = {}) {
  return artifactRecords(records)
    .filter((record) => matchesArtifact(record, query))
    .sort((left, right) => Number(right.mergeScore?.sortKey ?? 0) - Number(left.mergeScore?.sortKey ?? 0)
      || String(left.routeId).localeCompare(String(right.routeId)));
}

export function artifactIndex(routeArtifacts) {
  return {
    routeIds: uniqueStrings(routeArtifacts.map((artifact) => artifact.routeId)),
    historyIds: uniqueStrings(routeArtifacts.map((artifact) => artifact.history.id)),
    patchBundleIds: uniqueStrings(routeArtifacts.map((artifact) => artifact.patchBundle.id)),
    languages: uniqueStrings(routeArtifacts.map((artifact) => artifact.sourceLanguage)),
    targets: uniqueStrings(routeArtifacts.map((artifact) => artifact.target)),
    modes: uniqueStrings(routeArtifacts.map((artifact) => artifact.mode)),
    readinesses: uniqueStrings(routeArtifacts.map((artifact) => artifact.readiness)),
    admissionStatuses: uniqueStrings(routeArtifacts.map((artifact) => artifact.admissionStatus)),
    sourcePaths: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.history.index.sourcePaths)),
    sourceHashes: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.history.index.sourceHashes)),
    ownershipKeys: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.history.index.ownershipKeys)),
    conflictKeys: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.history.index.conflictKeys)),
    evidenceIds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.history.evidenceIds)),
    proofIds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.history.proofIds)),
    semanticOperationIds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.semanticOperations?.operations ?? []).map((operation) => operation.id)),
    semanticOperationKinds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.semanticOperations?.operations ?? []).map((operation) => operation.operationKind))
  };
}

function artifactRecords(records) {
  if (Array.isArray(records)) return records.flatMap(artifactRecords);
  if (records?.kind === 'frontier.lang.universalConversionArtifacts') return records.routeArtifacts ?? [];
  if (records?.kind === 'frontier.lang.universalConversionRouteArtifact') return [records];
  return [];
}

function matchesArtifact(record, query) {
  return match(query.routeId, [record.routeId])
    && match(query.historyId, [record.history.id])
    && match(query.patchBundleId, [record.patchBundle.id])
    && match(query.sourceLanguage, [record.sourceLanguage])
    && match(query.target, [record.target])
    && match(query.mode, [record.mode])
    && match(query.routeAction, [record.routeAction])
    && match(query.priority, [record.priority])
    && match(query.readiness, [record.readiness])
    && match(query.admissionStatus, [record.admissionStatus])
    && match(query.sourcePath, record.history.index.sourcePaths)
    && match(query.sourceHash, record.history.index.sourceHashes)
    && match(query.ownershipKey, record.history.index.ownershipKeys)
    && match(query.conflictKey, record.history.index.conflictKeys)
    && match(query.evidenceId, record.history.evidenceIds)
    && match(query.proofId, record.history.proofIds)
    && match(query.semanticOperationId, (record.semanticOperations?.operations ?? []).map((operation) => operation.id))
    && match(query.semanticOperationKind, (record.semanticOperations?.operations ?? []).map((operation) => operation.operationKind));
}

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (filters.length === 0) return true;
  const valueSet = new Set((values ?? []).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
