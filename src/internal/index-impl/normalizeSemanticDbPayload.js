import{idFragment}from'../../native-import-utils.js';import{hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';
import{externalDiagnosticFact}from'./externalDiagnosticFact.js';import{externalDiagnosticLoss}from'./externalDiagnosticLoss.js';import{externalSemanticBase}from'./externalSemanticBase.js';import{nameFromExternalSymbol}from'./nameFromExternalSymbol.js';import{normalizeArray}from'./normalizeArray.js';import{normalizeExternalSemanticLanguage}from'./normalizeExternalSemanticLanguage.js';import{normalizeExternalSymbolKind}from'./normalizeExternalSymbolKind.js';import{semanticDbOccurrenceRole}from'./semanticDbOccurrenceRole.js';import{semanticDbSymbolFacts}from'./semanticDbSymbolFacts.js';import{semanticDbSymbolId}from'./semanticDbSymbolId.js';import{spanFromSemanticDbRange}from'./spanFromSemanticDbRange.js';import{uriToPath}from'./uriToPath.js';import{withExternalEmptyLoss}from'./withExternalEmptyLoss.js';
export function normalizeSemanticDbPayload(payload, context) {
  const result = externalSemanticBase(context, { sourceFormat: 'semanticdb' });
  const documents = normalizeArray(payload.documents ?? payload.textDocuments ?? payload);
  for (const [documentIndex, document] of documents.entries()) {
    const sourcePath = uriToPath(document.uri) ?? document.uri ?? document.path ?? context.sourcePath ?? `semanticdb-document-${documentIndex + 1}`;
    const language = normalizeExternalSemanticLanguage(document.language ?? context.language ?? 'scala');
    const documentId = document.id ?? `doc_${idFragment(sourcePath)}`;
    result.documents.push({
      id: documentId,
      path: sourcePath,
      language,
      sourceHash: document.md5 ?? document.sourceHash ?? context.sourceHash,
      metadata: { format: 'semanticdb', schema: document.schema, documentIndex }
    });
    for (const [symbolIndex, symbolInfo] of normalizeArray(document.symbols).entries()) {
      const symbolId = semanticDbSymbolId(symbolInfo.symbol, context, documentId);
      result.symbols.push({
        id: symbolId,
        scheme: 'semanticdb',
        name: symbolInfo.display_name ?? symbolInfo.displayName ?? nameFromExternalSymbol(symbolInfo.symbol),
        kind: normalizeExternalSymbolKind(symbolInfo.kind),
        language,
        signatureHash: hashSemanticValue(symbolInfo.signature ?? symbolInfo.signature_documentation ?? symbolInfo.signatureDocumentation ?? symbolInfo),
        metadata: { format: 'semanticdb', symbolIndex, rawSymbol: symbolInfo.symbol, properties: symbolInfo.properties }
      });
      result.facts.push(...semanticDbSymbolFacts(symbolInfo, symbolId));
    }
    for (const [occurrenceIndex, occurrence] of normalizeArray(document.occurrences).entries()) {
      const symbolId = semanticDbSymbolId(occurrence.symbol, context, documentId);
      if (!result.symbols.some((symbol) => symbol.id === symbolId)) {
        result.symbols.push({
          id: symbolId,
          scheme: 'semanticdb',
          name: nameFromExternalSymbol(occurrence.symbol),
          kind: 'symbol',
          language,
          metadata: { format: 'semanticdb', inferredFromOccurrence: true, rawSymbol: occurrence.symbol }
        });
      }
      result.occurrences.push({
        id: occurrence.id ?? `occ_${idFragment(documentId)}_${occurrenceIndex + 1}`,
        documentId,
        symbolId,
        role: semanticDbOccurrenceRole(occurrence.role),
        span: spanFromSemanticDbRange(occurrence.range, sourcePath, document.md5 ?? context.sourceHash),
        metadata: { format: 'semanticdb', role: occurrence.role }
      });
    }
    for (const diagnostic of normalizeArray(document.diagnostics)) {
      result.facts.push(externalDiagnosticFact(diagnostic, context, documentId, sourcePath, result.facts.length));
      result.losses.push(externalDiagnosticLoss(diagnostic, context, sourcePath));
    }
  }
  return withExternalEmptyLoss(result, context);
}
