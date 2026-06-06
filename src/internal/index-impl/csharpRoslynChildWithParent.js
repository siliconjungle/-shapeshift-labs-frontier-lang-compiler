import{isCSharpRoslynNode}from'./isCSharpRoslynNode.js';
export function csharpRoslynChildWithParent(entry, parentKind, parentField) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return entry;
  if (!isCSharpRoslynNode(entry)) return entry;
  return { parentKind, parentField, ...entry };
}
