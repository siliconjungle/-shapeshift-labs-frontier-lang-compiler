import{idFragment}from'../../native-import-utils.js';
import{addLspSemanticTokens}from'./addLspSemanticTokens.js';import{addLspSymbol}from'./addLspSymbol.js';import{externalDiagnosticFact}from'./externalDiagnosticFact.js';import{externalDiagnosticLoss}from'./externalDiagnosticLoss.js';import{externalSemanticBase}from'./externalSemanticBase.js';import{normalizeArray}from'./normalizeArray.js';import{normalizeExternalSemanticLanguage}from'./normalizeExternalSemanticLanguage.js';import{normalizeLspDocuments}from'./normalizeLspDocuments.js';import{uriToPath}from'./uriToPath.js';import{withExternalEmptyLoss}from'./withExternalEmptyLoss.js';
export function normalizeLspPayload(payload, context) {
  const result = externalSemanticBase(context, { sourceFormat: 'lsp' });
  const documents = normalizeLspDocuments(payload, context);
  for (const [documentIndex, document] of documents.entries()) {
    const sourcePath = uriToPath(document.uri) ?? document.sourcePath ?? document.path ?? context.sourcePath ?? `lsp-document-${documentIndex + 1}`;
    const language = normalizeExternalSemanticLanguage(document.languageId ?? document.language ?? context.language);
    const documentId = document.id ?? `doc_${idFragment(sourcePath)}`;
    result.documents.push({
      id: documentId,
      path: sourcePath,
      language,
      sourceHash: document.sourceHash ?? context.sourceHash,
      metadata: { format: 'lsp', uri: document.uri, documentIndex }
    });
    const symbols = normalizeArray(document.documentSymbols ?? document.symbols ?? payload.documentSymbols ?? payload.symbols);
    for (const symbol of symbols) addLspSymbol(result, symbol, {
      context,
      documentId,
      sourcePath,
      language,
      parentName: symbol.containerName
    });
    const semanticTokens = document.semanticTokens ?? payload.semanticTokens;
    if (semanticTokens) addLspSemanticTokens(result, semanticTokens, { context, documentId, sourcePath, language });
    for (const diagnostic of normalizeArray(document.diagnostics ?? payload.diagnostics)) {
      result.facts.push(externalDiagnosticFact(diagnostic, context, documentId, sourcePath, result.facts.length));
      result.losses.push(externalDiagnosticLoss(diagnostic, context, sourcePath));
    }
  }
  return withExternalEmptyLoss(result, context);
}
