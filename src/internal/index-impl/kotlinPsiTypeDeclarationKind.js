export function kotlinPsiTypeDeclarationKind(kind) {
  return kind === 'KtClass'
    || kind === 'KtClassOrObject'
    || kind === 'KtObjectDeclaration';
}
