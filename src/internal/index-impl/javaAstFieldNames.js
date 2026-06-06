import{javaAstDeclarationName}from'./javaAstDeclarationName.js';
export function javaAstFieldNames(node) {
  const fragments = node.variables ?? node.fragments ?? node.declarators ?? node.variableDeclarators;
  if (Array.isArray(fragments)) return fragments.map(javaAstDeclarationName).filter(Boolean);
  const name = javaAstDeclarationName(node);
  return name ? [name] : [];
}
