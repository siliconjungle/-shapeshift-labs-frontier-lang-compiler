export function uniqueSemanticSliceSpans(spans) {
  const seen = new Set();
  const result = [];
  for (const span of spans ?? []) {
    if (!span) continue;
    const key = [
      span.path,
      span.sourceId,
      span.start,
      span.end,
      span.startLine,
      span.startColumn,
      span.endLine,
      span.endColumn
    ].join(':');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(span);
  }
  return result;
}
