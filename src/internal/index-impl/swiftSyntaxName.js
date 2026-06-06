export function swiftSyntaxName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.text === 'string') return value.text;
  if (typeof value.trimmedDescription === 'string') return value.trimmedDescription;
  if (typeof value.description === 'string' && !value.description.includes('[object Object]')) return value.description.trim();
  if (typeof value.identifier === 'string') return value.identifier;
  if (typeof value.name === 'string') return value.name;
  if (typeof value.value === 'string') return value.value;
  if (value.tokenKind && typeof value.tokenKind === 'object') return swiftSyntaxName(value.tokenKind);
  if (value.identifier && value.identifier !== value) return swiftSyntaxName(value.identifier);
  if (value.name && value.name !== value) return swiftSyntaxName(value.name);
  return undefined;
}
