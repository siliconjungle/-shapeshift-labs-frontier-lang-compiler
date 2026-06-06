export function normalizeExternalOccurrenceRole(role) {
  const value = String(role ?? 'reference').toLowerCase();
  if (value.includes('def')) return 'definition';
  if (value.includes('decl')) return 'declaration';
  if (value.includes('import')) return 'import';
  if (value.includes('write')) return 'write';
  if (value.includes('read')) return 'read';
  return value === '2' ? 'definition' : value === '1' ? 'reference' : 'reference';
}
