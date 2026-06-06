export function spanFromCSharpLineSpan(lineSpan, input) {
  if (!lineSpan || typeof lineSpan !== 'object') return undefined;
  const start = lineSpan.startLinePosition ?? lineSpan.StartLinePosition ?? lineSpan.start ?? lineSpan.Start;
  const end = lineSpan.endLinePosition ?? lineSpan.EndLinePosition ?? lineSpan.end ?? lineSpan.End;
  const line = start?.line ?? start?.Line;
  if (typeof line !== 'number') return undefined;
  const character = start.character ?? start.Character ?? start.column ?? start.Column;
  const endLine = end?.line ?? end?.Line;
  const endCharacter = end?.character ?? end?.Character ?? end?.column ?? end?.Column;
  return {
    sourceId: input.sourceHash,
    path: lineSpan.path ?? lineSpan.filePath ?? lineSpan.FilePath ?? input.sourcePath,
    startLine: line + 1,
    startColumn: typeof character === 'number' ? character + 1 : undefined,
    endLine: typeof endLine === 'number' ? endLine + 1 : undefined,
    endColumn: typeof endCharacter === 'number' ? endCharacter + 1 : undefined
  };
}
