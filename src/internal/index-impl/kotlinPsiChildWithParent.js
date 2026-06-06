import{isKotlinPsiNode}from'./isKotlinPsiNode.js';
export function kotlinPsiChildWithParent(entry, parentKind, parentField) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return entry;
  if (!isKotlinPsiNode(entry)) return entry;
  return { parentKind, parentField, ...entry };
}
