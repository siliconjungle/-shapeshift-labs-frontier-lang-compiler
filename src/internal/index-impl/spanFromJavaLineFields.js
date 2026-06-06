export function spanFromJavaLineFields(node, input) {
  const startLine = node.startLine ?? node.line ?? node.beginLine ?? node.lineno;
  if (typeof startLine !== 'number') return undefined;
  return {
    sourceId: input.sourceHash,
    path: node.path ?? node.file ?? node.filename ?? input.sourcePath,
    startLine,
    startColumn: node.startColumn ?? node.column ?? node.beginColumn ?? node.col,
    endLine: node.endLine ?? node.end_lineno,
    endColumn: node.endColumn ?? node.end_col_offset
  };
}
