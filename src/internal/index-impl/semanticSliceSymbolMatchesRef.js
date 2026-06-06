import{normalizeSemanticSliceRef}from'./normalizeSemanticSliceRef.js';import{semanticSliceValueMatches}from'./semanticSliceValueMatches.js';
export function semanticSliceSymbolMatchesRef(symbol, ref) {
  const normalized = normalizeSemanticSliceRef(ref, 'symbol');
  return [
    symbol.id,
    symbol.name,
    symbol.displayName,
    symbol.signature,
    symbol.nativeAstNodeId,
    symbol.metadata?.ownershipRegionId,
    symbol.metadata?.ownershipRegionKey
  ].filter(Boolean).some((value) => semanticSliceValueMatches(value, normalized));
}
