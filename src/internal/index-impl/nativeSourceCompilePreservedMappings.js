import{idFragment,normalizeSourcePreservationLevel,reserveUniqueId,uniqueStrings}from'../../native-import-utils.js';import{lossIdsForNativeNode}from'../../native-source-maps.js';
import{nativeSourceCompileGeneratedSpanFromSource}from'./nativeSourceCompileGeneratedSpanFromSource.js';
export function nativeSourceCompilePreservedMappings(input) {
  const sourceMaps = input.importResult.sourceMaps ?? input.importResult.universalAst?.sourceMaps ?? [];
  const sourceHash = input.importResult.nativeSource?.sourceHash ?? input.importResult.nativeAst?.sourceHash ?? input.importResult.sourceHash;
  const exact = input.projection.mode === 'preserved-source' && (!input.projection.sourceHash || input.outputHash === input.projection.sourceHash);
  const usedIds = new Set();
  return sourceMaps
    .flatMap((sourceMap) => sourceMap?.mappings ?? [])
    .filter((mapping) => mapping?.sourceSpan)
    .map((mapping, index) => ({
      id: reserveUniqueId(`compile_map_${idFragment(mapping.id ?? mapping.semanticSymbolId ?? mapping.nativeAstNodeId ?? index + 1)}`, usedIds),
      nativeSourceId: mapping.nativeSourceId ?? input.importResult.nativeSource?.id,
      nativeAstNodeId: mapping.nativeAstNodeId,
      semanticSymbolId: mapping.semanticSymbolId,
      semanticOccurrenceId: mapping.semanticOccurrenceId,
      semanticNodeId: mapping.semanticNodeId,
      mergeCandidateId: mapping.mergeCandidateId,
      sourceSpan: {
        ...mapping.sourceSpan,
        sourceId: mapping.sourceSpan.sourceId ?? sourceHash,
        path: mapping.sourceSpan.path ?? input.importResult.sourcePath ?? input.importResult.nativeSource?.sourcePath
      },
      generatedSpan: nativeSourceCompileGeneratedSpanFromSource(mapping.sourceSpan, input, mapping.generatedName),
      target: input.target,
      generatedName: mapping.generatedName,
      evidenceIds: uniqueStrings([
        ...(mapping.evidenceIds ?? []),
        ...(input.evidence ?? []).map((record) => record.id).filter(Boolean)
      ]),
      lossIds: uniqueStrings([
        ...(mapping.lossIds ?? []),
        ...lossIdsForNativeNode(input.losses ?? [], mapping.nativeAstNodeId)
      ]),
      ownershipRegionId: mapping.ownershipRegionId,
      ownershipRegionKey: mapping.ownershipRegionKey,
      ownershipRegionKind: mapping.ownershipRegionKind,
      precision: exact ? 'exact' : mapping.precision === 'exact' ? 'line' : mapping.precision ?? 'line',
      preservation: exact ? 'exact' : normalizeSourcePreservationLevel(mapping.preservation, {
        precision: mapping.precision === 'exact' ? 'line' : mapping.precision ?? 'line',
        lossIds: mapping.lossIds,
        losses: input.losses ?? [],
        sourcePreservation: input.importResult.metadata?.sourcePreservation
      }),
      metadata: {
        ...mapping.metadata,
        compileResultId: input.compileResultId,
        sourceMapOrigin: 'preserved-source'
      }
    }));
}
