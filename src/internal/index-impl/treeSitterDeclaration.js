import{declarationRecord}from'./declarationRecord.js';import{shortNodeText}from'./shortNodeText.js';import{treeSitterChildText,treeSitterFieldKind,treeSitterFieldText}from'./treeSitterNodeAccess.js';
export function treeSitterDeclaration(node, kind, nativeNodeId, input) {
  if (kind === 'variable_declarator') {
    const name = treeSitterNamedText(node, ['identifier', 'property_identifier', 'private_property_identifier']);
    if (name) return declarationRecord(input, nativeNodeId, name, treeSitterVariableSymbolKind(node), 'definition');
  }
  if (kind === 'method_definition') {
    const name = treeSitterNamedText(node, ['property_identifier', 'private_property_identifier', 'identifier']);
    if (name) return declarationRecord(input, nativeNodeId, name, 'method', 'definition');
  }
  if (/import|include|use/.test(kind)) {
    const name = treeSitterImportName(node, kind);
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
  if (/property_declaration|field_declaration/.test(kind)) {
    const name = treeSitterNamedText(node, ['identifier', 'property_identifier', 'field_identifier', 'private_property_identifier']);
    if (name) return declarationRecord(input, nativeNodeId, name, 'variable', 'definition');
  }
  return undefined;
}

function treeSitterNamedText(node, childKinds) {
  return treeSitterFieldText(node, 'name') ?? treeSitterFieldText(node, 'declarator') ?? treeSitterChildText(node, childKinds);
}

function treeSitterImportName(node, kind) {
  const fieldName = treeSitterFieldText(node, 'path') ?? treeSitterFieldText(node, 'source');
  if (fieldName || /import/.test(kind)) return fieldName;
  return treeSitterNamedText(node, ['string', 'string_fragment', 'identifier']) ?? shortNodeText(node);
}

function treeSitterVariableSymbolKind(node) {
  const valueKind = String(treeSitterFieldKind(node, 'value') ?? '');
  return /function|arrow_function|generator/.test(valueKind) ? 'function' : 'variable';
}
