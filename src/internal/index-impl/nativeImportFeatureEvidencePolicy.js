import{normalizeSemanticMergeReadiness,uniqueStrings}from'../../native-import-utils.js';
import{nativeImportCategoryForLossKind}from'./nativeImportCategoryForLossKind.js';
export function nativeImportFeatureEvidencePolicy(kind, input = {}) {
  return Object.freeze({
    kind,
    category: input.category ?? nativeImportCategoryForLossKind(kind),
    risk: input.risk ?? 'medium',
    minimumReadiness: normalizeSemanticMergeReadiness(input.minimumReadiness) ?? 'needs-review',
    missingEvidenceReadiness: normalizeSemanticMergeReadiness(input.missingEvidenceReadiness) ?? 'needs-review',
    requiredEvidenceKeys: Object.freeze(uniqueStrings(input.requiredEvidenceKeys ?? [])),
    recommendedEvidenceKeys: Object.freeze(uniqueStrings(input.recommendedEvidenceKeys ?? [])),
    notes: Object.freeze(uniqueStrings(input.notes ?? []))
  });
}
