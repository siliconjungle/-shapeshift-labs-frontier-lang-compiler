export function semanticSliceRegionFromMapping(mapping, context) {
  if (!mapping.ownershipRegionId && !mapping.ownershipRegionKey) return undefined;
  return {
    id: mapping.ownershipRegionId,
    key: mapping.ownershipRegionKey,
    regionKind: mapping.ownershipRegionKind,
    granularity: 'source-map',
    language: context.language,
    sourcePath: mapping.sourceSpan?.path ?? context.sourcePath,
    sourceSpan: mapping.sourceSpan,
    symbolId: mapping.semanticSymbolId,
    nativeAstNodeId: mapping.nativeAstNodeId,
    precision: mapping.precision,
    mergePolicy: 'source-map-region-review'
  };
}
