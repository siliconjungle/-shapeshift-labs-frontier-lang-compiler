export function normalizeSyntaxAstRoot(ast, astFormat) {
  if (!ast || typeof ast !== 'object') return undefined;
  if (astFormat === 'babel' && ast.program && typeof ast.program === 'object') return ast.program;
  return ast;
}
