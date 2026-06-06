import{uniqueByEvidenceId}from'../../native-import-utils.js';
import{externalDocument}from'./externalDocument.js';import{externalFact}from'./externalFact.js';import{externalOccurrence}from'./externalOccurrence.js';import{externalRelation}from'./externalRelation.js';import{externalSemanticBase}from'./externalSemanticBase.js';import{externalSymbol}from'./externalSymbol.js';import{normalizeArray}from'./normalizeArray.js';import{withExternalEmptyLoss}from'./withExternalEmptyLoss.js';
export function normalizeFrontierSemanticIndexPayload(payload, context) {
  const result = externalSemanticBase(context, { sourceFormat: payload.kind ?? 'frontier.lang.semanticIndex' });
  result.repository = payload.repository ?? result.repository;
  result.documents = normalizeArray(payload.documents).map((document, index) => externalDocument(document, context, index));
  result.symbols = normalizeArray(payload.symbols).map((symbol, index) => externalSymbol(symbol, context, index));
  result.occurrences = normalizeArray(payload.occurrences).map((occurrence, index) => externalOccurrence(occurrence, context, index));
  result.relations = normalizeArray(payload.relations).map((relation, index) => externalRelation(relation, context, index));
  result.facts = normalizeArray(payload.facts).map((fact, index) => externalFact(fact, context, index));
  result.evidence = uniqueByEvidenceId([...(payload.evidence ?? []), ...result.evidence]);
  if (payload.metadata) result.metadata = { ...result.metadata, ...payload.metadata };
  return withExternalEmptyLoss(result, context);
}
