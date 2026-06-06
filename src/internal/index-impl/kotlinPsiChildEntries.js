import{ignoredKotlinPsiField}from'./ignoredKotlinPsiField.js';import{isKotlinPsiNode}from'./isKotlinPsiNode.js';import{kotlinPsiChildWithParent}from'./kotlinPsiChildWithParent.js';import{kotlinPsiKind}from'./kotlinPsiKind.js';
export function kotlinPsiChildEntries(node, kind = kotlinPsiKind(node)) {
  const fieldNames = Object.keys(node).filter((key) => !ignoredKotlinPsiField(key));
  const entries = [];
  for (const field of fieldNames) {
    const value = node[field];
    if (Array.isArray(value)) {
      entries.push([field, value.map((entry) => kotlinPsiChildWithParent(entry, kind, field))]);
      continue;
    }
    if (value && typeof value === 'object') {
      entries.push([field, kotlinPsiChildWithParent(value, kind, field)]);
    }
  }
  return entries.filter(([, value]) => Array.isArray(value)
    ? value.some(isKotlinPsiNode)
    : isKotlinPsiNode(value));
}
