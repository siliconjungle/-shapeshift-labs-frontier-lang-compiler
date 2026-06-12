import{idFragment,caseSensitiveIdFragment}from'../../native-import-utils.js';
import{nativeNodeId}from'./nativeNodeId.js';
export function declarationRecord(input, nativeNodeId, name, symbolKind, role = 'definition') {
  return {
    name: String(name),
    symbolKind,
    role,
    symbolId: `symbol:${input.language}:${role === 'import' ? 'import:' : ''}${caseSensitiveIdFragment(name)}`,
    nativeNodeId
  };
}
