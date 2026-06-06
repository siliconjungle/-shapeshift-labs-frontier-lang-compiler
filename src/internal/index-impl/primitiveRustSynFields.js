import{rustSynIdentName}from'./rustSynIdentName.js';import{rustSynPathName}from'./rustSynPathName.js';import{rustSynVisibility}from'./rustSynVisibility.js';
export function primitiveRustSynFields(node, kind) {
  const fields = { kind };
  const ident = rustSynIdentName(node.ident ?? node.name ?? node.sig?.ident);
  if (ident) fields.ident = ident;
  const path = rustSynPathName(node.path ?? node.trait_ ?? node.self_ty ?? node.selfType ?? node.ty);
  if (path) fields.path = path;
  const visibility = rustSynVisibility(node.vis ?? node.visibility);
  if (visibility) fields.visibility = visibility;
  for (const key of ['mutability', 'defaultness', 'constness', 'asyncness', 'unsafety', 'abi']) {
    const value = node[key];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) fields[key] = value;
  }
  if (Array.isArray(node.attrs) && node.attrs.length) fields.attributeCount = node.attrs.length;
  return fields;
}
