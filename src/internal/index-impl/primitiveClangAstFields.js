import{clangDeclarationName}from'./clangDeclarationName.js';import{clangIncludePath}from'./clangIncludePath.js';import{clangLiteralValue}from'./clangLiteralValue.js';import{clangTypeName}from'./clangTypeName.js';
export function primitiveClangAstFields(node, kind) {
  const fields = { kind };
  const name = clangDeclarationName(node);
  if (name) fields.name = name;
  const type = clangTypeName(node.type ?? node.qualType);
  if (type) fields.type = type;
  for (const key of [
    'mangledName',
    'storageClass',
    'tagUsed',
    'completeDefinition',
    'isThisDeclarationADefinition',
    'inline',
    'isUsed',
    'isReferenced',
    'valueCategory',
    'opcode',
    'castKind'
  ]) {
    const value = node[key];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) fields[key] = value;
  }
  const includePath = clangIncludePath(node);
  if (includePath) fields.includePath = includePath;
  const literal = clangLiteralValue(node);
  if (literal !== undefined) fields.literal = literal;
  const referenced = clangDeclarationName(node.referencedDecl);
  if (referenced) fields.referenced = referenced;
  return fields;
}
