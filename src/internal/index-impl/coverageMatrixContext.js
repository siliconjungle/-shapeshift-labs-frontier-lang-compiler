import{summarizeImportSourcePreservation}from'../../semantic-import-source-preservation.js';
import{adapterCoverageSnapshotFromSummary}from'./adapterCoverageSnapshotFromSummary.js';import{effectiveNativeImporterAdapterCoverage}from'./effectiveNativeImporterAdapterCoverage.js';import{FrontierCompileTargets}from'./FrontierCompileTargets.js';import{matchingNativeTargetProjectionAdapter}from'./matchingNativeTargetProjectionAdapter.js';import{nativeImportCategoryForLossKind}from'./nativeImportCategoryForLossKind.js';import{nativeImporterAdapterCapabilityEvidence}from'./nativeImporterAdapterCapabilityEvidence.js';import{normalizeNativeImporterAdapter}from'./normalizeNativeImporterAdapter.js';import{normalizeNativeImporterAdapterObservedCoverage}from'./normalizeNativeImporterAdapterObservedCoverage.js';import{normalizeNativeTargetProjectionAdapter}from'./normalizeNativeTargetProjectionAdapter.js';import{observeNativeImporterSemanticEvidence}from'./observeNativeImporterSemanticEvidence.js';import{safeNativeTargetProjectionAdapterSummary}from'./safeNativeTargetProjectionAdapterSummary.js';import{summarizeNativeImportFeatureEvidence}from'./summarizeNativeImportFeatureEvidence.js';import{summarizeNativeImportLosses}from'./summarizeNativeImportLosses.js';
export function coverageMatrixContext() {
  return {
    compileTargets: FrontierCompileTargets,
    adapterCoverageSnapshotFromSummary,
    effectiveNativeImporterAdapterCoverage,
    matchingNativeTargetProjectionAdapter,
    nativeImportCategoryForLossKind,
    nativeImporterAdapterCapabilityEvidence,
    normalizeNativeImporterAdapter,
    normalizeNativeImporterAdapterObservedCoverage,
    normalizeNativeTargetProjectionAdapter,
    observeNativeImporterSemanticEvidence,
    safeNativeTargetProjectionAdapterSummary,
    summarizeImportSourcePreservation,
    summarizeNativeImportFeatureEvidence,
    summarizeNativeImportLosses
  };
}
