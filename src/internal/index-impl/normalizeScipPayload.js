import{idFragment}from'../../native-import-utils.js';import{hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';
import{externalDiagnosticFact}from'./externalDiagnosticFact.js';import{externalDiagnosticLoss}from'./externalDiagnosticLoss.js';import{externalSemanticBase}from'./externalSemanticBase.js';import{nameFromExternalSymbol}from'./nameFromExternalSymbol.js';import{normalizeArray}from'./normalizeArray.js';import{normalizeExternalSemanticLanguage}from'./normalizeExternalSemanticLanguage.js';import{normalizeExternalSymbolKind}from'./normalizeExternalSymbolKind.js';import{scipOccurrenceRole}from'./scipOccurrenceRole.js';import{scipOccurrenceRoleSet}from'./scipOccurrenceRoleSet.js';import{scipRelationshipRelations}from'./scipRelationshipRelations.js';import{scipSymbolFacts}from'./scipSymbolFacts.js';import{scipSymbolId}from'./scipSymbolId.js';import{scipSyntaxKind}from'./scipSyntaxKind.js';import{spanFromScipOccurrence}from'./spanFromScipOccurrence.js';import{withExternalEmptyLoss}from'./withExternalEmptyLoss.js';
export function normalizeScipPayload(payload, context) {
  const result = externalSemanticBase(context, { sourceFormat: 'scip' });
  const metadata = payload.metadata ?? {};
  const projectRoot = context.projectRoot ?? metadata.project_root ?? metadata.projectRoot;
  result.repository = projectRoot ? { root: projectRoot } : undefined;
  const documents = normalizeArray(payload.documents);
  for (const [documentIndex, document] of documents.entries()) {
    const path = document.relative_path ?? document.relativePath ?? document.path ?? context.sourcePath ?? `scip-document-${documentIndex + 1}`;
    const language = normalizeExternalSemanticLanguage(document.language ?? context.language);
    const documentId = document.id ?? `doc_${idFragment(path)}`;
    result.documents.push({
      id: documentId,
      path,
      language,
      sourceHash: document.sourceHash ?? document.md5 ?? context.sourceHash,
      metadata: {
        format: 'scip',
        projectRoot,
        textDocumentEncoding: metadata.text_document_encoding ?? metadata.textDocumentEncoding,
        documentIndex
      }
    });
    const documentSymbols = new Map();
    for (const symbolInfo of [...normalizeArray(document.symbols), ...normalizeArray(payload.external_symbols ?? payload.externalSymbols)]) {
      const symbolId = scipSymbolId(symbolInfo.symbol, context, normalizeArray(document.symbols).includes(symbolInfo) ? documentId : undefined);
      if (!symbolId || documentSymbols.has(symbolId)) continue;
      documentSymbols.set(symbolId, true);
      result.symbols.push({
        id: symbolId,
        scheme: 'scip',
        name: symbolInfo.display_name ?? symbolInfo.displayName ?? nameFromExternalSymbol(symbolInfo.symbol),
        kind: normalizeExternalSymbolKind(symbolInfo.kind),
        language,
        signatureHash: hashSemanticValue([symbolInfo.symbol, symbolInfo.signature_documentation ?? symbolInfo.signatureDocumentation]),
        metadata: {
          format: 'scip',
          rawSymbol: symbolInfo.symbol,
          documentation: symbolInfo.documentation,
          enclosingSymbol: symbolInfo.enclosing_symbol ?? symbolInfo.enclosingSymbol,
          external: !normalizeArray(document.symbols).includes(symbolInfo)
        }
      });
      result.facts.push(...scipSymbolFacts(symbolInfo, symbolId));
      result.relations.push(...scipRelationshipRelations(symbolInfo, symbolId, context));
    }
    for (const [occurrenceIndex, occurrence] of normalizeArray(document.occurrences).entries()) {
      const symbolId = scipSymbolId(occurrence.symbol, context, documentId);
      if (!symbolId) continue;
      const role = scipOccurrenceRole(occurrence.symbol_roles ?? occurrence.symbolRoles);
      if (!documentSymbols.has(symbolId)) {
        documentSymbols.set(symbolId, true);
        result.symbols.push({
          id: symbolId,
          scheme: 'scip',
          name: nameFromExternalSymbol(occurrence.symbol),
          kind: scipSyntaxKind(occurrence.syntax_kind ?? occurrence.syntaxKind),
          language,
          metadata: { format: 'scip', rawSymbol: occurrence.symbol, inferredFromOccurrence: true }
        });
      }
      result.occurrences.push({
        id: occurrence.id ?? `occ_${idFragment(documentId)}_${occurrenceIndex + 1}`,
        documentId,
        symbolId,
        role,
        span: spanFromScipOccurrence(occurrence, path, context.sourceHash),
        metadata: {
          format: 'scip',
          symbolRoles: occurrence.symbol_roles ?? occurrence.symbolRoles,
          roleSet: scipOccurrenceRoleSet(occurrence.symbol_roles ?? occurrence.symbolRoles),
          syntaxKind: occurrence.syntax_kind ?? occurrence.syntaxKind,
          overrideDocumentation: occurrence.override_documentation ?? occurrence.overrideDocumentation
        }
      });
      for (const diagnostic of normalizeArray(occurrence.diagnostics)) {
        const scopedDiagnostic = { ...diagnostic, range: diagnostic.range ?? occurrence.range };
        result.facts.push(externalDiagnosticFact(scopedDiagnostic, context, documentId, path, result.facts.length));
        result.losses.push(externalDiagnosticLoss(scopedDiagnostic, context, path));
      }
      if (scipOccurrenceRoleSet(occurrence.symbol_roles ?? occurrence.symbolRoles).includes('generated')) {
        result.losses.push({
          id: `loss_${idFragment(documentId)}_${occurrenceIndex + 1}_generated_scip_occurrence`,
          severity: 'warning',
          phase: 'index',
          sourceFormat: 'scip',
          kind: 'generatedCode',
          message: 'SCIP occurrence is marked generated; merge admission should review generated/source ownership before applying patches.',
          span: spanFromScipOccurrence(occurrence, path, context.sourceHash),
          semanticSymbolId: symbolId,
          metadata: { format: 'scip', symbolRoles: occurrence.symbol_roles ?? occurrence.symbolRoles }
        });
      }
    }
  }
  return withExternalEmptyLoss(result, context);
}
