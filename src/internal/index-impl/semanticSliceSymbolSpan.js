export function semanticSliceSymbolSpan(symbol) {
  return symbol.sourceSpan ?? symbol.definitionSpan ?? symbol.span;
}
