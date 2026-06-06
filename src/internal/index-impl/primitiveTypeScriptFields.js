import{identifierName}from'./identifierName.js';import{stringFromTsExpression}from'./stringFromTsExpression.js';
export function primitiveTypeScriptFields(node, kind) {
  const fields = { kind };
  const name = identifierName(node.name);
  if (name) fields.name = name;
  const moduleSpecifier = stringFromTsExpression(node.moduleSpecifier);
  if (moduleSpecifier) fields.moduleSpecifier = moduleSpecifier;
  return fields;
}
