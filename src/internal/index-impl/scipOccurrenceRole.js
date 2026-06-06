export function scipOccurrenceRole(value) {
  const role = Number(value ?? 0);
  if ((role & 0x1) > 0) return 'definition';
  if ((role & 0x2) > 0) return 'import';
  if ((role & 0x4) > 0) return 'write';
  if ((role & 0x8) > 0) return 'read';
  return 'reference';
}
