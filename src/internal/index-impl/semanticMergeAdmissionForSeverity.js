export function semanticMergeAdmissionForSeverity(severity) {
  if (severity === 'error') return 'blocked';
  if (severity === 'warning') return 'review';
  return 'disclose';
}
