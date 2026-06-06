export function spanFromKotlinRange(range, input) {
  if (!range || typeof range !== 'object') return undefined;
  const start = range.start ?? range.startPosition ?? range.lowerBound ?? range.begin;
  const end = range.end ?? range.endPosition ?? range.upperBound;
  const line = start?.line ?? start?.Line;
  if (typeof line !== 'number') return undefined;
  const column = start.column ?? start.character ?? start.offset ?? start.Column;
  const endLine = end?.line ?? end?.Line;
  const endColumn = end?.column ?? end?.character ?? end?.offset ?? end?.Column;
  return {
    sourceId: input.sourceHash,
    path: range.path ?? range.filePath ?? range.file ?? input.sourcePath,
    startLine: line,
    startColumn: typeof column === 'number' ? column : undefined,
    endLine: typeof endLine === 'number' ? endLine : undefined,
    endColumn: typeof endColumn === 'number' ? endColumn : undefined
  };
}
