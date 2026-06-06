import{idFragment}from'../../native-import-utils.js';
import{normalizeExternalOccurrenceRole}from'./normalizeExternalOccurrenceRole.js';import{normalizeExternalSpan}from'./normalizeExternalSpan.js';
export function externalOccurrence(occurrence, context, index) {
  return {
    ...occurrence,
    id: occurrence.id ?? `occ_${context.idPart}_${index + 1}`,
    documentId: occurrence.documentId ?? occurrence.document_id ?? `doc_${idFragment(occurrence.path ?? context.sourcePath ?? context.format)}`,
    symbolId: occurrence.symbolId ?? occurrence.symbol_id ?? occurrence.symbol ?? `symbol:${context.format}:unknown`,
    role: normalizeExternalOccurrenceRole(occurrence.role),
    span: normalizeExternalSpan(occurrence.span ?? occurrence.range, occurrence.path ?? context.sourcePath, context.sourceHash),
    metadata: { format: context.format, ...occurrence.metadata }
  };
}
