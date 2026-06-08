import{addSet}from'./addSet.js';import{semanticSliceMappingTouchesSets}from'./semanticSliceMappingTouchesSets.js';import{semanticSliceNativeParentMap}from'./semanticSliceNativeParentMap.js';import{semanticSliceRegionTouchesSets}from'./semanticSliceRegionTouchesSets.js';import{semanticSliceSymbolTouchesSets}from'./semanticSliceSymbolTouchesSets.js';
export function expandSemanticSliceSelection(records, selection) {
  let changed = true;
  let depth = 0;
  const childToParent = semanticSliceNativeParentMap(records.nativeNodes);
  while (changed && depth <= selection.maxDependencyDepth) {
    changed = false;
    for (const mapping of records.mappings) {
      if (!semanticSliceMappingTouchesSets(mapping, selection)) continue;
      changed = addSet(selection.selectedMappings, mapping.id) || changed;
      if (mapping.semanticSymbolId) changed = addSet(selection.selectedSymbols, mapping.semanticSymbolId) || changed;
      if (mapping.nativeAstNodeId) changed = addSet(selection.selectedNativeNodes, mapping.nativeAstNodeId) || changed;
      if (mapping.ownershipRegionId) changed = addSet(selection.selectedRegions, mapping.ownershipRegionId) || changed;
    }
    for (const symbol of records.symbols) {
      if (!semanticSliceSymbolTouchesSets(symbol, selection)) continue;
      changed = addSet(selection.selectedSymbols, symbol.id) || changed;
      if (symbol.nativeAstNodeId) changed = addSet(selection.selectedNativeNodes, symbol.nativeAstNodeId) || changed;
      const regionId = symbol.ownershipRegionId ?? symbol.metadata?.ownershipRegionId;
      if (regionId) changed = addSet(selection.selectedRegions, regionId) || changed;
    }
    for (const region of records.regions) {
      if (!semanticSliceRegionTouchesSets(region, selection)) continue;
      changed = addSet(selection.selectedRegions, region.id) || changed;
      if (region.symbolId) changed = addSet(selection.selectedSymbols, region.symbolId) || changed;
      if (region.nativeAstNodeId) changed = addSet(selection.selectedNativeNodes, region.nativeAstNodeId) || changed;
    }
    for (const occurrence of records.occurrences) {
      if (!selection.selectedSymbols.has(occurrence.symbolId) && !selection.selectedNativeNodes.has(occurrence.nativeAstNodeId)) continue;
      changed = addSet(selection.selectedOccurrences, occurrence.id) || changed;
      if (occurrence.symbolId) changed = addSet(selection.selectedSymbols, occurrence.symbolId) || changed;
      if (occurrence.nativeAstNodeId) changed = addSet(selection.selectedNativeNodes, occurrence.nativeAstNodeId) || changed;
    }
    if (selection.includeDependencies) {
      for (const relation of records.relations) {
        const touches = selection.selectedSymbols.has(relation.sourceId) || selection.selectedSymbols.has(relation.targetId);
        if (!touches) continue;
        changed = addSet(selection.selectedRelations, relation.id) || changed;
        if (relation.sourceId && records.symbolById.has(relation.sourceId)) changed = addSet(selection.selectedSymbols, relation.sourceId) || changed;
        if (relation.targetId && records.symbolById.has(relation.targetId)) changed = addSet(selection.selectedSymbols, relation.targetId) || changed;
      }
      for (const node of records.nativeNodes) {
        if (!selection.selectedNativeNodes.has(node.id)) continue;
        const parent = childToParent.get(node.id);
        if (parent) changed = addSet(selection.selectedNativeNodes, parent) || changed;
      }
    }
    depth += 1;
  }
}
