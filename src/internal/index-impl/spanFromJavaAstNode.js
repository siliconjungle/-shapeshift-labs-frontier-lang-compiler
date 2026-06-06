import{javaAstPosition}from'./javaAstPosition.js';import{spanFromJavaLineFields}from'./spanFromJavaLineFields.js';import{spanFromJavaRange}from'./spanFromJavaRange.js';
export function spanFromJavaAstNode(node, input, options = {}) {
  const direct = spanFromJavaRange(node.range ?? node.loc ?? node.location, input)
    ?? spanFromJavaLineFields(node, input);
  if (direct) return direct;
  const start = javaAstPosition(
    node.begin ?? node.start ?? node.pos ?? node.position ?? node.startPosition ?? node.name?.range?.begin ?? node.name?.loc?.start,
    options
  );
  const end = javaAstPosition(
    node.end ?? node.endPosition ?? node.stopPosition ?? node.finishPosition ?? node.name?.range?.end ?? node.name?.loc?.end,
    options
  );
  const sourceRange = node.sourceRange ?? node.rangeInfo;
  const sourceStart = javaAstPosition(
    sourceRange?.start ?? sourceRange?.offset ?? sourceRange?.startPosition,
    options
  );
  const sourceEnd = javaAstPosition(
    typeof sourceRange?.offset === 'number' && typeof sourceRange?.length === 'number'
      ? sourceRange.offset + sourceRange.length
      : sourceRange?.end ?? sourceRange?.endPosition,
    options
  );
  const resolvedStart = start ?? sourceStart;
  const resolvedEnd = end ?? sourceEnd;
  if (!resolvedStart) return undefined;
  return {
    sourceId: input.sourceHash,
    path: resolvedStart.path ?? resolvedEnd?.path ?? input.sourcePath,
    startLine: resolvedStart.line,
    startColumn: resolvedStart.column,
    endLine: resolvedEnd?.line,
    endColumn: resolvedEnd?.column
  };
}
