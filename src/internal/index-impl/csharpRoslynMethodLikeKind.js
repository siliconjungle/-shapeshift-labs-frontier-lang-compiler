export function csharpRoslynMethodLikeKind(kind) {
  return kind === 'MethodDeclaration'
    || kind === 'ConstructorDeclaration'
    || kind === 'DestructorDeclaration'
    || kind === 'OperatorDeclaration'
    || kind === 'ConversionOperatorDeclaration';
}
