export function goAstImportPath(node) {
  if (!node || typeof node !== 'object') return undefined;
  const path = node.Path ?? node.path;
  const raw = typeof path === 'string' ? path : path?.Value ?? path?.value ?? path?.Kind;
  if (typeof raw !== 'string') return undefined;
  return raw.replace(/^"|"$/g, '').replace(/^`|`$/g, '');
}
