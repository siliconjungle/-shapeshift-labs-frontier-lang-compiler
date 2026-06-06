export function javaAstName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.identifier === 'string') return value.identifier;
  if (typeof value.name === 'string') return value.name;
  if (typeof value.simpleName === 'string') return value.simpleName;
  if (typeof value.qualifiedName === 'string') return value.qualifiedName;
  if (typeof value.fullyQualifiedName === 'string') return value.fullyQualifiedName;
  if (typeof value.id === 'string') return value.id;
  if (typeof value.value === 'string') return value.value;
  if (value.name && value.name !== value) return javaAstName(value.name);
  if (value.identifier && value.identifier !== value) return javaAstName(value.identifier);
  return undefined;
}
