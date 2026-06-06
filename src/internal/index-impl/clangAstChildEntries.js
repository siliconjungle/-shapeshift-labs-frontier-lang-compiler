import{ignoredClangAstField}from'./ignoredClangAstField.js';import{isClangAstNode}from'./isClangAstNode.js';
export function clangAstChildEntries(node) {
  const fieldNames = Object.keys(node).filter((key) => !ignoredClangAstField(key));
  return fieldNames
    .map((field) => [field, node[field]])
    .filter(([, value]) => Array.isArray(value)
      ? value.some(isClangAstNode)
      : isClangAstNode(value));
}
