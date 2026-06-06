import{javaAstKind}from'./javaAstKind.js';
export function isJavaAstNode(value) {
  return Boolean(value && typeof value === 'object' && typeof javaAstKind(value) === 'string');
}
