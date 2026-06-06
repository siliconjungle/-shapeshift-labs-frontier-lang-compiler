export function identifierName(node) {
  if (!node) return undefined;
  if (typeof node === 'string') return node;
  if (typeof node.name === 'string') return node.name;
  if (typeof node.escapedText === 'string') return node.escapedText;
  if (typeof node.text === 'string') return node.text;
  if (node.type === 'Identifier' && typeof node.value === 'string') return node.value;
  return undefined;
}
