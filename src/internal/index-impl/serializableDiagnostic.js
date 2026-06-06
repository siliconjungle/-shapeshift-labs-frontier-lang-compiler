export function serializableDiagnostic(diagnostic) {
  return {
    id: diagnostic.id,
    severity: diagnostic.severity,
    code: diagnostic.code,
    phase: diagnostic.phase,
    kind: diagnostic.kind,
    message: diagnostic.message,
    path: diagnostic.path,
    span: diagnostic.span,
    metadata: diagnostic.metadata
  };
}
