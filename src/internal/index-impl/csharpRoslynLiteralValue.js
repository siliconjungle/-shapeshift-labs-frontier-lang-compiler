export function csharpRoslynLiteralValue(node) {
  const value = node.value ?? node.literal;
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  return undefined;
}
