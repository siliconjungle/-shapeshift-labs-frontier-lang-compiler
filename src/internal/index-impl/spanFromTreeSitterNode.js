export function spanFromTreeSitterNode(node, input) {
  const start = node.startPosition;
  if (!start) return undefined;
  const end = node.endPosition;
  return {
    sourceId: input.sourceHash,
    path: input.sourcePath,
    startLine: start.row + 1,
    startColumn: start.column + 1,
    endLine: end ? end.row + 1 : undefined,
    endColumn: end ? end.column + 1 : undefined
  };
}
