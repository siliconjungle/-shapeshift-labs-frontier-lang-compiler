import{idFragment}from'../../native-import-utils.js';
import{normalizeDiagnosticSeverity}from'./normalizeDiagnosticSeverity.js';
export function normalizeAdapterDiagnostics(value, adapter, input, scope = 'diagnostic') {
  if (value === undefined || value === null) return [];
  const diagnostics = Array.isArray(value) ? value : [value];
  return diagnostics.map((diagnostic, index) => {
    const normalized = typeof diagnostic === 'string' ? { message: diagnostic } : diagnostic ?? {};
    const severity = normalizeDiagnosticSeverity(normalized.severity);
    return Object.freeze({
      id: normalized.id ?? `diagnostic_${idFragment(adapter.id)}_${idFragment(scope)}_${index + 1}`,
      severity,
      code: normalized.code,
      phase: normalized.phase ?? 'parse',
      kind: normalized.kind,
      message: String(normalized.message ?? `${adapter.id} reported a ${severity} diagnostic.`),
      path: normalized.path ?? input.sourcePath,
      span: normalized.span,
      metadata: {
        adapterId: adapter.id,
        adapterVersion: adapter.version,
        language: input.language ?? adapter.language,
        parser: input.parser ?? adapter.parser,
        parserVersion: input.parserVersion,
        ...normalized.metadata
      }
    });
  });
}
