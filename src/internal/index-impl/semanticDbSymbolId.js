import{idFragment}from'../../native-import-utils.js';
export function semanticDbSymbolId(symbol, context, documentId) {
  if (!symbol) return `symbol:semanticdb:${context.idPart}:unknown`;
  if (String(symbol).startsWith('symbol:')) return String(symbol);
  const scope = /^local\d+$/i.test(String(symbol)) ? `${documentId}:` : '';
  return `symbol:semanticdb:${idFragment(scope + symbol)}`;
}
