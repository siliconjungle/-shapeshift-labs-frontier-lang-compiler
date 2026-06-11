import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

export function semanticEditIdentityFields(record) {
  const semanticKey = record.semanticKey ?? semanticEditKey(record);
  return compactRecord({
    semanticKey,
    semanticIdentityHash: record.semanticIdentityHash ?? hashSemanticValue(semanticIdentityRecord(record, semanticKey)),
    sourceIdentityHash: record.sourceIdentityHash ?? hashSemanticValue(sourceIdentityRecord(record, semanticKey))
  });
}

export function semanticEditOperationContentHash(record) {
  const semanticIdentityHash = record.semanticIdentityHash ?? semanticEditIdentityFields(record).semanticIdentityHash;
  return hashSemanticValue(compactRecord({
    semanticIdentityHash,
    baseTextHash: record.baseTextHash,
    workerTextHash: record.workerTextHash,
    headTextHash: record.headTextHash,
    status: record.status
  }));
}

export function semanticEditKey(record) {
  const scope = record.symbolName
    ? `${record.symbolKind ?? 'symbol'}:${record.symbolName}`
    : record.anchorKey ?? record.regionId ?? record.operationId ?? record.id;
  return ['semantic-edit', record.kind ?? 'region', record.changeKind ?? 'change', scope].filter(Boolean).join(':');
}

function semanticIdentityRecord(record, semanticKey) {
  return compactRecord({
    semanticKey,
    kind: record.kind,
    changeKind: record.changeKind,
    regionKind: record.regionKind,
    symbolName: record.symbolName,
    symbolKind: record.symbolKind
  });
}

function sourceIdentityRecord(record, semanticKey) {
  return compactRecord({
    anchorKey: record.anchorKey,
    conflictKey: record.conflictKey,
    regionId: record.regionId,
    sourcePath: record.sourcePath,
    symbolId: record.symbolId,
    semanticKey
  });
}

function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}
