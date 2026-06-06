import{stableUniversalAstJson}from'@shapeshift-labs/frontier-lang-kernel';
export function writeSemanticSliceJson(slice) {
  if (slice?.kind !== 'frontier.lang.semanticSlice') {
    throw new Error('Invalid Frontier semantic slice: expected kind frontier.lang.semanticSlice');
  }
  return stableUniversalAstJson(slice);
}
