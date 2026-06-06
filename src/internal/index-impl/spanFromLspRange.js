export function spanFromLspRange(range, sourcePath, sourceHash, base = 0) {
  if (!range) return undefined;
  const source = range.start && range.end ? range : { start: range, end: range.end ?? range };
  return {
    sourceId: sourceHash,
    path: sourcePath,
    startLine: Number(source.start?.line ?? source.startLine ?? 0) + (base === 0 ? 1 : 0),
    startColumn: Number(source.start?.character ?? source.startColumn ?? 0) + (base === 0 ? 1 : 0),
    endLine: Number(source.end?.line ?? source.endLine ?? source.start?.line ?? 0) + (base === 0 ? 1 : 0),
    endColumn: Number(source.end?.character ?? source.endColumn ?? source.start?.character ?? 0) + (base === 0 ? 1 : 0)
  };
}
