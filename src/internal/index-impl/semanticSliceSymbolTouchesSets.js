export function semanticSliceSymbolTouchesSets(symbol, selection) {
  return selection.selectedSymbols.has(symbol.id)
    || selection.selectedNativeNodes.has(symbol.nativeAstNodeId)
    || selection.selectedRegions.has(symbol.ownershipRegionId)
    || selection.selectedRegions.has(symbol.metadata?.ownershipRegionId)
    || selection.selectedRegions.has(symbol.metadata?.ownershipRegionKey);
}
