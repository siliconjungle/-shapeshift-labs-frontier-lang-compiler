import{swiftSyntaxDeclarationName}from'./swiftSyntaxDeclarationName.js';import{swiftSyntaxImportPath}from'./swiftSyntaxImportPath.js';import{swiftSyntaxKind}from'./swiftSyntaxKind.js';import{swiftSyntaxLiteralValue}from'./swiftSyntaxLiteralValue.js';import{swiftSyntaxTypeName}from'./swiftSyntaxTypeName.js';
export function swiftSyntaxNodeValue(node) {
  return swiftSyntaxDeclarationName(node, swiftSyntaxKind(node))
    ?? swiftSyntaxImportPath(node)
    ?? swiftSyntaxTypeName(node.type ?? node.returnClause?.type ?? node.extendedType)
    ?? swiftSyntaxLiteralValue(node);
}
