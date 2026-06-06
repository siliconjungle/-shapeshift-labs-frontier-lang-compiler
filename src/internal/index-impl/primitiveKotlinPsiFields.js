import{kotlinPsiAnnotationNames}from'./kotlinPsiAnnotationNames.js';import{kotlinPsiDeclarationName}from'./kotlinPsiDeclarationName.js';import{kotlinPsiImportPath}from'./kotlinPsiImportPath.js';import{kotlinPsiModifiers}from'./kotlinPsiModifiers.js';import{kotlinPsiPackageName}from'./kotlinPsiPackageName.js';import{kotlinPsiTypeName}from'./kotlinPsiTypeName.js';
export function primitiveKotlinPsiFields(node, kind) {
  const fields = { kind };
  const name = kotlinPsiDeclarationName(node, kind);
  if (name) fields.name = name;
  const importPath = kotlinPsiImportPath(node);
  if (importPath) fields.importPath = importPath;
  const packageName = kotlinPsiPackageName(node);
  if (packageName) fields.packageName = packageName;
  const type = kotlinPsiTypeName(node.typeReference ?? node.returnTypeRef ?? node.returnType ?? node.type);
  if (type) fields.type = type;
  const receiver = kotlinPsiTypeName(node.receiverTypeReference ?? node.receiverTypeRef);
  if (receiver) fields.receiverType = receiver;
  const modifiers = kotlinPsiModifiers(node);
  if (modifiers.length) fields.modifiers = modifiers.join(',');
  const annotations = kotlinPsiAnnotationNames(node);
  if (annotations.length) fields.annotations = annotations.join(',');
  if (node.generated === true || node.isGenerated === true) fields.generated = true;
  if (node.isScript === true || kind === 'KtScript') fields.script = true;
  if (Array.isArray(node.typeParameters ?? node.typeParameterList?.parameters)) fields.typeParameterCount = (node.typeParameters ?? node.typeParameterList?.parameters).length;
  if (Array.isArray(node.valueParameters ?? node.valueParameterList?.parameters ?? node.parameters)) fields.parameterCount = (node.valueParameters ?? node.valueParameterList?.parameters ?? node.parameters).length;
  if (Array.isArray(node.superTypeListEntries ?? node.superTypes)) fields.superTypeCount = (node.superTypeListEntries ?? node.superTypes).length;
  return fields;
}
