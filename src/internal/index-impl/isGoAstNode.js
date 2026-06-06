import{goAstKind}from'./goAstKind.js';
export function isGoAstNode(value) {
  return Boolean(value && typeof value === 'object' && typeof goAstKind(value) === 'string');
}
