export function scipSyntaxKind(kind) {
  const normalized = typeof kind === 'number' ? kind : Number(kind);
  if (normalized === 15 || normalized === 16) return 'function';
  if (normalized === 19 || normalized === 20) return 'type';
  if (normalized === 25 || normalized === 26) return 'module';
  if (normalized === 9 || normalized === 10 || normalized === 12) return 'variable';
  return 'symbol';
}
