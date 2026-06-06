import{idFragment}from'../../native-import-utils.js';
export function adapterDiagnosticToLoss(diagnostic, index, adapter, input) {
  const code = diagnostic.code ?? diagnostic.kind ?? diagnostic.severity;
  return {
    id: `loss_${idFragment(diagnostic.id ?? `${adapter.id}_${index}_${code}`)}`,
    severity: diagnostic.severity,
    phase: diagnostic.phase,
    sourceFormat: input.language,
    kind: diagnostic.kind ?? (diagnostic.severity === 'error' ? 'unsupportedSyntax' : 'opaqueNative'),
    message: diagnostic.message,
    span: diagnostic.span,
    metadata: {
      adapterId: adapter.id,
      adapterVersion: adapter.version,
      diagnosticId: diagnostic.id,
      diagnosticCode: diagnostic.code,
      parser: input.parser,
      parserVersion: input.parserVersion,
      path: diagnostic.path,
      ...diagnostic.metadata
    }
  };
}
