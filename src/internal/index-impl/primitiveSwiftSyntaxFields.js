import{swiftSyntaxAttributeNames}from'./swiftSyntaxAttributeNames.js';import{swiftSyntaxDeclarationName}from'./swiftSyntaxDeclarationName.js';import{swiftSyntaxImportPath}from'./swiftSyntaxImportPath.js';import{swiftSyntaxModifierNames}from'./swiftSyntaxModifierNames.js';import{swiftSyntaxTypeName}from'./swiftSyntaxTypeName.js';
export function primitiveSwiftSyntaxFields(node, kind) {
  const fields = { kind };
  const name = swiftSyntaxDeclarationName(node, kind);
  if (name) fields.name = name;
  const importPath = swiftSyntaxImportPath(node);
  if (importPath) fields.importPath = importPath;
  const type = swiftSyntaxTypeName(node.type ?? node.typeAnnotation?.type ?? node.returnClause?.type ?? node.extendedType);
  if (type) fields.type = type;
  const modifiers = swiftSyntaxModifierNames(node);
  if (modifiers.length) fields.modifiers = modifiers.join(',');
  const attributes = swiftSyntaxAttributeNames(node);
  if (attributes.length) fields.attributes = attributes.join(',');
  if (node.generated === true || node.isGenerated === true) fields.generated = true;
  if (node.isMissing === true || node.presence === 'missing') fields.isMissing = true;
  if (node.hasError === true || node.containsDiagnostics === true) fields.hasError = true;
  if (Array.isArray(node.genericParameterClause?.parameters ?? node.genericParameters)) fields.genericParameterCount = (node.genericParameterClause?.parameters ?? node.genericParameters).length;
  if (Array.isArray(node.inheritanceClause?.inheritedTypes ?? node.inheritedTypes)) fields.inheritedTypeCount = (node.inheritanceClause?.inheritedTypes ?? node.inheritedTypes).length;
  if (Array.isArray(node.signature?.parameterClause?.parameters ?? node.parameters)) fields.parameterCount = (node.signature?.parameterClause?.parameters ?? node.parameters).length;
  return fields;
}
