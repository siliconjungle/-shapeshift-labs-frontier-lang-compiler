import{uniqueStrings}from'../../native-import-utils.js';
export function semanticSliceReasons(context, selection, unresolvedEntryRefs, readiness) {
  return uniqueStrings([
    unresolvedEntryRefs.length ? `Unresolved semantic slice entry refs: ${unresolvedEntryRefs.join(', ')}` : undefined,
    selection.symbols.length + selection.regions.length + selection.nativeNodes.length === 0 ? 'Semantic slice selected no reviewable records.' : undefined,
    selection.mappings.length === 0 ? 'Semantic slice has no source-map links; source review may need file-level fallback.' : undefined,
    selection.losses.length ? `Semantic slice carries ${selection.losses.length} native import loss record(s).` : undefined,
    readiness !== 'ready' ? `Semantic slice readiness is ${readiness}.` : undefined,
    context.importResult?.metadata?.nativeImportLossSummary?.semanticMergeReadiness === 'needs-review' ? 'Parent native import requires review.' : undefined
  ].filter(Boolean));
}
