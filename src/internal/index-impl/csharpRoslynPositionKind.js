export function csharpRoslynPositionKind(node) {
  if (node.lineSpan || node.location?.lineSpan) return 'line-position-span';
  if (node.span || node.Span) return 'text-span';
  if (typeof node.startLine === 'number' || typeof node.line === 'number') return 'line-column-fields';
  return undefined;
}
