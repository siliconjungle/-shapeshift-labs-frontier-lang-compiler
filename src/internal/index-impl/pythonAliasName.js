export function pythonAliasName(alias) {
  if (!alias) return undefined;
  if (typeof alias === 'string') return alias;
  return alias.name ?? alias.asname ?? alias.id;
}
