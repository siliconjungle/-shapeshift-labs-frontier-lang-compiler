export function goAstPositionKind(node) {
  const pos = node.Pos ?? node.pos ?? node.Name?.NamePos ?? node.name?.namePos;
  if (!pos) return undefined;
  if (typeof pos === 'object') return 'token.Position';
  return 'token.Pos';
}
