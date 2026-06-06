import{clangDeclarationName}from'./clangDeclarationName.js';import{clangIncludePath}from'./clangIncludePath.js';import{clangLiteralValue}from'./clangLiteralValue.js';import{clangTypeName}from'./clangTypeName.js';
export function clangAstNodeValue(node) {
  return clangDeclarationName(node)
    ?? clangIncludePath(node)
    ?? clangTypeName(node.type ?? node.qualType)
    ?? clangLiteralValue(node);
}
