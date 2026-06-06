export function rustSynLiteralValue(node) {
  const value = node.value ?? node.lit?.value ?? node.lit;
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  return undefined;
}
