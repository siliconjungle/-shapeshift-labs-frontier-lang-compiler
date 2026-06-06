export function clangIncludePath(node) {
  if (!node || typeof node !== 'object') return undefined;
  for (const key of ['file', 'filename', 'path', 'spelling', 'source']) {
    if (typeof node[key] === 'string' && node[key]) return node[key];
  }
  if (node.include && typeof node.include === 'object') return clangIncludePath(node.include);
  return undefined;
}
