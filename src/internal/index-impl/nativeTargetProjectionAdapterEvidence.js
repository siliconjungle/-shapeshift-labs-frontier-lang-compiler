import{idFragment}from'../../native-import-utils.js';
import{serializableDiagnostic}from'./serializableDiagnostic.js';
export function nativeTargetProjectionAdapterEvidence(adapter, diagnostics, input) {
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const warnings = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length;
  return {
    id: `evidence_${idFragment(adapter.id)}_native_target_projection_adapter`,
    kind: 'projection',
    status: errors ? 'failed' : 'passed',
    path: input.sourcePath,
    summary: `Ran ${adapter.id} native target projection adapter from ${input.sourceLanguage} to ${input.target} with ${diagnostics.length} diagnostic(s).`,
    metadata: {
      adapterId: adapter.id,
      adapterVersion: adapter.version,
      sourceLanguage: input.sourceLanguage,
      target: input.target,
      targetPath: input.targetPath,
      outputHash: input.outputHash,
      capabilities: adapter.capabilities,
      coverage: adapter.coverage,
      diagnostics: diagnostics.map(serializableDiagnostic),
      errors,
      warnings
    }
  };
}
