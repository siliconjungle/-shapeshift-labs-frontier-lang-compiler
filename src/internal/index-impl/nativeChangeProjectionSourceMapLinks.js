import{nativeChangeMappingTouchesRegion}from'./nativeChangeMappingTouchesRegion.js';
export function nativeChangeProjectionSourceMapLinks(imported, side, region, symbols) {
  if (!imported) return [];
  const sourceMaps = imported.sourceMaps ?? imported.universalAst?.sourceMaps ?? [];
  const links = [];
  for (const sourceMap of sourceMaps) {
    for (const mapping of sourceMap?.mappings ?? []) {
      if (!nativeChangeMappingTouchesRegion(mapping, region, symbols)) continue;
      links.push({
        id: `${side}:${sourceMap.id}:${mapping.id}`,
        side,
        sourceMapId: sourceMap.id,
        sourceMapMappingId: mapping.id,
        sourcePath: mapping.sourceSpan?.path ?? sourceMap.sourcePath ?? imported.sourcePath,
        sourceHash: sourceMap.sourceHash ?? imported.nativeSource?.sourceHash ?? imported.nativeAst?.sourceHash,
        targetPath: mapping.generatedSpan?.targetPath ?? sourceMap.targetPath,
        targetHash: mapping.generatedSpan?.targetHash ?? sourceMap.targetHash,
        semanticSymbolId: mapping.semanticSymbolId,
        semanticOccurrenceId: mapping.semanticOccurrenceId,
        semanticNodeId: mapping.semanticNodeId,
        nativeSourceId: mapping.nativeSourceId,
        nativeAstNodeId: mapping.nativeAstNodeId,
        precision: mapping.precision,
        sourceSpan: mapping.sourceSpan,
        generatedSpan: mapping.generatedSpan,
        ownershipRegionId: mapping.ownershipRegionId,
        ownershipRegionKey: mapping.ownershipRegionKey,
        ownershipRegionKind: mapping.ownershipRegionKind
      });
    }
  }
  return links;
}
