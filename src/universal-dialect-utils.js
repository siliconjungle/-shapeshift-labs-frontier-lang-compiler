import { idFragment, normalizeStringList, uniqueStrings } from './native-import-utils.js';

function normalizeDialectProjection(input = {}, context = {}) {
  const projection = input && typeof input === 'object' ? input : {};
  const lossIds = uniqueStrings([...(projection.lossIds ?? []), ...(context.lossIds ?? [])]);
  const evidenceIds = uniqueStrings([...(projection.evidenceIds ?? []), ...(context.evidenceIds ?? [])]);
  const disposition = normalizeProjectionDisposition(projection.disposition, lossIds);
  return withoutUndefined({
    disposition,
    readiness: projection.readiness ?? projectionDispositionReadiness(disposition),
    targets: normalizeStringList(projection.targets ?? projection.target),
    lossIds,
    evidenceIds,
    sourceMapIds: uniqueStrings([...(projection.sourceMapIds ?? []), projection.sourceMapId].filter(Boolean)),
    sourceMapMappingIds: uniqueStrings([...(projection.sourceMapMappingIds ?? []), projection.sourceMapMappingId].filter(Boolean)),
    notes: normalizeStringList(projection.notes ?? projection.note),
    metadata: projection.metadata ? { ...projection.metadata } : undefined
  });
}

function projectionDispositionReadiness(disposition) {
  switch (disposition) {
    case 'preserved':
    case 'lossless':
      return 'ready';
    case 'lossy':
    case 'declaration-only':
      return 'ready-with-losses';
    case 'stub-only':
    case 'unsupported':
      return 'blocked';
    default:
      return 'needs-review';
  }
}

function dialectRecordId(input) {
  return [
    'dialect',
    idFragment(input.language ?? 'mixed'),
    idFragment(input.dialect ?? 'unknown'),
    idFragment(input.constructKind ?? 'construct'),
    idFragment(input.name ?? input.index ?? 'record')
  ].join('_');
}

function externRecordId(input) {
  return [
    'extern',
    idFragment(input.language ?? 'mixed'),
    idFragment(input.dialect ?? 'unknown'),
    idFragment(input.externKind ?? 'extern'),
    idFragment(input.name ?? input.index ?? 'record')
  ].join('_');
}

function countByPresent(values) {
  const counts = {};
  for (const value of values ?? []) {
    if (value === undefined || value === null || value === '') continue;
    const key = String(value);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function normalizeProjectionDisposition(value, lossIds) {
  const normalized = normalizeOptionalString(value);
  return normalized ?? (lossIds.length ? 'review-required' : 'preserved');
}

function normalizeOptionalString(value) {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value);
}

function objectValue(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function uniqueRecordsById(records) {
  const seen = new Set();
  const result = [];
  for (const record of records ?? []) {
    if (!record?.id || seen.has(record.id)) continue;
    seen.add(record.id);
    result.push(record);
  }
  return result;
}

function withoutUndefined(value) {
  const result = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) result[key] = entry;
  }
  return result;
}

export {
  countByPresent,
  dialectRecordId,
  externRecordId,
  normalizeDialectProjection,
  normalizeOptionalString,
  objectValue,
  projectionDispositionReadiness,
  uniqueRecordsById,
  withoutUndefined
};
