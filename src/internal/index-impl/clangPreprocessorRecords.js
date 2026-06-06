import{isClangAstNode}from'./isClangAstNode.js';
export function clangPreprocessorRecords(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(isClangAstNode);
  if (typeof value === 'object' && Array.isArray(value.records)) return value.records.filter(isClangAstNode);
  if (isClangAstNode(value)) return [value];
  return [];
}
