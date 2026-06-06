export function normalizeLossSeverity(value) {
  const severity = String(value ?? 'warning').toLowerCase();
  if (severity === 'error') return 'error';
  if (severity === 'info') return 'info';
  return 'warning';
}
