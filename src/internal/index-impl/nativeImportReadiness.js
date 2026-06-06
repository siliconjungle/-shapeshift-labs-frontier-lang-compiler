export function nativeImportReadiness(imported) {
  return imported?.metadata?.semanticMergeReadiness
    ?? imported?.metadata?.nativeImportLossSummary?.semanticMergeReadiness
    ?? imported?.mergeCandidates?.[0]?.readiness
    ?? 'ready';
}
