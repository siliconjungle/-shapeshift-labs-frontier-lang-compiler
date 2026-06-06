import{maxSemanticMergeReadiness,uniqueStrings}from'../../native-import-utils.js';
import{getNativeImportFeatureEvidencePolicy}from'./getNativeImportFeatureEvidencePolicy.js';import{nativeFeatureEvidenceRiskRank}from'./nativeFeatureEvidenceRiskRank.js';import{nativeImportFeatureEvidenceHasKey}from'./nativeImportFeatureEvidenceHasKey.js';import{nativeImportFeatureEvidenceIds}from'./nativeImportFeatureEvidenceIds.js';import{nativeImportFeatureEvidenceReasons}from'./nativeImportFeatureEvidenceReasons.js';import{normalizeNativeLossRecords}from'./normalizeNativeLossRecords.js';
export function summarizeNativeImportFeatureEvidence(losses = [], options = {}) {
  const normalizedLosses = normalizeNativeLossRecords(losses);
  const evidence = options.evidence ?? [];
  const issues = [];
  const byKind = {};
  const byRisk = {};
  const policyKinds = [];
  let highestRisk = 'low';
  let semanticMergeReadiness = 'ready';

  for (const loss of normalizedLosses) {
    const policy = getNativeImportFeatureEvidencePolicy(loss.kind);
    if (!policy) continue;
    byKind[policy.kind] = (byKind[policy.kind] ?? 0) + 1;
    byRisk[policy.risk] = (byRisk[policy.risk] ?? 0) + 1;
    if ((nativeFeatureEvidenceRiskRank[policy.risk] ?? 0) > (nativeFeatureEvidenceRiskRank[highestRisk] ?? 0)) {
      highestRisk = policy.risk;
    }
    policyKinds.push(policy.kind);
    semanticMergeReadiness = maxSemanticMergeReadiness(semanticMergeReadiness, policy.minimumReadiness);
    const missingRequiredEvidence = policy.requiredEvidenceKeys.filter((key) => !nativeImportFeatureEvidenceHasKey(loss, evidence, key));
    const presentRequiredEvidence = policy.requiredEvidenceKeys.filter((key) => !missingRequiredEvidence.includes(key));
    const presentRecommendedEvidence = policy.recommendedEvidenceKeys.filter((key) => nativeImportFeatureEvidenceHasKey(loss, evidence, key));
    if (missingRequiredEvidence.length) {
      semanticMergeReadiness = maxSemanticMergeReadiness(semanticMergeReadiness, policy.missingEvidenceReadiness);
    }
    issues.push({
      lossId: loss.id,
      kind: loss.kind,
      policyKind: policy.kind,
      risk: policy.risk,
      category: policy.category,
      readiness: missingRequiredEvidence.length ? policy.missingEvidenceReadiness : policy.minimumReadiness,
      missingRequiredEvidence,
      presentRequiredEvidence,
      presentRecommendedEvidence,
      evidenceIds: nativeImportFeatureEvidenceIds(loss, evidence, policy)
    });
  }

  const missingRequiredEvidence = issues.flatMap((issue) => issue.missingRequiredEvidence.map((key) => ({
    lossId: issue.lossId,
    kind: issue.kind,
    policyKind: issue.policyKind,
    evidenceKey: key
  })));
  return {
    total: issues.length,
    policyKinds: uniqueStrings(policyKinds),
    byKind,
    byRisk,
    highestRisk: issues.length ? highestRisk : 'low',
    semanticMergeReadiness,
    missingRequiredEvidence,
    issues,
    reasons: nativeImportFeatureEvidenceReasons(issues)
  };
}
