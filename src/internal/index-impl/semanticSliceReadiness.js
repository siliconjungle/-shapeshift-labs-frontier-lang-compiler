import{maxSemanticMergeReadiness}from'../../native-import-utils.js';
import{summarizeNativeImportLosses}from'./summarizeNativeImportLosses.js';
export function semanticSliceReadiness(context, selection, unresolvedEntryRefs) {
  if (unresolvedEntryRefs.length) return 'blocked';
  if (selection.symbols.length + selection.regions.length + selection.nativeNodes.length === 0) return 'blocked';
  const lossReadiness = summarizeNativeImportLosses(selection.losses, { evidence: context.importResult?.evidence }).semanticMergeReadiness;
  return [
    context.importResult?.metadata?.semanticMergeReadiness,
    context.importResult?.metadata?.nativeImportLossSummary?.semanticMergeReadiness,
    context.sidecar?.summary?.readiness,
    ...(context.importResult?.mergeCandidates ?? []).map((candidate) => candidate.readiness),
    lossReadiness
  ].reduce((current, value) => maxSemanticMergeReadiness(current, value ?? 'ready'), 'ready');
}
