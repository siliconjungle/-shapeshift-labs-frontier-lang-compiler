import{idFragment}from'../../native-import-utils.js';
export function scipSymbolId(symbol, context, documentId) {
  if (!symbol) return undefined;
  const raw = String(symbol);
  if (raw.startsWith('symbol:')) return raw;
  const scope = /^local\b/i.test(raw) ? `${documentId ?? context.idPart}:` : '';
  return `symbol:scip:${idFragment(scope + raw)}`;
}
