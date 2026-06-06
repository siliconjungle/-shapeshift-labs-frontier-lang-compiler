import{isPythonAstNode}from'./isPythonAstNode.js';
export function pythonAstRoot(value) {
  if (!value || typeof value !== 'object') return undefined;
  if (isPythonAstNode(value)) return value;
  if (isPythonAstNode(value.ast)) return value.ast;
  if (isPythonAstNode(value.root)) return value.root;
  if (isPythonAstNode(value.module)) return value.module;
  return undefined;
}
