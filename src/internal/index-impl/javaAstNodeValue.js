import{javaAstDeclarationName}from'./javaAstDeclarationName.js';import{javaAstImportPath}from'./javaAstImportPath.js';import{javaAstLiteralValue}from'./javaAstLiteralValue.js';import{javaAstPackageName}from'./javaAstPackageName.js';import{javaAstTypeName}from'./javaAstTypeName.js';
export function javaAstNodeValue(node) {
  return javaAstDeclarationName(node)
    ?? javaAstImportPath(node)
    ?? javaAstPackageName(node)
    ?? javaAstTypeName(node.type ?? node.returnType ?? node.elementType)
    ?? javaAstLiteralValue(node);
}
