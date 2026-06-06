import{declarationRecord}from'./declarationRecord.js';import{identifierName}from'./identifierName.js';import{nativeNodeId}from'./nativeNodeId.js';
export function namedDeclaration(input, nativeNodeId, nameNode, symbolKind) {
  const name = identifierName(nameNode);
  return name ? declarationRecord(input, nativeNodeId, name, symbolKind, 'definition') : undefined;
}
