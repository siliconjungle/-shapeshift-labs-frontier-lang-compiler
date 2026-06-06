export function csharpRoslynTypeDeclarationSymbolKind(kind) {
  if (kind === 'ClassDeclaration' || kind === 'RecordDeclaration') return 'class';
  if (kind === 'InterfaceDeclaration') return 'interface';
  return 'type';
}
