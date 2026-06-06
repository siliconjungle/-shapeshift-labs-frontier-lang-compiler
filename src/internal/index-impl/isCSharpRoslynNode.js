import{csharpRoslynKind}from'./csharpRoslynKind.js';
export function isCSharpRoslynNode(value) {
  return Boolean(value && typeof value === 'object' && typeof csharpRoslynKind(value) === 'string');
}
