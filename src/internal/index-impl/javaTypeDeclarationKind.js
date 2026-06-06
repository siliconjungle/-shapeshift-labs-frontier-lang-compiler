export function javaTypeDeclarationKind(kind) {
  return kind === 'ClassDeclaration'
    || kind === 'InterfaceDeclaration'
    || kind === 'EnumDeclaration'
    || kind === 'RecordDeclaration'
    || kind === 'AnnotationDeclaration';
}
