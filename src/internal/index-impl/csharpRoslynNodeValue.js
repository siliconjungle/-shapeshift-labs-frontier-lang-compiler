import{csharpRoslynDeclarationName}from'./csharpRoslynDeclarationName.js';import{csharpRoslynLiteralValue}from'./csharpRoslynLiteralValue.js';import{csharpRoslynTypeName}from'./csharpRoslynTypeName.js';import{csharpRoslynUsingPath}from'./csharpRoslynUsingPath.js';
export function csharpRoslynNodeValue(node) {
  return csharpRoslynDeclarationName(node)
    ?? csharpRoslynUsingPath(node)
    ?? csharpRoslynTypeName(node.type ?? node.returnType)
    ?? csharpRoslynLiteralValue(node);
}
