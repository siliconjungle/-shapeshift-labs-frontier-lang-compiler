export function pythonAstLiteralValue(node) {
  if (node.value === null || typeof node.value === 'string' || typeof node.value === 'number' || typeof node.value === 'boolean') return node.value;
  if (typeof node.s === 'string' || typeof node.s === 'number') return node.s;
  if (typeof node.n === 'number') return node.n;
  return undefined;
}
