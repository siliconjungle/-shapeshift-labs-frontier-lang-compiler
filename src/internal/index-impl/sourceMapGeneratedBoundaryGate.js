import { countBy, uniqueStrings } from '../../native-import-utils.js';

export function classifySourceMapGeneratedBoundary(sourceMaps, options = {}) {
  const maps = normalizeSourceMapCollection(sourceMaps);
  const entries = maps.flatMap((sourceMap) => (sourceMap?.mappings ?? [])
    .map((mapping) => ({ sourceMap, mapping })));
  const exactEntries = entries.filter(({ sourceMap, mapping }) => hasExactGeneratedBoundary(sourceMap, mapping));
  const generatedBoundaryOwnershipRecords = exactEntries.map(generatedBoundaryOwnershipRecord).filter(Boolean);
  const summary = sourceMapGeneratedBoundarySummary(maps, entries);
  const exactBoundary = generatedBoundaryOwnershipRecords.length > 0;
  return {
    schema: 'frontier.lang.sourceMapGeneratedBoundaryGate.v1',
    version: 1,
    status: exactBoundary ? 'ready' : 'blocked',
    readiness: exactBoundary ? 'ready' : 'blocked',
    action: exactBoundary ? 'admit-exact-source-map-generated-boundary' : 'block-generated-file-merge-admission',
    reviewRequired: !exactBoundary,
    exactBoundary,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    sourceLanguage: options.sourceLanguage,
    target: options.target,
    outputMode: options.outputMode,
    projectionMode: options.projectionMode,
    sourceMapIds: uniqueStrings(maps.map((sourceMap) => sourceMap?.id)),
    sourceMapMappingIds: uniqueStrings(exactEntries.map(({ mapping }) => mapping?.id)),
    generatedBoundaryOwnershipStatus: exactBoundary ? 'deterministic-source-map-span' : 'blocked',
    generatedBoundaryOwnershipKeys: uniqueStrings(generatedBoundaryOwnershipRecords.map((record) => record.key)),
    generatedBoundaryOwnershipRecords,
    invariant: 'ECMA-426 source maps identify generated positions and original positions; Frontier generated-file merge admission requires validated source-map evidence plus exact source and generated spans with source and target hashes.',
    missingInvariant: exactBoundary ? undefined : 'ecma-426-generated-position-only-no-range-boundary',
    summary,
    reasonCodes: sourceMapGeneratedBoundaryReasonCodes(summary, exactBoundary)
  };
}

function normalizeSourceMapCollection(sourceMaps) {
  if (!sourceMaps) return [];
  return Array.isArray(sourceMaps) ? sourceMaps.filter(Boolean) : [sourceMaps].filter(Boolean);
}

function hasExactGeneratedBoundary(sourceMap, mapping) {
  return mapping?.precision === 'exact'
    && hasExactSpan(mapping.sourceSpan)
    && hasExactSpan(mapping.generatedSpan)
    && Boolean(sourceBoundaryHash(sourceMap, mapping))
    && Boolean(targetBoundaryHash(sourceMap, mapping));
}

function hasExactSpan(span) {
  if (!span) return false;
  return [span.startLine, span.startColumn, span.endLine, span.endColumn]
    .every((value) => Number.isFinite(value));
}

function sourceMapGeneratedBoundarySummary(maps, entries) {
  const mappings = entries.map(({ mapping }) => mapping);
  const ecma426Payloads = maps.map(ecma426SourceMapEvidence).filter((record) => record?.present);
  const ecma426ReasonCodes = uniqueStrings(ecma426Payloads.flatMap((record) => record?.reasonCodes ?? []));
  const generatedBoundaryOwnershipRecords = entries
    .filter(({ sourceMap, mapping }) => hasExactGeneratedBoundary(sourceMap, mapping))
    .map(generatedBoundaryOwnershipRecord)
    .filter(Boolean);
  return {
    sourceMaps: maps.length,
    mappings: mappings.length,
    exactBoundaryMappings: entries.filter(({ sourceMap, mapping }) => hasExactGeneratedBoundary(sourceMap, mapping)).length,
    deterministicGeneratedBoundaryOwnerships: generatedBoundaryOwnershipRecords.length,
    exactPrecisionMappings: mappings.filter((mapping) => mapping?.precision === 'exact').length,
    withSourceSpan: mappings.filter((mapping) => hasExactSpan(mapping?.sourceSpan)).length,
    withGeneratedSpan: mappings.filter((mapping) => hasExactSpan(mapping?.generatedSpan)).length,
    withSourceHash: entries.filter(({ sourceMap, mapping }) => sourceBoundaryHash(sourceMap, mapping)).length,
    withTargetHash: entries.filter(({ sourceMap, mapping }) => targetBoundaryHash(sourceMap, mapping)).length,
    byPrecision: countBy(mappings.map((mapping) => mapping?.precision ?? 'unknown')),
    byOrigin: countBy(mappings.map((mapping) => mapping?.metadata?.sourceMapOrigin ?? 'native-import')),
    byBoundaryKind: countBy(entries.map(({ sourceMap, mapping }) => sourceMapBoundaryKind(sourceMap, mapping))),
    byEcma426Status: countBy(maps.map((sourceMap) => ecma426SourceMapEvidence(sourceMap)?.status ?? 'missing')),
    ecma426Payloads: ecma426Payloads.length,
    validEcma426Payloads: ecma426Payloads.filter((record) => record?.status === 'valid').length,
    invalidEcma426Payloads: ecma426Payloads.filter((record) => record?.status === 'blocked').length,
    decodedEcma426Mappings: ecma426Payloads.reduce((sum, record) => sum + numeric(record?.summary?.decodedMappings), 0),
    ecma426ReasonCodes,
    sourcePaths: uniqueStrings(entries.map(({ sourceMap, mapping }) => mapping?.sourceSpan?.path ?? sourceMap?.sourcePath)),
    targetPaths: uniqueStrings(entries.map(({ sourceMap, mapping }) => mapping?.generatedSpan?.targetPath
      ?? mapping?.generatedSpan?.path ?? sourceMap?.targetPath ?? sourceMap?.target?.emitPath))
  };
}

