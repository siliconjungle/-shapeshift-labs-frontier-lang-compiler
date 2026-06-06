import { uniqueStrings } from './native-import-utils.js';

function createUniversalDialectLayer(universalAst, registry) {
  const records = [...registry.dialects, ...registry.externs];
  const references = uniqueReferences([
    { kind: 'dialectRegistry', id: registry.id, layer: 'dialects' },
    ...registry.dialects.map((record) => ({ kind: 'dialectRecord', id: record.id, layer: 'dialects' })),
    ...registry.externs.map((record) => ({ kind: 'externRecord', id: record.id, layer: 'dialects' })),
    ...records.flatMap(recordReferences)
  ]);
  return {
    kind: 'frontier.lang.universalAstLayer',
    version: 1,
    id: `layer:${registry.id}:dialects`,
    layer: 'dialects',
    nativeSourceIds: uniqueStrings(records.map((record) => record.nativeSourceId).filter(Boolean)),
    nativeAstIds: uniqueStrings(records.map((record) => record.nativeAstId).filter(Boolean)),
    nativeAstNodeIds: uniqueStrings(records.map((record) => record.nativeAstNodeId).filter(Boolean)),
    semanticNodeIds: uniqueStrings(records.map((record) => record.semanticNodeId).filter(Boolean)),
    semanticIndexId: universalAst.semanticIndex?.id,
    semanticSymbolIds: uniqueStrings(records.map((record) => record.semanticSymbolId).filter(Boolean)),
    semanticOccurrenceIds: uniqueStrings(records.map((record) => record.semanticOccurrenceId).filter(Boolean)),
    sourceMapIds: registry.summary.sourceMapIds,
    sourceMapMappingIds: uniqueStrings(records.flatMap((record) => [
      record.sourceMapMappingId,
      ...(record.projection?.sourceMapMappingIds ?? [])
    ]).filter(Boolean)),
    lossIds: registry.summary.lossIds,
    evidenceIds: registry.summary.evidenceIds,
    references,
    records: [registry],
    metadata: {
      registryId: registry.id,
      dialectRecords: registry.summary.dialects,
      externRecords: registry.summary.externs,
      constructKinds: registry.summary.constructKinds,
      externKinds: registry.summary.externKinds,
      projectionReadiness: registry.summary.projectionReadiness,
      note: 'Dialect records preserve language-specific constructs with explicit loss and projection evidence instead of lowering them into generic stubs.'
    }
  };
}

function recordReferences(record) {
  return [
    record.nativeSourceId ? { kind: 'nativeSource', id: record.nativeSourceId } : undefined,
    record.nativeAstId ? { kind: 'nativeAst', id: record.nativeAstId } : undefined,
    record.nativeAstNodeId ? { kind: 'nativeAstNode', id: record.nativeAstNodeId } : undefined,
    record.semanticNodeId ? { kind: 'semanticNode', id: record.semanticNodeId } : undefined,
    record.semanticSymbolId ? { kind: 'semanticSymbol', id: record.semanticSymbolId } : undefined,
    record.semanticOccurrenceId ? { kind: 'semanticOccurrence', id: record.semanticOccurrenceId } : undefined,
    record.sourceMapId ? { kind: 'sourceMap', id: record.sourceMapId } : undefined,
    record.sourceMapMappingId ? { kind: 'sourceMapMapping', id: record.sourceMapMappingId } : undefined,
    ...(record.lossIds ?? []).map((id) => ({ kind: 'loss', id })),
    ...(record.evidenceIds ?? []).map((id) => ({ kind: 'evidence', id })),
    ...(record.projection?.sourceMapIds ?? []).map((id) => ({ kind: 'sourceMap', id })),
    ...(record.projection?.sourceMapMappingIds ?? []).map((id) => ({ kind: 'sourceMapMapping', id }))
  ].filter(Boolean);
}

function uniqueReferences(references) {
  const seen = new Set();
  const result = [];
  for (const reference of references) {
    if (!reference?.id) continue;
    const key = `${reference.kind}:${reference.id}:${reference.layer ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(reference);
  }
  return result;
}

export { createUniversalDialectLayer };
