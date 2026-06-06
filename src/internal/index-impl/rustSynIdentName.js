import{rustSynPathName}from'./rustSynPathName.js';
export function rustSynIdentName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.ident === 'string') return value.ident;
  if (typeof value.name === 'string') return value.name;
  if (typeof value.text === 'string') return value.text;
  if (typeof value.sym === 'string') return value.sym;
  if (typeof value.value === 'string') return value.value;
  if (typeof value.path === 'string') return value.path;
  return rustSynPathName(value.path ?? value);
}
