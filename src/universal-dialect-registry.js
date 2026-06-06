import { idFragment, maxSemanticMergeReadiness, uniqueStrings } from './native-import-utils.js';
import { createUniversalDialectLayer } from './universal-dialect-layer.js';
import {
  countByPresent,
  dialectRecordId,
  externRecordId,
  normalizeDialectProjection,
  normalizeOptionalString,
  objectValue,
  projectionDispositionReadiness,
  uniqueRecordsById,
  withoutUndefined
} from './universal-dialect-utils.js';

export const UniversalDialectConstructKinds = Object.freeze([
  'macro',
  'reflection',
  'generator',
  'runtime',
  'extern',
  'attribute',
  'decorator',
  'preprocessor',
  'conditionalCompilation',
  'syntaxExtension',
  'toolchain'
]);

export const UniversalDialectProjectionDispositions = Object.freeze([
  'preserved',
  'lossless',
  'lossy',
  'opaque',
  'declaration-only',
  'stub-only',
  'unsupported',
  'runtime-required',
  'review-required'
]);

export function createUniversalDialectRecord(input = {}, context = {}) {
  const language = normalizeOptionalString(input.language ?? context.language);
  const dialect = normalizeOptionalString(input.dialect ?? context.dialect ?? language ?? 'unknown');
  const constructKind = normalizeOptionalString(input.constructKind ?? context.constructKind ?? 'extern');
  const name = normalizeOptionalString(input.name ?? input.symbol ?? input.nativeKind ?? constructKind);
  const lossIds = uniqueStrings([...(input.lossIds ?? []), input.lossId].filter(Boolean));
  const evidenceIds = uniqueStrings([...(input.evidenceIds ?? []), input.evidenceId].filter(Boolean));
  return withoutUndefined({
    kind: 'frontier.lang.universalDialectRecord',
    version: 1,
    id: normalizeOptionalString(input.id) ?? dialectRecordId({ language, dialect, constructKind, name, index: context.index }),
    language,
    dialect,
    constructKind,
    name,
    nativeKind: normalizeOptionalString(input.nativeKind),
    sourcePath: normalizeOptionalString(input.sourcePath ?? context.sourcePath),
    sourceSpan: input.sourceSpan,
    nativeSourceId: normalizeOptionalString(input.nativeSourceId),
    nativeAstId: normalizeOptionalString(input.nativeAstId),
    nativeAstNodeId: normalizeOptionalString(input.nativeAstNodeId ?? input.nodeId),
    semanticNodeId: normalizeOptionalString(input.semanticNodeId),
    semanticSymbolId: normalizeOptionalString(input.semanticSymbolId),
    semanticOccurrenceId: normalizeOptionalString(input.semanticOccurrenceId),
    sourceMapId: normalizeOptionalString(input.sourceMapId),
    sourceMapMappingId: normalizeOptionalString(input.sourceMapMappingId),
    externIds: uniqueStrings([...(input.externIds ?? []), input.externId].filter(Boolean)),
    lossIds,
    evidenceIds,
    projection: normalizeDialectProjection(input.projection ?? input.projectionEvidence, { lossIds, evidenceIds }),
    payload: input.payload,
    metadata: input.metadata ? { ...input.metadata } : undefined
  });
}

export function createUniversalExternRecord(input = {}, context = {}) {
  const language = normalizeOptionalString(input.language ?? context.language);
  const dialect = normalizeOptionalString(input.dialect ?? context.dialect ?? language ?? 'extern');
  const externKind = normalizeOptionalString(input.externKind ?? input.constructKind ?? context.externKind ?? 'foreignSymbol');
  const name = normalizeOptionalString(input.name ?? input.symbol ?? input.binding?.symbol ?? externKind);
  const lossIds = uniqueStrings([...(input.lossIds ?? []), input.lossId].filter(Boolean));
  const evidenceIds = uniqueStrings([...(input.evidenceIds ?? []), input.evidenceId].filter(Boolean));
  return withoutUndefined({
    kind: 'frontier.lang.universalExternRecord',
    version: 1,
    id: normalizeOptionalString(input.id) ?? externRecordId({ language, dialect, externKind, name, index: context.index }),
    language,
    dialect,
    externKind,
    name,
    binding: input.binding ? { ...input.binding } : undefined,
    sourcePath: normalizeOptionalString(input.sourcePath ?? context.sourcePath),
    sourceSpan: input.sourceSpan,
    nativeSourceId: normalizeOptionalString(input.nativeSourceId),
    nativeAstId: normalizeOptionalString(input.nativeAstId),
    nativeAstNodeId: normalizeOptionalString(input.nativeAstNodeId ?? input.nodeId),
    semanticNodeId: normalizeOptionalString(input.semanticNodeId),
    semanticSymbolId: normalizeOptionalString(input.semanticSymbolId),
    semanticOccurrenceId: normalizeOptionalString(input.semanticOccurrenceId),
    sourceMapId: normalizeOptionalString(input.sourceMapId),
    sourceMapMappingId: normalizeOptionalString(input.sourceMapMappingId),
    lossIds,
    evidenceIds,
    projection: normalizeDialectProjection(input.projection ?? input.projectionEvidence, { lossIds, evidenceIds }),
    payload: input.payload,
    metadata: input.metadata ? { ...input.metadata } : undefined
  });
}

