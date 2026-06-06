import{javaAstName}from'./javaAstName.js';
export function javaAstDeclarationName(node) {
  if (!node || typeof node !== 'object') return undefined;
  for (const key of ['name', 'identifier', 'simpleName', 'qualifiedName', 'id']) {
    const value = node[key];
    const name = javaAstName(value);
    if (name) return name;
  }
  if (node.declaration && typeof node.declaration === 'object') return javaAstDeclarationName(node.declaration);
  return undefined;
}
