export function swiftSyntaxPositionKind(node) {
  if (node.sourceRange || node.range) return 'source-range';
  if (node.position || node.absolutePosition) return 'absolute-position';
  if (typeof node.startLine === 'number' || typeof node.line === 'number') return 'line-column-fields';
  return undefined;
}
