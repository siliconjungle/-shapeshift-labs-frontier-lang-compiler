import{uniqueStrings}from'../../native-import-utils.js';
import{lossSeverityRank}from'./lossSeverityRank.js';import{nativeImportCategoryForLossKind}from'./nativeImportCategoryForLossKind.js';import{NativeImportReadinessBySeverity}from'./NativeImportReadinessBySeverity.js';import{nativeImportReadinessReasons}from'./nativeImportReadinessReasons.js';import{normalizeNativeLossRecords}from'./normalizeNativeLossRecords.js';import{summarizeNativeImportFeatureEvidence}from'./summarizeNativeImportFeatureEvidence.js';
export function summarizeNativeImportLosses(losses = [], options = {}) {
  const normalizedLosses = normalizeNativeLossRecords(losses);
  const bySeverity = { info: 0, warning: 0, error: 0 };
  const byKind = {};
  const blockingLossIds = [];
  const reviewLossIds = [];
  const informationalLossIds = [];
  let highestSeverity = 'none';

  for (const loss of normalizedLosses) {
    bySeverity[loss.severity] += 1;
    byKind[loss.kind] = (byKind[loss.kind] ?? 0) + 1;
    if (lossSeverityRank[loss.severity] > lossSeverityRank[highestSeverity]) {
      highestSeverity = loss.severity;
    }
    if (loss.severity === 'error') blockingLossIds.push(loss.id);
    else if (loss.severity === 'warning') reviewLossIds.push(loss.id);
    else informationalLossIds.push(loss.id);
  }

  const failedEvidenceIds = (options.evidence ?? [])
    .filter((record) => record?.status === 'failed')
    .map((record) => record.id)
    .filter(Boolean);
  const exactAst = Boolean(options.exactAst) && normalizedLosses.length === 0;
  const categories = uniqueStrings([
    ...(exactAst ? ['exactAstImport'] : []),
    ...normalizedLosses.map((loss) => nativeImportCategoryForLossKind(loss.kind))
  ]);
  const semanticMergeReadiness = failedEvidenceIds.length
    ? 'blocked'
    : NativeImportReadinessBySeverity[highestSeverity];
  const readinessReasons = nativeImportReadinessReasons({
    exactAst,
    failedEvidenceIds,
    blockingLossIds,
    reviewLossIds,
    informationalLossIds
  });
  const featureEvidence = summarizeNativeImportFeatureEvidence(normalizedLosses, {
    evidence: options.evidence
  });

  return {
    total: normalizedLosses.length,
    hasLosses: normalizedLosses.length > 0,
    exactAst,
    highestSeverity,
    semanticMergeReadiness,
    readinessReasons,
    categories,
    bySeverity,
    byKind,
    blockingLossIds,
    reviewLossIds,
    informationalLossIds,
    failedEvidenceIds,
    featureEvidence,
    parser: options.parser,
    scanKind: options.scanKind,
    semanticStatus: options.semanticStatus
  };
}
