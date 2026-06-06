export function javaAstLiteralValue(node) {
  const value = node.value ?? node.literal ?? node.token;
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  return undefined;
}
