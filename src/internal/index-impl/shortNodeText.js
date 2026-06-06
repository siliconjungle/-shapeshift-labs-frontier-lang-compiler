export function shortNodeText(node) {
  if (!node || typeof node.text !== 'string') return undefined;
  const text = node.text.trim();
  if (!text || text.length > 160) return undefined;
  return text.replace(/^['"]|['"]$/g, '');
}
