import{expandSemanticSliceSelection}from'./expandSemanticSliceSelection.js';import{semanticSliceMappingMatchesRef}from'./semanticSliceMappingMatchesRef.js';import{semanticSliceNativeNodeMatchesRef}from'./semanticSliceNativeNodeMatchesRef.js';import{semanticSliceRegionMatchesRef}from'./semanticSliceRegionMatchesRef.js';import{semanticSliceSpanTouchesSelection}from'./semanticSliceSpanTouchesSelection.js';import{semanticSliceSymbolMatchesRef}from'./semanticSliceSymbolMatchesRef.js';
export function selectSemanticSliceRecords(records, options) {
  const selectedSymbols = new Set();
  const selectedRegions = new Set();
  const selectedNativeNodes = new Set();
  const selectedMappings = new Set();
  const selectedRelations = new Set();
  const selectedOccurrences = new Set();
  const matchedEntryRefs = [];
  const entryRefs = options.entryRefs ?? [];
  if (entryRefs.length === 0) {
    for (const symbol of records.symbols) selectedSymbols.add(symbol.id);
    for (const region of records.regions) selectedRegions.add(region.id);
    for (const node of records.nativeNodes) selectedNativeNodes.add(node.id);
    for (const mapping of records.mappings) selectedMappings.add(mapping.id);
  } else {
    for (const ref of entryRefs) {
      let matched = false;
      for (const symbol of records.symbols) {
        if (!semanticSliceSymbolMatchesRef(symbol, ref)) continue;
        selectedSymbols.add(symbol.id);
        matched = true;
      }
      for (const region of records.regions) {
        if (!semanticSliceRegionMatchesRef(region, ref)) continue;
        selectedRegions.add(region.id);
        matched = true;
      }
      for (const node of records.nativeNodes) {
        if (!semanticSliceNativeNodeMatchesRef(node, ref)) continue;
        selectedNativeNodes.add(node.id);
        matched = true;
      }
      for (const mapping of records.mappings) {
        if (!semanticSliceMappingMatchesRef(mapping, ref)) continue;
        selectedMappings.add(mapping.id);
        matched = true;
      }
      if (matched) matchedEntryRefs.push(ref);
    }
  }
  expandSemanticSliceSelection(records, {
    selectedSymbols,
    selectedRegions,
    selectedNativeNodes,
    selectedMappings,
    selectedRelations,
    selectedOccurrences,
    includeDependencies: options.includeDependencies,
    maxDependencyDepth: options.maxDependencyDepth
  });
  const symbols = records.symbols.filter((symbol) => selectedSymbols.has(symbol.id));
  const regions = records.regions.filter((region) => selectedRegions.has(region.id));
  const nativeNodes = records.nativeNodes.filter((node) => selectedNativeNodes.has(node.id));
  const mappings = records.mappings.filter((mapping) => selectedMappings.has(mapping.id));
  const relations = records.relations.filter((relation) => selectedRelations.has(relation.id));
  const occurrences = records.occurrences.filter((occurrence) => selectedOccurrences.has(occurrence.id));
  const selectedNodeIds = new Set(nativeNodes.map((node) => node.id));
  const losses = records.losses.filter((loss) => !loss.nodeId || selectedNodeIds.has(loss.nodeId) || semanticSliceSpanTouchesSelection(loss.span, mappings, regions));
  return {
    matchedEntryRefs,
    symbols,
    regions,
    nativeNodes,
    mappings,
    relations,
    occurrences,
    losses
  };
}
