import{normalizeSemanticSliceRef}from'./normalizeSemanticSliceRef.js';import{semanticSliceValueMatches}from'./semanticSliceValueMatches.js';
export function semanticSliceRegionMatchesRef(region, ref) {
  const normalized = normalizeSemanticSliceRef(ref, 'region');
  return [
    region.id,
    region.key,
    region.symbolId,
    region.symbolName,
    region.nativeAstNodeId,
    region.sourcePath
  ].filter(Boolean).some((value) => semanticSliceValueMatches(value, normalized));
}
