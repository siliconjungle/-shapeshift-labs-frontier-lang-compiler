export function relationPredicateForDeclaration(declaration) {
  if (declaration.role === 'import') return 'imports';
  if (declaration.role === 'export') return 'exports';
  return 'defines';
}
