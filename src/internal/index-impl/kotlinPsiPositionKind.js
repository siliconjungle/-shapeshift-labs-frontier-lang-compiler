export function kotlinPsiPositionKind(node) {
  if (node.textRange || node.range) return 'text-range';
  if (typeof node.startOffset === 'number') return 'offset';
  if (typeof node.startLine === 'number' || typeof node.line === 'number') return 'line-column-fields';
  return undefined;
}
