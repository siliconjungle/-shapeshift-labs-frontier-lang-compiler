import{rustSynIdentName}from'./rustSynIdentName.js';import{rustSynPathName}from'./rustSynPathName.js';
export function rustSynUseName(node) {
  if (!node) return undefined;
  if (node.prefix && node.tree) {
    const prefix = rustSynPathName(node.prefix);
    const child = rustSynUseName(node.tree);
    return [prefix, child].filter(Boolean).join('::') || undefined;
  }
  if (node.ident && node.tree) {
    const prefix = rustSynIdentName(node.ident);
    const child = rustSynUseName(node.tree);
    return [prefix, child].filter(Boolean).join('::') || undefined;
  }
  if (node.path && node.tree) {
    const prefix = rustSynPathName(node.path);
    const child = rustSynUseName(node.tree);
    return [prefix, child].filter(Boolean).join('::') || undefined;
  }
  if (Array.isArray(node.trees)) return node.trees.map(rustSynUseName).find(Boolean);
  if (node.tree) return rustSynUseName(node.tree);
  if (node.path) return rustSynPathName(node.path);
  if (node.name) return rustSynIdentName(node.name);
  if (node.ident) return rustSynIdentName(node.ident);
  if (node.rename) return rustSynIdentName(node.rename);
  return undefined;
}
