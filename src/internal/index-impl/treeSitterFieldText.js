import{shortNodeText}from'./shortNodeText.js';
export function treeSitterFieldText(node, field) {
  if (typeof node.childForFieldName !== 'function') return undefined;
  return shortNodeText(node.childForFieldName(field));
}
