import{idFragment}from'../../native-import-utils.js';import{hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';
import{normalizeArray}from'./normalizeArray.js';import{normalizeLspSymbolKind}from'./normalizeLspSymbolKind.js';import{spanFromLspRange}from'./spanFromLspRange.js';import{uriToPath}from'./uriToPath.js';
export function addLspSymbol(result, symbol, input) {
  const location = symbol.location ?? {};
  const range = symbol.range ?? location.range ?? symbol.selectionRange;
  const sourcePath = uriToPath(location.uri ?? symbol.uri) ?? input.sourcePath;
  const symbolName = symbol.name ?? symbol.containerName ?? `symbol_${result.symbols.length + 1}`;
  const symbolId = symbol.id ?? `symbol:lsp:${idFragment(input.language ?? 'unknown')}:${idFragment([input.parentName, symbolName].filter(Boolean).join('.'))}`;
  const ownershipSpan = spanFromLspRange(range, sourcePath, input.context.sourceHash, 0);
  const selectionSpan = spanFromLspRange(symbol.selectionRange ?? range, sourcePath, input.context.sourceHash, 0);
  if (!result.symbols.some((entry) => entry.id === symbolId)) {
    result.symbols.push({
      id: symbolId,
      scheme: 'lsp',
      name: symbolName,
      kind: normalizeLspSymbolKind(symbol.kind),
      language: input.language,
      definitionSpan: ownershipSpan,
      signatureHash: hashSemanticValue([symbolName, symbol.kind, symbol.detail]),
      metadata: {
        format: 'lsp',
        detail: symbol.detail,
        tags: symbol.tags,
        deprecated: symbol.deprecated,
        containerName: symbol.containerName,
        parentName: input.parentName
      }
    });
  }
  result.occurrences.push({
    id: `occ_${idFragment(symbolId)}_${result.occurrences.length + 1}`,
    documentId: input.documentId,
    symbolId,
    role: 'definition',
    span: selectionSpan,
    metadata: { format: 'lsp', range, selectionRange: symbol.selectionRange }
  });
  for (const child of normalizeArray(symbol.children)) {
    addLspSymbol(result, child, {
      ...input,
      parentName: [input.parentName, symbolName].filter(Boolean).join('.')
    });
  }
}
