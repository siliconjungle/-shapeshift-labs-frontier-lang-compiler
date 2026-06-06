import{csharpRoslynChildWithParent}from'./csharpRoslynChildWithParent.js';import{csharpRoslynKind}from'./csharpRoslynKind.js';import{ignoredCSharpRoslynField}from'./ignoredCSharpRoslynField.js';import{isCSharpRoslynNode}from'./isCSharpRoslynNode.js';
export function csharpRoslynChildEntries(node, kind = csharpRoslynKind(node)) {
  const fieldNames = Object.keys(node).filter((key) => !ignoredCSharpRoslynField(key));
  const entries = [];
  for (const field of fieldNames) {
    const value = node[field];
    if (Array.isArray(value)) {
      entries.push([field, value.map((entry) => csharpRoslynChildWithParent(entry, kind, field))]);
      continue;
    }
    if (value && typeof value === 'object') {
      entries.push([field, csharpRoslynChildWithParent(value, kind, field)]);
    }
  }
  return entries.filter(([, value]) => Array.isArray(value)
    ? value.some(isCSharpRoslynNode)
    : isCSharpRoslynNode(value));
}
