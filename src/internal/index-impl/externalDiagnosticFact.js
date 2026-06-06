import{idFragment}from'../../native-import-utils.js';
import{normalizeExternalSpan}from'./normalizeExternalSpan.js';
export function externalDiagnosticFact(diagnostic, context, documentId, sourcePath, index) {
  return {
    id: diagnostic.id ? `fact_${idFragment(diagnostic.id)}_diagnostic` : `fact_${context.idPart}_${idFragment(sourcePath)}_diagnostic_${index + 1}`,
    predicate: `${context.format}.diagnostic`,
    subjectId: documentId,
    value: {
      severity: diagnostic.severity,
      code: diagnostic.code,
      message: diagnostic.message,
      source: diagnostic.source,
      tags: diagnostic.tags,
      range: diagnostic.range,
      span: normalizeExternalSpan(diagnostic.range ?? diagnostic.span, sourcePath, context.sourceHash)
    },
    metadata: {
      format: context.format,
      source: 'external-semantic-index'
    }
  };
}
