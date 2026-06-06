import{rustSynPathName}from'./rustSynPathName.js';
export function rustSynImplName(node) {
  const selfType = rustSynPathName(node.self_ty ?? node.selfType ?? node.ty);
  const traitPath = Array.isArray(node.trait_)
    ? rustSynPathName(node.trait_[1] ?? node.trait_[0])
    : rustSynPathName(node.trait_);
  if (selfType && traitPath) return `${selfType}.${traitPath}.impl`;
  if (selfType) return `${selfType}.impl`;
  if (traitPath) return `${traitPath}.impl`;
  return undefined;
}
