export function rustSynSpanKind(node) {
  const span = node.span ?? node.ident?.span ?? node.sig?.ident?.span ?? node.name?.span;
  if (!span || typeof span !== 'object') return undefined;
  return span.kind ?? span.source ?? 'host-span';
}
