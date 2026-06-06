import{pythonAstKind}from'./pythonAstKind.js';
export function isPythonAstNode(value) {
  return Boolean(value && typeof value === 'object' && typeof pythonAstKind(value) === 'string');
}
