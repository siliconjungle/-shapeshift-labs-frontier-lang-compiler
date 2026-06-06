import{externalSymbolKindByNumber}from'./externalSymbolKindByNumber.js';import{lspSymbolKindByNumber}from'./lspSymbolKindByNumber.js';
export function normalizeExternalSymbolKind(kind) {
  if (kind === undefined || kind === null || kind === '') return 'symbol';
  if (typeof kind === 'number') return externalSymbolKindByNumber[kind] ?? lspSymbolKindByNumber[kind] ?? `kind${kind}`;
  return String(kind).replace(/^[A-Z_]+_/, '').replace(/^[A-Z]/, (letter) => letter.toLowerCase());
}
