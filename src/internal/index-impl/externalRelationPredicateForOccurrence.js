export function externalRelationPredicateForOccurrence(occurrence) {
  const role = String(occurrence.role ?? '').toLowerCase();
  if (role === 'definition' || role === 'declaration') return 'defines';
  if (role === 'import') return 'imports';
  if (role === 'write') return 'writes';
  if (role === 'read') return 'reads';
  return 'references';
}
