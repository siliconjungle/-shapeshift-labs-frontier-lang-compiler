import{uniqueStrings}from'../../native-import-utils.js';
import{nativeImportFeatureEvidenceValue}from'./nativeImportFeatureEvidenceValue.js';import{nativeImportFeatureEvidenceValuePresent}from'./nativeImportFeatureEvidenceValuePresent.js';
export function nativeImportFeatureEvidenceIds(loss, evidence, policy) {
  const keys = [...policy.requiredEvidenceKeys, ...policy.recommendedEvidenceKeys];
  return uniqueStrings((evidence ?? [])
    .filter((record) => keys.some((key) => nativeImportFeatureEvidenceValuePresent(nativeImportFeatureEvidenceValue(record, key))))
    .map((record) => record.id)
    .filter(Boolean)
    .concat(loss.evidenceIds ?? []));
}
