import{idFragment}from'../../native-import-utils.js';
export function nativeTargetProjectionDiagnosticToLoss(diagnostic, index, adapter, input) {
  return {
    id: `loss_${idFragment(diagnostic.id ?? `${adapter.id}_${index}_${diagnostic.code ?? diagnostic.severity}`)}`,
    severity: diagnostic.severity,
    phase: diagnostic.phase ?? 'emit',
    sourceFormat: input.sourceLanguage,
    kind: diagnostic.kind ?? 'targetProjectionLoss',
    message: diagnostic.message,
    span: diagnostic.span,
    metadata: {
      adapterId: adapter.id,
      adapterVersion: adapter.version,
      diagnosticId: diagnostic.id,
      diagnosticCode: diagnostic.code,
      sourceLanguage: input.sourceLanguage,
      target: input.target,
      path: diagnostic.path,
      ...diagnostic.metadata
    }
  };
}
