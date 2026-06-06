import{goAstDeclarationName}from'./goAstDeclarationName.js';import{goAstIdentName}from'./goAstIdentName.js';
export function goAstValueSpecNames(node) {
  const names = node.Names ?? node.names;
  if (Array.isArray(names)) return names.map(goAstIdentName).filter(Boolean);
  const name = goAstDeclarationName(node);
  return name ? [name] : [];
}
