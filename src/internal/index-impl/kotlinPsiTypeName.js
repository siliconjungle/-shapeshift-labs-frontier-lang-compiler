import{kotlinPsiName}from'./kotlinPsiName.js';
export function kotlinPsiTypeName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.text === 'string') return value.text.trim();
  if (typeof value.name === 'string') return value.name;
  if (typeof value.fqName === 'string') return value.fqName;
  if (value.typeElement) return kotlinPsiTypeName(value.typeElement);
  if (value.typeReference) return kotlinPsiTypeName(value.typeReference);
  if (value.referencedName) return kotlinPsiName(value.referencedName);
  if (value.constructorReferenceExpression) return kotlinPsiTypeName(value.constructorReferenceExpression);
  if (Array.isArray(value.typeArguments) || Array.isArray(value.arguments)) {
    const base = kotlinPsiName(value.name ?? value.referencedName ?? value.constructorReferenceExpression);
    const args = (value.typeArguments ?? value.arguments).map((entry) => kotlinPsiTypeName(entry.typeReference ?? entry)).filter(Boolean);
    return base ? `${base}<${args.join(', ')}>` : undefined;
  }
  return kotlinPsiName(value);
}
