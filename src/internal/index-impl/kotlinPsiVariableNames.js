import{kotlinPsiDeclarationName}from'./kotlinPsiDeclarationName.js';import{kotlinPsiName}from'./kotlinPsiName.js';
export function kotlinPsiVariableNames(node) {
  const variables = node.variables ?? node.entries ?? node.declarations;
  if (Array.isArray(variables)) return variables.map(kotlinPsiDeclarationName).filter(Boolean);
  const name = kotlinPsiName(node.nameIdentifier ?? node.identifier ?? node.name);
  return name ? [name] : [];
}
