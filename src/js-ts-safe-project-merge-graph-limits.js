import { compactRecord } from './js-ts-safe-merge-context.js';

const encoder = typeof TextEncoder === 'function' ? new TextEncoder() : undefined;
const PROJECT_GRAPH_LIMIT_CODE = 'project-graph-limit-exceeded';
const PROJECT_GRAPH_INVALID_LIMIT_CODE = 'project-graph-limit-invalid';
const LIMIT_FIELDS = [
  ['maxFiles', 'source-files'],
  ['maxSourceBytes', 'source-bytes'],
  ['maxImportEdges', 'import-edges'],
  ['maxExportEdges', 'export-edges'],
  ['maxSerializedBytes', 'serialized-bytes']
];

function normalizeProjectGraphLimits(value) {
  if (!value || typeof value !== 'object') return {};
  const limits = {};
  const invalidLimits = [];
  for (const [field, limitKind] of LIMIT_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(value, field) || value[field] === undefined) continue;
    const normalized = normalizeLimit(value[field]);
    if (normalized === undefined) invalidLimits.push({ field, limitKind, value: String(value[field]), valueType: typeof value[field] });
    else limits[field] = normalized;
  }
  return compactRecord({ ...limits, invalidLimits: invalidLimits.length ? invalidLimits : undefined });
}

function projectGraphSourceStats(files) {
  return {
    sourceFiles: files.length,
    sourceBytes: files.reduce((total, file) => total + utf8ByteLength(file?.sourceText ?? ''), 0)
  };
}

function projectGraphSourceLimitConflicts(limits, stage, stats) {
  return [
    ...projectGraphInvalidLimitConflicts(limits, stage),
    limitConflict(limits.maxFiles, stage, 'source-files', stats.sourceFiles),
    limitConflict(limits.maxSourceBytes, stage, 'source-bytes', stats.sourceBytes)
  ].filter(Boolean);
}

function projectGraphInvalidLimitConflicts(limits, stage) {
  return (limits.invalidLimits ?? []).map((invalid) => ({
    code: PROJECT_GRAPH_INVALID_LIMIT_CODE,
    gateId: 'project-graph-limit',
    message: `Project graph ${stage} stage received invalid ${invalid.limitKind} limit ${JSON.stringify(invalid.value)}.`,
    details: compactRecord({
      reasonCode: PROJECT_GRAPH_INVALID_LIMIT_CODE,
      conflictKey: `project-graph-limit#${stage}#${invalid.limitKind}#invalid`,
      stage,
      limitKind: invalid.limitKind,
      limitField: invalid.field,
      limitValue: invalid.value,
      limitValueType: invalid.valueType
    })
  }));
}

function projectGraphEdgeLimitConflicts(limits, stage, projectSymbolGraph) {
  const importEdges = Array.isArray(projectSymbolGraph?.importEdges) ? projectSymbolGraph.importEdges.length : 0;
  const exportEdges = Array.isArray(projectSymbolGraph?.exportEdges) ? projectSymbolGraph.exportEdges.length : 0;
  return [
    limitConflict(limits.maxImportEdges, stage, 'import-edges', importEdges),
    limitConflict(limits.maxExportEdges, stage, 'export-edges', exportEdges)
  ].filter(Boolean);
}

function projectGraphSerializedLimitConflict(limits, stage, artifact) {
  const serializedBytes = serializedByteLength(artifact);
  return {
    serializedBytes,
    conflict: limitConflict(limits.maxSerializedBytes, stage, 'serialized-bytes', serializedBytes)
  };
}

function limitConflict(limit, stage, limitKind, actual) {
  if (limit === undefined || actual <= limit) return undefined;
  return {
    code: PROJECT_GRAPH_LIMIT_CODE,
    gateId: 'project-graph-limit',
    message: `Project graph ${stage} stage exceeded ${limitKind} limit: ${actual} > ${limit}.`,
    details: compactRecord({
      reasonCode: PROJECT_GRAPH_LIMIT_CODE,
      conflictKey: `project-graph-limit#${stage}#${limitKind}`,
      stage,
      limitKind,
      actual,
      limit
    })
  };
}

function normalizeLimit(value) {
  if (value === null) return undefined;
  const limit = Number(value);
  return Number.isFinite(limit) && limit >= 0 ? Math.floor(limit) : undefined;
}

function serializedByteLength(value) {
  return utf8ByteLength(JSON.stringify(value));
}

function utf8ByteLength(value) {
  const text = String(value ?? '');
  if (encoder) return encoder.encode(text).length;
  return unescape(encodeURIComponent(text)).length;
}

export {
  PROJECT_GRAPH_INVALID_LIMIT_CODE,
  PROJECT_GRAPH_LIMIT_CODE,
  normalizeProjectGraphLimits,
  projectGraphEdgeLimitConflicts,
  projectGraphSerializedLimitConflict,
  projectGraphSourceLimitConflicts,
  projectGraphSourceStats
};
