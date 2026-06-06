import{normalizeSemanticSliceRef}from'./normalizeSemanticSliceRef.js';import{semanticSliceValueMatches}from'./semanticSliceValueMatches.js';
export function semanticSliceNativeNodeMatchesRef(node, ref) {
  const normalized = normalizeSemanticSliceRef(ref, 'native');
  return [
    node.id,
    node.nodeId,
    node.name,
    node.symbolId,
    node.kind,
    node.languageKind
  ].filter(Boolean).some((value) => semanticSliceValueMatches(value, normalized));
}
