import{isJavaAstNode}from'./isJavaAstNode.js';
export function javaAstRoot(value) {
  if (!value || typeof value !== 'object') return undefined;
  if (isJavaAstNode(value)) return value;
  if (isJavaAstNode(value.ast)) return value.ast;
  if (isJavaAstNode(value.root)) return value.root;
  if (isJavaAstNode(value.compilationUnit)) return value.compilationUnit;
  if (isJavaAstNode(value.unit)) return value.unit;
  if (isJavaAstNode(value.sourceFile)) return value.sourceFile;
  if (Array.isArray(value.types) || Array.isArray(value.imports) || value.packageDeclaration || value.package) {
    return { kind: 'CompilationUnit', ...value };
  }
  return undefined;
}
