export function rustSynVisibility(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.kind === 'string') return value.kind;
  if (typeof value.type === 'string') return value.type;
  if (value.pub || value.Public) return 'pub';
  if (value.restricted || value.Restricted) return 'restricted';
  return undefined;
}
