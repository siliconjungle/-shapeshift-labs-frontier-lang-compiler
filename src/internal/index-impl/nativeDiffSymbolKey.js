export function nativeDiffSymbolKey(symbol, imported) {
  return [
    symbol.language ?? imported?.language,
    symbol.kind ?? 'symbol',
    symbol.name ?? symbol.id
  ].map((part) => String(part ?? '').trim()).join(':');
}
