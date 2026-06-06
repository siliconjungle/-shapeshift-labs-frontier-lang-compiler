import{nativeImportFeatureEvidenceValue}from'./nativeImportFeatureEvidenceValue.js';import{nativeImportFeatureEvidenceValuePresent}from'./nativeImportFeatureEvidenceValuePresent.js';
export function nativeImportFeatureEvidenceHasKey(loss, evidence, key) {
  return nativeImportFeatureEvidenceValuePresent(nativeImportFeatureEvidenceValue(loss, key))
    || (evidence ?? []).some((record) => nativeImportFeatureEvidenceValuePresent(nativeImportFeatureEvidenceValue(record, key)));
}
