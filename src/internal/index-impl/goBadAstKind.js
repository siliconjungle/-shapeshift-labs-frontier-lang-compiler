export function goBadAstKind(kind) {
  return kind === 'BadDecl' || kind === 'BadExpr' || kind === 'BadStmt';
}
