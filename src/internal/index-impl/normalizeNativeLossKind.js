export function normalizeNativeLossKind(loss, severity) {
  const kind = String(loss.kind ?? '').trim();
  if (kind) return kind;
  if (loss.metadata?.diagnosticId || loss.metadata?.diagnosticCode) {
    return severity === 'error' ? 'unsupportedSyntax' : 'parserDiagnostic';
  }
  return severity === 'error' ? 'unsupportedSyntax' : 'opaqueNative';
}
