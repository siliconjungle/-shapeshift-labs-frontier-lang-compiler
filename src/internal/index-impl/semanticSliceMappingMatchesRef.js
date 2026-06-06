import{normalizeSemanticSliceRef}from'./normalizeSemanticSliceRef.js';import{semanticSliceValueMatches}from'./semanticSliceValueMatches.js';
export function semanticSliceMappingMatchesRef(mapping, ref) {
  const pathRef = normalizeSemanticSliceRef(ref, 'path');
  const normalized = normalizeSemanticSliceRef(ref, 'mapping');
  return [
    mapping.id,
    mapping.semanticSymbolId,
    mapping.semanticOccurrenceId,
    mapping.semanticNodeId,
    mapping.nativeAstNodeId,
    mapping.ownershipRegionId,
    mapping.ownershipRegionKey
  ].filter(Boolean).some((value) => semanticSliceValueMatches(value, normalized))
    || semanticSliceValueMatches(mapping.sourceSpan?.path ?? mapping.sourceMapSourcePath, pathRef);
}
