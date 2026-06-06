export function semanticDbOccurrenceRole(value) {
  const role = String(value ?? 'reference').toLowerCase();
  if (role === '2' || role.includes('definition')) return 'definition';
  return 'reference';
}
