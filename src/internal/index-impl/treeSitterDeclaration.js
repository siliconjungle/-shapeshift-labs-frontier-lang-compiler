import{declarationRecord}from'./declarationRecord.js';import{nativeNodeId}from'./nativeNodeId.js';import{shortNodeText}from'./shortNodeText.js';import{treeSitterFieldText}from'./treeSitterFieldText.js';
export function treeSitterDeclaration(node, kind, nativeNodeId, input) {
  if (/import|include|use/.test(kind)) {
    const name = treeSitterFieldText(node, 'path') ?? treeSitterFieldText(node, 'source') ?? shortNodeText(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'module', 'import');
  }
  if (/function|method|fn_item|function_declaration/.test(kind)) {
    const name = treeSitterFieldText(node, 'name');
    if (name) return declarationRecord(input, nativeNodeId, name, 'function', 'definition');
  }
  if (/class/.test(kind)) {
    const name = treeSitterFieldText(node, 'name');
    if (name) return declarationRecord(input, nativeNodeId, name, 'class', 'definition');
  }
  if (/interface/.test(kind)) {
    const name = treeSitterFieldText(node, 'name');
    if (name) return declarationRecord(input, nativeNodeId, name, 'interface', 'definition');
  }
  if (/struct|enum|type/.test(kind)) {
    const name = treeSitterFieldText(node, 'name');
    if (name) return declarationRecord(input, nativeNodeId, name, 'type', 'definition');
  }
  return undefined;
}
