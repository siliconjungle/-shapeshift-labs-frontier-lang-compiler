export function swiftSyntaxTypeDeclarationSymbolKind(kind) {
  if (kind === 'ClassDecl') return 'class';
  if (kind === 'StructDecl') return 'struct';
  if (kind === 'EnumDecl') return 'enum';
  if (kind === 'ProtocolDecl') return 'protocol';
  if (kind === 'ActorDecl') return 'class';
  return 'type';
}
