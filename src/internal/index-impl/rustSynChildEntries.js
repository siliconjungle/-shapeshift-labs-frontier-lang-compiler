import{ignoredRustSynField}from'./ignoredRustSynField.js';import{isRustSynAstNode}from'./isRustSynAstNode.js';import{rustSynPayload}from'./rustSynPayload.js';
export function rustSynChildEntries(node) {
  const payload = rustSynPayload(node);
  const fieldNames = Object.keys(payload).filter((key) => !ignoredRustSynField(key));
  return fieldNames
    .map((field) => [field, payload[field]])
    .filter(([, value]) => Array.isArray(value)
      ? value.some(isRustSynAstNode)
      : isRustSynAstNode(value));
}
