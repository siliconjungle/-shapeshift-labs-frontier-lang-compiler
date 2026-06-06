export function kotlinPsiName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.asString === 'string') return value.asString;
  if (typeof value.identifier === 'string') return value.identifier;
  if (typeof value.name === 'string') return value.name;
  if (typeof value.text === 'string') return value.text;
  if (typeof value.value === 'string') return value.value;
  if (typeof value.fqName === 'string') return value.fqName;
  if (value.shortName && value.shortName !== value) return kotlinPsiName(value.shortName);
  if (value.name && value.name !== value) return kotlinPsiName(value.name);
  if (value.identifier && value.identifier !== value) return kotlinPsiName(value.identifier);
  return undefined;
}
