export function sourceSpanPathMatches(span, sourcePath) {
  if (!span || !sourcePath) return false;
  return span.path === sourcePath || span.sourceId === sourcePath;
}
