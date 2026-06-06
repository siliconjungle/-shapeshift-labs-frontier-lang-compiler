import{maxSemanticMergeReadiness,uniqueStrings}from'../../native-import-utils.js';
import{createNativeImportResultContract}from'./createNativeImportResultContract.js';
export function withNativeImportReadiness(importResult, lossSummary) {
  const mergeCandidates = (importResult.mergeCandidates ?? []).map((candidate) => {
    const readiness = maxSemanticMergeReadiness(candidate.readiness, lossSummary.semanticMergeReadiness);
    return {
      ...candidate,
      readiness,
      reasons: uniqueStrings([
        ...(candidate.reasons ?? []),
        ...lossSummary.readinessReasons
      ]),
      metadata: {
        ...candidate.metadata,
        nativeImportLossSummary: lossSummary,
        severityReadiness: lossSummary.semanticMergeReadiness,
        finalReadiness: readiness,
        lossCategories: lossSummary.categories,
        lossSeverityCounts: lossSummary.bySeverity,
        lossKindCounts: lossSummary.byKind
      }
    };
  });
  const semanticMergeReadiness = mergeCandidates[0]?.readiness ?? lossSummary.semanticMergeReadiness;
  const contractInput = {
    ...importResult,
    mergeCandidates,
    metadata: {
      ...importResult.metadata,
      nativeImportLossSummary: lossSummary,
      semanticMergeReadiness
    }
  };
  const importResultContract = createNativeImportResultContract(contractInput, { lossSummary });
  return {
    ...importResult,
    mergeCandidates,
    metadata: {
      ...importResult.metadata,
      importResultContract,
      nativeImportLossSummary: lossSummary,
      semanticMergeReadiness,
      readinessReasons: importResultContract.readiness.reasons,
      sourcePreservationSummary: importResultContract.sourcePreservation,
      adapterCoverageSummary: importResultContract.adapterCoverage,
      regionSummary: importResultContract.regions,
      sourceMapSummary: importResultContract.sourceMaps,
      lossCategories: lossSummary.categories,
      lossSeverityCounts: lossSummary.bySeverity,
      lossKindCounts: lossSummary.byKind
    }
  };
}
