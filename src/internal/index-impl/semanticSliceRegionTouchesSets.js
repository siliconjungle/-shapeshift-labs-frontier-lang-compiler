export function semanticSliceRegionTouchesSets(region, selection) {
  return selection.selectedRegions.has(region.id)
    || selection.selectedRegions.has(region.key)
    || selection.selectedSymbols.has(region.symbolId)
    || selection.selectedNativeNodes.has(region.nativeAstNodeId);
}
