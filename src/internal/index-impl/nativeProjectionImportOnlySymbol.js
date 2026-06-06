export function nativeProjectionImportOnlySymbol(symbol, occurrences = []) {
  if (String(symbol.id ?? '').includes(':import:')) return true;
  if (occurrences.length && occurrences.every((occurrence) => occurrence.role === 'import')) return true;
  return symbol.kind === 'module' && occurrences.some((occurrence) => occurrence.role === 'import');
}
