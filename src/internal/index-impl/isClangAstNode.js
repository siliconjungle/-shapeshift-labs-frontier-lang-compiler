import{clangAstKind}from'./clangAstKind.js';
export function isClangAstNode(value) {
  return Boolean(value && typeof value === 'object' && typeof clangAstKind(value) === 'string');
}
