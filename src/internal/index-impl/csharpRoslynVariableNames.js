import{csharpRoslynDeclarationName}from'./csharpRoslynDeclarationName.js';
export function csharpRoslynVariableNames(node) {
  const variables = node.variables
    ?? node.declaration?.variables
    ?? node.Declaration?.Variables
    ?? node.variableDeclarators;
  if (Array.isArray(variables)) return variables.map(csharpRoslynDeclarationName).filter(Boolean);
  const name = csharpRoslynDeclarationName(node);
  return name ? [name] : [];
}
