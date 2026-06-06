import{clangLocPosition}from'./clangLocPosition.js';
export function spanFromClangAstNode(node, input) {
  const range = node.range ?? {};
  const begin = range.begin ?? node.loc ?? node.spellingLoc ?? node.expansionLoc;
  const end = range.end ?? node.end;
  const start = clangLocPosition(begin);
  if (!start) return undefined;
  const finish = clangLocPosition(end);
  return {
    sourceId: input.sourceHash,
    path: start.path ?? finish?.path ?? input.sourcePath,
    startLine: start.line,
    startColumn: start.column,
    endLine: finish?.line,
    endColumn: finish?.column
  };
}
