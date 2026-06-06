import{declarationRecord}from'./declarationRecord.js';import{nativeNodeId}from'./nativeNodeId.js';import{pythonAliasName}from'./pythonAliasName.js';import{pythonAssignmentName}from'./pythonAssignmentName.js';
export function pythonAstDeclaration(node, kind, nativeNodeId, input) {
  if (kind === 'Import') {
    const name = (node.names ?? []).map((entry) => pythonAliasName(entry)).find(Boolean);
    if (name) return declarationRecord(input, nativeNodeId, name, 'module', 'import');
  }
  if (kind === 'ImportFrom') {
    const name = node.module ?? (node.names ?? []).map((entry) => pythonAliasName(entry)).find(Boolean);
    if (name) return declarationRecord(input, nativeNodeId, name, 'module', 'import');
  }
  if (kind === 'FunctionDef' || kind === 'AsyncFunctionDef') return declarationRecord(input, nativeNodeId, node.name, 'function', 'definition');
  if (kind === 'ClassDef') return declarationRecord(input, nativeNodeId, node.name, 'class', 'definition');
  if (kind === 'AnnAssign' || kind === 'Assign') {
    const name = pythonAssignmentName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'variable', 'definition');
  }
  return undefined;
}
