export function clangLiteralValue(node) {
  const value = node.value ?? node.val ?? node.literal;
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof node.valueAsString === 'string') return node.valueAsString;
  return undefined;
}
