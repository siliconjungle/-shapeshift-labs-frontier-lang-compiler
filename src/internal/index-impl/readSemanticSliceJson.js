export function readSemanticSliceJson(source) {
  const slice = JSON.parse(source);
  if (slice?.kind !== 'frontier.lang.semanticSlice') {
    throw new Error('Invalid Frontier semantic slice JSON: expected kind frontier.lang.semanticSlice');
  }
  return slice;
}
