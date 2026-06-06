import{identifierName}from'./identifierName.js';
export function stringFromTsExpression(node) {
  if (!node) return undefined;
  if (typeof node.text === 'string') return node.text;
  if (typeof node.value === 'string') return node.value;
  return identifierName(node);
}
