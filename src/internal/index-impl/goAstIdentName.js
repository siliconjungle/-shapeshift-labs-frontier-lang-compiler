export function goAstIdentName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value.Name ?? value.name ?? value.Value ?? value.value;
}
