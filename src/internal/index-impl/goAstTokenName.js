export function goAstTokenName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return value.String ?? value.string ?? value.Name ?? value.name;
}
