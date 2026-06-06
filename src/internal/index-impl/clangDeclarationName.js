export function clangDeclarationName(node) {
  if (!node || typeof node !== 'object') return undefined;
  for (const key of ['qualifiedName', 'displayName', 'name', 'mangledName']) {
    if (typeof node[key] === 'string' && node[key]) return node[key];
  }
  if (node.name && typeof node.name === 'object') return clangDeclarationName(node.name);
  if (node.referencedDecl && typeof node.referencedDecl === 'object') return clangDeclarationName(node.referencedDecl);
  if (node.decl && typeof node.decl === 'object') return clangDeclarationName(node.decl);
  return undefined;
}
