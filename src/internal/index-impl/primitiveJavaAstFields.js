import{javaAstDeclarationName}from'./javaAstDeclarationName.js';import{javaAstImportPath}from'./javaAstImportPath.js';import{javaAstModifierNames}from'./javaAstModifierNames.js';import{javaAstPackageName}from'./javaAstPackageName.js';import{javaAstTypeName}from'./javaAstTypeName.js';
export function primitiveJavaAstFields(node, kind) {
  const fields = { kind };
  const name = javaAstDeclarationName(node);
  if (name) fields.name = name;
  const importPath = javaAstImportPath(node);
  if (importPath) fields.importPath = importPath;
  const type = javaAstTypeName(node.type ?? node.typeName ?? node.returnType ?? node.elementType);
  if (type) fields.type = type;
  const packageName = javaAstPackageName(node);
  if (packageName) fields.packageName = packageName;
  const modifiers = javaAstModifierNames(node);
  if (modifiers.length) fields.modifiers = modifiers.join(',');
  if (node.static === true || node.isStatic === true) fields.static = true;
  if (node.default === true || node.isDefault === true) fields.default = true;
  if (node.generated === true || node.Generated === true) fields.generated = true;
  if (typeof node.binaryName === 'string') fields.binaryName = node.binaryName;
  if (typeof node.qualifiedName === 'string') fields.qualifiedName = node.qualifiedName;
  if (Array.isArray(node.parameters)) fields.parameterCount = node.parameters.length;
  if (Array.isArray(node.throws ?? node.thrownExceptions)) fields.throwsCount = (node.throws ?? node.thrownExceptions).length;
  return fields;
}
