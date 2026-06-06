export function normalizeLspDocuments(payload, context) {
  if (Array.isArray(payload.documents)) return payload.documents;
  if (payload.textDocument || payload.uri || payload.documentSymbols || payload.symbols || payload.semanticTokens || payload.diagnostics) {
    return [{
      ...payload,
      uri: payload.uri ?? payload.textDocument?.uri,
      languageId: payload.languageId ?? payload.language ?? context.language,
      documentSymbols: payload.documentSymbols,
      symbols: payload.symbols,
      semanticTokens: payload.semanticTokens,
      diagnostics: payload.diagnostics
    }];
  }
  return [{ uri: context.sourcePath, languageId: context.language }];
}
