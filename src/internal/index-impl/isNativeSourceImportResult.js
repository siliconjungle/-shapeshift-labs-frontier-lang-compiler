export function isNativeSourceImportResult(input) {
  return Boolean(input && typeof input === 'object' && input.kind === 'frontier.lang.importResult' && input.nativeSource && input.universalAst);
}