export function createUniversalDialectRegistry(input = {}, context = {}) {
  const source = input?.kind === 'frontier.lang.universalDialectRegistry' ? input : input ?? {};
  const dialects = uniqueRecordsById((source.dialects ?? source.records ?? []).map((record, index) => createUniversalDialectRecord(record, {
    language: source.language ?? context.language,
    dialect: source.dialect ?? context.dialect,
    sourcePath: source.sourcePath ?? context.sourcePath,
    index
  })));
  const externs = uniqueRecordsById((source.externs ?? []).map((record, index) => createUniversalExternRecord(record, {
    language: source.language ?? context.language,
    dialect: source.dialect ?? context.dialect,
    sourcePath: source.sourcePath ?? context.sourcePath,
    index
  })));
  const language = normalizeOptionalString(source.language ?? context.language);
  const id = normalizeOptionalString(source.id)
    ?? `dialect_registry_${idFragment(language ?? source.sourcePath ?? context.sourcePath ?? dialects[0]?.dialect ?? externs[0]?.dialect ?? 'mixed')}`;
  const registry = {
    kind: 'frontier.lang.universalDialectRegistry',
    version: 1,
    id,
    language,
    dialects,
    externs,
    metadata: source.metadata ? { ...source.metadata } : undefined
  };
  return withoutUndefined({ ...registry, summary: summarizeUniversalDialectRegistry(registry) });
}

export function summarizeUniversalDialectRegistry(input = {}) {
  const dialects = input.dialects ?? [];
  const externs = input.externs ?? [];
  const records = [...dialects, ...externs];
  return {
    dialects: dialects.length,
    externs: externs.length,
    records: records.length,
    languages: uniqueStrings(records.map((record) => record.language).filter(Boolean)),
    dialectNames: uniqueStrings(records.map((record) => record.dialect).filter(Boolean)),
    constructKinds: countByPresent(dialects.map((record) => record.constructKind)),
    externKinds: countByPresent(externs.map((record) => record.externKind)),
    lossIds: uniqueStrings(records.flatMap((record) => record.lossIds ?? [])),
    evidenceIds: uniqueStrings(records.flatMap((record) => record.evidenceIds ?? [])),
    sourceMapIds: uniqueStrings(records.flatMap((record) => [record.sourceMapId, ...(record.projection?.sourceMapIds ?? [])]).filter(Boolean)),
    projectionDispositions: countByPresent(records.map((record) => record.projection?.disposition)),
    projectionReadiness: records.reduce(
      (readiness, record) => maxSemanticMergeReadiness(readiness, projectionDispositionReadiness(record.projection?.disposition)),
      'ready'
    ),
    recordsWithLosses: records.filter((record) => (record.lossIds ?? []).length > 0).length,
    recordsWithProjectionEvidence: records.filter((record) => (record.projection?.evidenceIds ?? []).length > 0).length
  };
}

export function attachUniversalDialectRegistry(universalAst, input = {}) {
  if (!universalAst || typeof universalAst !== 'object') {
    throw new Error('attachUniversalDialectRegistry requires a universal AST envelope');
  }
  const existing = universalAst.metadata?.dialects;
  const registry = createUniversalDialectRegistry({
    ...(existing && typeof existing === 'object' ? existing : {}),
    ...input,
    dialects: [...((existing && typeof existing === 'object' ? existing.dialects : []) ?? []), ...(input.dialects ?? input.records ?? [])],
    externs: [...((existing && typeof existing === 'object' ? existing.externs : []) ?? []), ...(input.externs ?? [])]
  }, {
    language: universalAst.metadata?.sourceLanguage,
    sourcePath: universalAst.metadata?.sourcePath
  });
  const metadata = {
    ...(universalAst.metadata ?? {}),
    dialects: registry,
    language: { ...objectValue(universalAst.metadata?.language), externs: registry.externs }
  };
  return { ...universalAst, metadata, layers: { ...(universalAst.layers ?? {}), dialects: createUniversalDialectLayer(universalAst, registry) } };
}

export function attachInputUniversalDialectRegistry(universalAst, input = {}, context = {}) {
  if (!hasUniversalDialectRegistryInput(input)) return universalAst;
  const registryInput = input.universalDialectRegistry ?? {};
  return attachUniversalDialectRegistry(universalAst, {
    ...registryInput,
    language: context.language ?? input.language,
    sourcePath: context.sourcePath ?? input.sourcePath,
    dialects: [...(registryInput.dialects ?? registryInput.records ?? []), ...(input.dialects ?? [])],
    externs: [...(registryInput.externs ?? []), ...(input.externs ?? [])]
  });
}

export function hasUniversalDialectRegistryInput(input) {
  return Boolean(
    input?.universalDialectRegistry
    || (input?.dialects && input.dialects.length)
    || (input?.externs && input.externs.length)
  );
}
