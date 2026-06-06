import{goAstDeclarationName}from'./goAstDeclarationName.js';import{goAstImportPath}from'./goAstImportPath.js';import{goAstLiteralValue}from'./goAstLiteralValue.js';import{goAstTypeName}from'./goAstTypeName.js';
export function goAstNodeValue(node) {
  return goAstDeclarationName(node)
    ?? goAstImportPath(node)
    ?? goAstTypeName(node.Type ?? node.type)
    ?? goAstLiteralValue(node);
}
