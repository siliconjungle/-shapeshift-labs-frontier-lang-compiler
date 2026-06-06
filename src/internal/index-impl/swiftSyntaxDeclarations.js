import{declarationRecord}from'./declarationRecord.js';import{nativeNodeId}from'./nativeNodeId.js';import{swiftSyntaxDeclarationName}from'./swiftSyntaxDeclarationName.js';import{swiftSyntaxEnumCaseNames}from'./swiftSyntaxEnumCaseNames.js';import{swiftSyntaxFunctionLikeKind}from'./swiftSyntaxFunctionLikeKind.js';import{swiftSyntaxHasBody}from'./swiftSyntaxHasBody.js';import{swiftSyntaxImportPath}from'./swiftSyntaxImportPath.js';import{swiftSyntaxOperatorName}from'./swiftSyntaxOperatorName.js';import{swiftSyntaxTypeDeclarationKind}from'./swiftSyntaxTypeDeclarationKind.js';import{swiftSyntaxTypeDeclarationSymbolKind}from'./swiftSyntaxTypeDeclarationSymbolKind.js';import{swiftSyntaxVariableNames}from'./swiftSyntaxVariableNames.js';
export function swiftSyntaxDeclarations(node, kind, nativeNodeId, input) {
  if (kind === 'ImportDecl') {
    const name = swiftSyntaxImportPath(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'module', 'import')] : [];
  }
  if (swiftSyntaxTypeDeclarationKind(kind)) {
    const name = swiftSyntaxDeclarationName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, swiftSyntaxTypeDeclarationSymbolKind(kind), 'definition')] : [];
  }
  if (kind === 'ExtensionDecl') {
    const name = swiftSyntaxDeclarationName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, 'type', 'definition')] : [];
  }
  if (kind === 'TypeAliasDecl' || kind === 'AssociatedTypeDecl') {
    const name = swiftSyntaxDeclarationName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, 'type', 'definition')] : [];
  }
  if (swiftSyntaxFunctionLikeKind(kind)) {
    const name = swiftSyntaxDeclarationName(node, kind) ?? swiftSyntaxOperatorName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, kind === 'FunctionDecl' ? 'function' : 'method', swiftSyntaxHasBody(node) ? 'definition' : 'declaration')] : [];
  }
  if (kind === 'VariableDecl') {
    return swiftSyntaxVariableNames(node).map((name) => declarationRecord(input, nativeNodeId, name, 'property', 'definition'));
  }
  if (kind === 'PatternBinding' && node.parentKind === 'VariableDecl') {
    const name = swiftSyntaxDeclarationName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, 'property', 'definition')] : [];
  }
  if (kind === 'EnumCaseDecl') {
    return swiftSyntaxEnumCaseNames(node).map((name) => declarationRecord(input, nativeNodeId, name, 'enumMember', 'definition'));
  }
  if (kind === 'EnumCaseElement') {
    const name = swiftSyntaxDeclarationName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, 'enumMember', 'definition')] : [];
  }
  return [];
}
