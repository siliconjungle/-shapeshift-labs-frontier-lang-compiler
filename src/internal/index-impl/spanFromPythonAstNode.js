export function spanFromPythonAstNode(node, input) {
  const line = node.lineno ?? node.line;
  if (typeof line !== 'number') return undefined;
  const col = node.col_offset ?? node.colOffset;
  const endLine = node.end_lineno ?? node.endLine;
  const endCol = node.end_col_offset ?? node.endColOffset;
  return {
    sourceId: input.sourceHash,
    path: input.sourcePath,
    startLine: line,
    startColumn: typeof col === 'number' ? col + 1 : undefined,
    endLine: typeof endLine === 'number' ? endLine : undefined,
    endColumn: typeof endCol === 'number' ? endCol + 1 : undefined
  };
}
