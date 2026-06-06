export function kotlinPsiTypeDeclarationSymbolKind(node, kind) {
  const classKind = String(node.classKind ?? node.kindKeyword ?? '').toLowerCase();
  if (kind === 'KtObjectDeclaration') return 'class';
  if (classKind.includes('interface')) return 'interface';
  if (classKind.includes('enum')) return 'enum';
  if (classKind.includes('annotation')) return 'type';
  return 'class';
}
