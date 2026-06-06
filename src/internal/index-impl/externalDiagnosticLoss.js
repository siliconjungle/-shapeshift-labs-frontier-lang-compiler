import{idFragment}from'../../native-import-utils.js';
import{externalDiagnosticSeverity}from'./externalDiagnosticSeverity.js';import{normalizeExternalSpan}from'./normalizeExternalSpan.js';
export function externalDiagnosticLoss(diagnostic, context, sourcePath) {
  const severity = externalDiagnosticSeverity(diagnostic.severity);
  return {
    id: diagnostic.id ?? `loss_${context.idPart}_${idFragment(diagnostic.code ?? diagnostic.message ?? severity)}_${idFragment(sourcePath)}`,
    severity,
    phase: 'index',
    sourceFormat: context.format,
    kind: severity === 'error' ? 'unsupportedSemantic' : 'partialSemanticIndex',
    message: String(diagnostic.message ?? `${context.format} diagnostic reported ${severity}.`),
    span: normalizeExternalSpan(diagnostic.range ?? diagnostic.span, sourcePath, context.sourceHash),
    metadata: {
      format: context.format,
      code: diagnostic.code,
      source: diagnostic.source,
      tags: diagnostic.tags
    }
  };
}
