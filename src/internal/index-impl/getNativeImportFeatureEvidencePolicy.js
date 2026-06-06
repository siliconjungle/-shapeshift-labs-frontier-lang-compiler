import{NativeImportFeatureEvidencePolicies}from'./NativeImportFeatureEvidencePolicies.js';import{normalizeNativeLossKind}from'./normalizeNativeLossKind.js';
export function getNativeImportFeatureEvidencePolicy(kind) {
  const normalized = normalizeNativeLossKind({ kind }, 'warning');
  return NativeImportFeatureEvidencePolicies[normalized] ?? NativeImportFeatureEvidencePolicies[String(kind ?? '')];
}
