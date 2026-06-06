import{semanticSliceSymbolSpan}from'./semanticSliceSymbolSpan.js';
export function semanticSliceRegionFromSymbol(symbol, context) {
  const regionId = symbol.ownershipRegionId ?? symbol.metadata?.ownershipRegionId;
  const regionKey = symbol.ownershipKey ?? symbol.metadata?.ownershipRegionKey;
  if (!regionId && !regionKey) return undefined;
  return {
    id: regionId,
    key: regionKey,
    regionKind: symbol.ownershipRegionKind ?? symbol.metadata?.ownershipRegionKind ?? symbol.kind,
    granularity: 'symbol',
    language: symbol.language ?? context.language,
    sourcePath: semanticSliceSymbolSpan(symbol)?.path ?? context.sourcePath,
    sourceSpan: semanticSliceSymbolSpan(symbol),
    symbolId: symbol.id,
    symbolName: symbol.name,
    symbolKind: symbol.kind,
    nativeAstNodeId: symbol.nativeAstNodeId,
    precision: 'symbol',
    mergePolicy: 'semantic-region-review'
  };
}
