import{csharpRoslynName}from'./csharpRoslynName.js';
export function csharpRoslynDeclarationName(node) {
  if (!node || typeof node !== 'object') return undefined;
  for (const key of ['identifier', 'name', 'simpleName', 'qualifiedName', 'id']) {
    const value = node[key];
    const name = csharpRoslynName(value);
    if (name) return name;
  }
  if (node.declaration && typeof node.declaration === 'object') return csharpRoslynDeclarationName(node.declaration);
  return undefined;
}
