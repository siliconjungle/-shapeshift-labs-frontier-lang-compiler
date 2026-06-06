import{goAstTokenName}from'./goAstTokenName.js';import{ignoredGoAstField}from'./ignoredGoAstField.js';import{isGoAstNode}from'./isGoAstNode.js';
export function goAstChildEntries(node) {
  const fieldNames = Object.keys(node).filter((key) => !ignoredGoAstField(key));
  const entries = [];
  for (const field of fieldNames) {
    const value = node[field];
    if (field === 'Files' || field === 'files') {
      if (value && typeof value === 'object') entries.push([field, Array.isArray(value) ? value : Object.values(value)]);
      continue;
    }
    if (field === 'Specs' || field === 'specs') {
      const token = goAstTokenName(node.Tok ?? node.tok);
      entries.push([field, Array.isArray(value)
        ? value.map((entry) => entry && typeof entry === 'object' ? { parentTok: token, ...entry } : entry)
        : value]);
      continue;
    }
    entries.push([field, value]);
  }
  return entries.filter(([, value]) => Array.isArray(value)
    ? value.some(isGoAstNode)
    : isGoAstNode(value));
}
