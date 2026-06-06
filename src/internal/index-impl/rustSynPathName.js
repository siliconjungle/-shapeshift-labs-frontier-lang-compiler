import{rustSynIdentName}from'./rustSynIdentName.js';
export function rustSynPathName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.ident === 'string') return value.ident;
  if (typeof value.name === 'string') return value.name;
  if (typeof value.path === 'string') return value.path;
  if (value.path && typeof value.path === 'object') return rustSynPathName(value.path);
  if (Array.isArray(value.segments)) {
    const names = value.segments
      .map((segment) => rustSynIdentName(segment.ident ?? segment))
      .filter(Boolean);
    return names.length ? names.join('::') : undefined;
  }
  if (Array.isArray(value.qself)) return value.qself.map(rustSynPathName).filter(Boolean).join('::');
  if (value.leading_colon && value.segments) {
    const name = rustSynPathName({ segments: value.segments });
    return name ? `::${name}` : undefined;
  }
  return undefined;
}
