export function nativeImportEntries(importResult) {
  if (Array.isArray(importResult?.imports)) return importResult.imports.filter(Boolean);
  return [importResult].filter(Boolean);
}
