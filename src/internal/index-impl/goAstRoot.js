import{isGoAstNode}from'./isGoAstNode.js';
export function goAstRoot(value) {
  if (!value || typeof value !== 'object') return undefined;
  if (isGoAstNode(value)) return value;
  if (isGoAstNode(value.ast)) return value.ast;
  if (isGoAstNode(value.file)) return value.file;
  if (isGoAstNode(value.sourceFile)) return value.sourceFile;
  if (isGoAstNode(value.root)) return value.root;
  if (isGoAstNode(value.package)) return value.package;
  if (value.files && typeof value.files === 'object') return { kind: 'Package', Name: value.name ?? value.packageName, Files: value.files };
  return undefined;
}
