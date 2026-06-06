import{csharpRoslynPosition}from'./csharpRoslynPosition.js';import{spanFromCSharpLineFields}from'./spanFromCSharpLineFields.js';import{spanFromCSharpLineSpan}from'./spanFromCSharpLineSpan.js';
export function spanFromCSharpRoslynNode(node, input, options = {}) {
  const lineSpan = node.lineSpan ?? node.location?.lineSpan ?? node.location?.LineSpan ?? node.FileLinePositionSpan;
  const fromLineSpan = spanFromCSharpLineSpan(lineSpan, input);
  if (fromLineSpan) return fromLineSpan;
  const direct = spanFromCSharpLineFields(node, input);
  if (direct) return direct;
  const start = csharpRoslynPosition(node.start ?? node.Start ?? node.span?.start ?? node.Span?.Start ?? node.position, options);
  const end = csharpRoslynPosition(node.end ?? node.End ?? node.span?.end ?? node.Span?.End, options);
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
