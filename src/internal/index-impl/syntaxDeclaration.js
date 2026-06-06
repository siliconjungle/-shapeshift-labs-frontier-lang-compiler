import{declarationRecord}from'./declarationRecord.js';import{namedDeclaration}from'./namedDeclaration.js';import{nativeNodeId}from'./nativeNodeId.js';
export function syntaxDeclaration(node, nativeNodeId, input) {
  const kind = String(node.type ?? node.kind ?? '');
  if (kind === 'ImportDeclaration') {
    const name = node.source?.value;
    if (typeof name === 'string') return declarationRecord(input, nativeNodeId, name, 'module', 'import');
  }
  if (kind === 'ExportNamedDeclaration' || kind === 'ExportAllDeclaration') {
    const name = node.source?.value;
    if (typeof name === 'string') return declarationRecord(input, nativeNodeId, name, 'module', 'export');
  }
  if (kind === 'FunctionDeclaration') return namedDeclaration(input, nativeNodeId, node.id, 'function');
  if (kind === 'ClassDeclaration') return namedDeclaration(input, nativeNodeId, node.id, 'class');
  if (kind === 'TSInterfaceDeclaration' || kind === 'InterfaceDeclaration') return namedDeclaration(input, nativeNodeId, node.id, 'interface');
  if (kind === 'TSTypeAliasDeclaration' || kind === 'TypeAliasDeclaration') return namedDeclaration(input, nativeNodeId, node.id, 'type');
  if (kind === 'VariableDeclarator') return namedDeclaration(input, nativeNodeId, node.id, 'variable');
  return undefined;
}
