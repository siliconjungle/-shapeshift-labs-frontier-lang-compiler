import{goAstPosition}from'./goAstPosition.js';
export function spanFromGoAstNode(node, input, options = {}) {
  const start = goAstPosition(node.Pos ?? node.pos ?? node.Name?.NamePos ?? node.name?.namePos ?? node.Package, options);
  const end = goAstPosition(node.End ?? node.end ?? node.EndPos ?? node.endPos, options);
  if (!start) return undefined;
  return {
    sourceId: input.sourceHash,
    path: start.path ?? end?.path ?? input.sourcePath,
    startLine: start.line,
    startColumn: start.column,
    endLine: end?.line,
    endColumn: end?.column
  };
}
