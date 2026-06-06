import{clangAstKind}from'./clangAstKind.js';
export function clangDeclarationAction(node) {
  if (node.isThisDeclarationADefinition === false) return 'declaration';
  if (node.isThisDeclarationADefinition === true) return 'definition';
  if (Array.isArray(node.inner) && node.inner.some((entry) => ['CompoundStmt', 'FieldDecl', 'EnumConstantDecl'].includes(clangAstKind(entry)))) return 'definition';
  return 'declaration';
}
