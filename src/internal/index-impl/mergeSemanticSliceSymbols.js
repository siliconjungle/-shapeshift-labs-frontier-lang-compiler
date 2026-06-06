export function mergeSemanticSliceSymbols(symbols) {
  const byId = new Map();
  for (const symbol of symbols ?? []) {
    if (!symbol?.id) continue;
    const existing = byId.get(symbol.id);
    byId.set(symbol.id, {
      ...(existing ?? {}),
      ...symbol,
      metadata: {
        ...(existing?.metadata ?? {}),
        ...(symbol.metadata ?? {})
      }
    });
  }
  return [...byId.values()];
}
