import{csharpRoslynName}from'./csharpRoslynName.js';
export function csharpRoslynUsingPath(node) {
  if (!node || typeof node !== 'object') return undefined;
  return csharpRoslynName(node.name ?? node.Name ?? node.qualifiedName ?? node.path);
}
