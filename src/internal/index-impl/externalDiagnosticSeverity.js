export function externalDiagnosticSeverity(value) {
  if (value === undefined || value === null || value === '') return 'error';
  const raw = String(value).toLowerCase();
  if (raw === '1' || raw.includes('error')) return 'error';
  if (raw === '3' || raw.includes('info') || raw.includes('hint')) return 'info';
  return 'warning';
}
