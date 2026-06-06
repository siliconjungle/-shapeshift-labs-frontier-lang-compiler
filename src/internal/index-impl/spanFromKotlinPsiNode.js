import{kotlinPsiPosition}from'./kotlinPsiPosition.js';import{spanFromKotlinLineFields}from'./spanFromKotlinLineFields.js';import{spanFromKotlinRange}from'./spanFromKotlinRange.js';
export function spanFromKotlinPsiNode(node, input, options = {}) {
  const direct = spanFromKotlinLineFields(node, input);
  if (direct) return direct;
  const range = node.sourceRange ?? node.range ?? node.span ?? node.textRange;
  const fromRange = spanFromKotlinRange(range, input);
  if (fromRange) return fromRange;
  const start = kotlinPsiPosition(node.start ?? node.startOffset ?? range?.startOffset ?? range?.start, options);
  const end = kotlinPsiPosition(node.end ?? node.endOffset ?? range?.endOffset ?? range?.end, options);
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
