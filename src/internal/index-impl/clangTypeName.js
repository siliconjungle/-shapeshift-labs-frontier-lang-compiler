export function clangTypeName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.qualType === 'string') return value.qualType;
  if (typeof value.desugaredQualType === 'string') return value.desugaredQualType;
  if (typeof value.name === 'string') return value.name;
  if (value.type && typeof value.type === 'object') return clangTypeName(value.type);
  return undefined;
}
