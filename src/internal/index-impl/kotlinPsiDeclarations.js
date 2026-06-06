import{declarationRecord}from'./declarationRecord.js';import{kotlinPsiDeclarationName}from'./kotlinPsiDeclarationName.js';import{kotlinPsiHasBody}from'./kotlinPsiHasBody.js';import{kotlinPsiImportPath}from'./kotlinPsiImportPath.js';import{kotlinPsiPackageName}from'./kotlinPsiPackageName.js';import{kotlinPsiTypeDeclarationKind}from'./kotlinPsiTypeDeclarationKind.js';import{kotlinPsiTypeDeclarationSymbolKind}from'./kotlinPsiTypeDeclarationSymbolKind.js';import{kotlinPsiVariableNames}from'./kotlinPsiVariableNames.js';import{nativeNodeId}from'./nativeNodeId.js';
export function kotlinPsiDeclarations(node, kind, nativeNodeId, input) {
  if (kind === 'KtPackageDirective') {
    const name = kotlinPsiPackageName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'namespace', 'definition')] : [];
  }
  if (kind === 'KtImportDirective') {
    const name = kotlinPsiImportPath(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'module', 'import')] : [];
  }
  if (kotlinPsiTypeDeclarationKind(kind)) {
    const name = kotlinPsiDeclarationName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, kotlinPsiTypeDeclarationSymbolKind(node, kind), 'definition')] : [];
  }
  if (kind === 'KtTypeAlias') {
    const name = kotlinPsiDeclarationName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, 'type', 'definition')] : [];
  }
  if (kind === 'KtNamedFunction') {
    const name = kotlinPsiDeclarationName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, node.parentKind && kotlinPsiTypeDeclarationKind(node.parentKind) ? 'method' : 'function', kotlinPsiHasBody(node) ? 'definition' : 'declaration')] : [];
  }
  if (kind === 'KtProperty') {
    return kotlinPsiVariableNames(node).map((name) => declarationRecord(input, nativeNodeId, name, 'property', 'definition'));
  }
  if (kind === 'KtParameter' && node.parentKind === 'KtPrimaryConstructor') {
    return kotlinPsiVariableNames(node).map((name) => declarationRecord(input, nativeNodeId, name, 'property', 'definition'));
  }
  if (kind === 'KtPrimaryConstructor' || kind === 'KtSecondaryConstructor') {
    return [declarationRecord(input, nativeNodeId, kotlinPsiDeclarationName(node, kind) ?? 'constructor', 'method', 'definition')];
  }
  if (kind === 'KtEnumEntry') {
    const name = kotlinPsiDeclarationName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, 'enumMember', 'definition')] : [];
  }
  return [];
}
