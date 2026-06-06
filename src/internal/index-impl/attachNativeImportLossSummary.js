export function attachNativeImportLossSummary(evidence, lossSummary) {
  return (evidence ?? []).map((record) => ({
    ...record,
    metadata: {
      ...record.metadata,
      nativeImportLossSummary: lossSummary,
      semanticMergeReadiness: lossSummary.semanticMergeReadiness,
      lossCategories: lossSummary.categories
    }
  }));
}
