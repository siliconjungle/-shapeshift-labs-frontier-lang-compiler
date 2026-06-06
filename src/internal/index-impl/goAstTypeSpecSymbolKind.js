import{goAstKind}from'./goAstKind.js';
export function goAstTypeSpecSymbolKind(node) {
  const type = node.Type ?? node.type;
  const kind = goAstKind(type);
  if (kind === 'InterfaceType') return 'interface';
  if (kind === 'StructType') return 'class';
  return 'type';
}
