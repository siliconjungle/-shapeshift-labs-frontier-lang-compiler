import{declarationRecord}from'./declarationRecord.js';import{namedDeclaration}from'./namedDeclaration.js';import{nativeNodeId}from'./nativeNodeId.js';import{stringFromTsExpression}from'./stringFromTsExpression.js';
export function typeScriptDeclaration(node, kind, nativeNodeId, input) {
  if (kind === 'ImportDeclaration' || kind === 'ImportEqualsDeclaration') {
    const name = stringFromTsExpression(node.moduleSpecifier) ?? stringFromTsExpression(node.externalModuleReference?.expression);
    if (name) return declarationRecord(input, nativeNodeId, name, 'module', 'import');
  }
  if (kind === 'FunctionDeclaration') return namedDeclaration(input, nativeNodeId, node.name, 'function');
  if (kind === 'ClassDeclaration') return namedDeclaration(input, nativeNodeId, node.name, 'class');
  if (kind === 'InterfaceDeclaration') return namedDeclaration(input, nativeNodeId, node.name, 'interface');
  if (kind === 'TypeAliasDeclaration' || kind === 'EnumDeclaration') return namedDeclaration(input, nativeNodeId, node.name, 'type');
  if (kind === 'VariableDeclaration') return namedDeclaration(input, nativeNodeId, node.name, 'variable');
  if (kind === 'MethodDeclaration' || kind === 'MethodSignature') return namedDeclaration(input, nativeNodeId, node.name, 'method');
  return undefined;
}
