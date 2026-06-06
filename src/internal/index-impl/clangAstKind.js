export function clangAstKind(node) {
  if (!node || typeof node !== 'object') return undefined;
  const declared = node.kind ?? node._type ?? node.type ?? node.nodeType ?? node.declKind ?? node.stmtKind;
  if (typeof declared === 'string') return declared;
  if (Array.isArray(node.inner) || Array.isArray(node.children) || Array.isArray(node.decls)) return 'TranslationUnitDecl';
  return undefined;
}
