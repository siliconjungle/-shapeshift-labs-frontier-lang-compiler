export function javaAstPositionKind(node) {
  if (node.range?.begin || node.loc?.start) return 'line-column-range';
  if (typeof node.startLine === 'number' || typeof node.line === 'number') return 'line-column-fields';
  if (node.pos !== undefined || node.startPosition !== undefined) return 'offset-position';
  if (node.sourceRange) return 'source-range';
  return undefined;
}
