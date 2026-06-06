import{sourceSpanPathMatches}from'./sourceSpanPathMatches.js';
export function nativeChangeMappingTouchesRegion(mapping, region, symbols) {
  if (!mapping || !region) return false;
  const symbolIds = new Set((symbols ?? []).map((symbol) => symbol.id).filter(Boolean));
  const occurrenceIds = new Set((symbols ?? []).map((symbol) => symbol.semanticOccurrenceId).filter(Boolean));
  const mappingIds = new Set((symbols ?? []).map((symbol) => symbol.sourceMapMappingId).filter(Boolean));
  if (mappingIds.has(mapping.id)) return true;
  if (region.id && mapping.ownershipRegionId === region.id) return true;
  if (region.key && mapping.ownershipRegionKey === region.key) return true;
  if (region.nativeAstNodeId && mapping.nativeAstNodeId === region.nativeAstNodeId) return true;
  if (symbolIds.has(mapping.semanticSymbolId)) return true;
  if (occurrenceIds.has(mapping.semanticOccurrenceId)) return true;
  if (region.granularity === 'file') {
    return !region.sourcePath || sourceSpanPathMatches(mapping.sourceSpan, region.sourcePath);
  }
  return false;
}
