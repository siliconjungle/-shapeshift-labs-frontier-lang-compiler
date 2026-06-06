import{spanFromSwiftLineFields}from'./spanFromSwiftLineFields.js';import{spanFromSwiftRange}from'./spanFromSwiftRange.js';import{swiftSyntaxPosition}from'./swiftSyntaxPosition.js';
export function spanFromSwiftSyntaxNode(node, input, options = {}) {
  const direct = spanFromSwiftLineFields(node, input);
  if (direct) return direct;
  const range = node.sourceRange ?? node.range ?? node.span;
  const fromRange = spanFromSwiftRange(range, input);
  if (fromRange) return fromRange;
  const start = swiftSyntaxPosition(node.position ?? node.absolutePosition ?? node.start ?? range?.start, options);
  const end = swiftSyntaxPosition(node.endPosition ?? node.end ?? range?.end, options);
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
