import{summarizeNativeImportLosses}from'./summarizeNativeImportLosses.js';
export function classifyNativeImportReadiness(losses = [], options = {}) {
  const summary = summarizeNativeImportLosses(losses, options);
  return {
    readiness: summary.semanticMergeReadiness,
    reasons: summary.readinessReasons,
    summary
  };
}
