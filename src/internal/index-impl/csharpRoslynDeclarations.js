import{csharpRoslynDeclarationName}from'./csharpRoslynDeclarationName.js';import{csharpRoslynHasBody}from'./csharpRoslynHasBody.js';import{csharpRoslynMethodLikeKind}from'./csharpRoslynMethodLikeKind.js';import{csharpRoslynOperatorName}from'./csharpRoslynOperatorName.js';import{csharpRoslynTypeDeclarationKind}from'./csharpRoslynTypeDeclarationKind.js';import{csharpRoslynTypeDeclarationSymbolKind}from'./csharpRoslynTypeDeclarationSymbolKind.js';import{csharpRoslynUsingPath}from'./csharpRoslynUsingPath.js';import{csharpRoslynVariableNames}from'./csharpRoslynVariableNames.js';import{declarationRecord}from'./declarationRecord.js';import{nativeNodeId}from'./nativeNodeId.js';
export function csharpRoslynDeclarations(node, kind, nativeNodeId, input) {
  if (kind === 'UsingDirective') {
    const name = csharpRoslynUsingPath(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'module', 'import')] : [];
  }
  if (kind === 'NamespaceDeclaration' || kind === 'FileScopedNamespaceDeclaration') {
    const name = csharpRoslynDeclarationName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'namespace', 'definition')] : [];
  }
  if (csharpRoslynTypeDeclarationKind(kind)) {
    const name = csharpRoslynDeclarationName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, csharpRoslynTypeDeclarationSymbolKind(kind), 'definition')] : [];
  }
  if (kind === 'DelegateDeclaration') {
    const name = csharpRoslynDeclarationName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'type', 'definition')] : [];
  }
  if (csharpRoslynMethodLikeKind(kind)) {
    const name = csharpRoslynDeclarationName(node) ?? csharpRoslynOperatorName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, 'method', csharpRoslynHasBody(node) ? 'definition' : 'declaration')] : [];
  }
  if (kind === 'PropertyDeclaration' || kind === 'IndexerDeclaration') {
    const name = csharpRoslynDeclarationName(node) ?? (kind === 'IndexerDeclaration' ? 'this[]' : undefined);
    return name ? [declarationRecord(input, nativeNodeId, name, 'property', 'definition')] : [];
  }
  if (kind === 'FieldDeclaration') {
    return csharpRoslynVariableNames(node).map((name) => declarationRecord(input, nativeNodeId, name, 'property', 'definition'));
  }
  if (kind === 'EventDeclaration') {
    const name = csharpRoslynDeclarationName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'event', 'definition')] : [];
  }
  if (kind === 'EventFieldDeclaration') {
    return csharpRoslynVariableNames(node).map((name) => declarationRecord(input, nativeNodeId, name, 'event', 'definition'));
  }
  if (kind === 'VariableDeclarator') {
    if (node.parentKind === 'FieldDeclaration') {
      const name = csharpRoslynDeclarationName(node);
      return name ? [declarationRecord(input, nativeNodeId, name, 'property', 'definition')] : [];
    }
    if (node.parentKind === 'EventFieldDeclaration') {
      const name = csharpRoslynDeclarationName(node);
      return name ? [declarationRecord(input, nativeNodeId, name, 'event', 'definition')] : [];
    }
    return [];
  }
  if (kind === 'EnumMemberDeclaration') {
    const name = csharpRoslynDeclarationName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'enumMember', 'definition')] : [];
  }
  return [];
}
