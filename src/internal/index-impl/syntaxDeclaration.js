import{declarationRecord}from'./declarationRecord.js';import{namedDeclaration}from'./namedDeclaration.js';import{nativeNodeId}from'./nativeNodeId.js';import{syntaxModuleDeclarationEntries}from'./syntaxModuleDeclarationEntries.js';
export function syntaxDeclaration(node, nativeNodeId, input) {
  const kind = String(node.type ?? node.kind ?? '');
  const moduleEntries = syntaxModuleDeclarationEntries(node, nativeNodeId, input);
  if (moduleEntries.length) return moduleEntries.map((entry) => entry.declaration);
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
  if (kind === 'TSModuleDeclaration' || kind === 'ModuleDeclaration') return syntaxModuleDeclaration(input, nativeNodeId, node);
  if (kind === 'VariableDeclarator') return namedDeclaration(input, nativeNodeId, node.id, 'variable');
  return undefined;
}

function syntaxModuleDeclaration(input, nativeNodeId, node) {
  const name = syntaxName(node.id ?? node.name);
  if (!name) return undefined;
  return {
    ...declarationRecord(input, nativeNodeId, name, 'module', 'definition'),
    metadata: {
      scan: 'syntax-module-declaration',
      moduleName: name,
      namespace: name
    }
  };
}

function syntaxName(node) {
  if (!node) return undefined;
  if (typeof node === 'string') return node;
  if (typeof node.name === 'string') return node.name;
  if (typeof node.value === 'string') return node.value;
  if (typeof node.text === 'string') return node.text;
  return undefined;
}
