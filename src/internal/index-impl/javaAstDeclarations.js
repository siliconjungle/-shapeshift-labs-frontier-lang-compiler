import{declarationRecord}from'./declarationRecord.js';import{javaAstDeclarationName}from'./javaAstDeclarationName.js';import{javaAstFieldNames}from'./javaAstFieldNames.js';import{javaAstHasBody}from'./javaAstHasBody.js';import{javaAstImportPath}from'./javaAstImportPath.js';import{javaAstPackageName}from'./javaAstPackageName.js';import{javaTypeDeclarationKind}from'./javaTypeDeclarationKind.js';import{javaTypeDeclarationSymbolKind}from'./javaTypeDeclarationSymbolKind.js';import{nativeNodeId}from'./nativeNodeId.js';
export function javaAstDeclarations(node, kind, nativeNodeId, input) {
  if (kind === 'PackageDeclaration') {
    const name = javaAstPackageName(node) ?? javaAstDeclarationName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'module', 'definition')] : [];
  }
  if (kind === 'ImportDeclaration') {
    const name = javaAstImportPath(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'module', 'import')] : [];
  }
  if (javaTypeDeclarationKind(kind)) {
    const name = javaAstDeclarationName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, javaTypeDeclarationSymbolKind(kind), 'definition')] : [];
  }
  if (kind === 'MethodDeclaration' || kind === 'ConstructorDeclaration') {
    const name = javaAstDeclarationName(node);
    if (!name) return [];
    return [declarationRecord(input, nativeNodeId, name, 'method', javaAstHasBody(node) ? 'definition' : 'declaration')];
  }
  if (kind === 'FieldDeclaration') {
    return javaAstFieldNames(node).map((name) => declarationRecord(input, nativeNodeId, name, 'property', 'definition'));
  }
  if (kind === 'VariableDeclarator') {
    if (node.parentField === 'parameters' || node.parentKind === 'MethodDeclaration' || node.parentKind === 'ConstructorDeclaration') return [];
    const name = javaAstDeclarationName(node);
    if (!name) return [];
    const symbolKind = node.parentKind === 'FieldDeclaration' || javaTypeDeclarationKind(node.parentKind) ? 'property' : 'variable';
    return [declarationRecord(input, nativeNodeId, name, symbolKind, 'definition')];
  }
  if (kind === 'EnumConstantDeclaration') {
    const name = javaAstDeclarationName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'enumMember', 'definition')] : [];
  }
  return [];
}
