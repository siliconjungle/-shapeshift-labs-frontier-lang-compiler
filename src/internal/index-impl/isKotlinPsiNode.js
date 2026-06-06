import{kotlinPsiKind}from'./kotlinPsiKind.js';
export function isKotlinPsiNode(value) {
  return Boolean(value && typeof value === 'object' && typeof kotlinPsiKind(value) === 'string');
}
