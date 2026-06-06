export function typeScriptKindName(node, ts) {
  if (typeof node.kindName === 'string') return node.kindName;
  if (ts?.SyntaxKind && node.kind !== undefined) return ts.SyntaxKind[node.kind] ?? `SyntaxKind${node.kind}`;
  if (typeof node.kind === 'string') return node.kind;
  return `SyntaxKind${node.kind ?? 'Unknown'}`;
}
