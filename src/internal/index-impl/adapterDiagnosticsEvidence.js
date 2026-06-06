import{idFragment}from'../../native-import-utils.js';
import{serializableDiagnostic}from'./serializableDiagnostic.js';
export function adapterDiagnosticsEvidence(adapter, diagnostics, input) {
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const warnings = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length;
  return {
    id: `evidence_${idFragment(adapter.id)}_native_importer_adapter`,
    kind: 'import',
    status: errors ? 'failed' : 'passed',
    path: input.sourcePath,
    summary: `Ran ${adapter.id} native importer for ${input.language} with ${diagnostics.length} diagnostic(s).`,
    metadata: {
      adapterId: adapter.id,
      adapterVersion: adapter.version,
      language: input.language,
      parser: input.parser,
      parserVersion: input.parserVersion,
      sourceHash: input.sourceHash,
      capabilities: adapter.capabilities,
      coverage: adapter.coverage,
      supportedExtensions: adapter.supportedExtensions,
      diagnostics: diagnostics.map(serializableDiagnostic),
      errors,
      warnings
    }
  };
}
