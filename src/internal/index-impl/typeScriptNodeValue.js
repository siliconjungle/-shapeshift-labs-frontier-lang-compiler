import{identifierName}from'./identifierName.js';import{stringFromTsExpression}from'./stringFromTsExpression.js';
export function typeScriptNodeValue(node) {
  return identifierName(node.name) ?? stringFromTsExpression(node.moduleSpecifier) ?? undefined;
}
