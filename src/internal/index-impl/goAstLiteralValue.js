export function goAstLiteralValue(node) {
  const value = node.Value ?? node.value;
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  return undefined;
}
