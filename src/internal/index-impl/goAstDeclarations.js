import{declarationRecord}from'./declarationRecord.js';import{goAstDeclarationName}from'./goAstDeclarationName.js';import{goAstImportPath}from'./goAstImportPath.js';import{goAstPackageName}from'./goAstPackageName.js';import{goAstReceiverName}from'./goAstReceiverName.js';import{goAstTokenName}from'./goAstTokenName.js';import{goAstTypeSpecSymbolKind}from'./goAstTypeSpecSymbolKind.js';import{goAstValueSpecNames}from'./goAstValueSpecNames.js';import{nativeNodeId}from'./nativeNodeId.js';
export function goAstDeclarations(node, kind, nativeNodeId, input) {
  if (kind === 'ImportSpec') {
    const name = goAstImportPath(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'module', 'import')] : [];
  }
  if (kind === 'FuncDecl') {
    const name = goAstDeclarationName(node);
    if (!name) return [];
    const receiver = goAstReceiverName(node);
    return [declarationRecord(input, nativeNodeId, receiver ? `${receiver}.${name}` : name, receiver ? 'method' : 'function', node.Body || node.body ? 'definition' : 'declaration')];
  }
  if (kind === 'TypeSpec') {
    const name = goAstDeclarationName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, goAstTypeSpecSymbolKind(node), 'definition')] : [];
  }
  if (kind === 'ValueSpec') {
    const names = goAstValueSpecNames(node);
    const token = goAstTokenName(node.parentTok ?? node.Tok ?? node.tok);
    return names.map((name) => declarationRecord(input, nativeNodeId, name, token === 'CONST' || token === 'const' ? 'constant' : 'variable', 'definition'));
  }
  if (kind === 'Field') {
    return goAstValueSpecNames(node).map((name) => declarationRecord(input, nativeNodeId, name, 'property', 'definition'));
  }
  if (kind === 'Package' || kind === 'File') {
    const name = goAstPackageName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'module', 'definition')] : [];
  }
  return [];
}
