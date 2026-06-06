import{ignoredSwiftSyntaxField}from'./ignoredSwiftSyntaxField.js';import{isSwiftSyntaxNode}from'./isSwiftSyntaxNode.js';import{swiftSyntaxChildWithParent}from'./swiftSyntaxChildWithParent.js';import{swiftSyntaxKind}from'./swiftSyntaxKind.js';
export function swiftSyntaxChildEntries(node, kind = swiftSyntaxKind(node)) {
  const fieldNames = Object.keys(node).filter((key) => !ignoredSwiftSyntaxField(key));
  const entries = [];
  for (const field of fieldNames) {
    const value = node[field];
    if (Array.isArray(value)) {
      entries.push([field, value.map((entry) => swiftSyntaxChildWithParent(entry, kind, field))]);
      continue;
    }
    if (value && typeof value === 'object') {
      entries.push([field, swiftSyntaxChildWithParent(value, kind, field)]);
    }
  }
  return entries.filter(([, value]) => Array.isArray(value)
    ? value.some(isSwiftSyntaxNode)
    : isSwiftSyntaxNode(value));
}
