import{isClangAstNode}from'./isClangAstNode.js';
export function clangAstRoot(value) {
  if (!value || typeof value !== 'object') return undefined;
  if (Array.isArray(value)) return { kind: 'TranslationUnitDecl', inner: value };
  if (isClangAstNode(value)) return value;
  if (Array.isArray(value.ast)) return { kind: 'TranslationUnitDecl', inner: value.ast };
  if (isClangAstNode(value.ast)) return value.ast;
  if (isClangAstNode(value.root)) return value.root;
  if (isClangAstNode(value.translationUnit)) return value.translationUnit;
  if (isClangAstNode(value.tu)) return value.tu;
  if (isClangAstNode(value.file)) return value.file;
  if (isClangAstNode(value.sourceFile)) return value.sourceFile;
  return undefined;
}
