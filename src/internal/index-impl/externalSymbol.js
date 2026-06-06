import{nameFromExternalSymbol}from'./nameFromExternalSymbol.js';import{normalizeExternalSemanticLanguage}from'./normalizeExternalSemanticLanguage.js';import{normalizeExternalSpan}from'./normalizeExternalSpan.js';import{normalizeExternalSymbolKind}from'./normalizeExternalSymbolKind.js';
export function externalSymbol(symbol, context, index) {
  const id = symbol.id ?? symbol.symbolId ?? symbol.symbol ?? `symbol:${context.format}:${index + 1}`;
  return {
    ...symbol,
    id: String(id),
    scheme: symbol.scheme ?? context.format,
    name: symbol.name ?? symbol.display_name ?? symbol.displayName ?? nameFromExternalSymbol(id),
    kind: normalizeExternalSymbolKind(symbol.kind),
    language: normalizeExternalSemanticLanguage(symbol.language ?? context.language),
    definitionSpan: normalizeExternalSpan(symbol.definitionSpan ?? symbol.span, context.sourcePath, context.sourceHash),
    metadata: { format: context.format, rawSymbol: symbol.symbol, ...symbol.metadata }
  };
}
