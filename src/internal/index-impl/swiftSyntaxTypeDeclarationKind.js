export function swiftSyntaxTypeDeclarationKind(kind) {
  return kind === 'ClassDecl'
    || kind === 'StructDecl'
    || kind === 'EnumDecl'
    || kind === 'ProtocolDecl'
    || kind === 'ActorDecl';
}
