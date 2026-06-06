import{csharpRoslynDeclarationName}from'./csharpRoslynDeclarationName.js';import{csharpRoslynName}from'./csharpRoslynName.js';import{csharpRoslynTypeName}from'./csharpRoslynTypeName.js';
export function csharpRoslynOperatorName(node, kind) {
  if (kind === 'ConstructorDeclaration') return csharpRoslynDeclarationName(node);
  if (kind === 'DestructorDeclaration') return `~${csharpRoslynDeclarationName(node) ?? 'destructor'}`;
  if (kind === 'OperatorDeclaration') return `operator ${csharpRoslynName(node.operatorToken) ?? csharpRoslynName(node.operatorKeyword) ?? 'operator'}`;
  if (kind === 'ConversionOperatorDeclaration') return `operator ${csharpRoslynTypeName(node.type) ?? 'conversion'}`;
  return undefined;
}
