export function javaTypeDeclarationSymbolKind(kind) {
  if (kind === 'InterfaceDeclaration' || kind === 'AnnotationDeclaration') return 'interface';
  if (kind === 'ClassDeclaration') return 'class';
  return 'type';
}
