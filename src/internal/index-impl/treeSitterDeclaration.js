import{declarationRecord}from'./declarationRecord.js';import{shortNodeText}from'./shortNodeText.js';import{treeSitterChildText,treeSitterFieldText}from'./treeSitterNodeAccess.js';
export function treeSitterDeclaration(node, kind, nativeNodeId, input) {
  if (/import|include|use/.test(kind)) {
    const name = treeSitterNamedText(node, ['string', 'string_fragment', 'identifier']) ?? shortNodeText(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'module', 'import');
  }
  if (/function|method|fn_item|function_declaration/.test(kind)) {
    const name = treeSitterNamedText(node, ['identifier', 'property_identifier']);
    if (name) return declarationRecord(input, nativeNodeId, name, 'function', 'definition');
  }
  if (/class/.test(kind)) {
    const name = treeSitterNamedText(node, ['type_identifier', 'identifier']);
    if (name) return declarationRecord(input, nativeNodeId, name, 'class', 'definition');
  }
  if (/interface/.test(kind)) {
    const name = treeSitterNamedText(node, ['type_identifier', 'identifier']);
    if (name) return declarationRecord(input, nativeNodeId, name, 'interface', 'definition');
  }
  if (/struct|enum|type/.test(kind)) {
    const name = treeSitterNamedText(node, ['type_identifier', 'identifier']);
    if (name) return declarationRecord(input, nativeNodeId, name, 'type', 'definition');
  }
  if (/variable_declarator|property_declaration|field_declaration/.test(kind)) {
    const name = treeSitterNamedText(node, ['identifier', 'property_identifier', 'field_identifier']);
    if (name) return declarationRecord(input, nativeNodeId, name, 'variable', 'definition');
  }
  return undefined;
}

function treeSitterNamedText(node, childKinds) {
  return treeSitterFieldText(node, 'name') ?? treeSitterFieldText(node, 'declarator') ?? treeSitterChildText(node, childKinds);
}
