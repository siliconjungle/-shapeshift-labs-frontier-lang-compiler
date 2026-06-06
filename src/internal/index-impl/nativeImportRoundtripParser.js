import{uniqueStrings}from'../../native-import-utils.js';
export function nativeImportRoundtripParser(importResult, imports) {
  const parsers = uniqueStrings([
    importResult.nativeAst?.parser,
    importResult.nativeSource?.parser,
    importResult.metadata?.parser,
    ...imports.map((imported) => imported?.nativeAst?.parser ?? imported?.nativeSource?.parser ?? imported?.metadata?.parser)
  ].filter(Boolean));
  return parsers.length === 1 ? parsers[0] : parsers.length ? parsers.join(',') : undefined;
}
