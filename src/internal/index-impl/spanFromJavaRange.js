export function spanFromJavaRange(range, input) {
  if (!range || typeof range !== 'object') return undefined;
  const start = range.begin ?? range.start;
  const end = range.end ?? range.stop;
  if (start && typeof start === 'object') {
    const startLine = start.line ?? start.Line;
    const startColumn = start.column ?? start.col ?? start.Column ?? start.character;
    const endLine = end?.line ?? end?.Line;
    const endColumn = end?.column ?? end?.col ?? end?.Column ?? end?.character;
    if (typeof startLine === 'number') {
      return {
        sourceId: input.sourceHash,
        path: start.path ?? start.file ?? end?.path ?? end?.file ?? input.sourcePath,
        startLine,
        startColumn,
        endLine,
        endColumn
      };
    }
  }
  return undefined;
}
