export function spanFromCSharpLineFields(node, input) {
  const startLine = node.startLine ?? node.line ?? node.beginLine;
  if (typeof startLine !== 'number') return undefined;
  return {
    sourceId: input.sourceHash,
    path: node.path ?? node.filePath ?? node.file ?? input.sourcePath,
    startLine,
    startColumn: node.startColumn ?? node.column ?? node.beginColumn,
    endLine: node.endLine,
    endColumn: node.endColumn
  };
}
