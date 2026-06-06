export function semanticSliceSourceMapLinks(selection) {
  return selection.mappings.map((mapping) => ({
    id: mapping.id,
    sourceMapId: mapping.sourceMapId,
    sourcePath: mapping.sourceSpan?.path ?? mapping.sourceMapSourcePath,
    sourceHash: mapping.sourceMapSourceHash,
    targetPath: mapping.generatedSpan?.targetPath ?? mapping.sourceMapTargetPath,
    targetHash: mapping.generatedSpan?.targetHash ?? mapping.sourceMapTargetHash,
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
  }));
}
