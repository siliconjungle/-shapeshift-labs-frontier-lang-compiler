import{isRustSynAstNode}from'./isRustSynAstNode.js';
export function rustSynAstRoot(value) {
  if (!value || typeof value !== 'object') return undefined;
  if (isRustSynAstNode(value)) return value;
  if (isRustSynAstNode(value.ast)) return value.ast;
  if (isRustSynAstNode(value.file)) return value.file;
  if (isRustSynAstNode(value.root)) return value.root;
  if (isRustSynAstNode(value.module)) return value.module;
  if (isRustSynAstNode(value.sourceFile)) return value.sourceFile;
  return undefined;
}
