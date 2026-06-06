import{ignoredPythonAstField}from'./ignoredPythonAstField.js';import{isPythonAstNode}from'./isPythonAstNode.js';
export function pythonAstChildEntries(node) {
  const fieldNames = Array.isArray(node._fields)
    ? node._fields
    : Object.keys(node).filter((key) => !ignoredPythonAstField(key));
  return fieldNames
    .map((field) => [field, node[field]])
    .filter(([, value]) => Array.isArray(value)
      ? value.some(isPythonAstNode)
      : isPythonAstNode(value));
}
