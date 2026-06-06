import{csharpRoslynDeclarationName}from'./csharpRoslynDeclarationName.js';import{csharpRoslynModifierNames}from'./csharpRoslynModifierNames.js';import{csharpRoslynName}from'./csharpRoslynName.js';import{csharpRoslynTypeName}from'./csharpRoslynTypeName.js';import{csharpRoslynUsingPath}from'./csharpRoslynUsingPath.js';
export function primitiveCSharpRoslynFields(node, kind) {
  const fields = { kind };
  const name = csharpRoslynDeclarationName(node);
  if (name) fields.name = name;
  const importPath = csharpRoslynUsingPath(node);
  if (importPath) fields.importPath = importPath;
  const type = csharpRoslynTypeName(node.type ?? node.Type ?? node.returnType ?? node.ReturnType);
  if (type) fields.type = type;
  const modifiers = csharpRoslynModifierNames(node);
  if (modifiers.length) fields.modifiers = modifiers.join(',');
  const alias = csharpRoslynName(node.alias ?? node.Alias);
  if (alias) fields.alias = alias;
  if (node.static === true || node.isStatic === true) fields.static = true;
  if (node.global === true || node.isGlobal === true) fields.global = true;
  if (node.generated === true || node.Generated === true) fields.generated = true;
  if (node.containsDiagnostics === true || node.ContainsDiagnostics === true) fields.containsDiagnostics = true;
  if (node.containsSkippedText === true || node.ContainsSkippedText === true) fields.containsSkippedText = true;
  if (node.isMissing === true || node.IsMissing === true) fields.isMissing = true;
  if (Array.isArray(node.parameterList?.parameters ?? node.parameters)) fields.parameterCount = (node.parameterList?.parameters ?? node.parameters).length;
  if (Array.isArray(node.attributeLists)) fields.attributeListCount = node.attributeLists.length;
  return fields;
}
