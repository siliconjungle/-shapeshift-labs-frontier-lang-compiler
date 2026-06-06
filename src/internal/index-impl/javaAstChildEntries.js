import{ignoredJavaAstField}from'./ignoredJavaAstField.js';import{isJavaAstNode}from'./isJavaAstNode.js';import{javaAstChildWithParent}from'./javaAstChildWithParent.js';import{javaAstKind}from'./javaAstKind.js';
export function javaAstChildEntries(node, kind = javaAstKind(node)) {
  const fieldNames = Object.keys(node).filter((key) => !ignoredJavaAstField(key));
  const entries = [];
  for (const field of fieldNames) {
    const value = node[field];
    if (Array.isArray(value)) {
      entries.push([field, value.map((entry) => javaAstChildWithParent(entry, kind, field))]);
      continue;
    }
    if (value && typeof value === 'object') {
      entries.push([field, javaAstChildWithParent(value, kind, field)]);
    }
  }
  return entries.filter(([, value]) => Array.isArray(value)
    ? value.some(isJavaAstNode)
    : isJavaAstNode(value));
}
