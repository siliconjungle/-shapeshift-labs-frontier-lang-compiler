export function semanticSliceMappingTouchesSets(mapping, selection) {
  return selection.selectedMappings.has(mapping.id)
    || selection.selectedSymbols.has(mapping.semanticSymbolId)
    || selection.selectedNativeNodes.has(mapping.nativeAstNodeId)
    || selection.selectedRegions.has(mapping.ownershipRegionId)
    || selection.selectedRegions.has(mapping.ownershipRegionKey);
}