function sourceMapGeneratedBoundaryReasonCodes(summary, exactBoundary) {
  return uniqueStrings([
    'ecma-426:source-map-generated-boundary-gate',
    'runtime-neutral:source-map-records-only',
    exactBoundary ? 'source-map-generated-boundary:exact' : 'ecma-426:missing-exact-source-generated-boundary',
    exactBoundary ? 'source-map-generated-boundary:deterministic-source-map-span-ownership' : undefined,
    summary.sourceMaps === 0 ? 'source-map:missing' : undefined,
    !exactBoundary && summary.ecma426Payloads === 0 ? 'ecma-426:payload-missing' : undefined,
    summary.validEcma426Payloads > 0 ? 'ecma-426:payload-valid' : undefined,
    !exactBoundary && summary.invalidEcma426Payloads > 0 ? 'ecma-426:payload-invalid' : undefined,
    !exactBoundary && summary.validEcma426Payloads > 0 && summary.exactBoundaryMappings === 0 ? 'ecma-426:payload-position-only' : undefined,
    ...summary.ecma426ReasonCodes,
    summary.mappings === 0 ? 'source-map:mappings-missing' : undefined,
    summary.exactPrecisionMappings === 0 ? 'source-map:exact-precision-missing' : undefined,
    summary.withSourceSpan < summary.mappings ? 'ecma-426:missing-original-range' : undefined,
    summary.withGeneratedSpan < summary.mappings ? 'ecma-426:missing-generated-range' : undefined,
    summary.withSourceHash < summary.mappings ? 'source-map:source-hash-missing' : undefined,
    summary.withTargetHash < summary.mappings ? 'source-map:target-hash-missing' : undefined
  ]);
}

function sourceBoundaryHash(sourceMap, mapping) {
  return sourceMap?.sourceHash ?? mapping?.sourceSpan?.sourceHash ?? mapping?.sourceSpan?.sourceId;
}

function targetBoundaryHash(sourceMap, mapping) {
  return sourceMap?.targetHash ?? mapping?.generatedSpan?.targetHash ?? mapping?.targetHash;
}

function generatedBoundaryOwnershipRecord({ sourceMap, mapping }) {
  if (!hasExactGeneratedBoundary(sourceMap, mapping)) return undefined;
  const sourceSpan = mapping?.sourceSpan;
  const generatedSpan = mapping?.generatedSpan;
  const sourcePath = sourceSpan?.path ?? sourceMap?.sourcePath;
  const targetPath = generatedSpan?.targetPath ?? generatedSpan?.path ?? sourceMap?.targetPath ?? sourceMap?.target?.emitPath;
  const sourceHash = sourceBoundaryHash(sourceMap, mapping);
  const targetHash = targetBoundaryHash(sourceMap, mapping);
  const sourceSpanKey = exactSpanKey(sourceSpan);
  const generatedSpanKey = exactSpanKey(generatedSpan);
  const key = stableKey(['generated-boundary', sourcePath, sourceHash, sourceSpanKey, targetPath, targetHash, generatedSpanKey]);
  return compactRecord({
    key,
    status: 'deterministic-source-map-span',
    sourceMapId: sourceMap?.id,
    sourceMapMappingId: mapping?.id,
    sourcePath,
    targetPath,
    sourceHash,
    targetHash,
    sourceSpanKey,
    generatedSpanKey,
    boundaryKind: sourceMapBoundaryKind(sourceMap, mapping),
    sourceMapOrigin: mapping?.metadata?.sourceMapOrigin ?? 'native-import'
  });
}

function exactSpanKey(span) {
  return stableKey([
    span?.path ?? span?.targetPath ?? span?.sourceId,
    span?.start,
    span?.end,
    span?.startLine,
    span?.startColumn,
    span?.endLine,
    span?.endColumn
  ]);
}

function ecma426SourceMapEvidence(sourceMap) {
  return sourceMap?.metadata?.ecma426SourceMap;
}

function numeric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function sourceMapBoundaryKind(sourceMap, mapping) {
  const sourcePath = mapping?.sourceSpan?.path ?? sourceMap?.sourcePath;
  const targetPath = mapping?.generatedSpan?.targetPath ?? mapping?.generatedSpan?.path
    ?? sourceMap?.targetPath ?? sourceMap?.target?.emitPath;
  const sourceHash = sourceBoundaryHash(sourceMap, mapping);
  const targetHash = targetBoundaryHash(sourceMap, mapping);
  if (sourcePath && targetPath && sourcePath === targetPath && sourceHash && targetHash && sourceHash === targetHash) {
    return 'preserved-source';
  }
  return 'source-generated';
}

function stableKey(parts) {
  const values = parts.map((part) => part === undefined || part === null ? '' : String(part));
  return values.some(Boolean) ? values.join('#') : undefined;
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}
