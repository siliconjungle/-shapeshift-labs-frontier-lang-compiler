export function csharpRoslynTypeDeclarationKind(kind) {
  return kind === 'ClassDeclaration'
    || kind === 'InterfaceDeclaration'
    || kind === 'StructDeclaration'
    || kind === 'RecordDeclaration'
    || kind === 'RecordStructDeclaration'
    || kind === 'EnumDeclaration';
}
