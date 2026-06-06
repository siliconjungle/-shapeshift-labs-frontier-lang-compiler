import{lspSymbolKindByNumber}from'./lspSymbolKindByNumber.js';import{normalizeExternalSymbolKind}from'./normalizeExternalSymbolKind.js';
export function normalizeLspSymbolKind(kind) {
  if (typeof kind === 'number') return lspSymbolKindByNumber[kind] ?? `kind${kind}`;
  return normalizeExternalSymbolKind(kind);
}
