import{rustSynKind}from'./rustSynKind.js';
export function isRustSynAstNode(value) {
  return Boolean(value && typeof value === 'object' && typeof rustSynKind(value) === 'string');
}
