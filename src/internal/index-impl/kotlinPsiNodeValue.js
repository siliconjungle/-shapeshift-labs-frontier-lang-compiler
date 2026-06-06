import{kotlinPsiDeclarationName}from'./kotlinPsiDeclarationName.js';import{kotlinPsiImportPath}from'./kotlinPsiImportPath.js';import{kotlinPsiKind}from'./kotlinPsiKind.js';import{kotlinPsiPackageName}from'./kotlinPsiPackageName.js';import{kotlinPsiTypeName}from'./kotlinPsiTypeName.js';
export function kotlinPsiNodeValue(node) {
  return kotlinPsiDeclarationName(node, kotlinPsiKind(node))
    ?? kotlinPsiImportPath(node)
    ?? kotlinPsiPackageName(node)
    ?? kotlinPsiTypeName(node.typeReference ?? node.returnTypeRef ?? node.type);
}
