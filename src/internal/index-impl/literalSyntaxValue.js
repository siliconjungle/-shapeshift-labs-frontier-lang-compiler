export function literalSyntaxValue(node) {
  if (node.value === null || typeof node.value === 'string' || typeof node.value === 'number' || typeof node.value === 'boolean') return node.value;
  return undefined;
}
