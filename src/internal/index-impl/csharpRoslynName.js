export function csharpRoslynName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.text === 'string') return value.text;
  if (typeof value.valueText === 'string') return value.valueText;
  if (typeof value.identifier === 'string') return value.identifier;
  if (typeof value.name === 'string') return value.name;
  if (typeof value.qualifiedName === 'string') return value.qualifiedName;
  if (typeof value.value === 'string') return value.value;
  if (value.identifier && value.identifier !== value) return csharpRoslynName(value.identifier);
  if (value.name && value.name !== value) return csharpRoslynName(value.name);
  return undefined;
}
