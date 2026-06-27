import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { assertRealRepoCorpusOracleCoverageMetrics, measureRealRepoCorpus } from './real-repo-corpus-suite.mjs';

const splitWorkspaceMode = !existsSync(new URL('../src/index.js', import.meta.url)) &&
  !existsSync(new URL('./compile-suite.mjs', import.meta.url));

if (splitWorkspaceMode) {
  const realRepoCorpusMetrics = measureRealRepoCorpus();
  assertRealRepoCorpusSmokeMetrics(realRepoCorpusMetrics);
  console.log(JSON.stringify({
    benchSmokeMode: 'real-repo-corpus-only-split-workspace',
    ...realRepoCorpusMetrics
  }));
} else {
const [
  { measureFrontierCompile },
  { collectNativeImports },
  { measureNativeMatrices },
  { measureNativeTransformations },
  { measureSourceChangeSuites },
  { measureUniversalFixtureSuite }
] = await Promise.all([
  import('./compile-suite.mjs'),
  import('./native-import-suite.mjs'),
  import('./native-matrix-suite.mjs'),
  import('./native-transform-suite.mjs'),
  import('./source-change-suite.mjs'),
  import('./universal-fixture-suite.mjs')
]);

const compileMetrics = measureFrontierCompile();
const importMetrics = await collectNativeImports();
const matrixMetrics = measureNativeMatrices(importMetrics.nativeImportResults, importMetrics.adapters);
const transformMetrics = measureNativeTransformations(importMetrics.nativeImportResults);
const realRepoCorpusMetrics = measureRealRepoCorpus();
const sourceChangeMetrics = measureSourceChangeSuites();
const universalFixtureMetrics = measureUniversalFixtureSuite(importMetrics.adapters);

assertRealRepoCorpusSmokeMetrics(realRepoCorpusMetrics);

console.log(JSON.stringify({
  benchSmokeMode: 'full-package',
  compiles: 250,
  bytes: compileMetrics.bytes,
  compileDurationMs: Number(compileMetrics.compileDurationMs.toFixed(2)),
  nativeImports: importMetrics.nativeImportResults.length,
  nativeSymbols: importMetrics.nativeSymbols,
  nativeImportDurationMs: Number(importMetrics.nativeImportDurationMs.toFixed(2)),
  coverageMatrixLanguages: matrixMetrics.coverageMatrix.summary.languages,
  coverageMatrixImports: matrixMetrics.coverageMatrix.summary.imports,
  adapterCoverageSummaries: matrixMetrics.coverageMatrix.summary.adapterCoverage.total,
  adapterCoverageSourceRanges: matrixMetrics.coverageMatrix.summary.adapterCoverage.effective.sourceRanges ?? 0,
  adapterCoverageTokenGaps: matrixMetrics.coverageMatrix.summary.adapterCoverage.gaps.tokens ?? 0,
  adapterCoverageReferenceGaps: matrixMetrics.coverageMatrix.summary.adapterCoverage.gaps.references ?? 0,
  coverageMatrixDurationMs: Number(matrixMetrics.coverageMatrixDurationMs.toFixed(2)),
  parserFormatMatrixFormats: matrixMetrics.parserFormatMatrix.summary.formats,
  parserFormatMatrixImports: matrixMetrics.parserFormatMatrix.summary.imports,
  parserFormatMatrixNativeAstNodes: matrixMetrics.parserFormatMatrix.summary.nativeAstNodes,
  parserFormatMatrixDurationMs: Number(matrixMetrics.parserFormatMatrixDurationMs.toFixed(2)),
  parserFeatureMatrixParsers: matrixMetrics.parserFeatureMatrix.summary.parsers,
  parserFeatureMatrixMergeReady: matrixMetrics.parserFeatureMatrix.summary.mergeReady,
  parserFeatureMatrixSyntaxFull: matrixMetrics.parserFeatureMatrix.summary.byFeatureStatus.syntax?.full ?? 0,
  parserFeatureQueryMergeReady: matrixMetrics.parserFeatureQuery.merge.mergeReady,
  parserFeatureMatrixDurationMs: Number(matrixMetrics.parserFeatureMatrixDurationMs.toFixed(2)),
  projectionMatrixLanguages: matrixMetrics.projectionLossMatrix.summary.languages,
  projectionMatrixMissingAdapters: matrixMetrics.projectionLossMatrix.summary.missingAdapters,
  projectionMatrixUnsupportedTargetFeatures: matrixMetrics.projectionLossMatrix.summary.unsupportedTargetFeatures,
  projectionMatrixDurationMs: Number(matrixMetrics.projectionMatrixDurationMs.toFixed(2)),
  universalMatrixLanguages: matrixMetrics.universalCapabilityMatrix.summary.languages,
  universalMatrixImports: matrixMetrics.universalCapabilityMatrix.summary.imports,
  universalMatrixBlockedLanguages: matrixMetrics.universalCapabilityMatrix.summary.blockedLanguages,
  universalMatrixMissingAdapters: matrixMetrics.universalCapabilityMatrix.summary.missingAdapters,
  universalMatrixDurationMs: Number(matrixMetrics.universalMatrixDurationMs.toFixed(2)),
  sourcePreservationRecords: transformMetrics.sourcePreservationRecords,
  sourcePreservationTokens: transformMetrics.sourcePreservationTokens,
  sourcePreservationDurationMs: Number(transformMetrics.sourcePreservationDurationMs.toFixed(2)),
  semanticSidecars: transformMetrics.semanticSidecars,
  sidecarOwnershipRegions: transformMetrics.sidecarOwnershipRegions,
  sidecarDurationMs: Number(transformMetrics.sidecarDurationMs.toFixed(2)),
  semanticSlices: transformMetrics.semanticSlices,
  sliceDurationMs: Number(transformMetrics.sliceDurationMs.toFixed(2)),
  sliceGateDurationMs: Number(transformMetrics.sliceGateDurationMs.toFixed(2)),
  sliceAdmissionDurationMs: Number(transformMetrics.sliceAdmissionDurationMs.toFixed(2)),
  sliceSourceMapLinks: transformMetrics.sliceSourceMapLinks,
  sliceConflictKeys: transformMetrics.sliceConflictKeys,
  sliceGateFailures: transformMetrics.sliceGateFailures,
  sliceAdmissions: transformMetrics.sliceAdmissions,
  sliceAdmissionRejected: transformMetrics.sliceAdmissionRejected,
  conversionPlanRoutes: transformMetrics.conversionPlanRoutes,
  conversionPlanBlocked: transformMetrics.conversionPlanBlocked,
  conversionPlanDurationMs: Number(transformMetrics.conversionPlanDurationMs.toFixed(2)),
  conversionArtifacts: transformMetrics.conversionArtifacts,
  conversionArtifactHistories: transformMetrics.conversionArtifactHistories,
  conversionArtifactPatchBundles: transformMetrics.conversionArtifactPatchBundles,
  conversionArtifactAdmissionRecords: transformMetrics.conversionArtifactAdmissionRecords,
  conversionArtifactMergeReady: transformMetrics.conversionArtifactMergeReady,
  conversionArtifactNeedsEvidence: transformMetrics.conversionArtifactNeedsEvidence,
  conversionArtifactNeedsAdapter: transformMetrics.conversionArtifactNeedsAdapter,
  conversionArtifactNeedsReview: transformMetrics.conversionArtifactNeedsReview,
  conversionArtifactAdmissionBlocked: transformMetrics.conversionArtifactAdmissionBlocked,
  conversionArtifactLowRisk: transformMetrics.conversionArtifactLowRisk,
  conversionArtifactMediumRisk: transformMetrics.conversionArtifactMediumRisk,
  conversionArtifactHighRisk: transformMetrics.conversionArtifactHighRisk,
  conversionArtifactQueued: transformMetrics.conversionArtifactQueued,
  conversionArtifactAdmissionReasonCodes: transformMetrics.conversionArtifactAdmissionReasonCodes,
  conversionArtifactAdmissionMissingEvidence: transformMetrics.conversionArtifactAdmissionMissingEvidence,
  conversionArtifactAdmissionBlockers: transformMetrics.conversionArtifactAdmissionBlockers,
  conversionArtifactAdmissionReviewReasons: transformMetrics.conversionArtifactAdmissionReviewReasons,
  conversionArtifactAdmissionEvidenceIds: transformMetrics.conversionArtifactAdmissionEvidenceIds,
  conversionArtifactAdmissionProofIds: transformMetrics.conversionArtifactAdmissionProofIds,
  conversionArtifactsDurationMs: Number(transformMetrics.conversionArtifactsDurationMs.toFixed(2)),
  lineageResolutionEvents: transformMetrics.lineageResolutionEvents,
  lineageResolutions: transformMetrics.lineageResolutions,
  lineageResolutionAmbiguous: transformMetrics.lineageResolutionAmbiguous,
  lineageResolutionDurationMs: Number(transformMetrics.lineageResolutionDurationMs.toFixed(2)),
  featureEvidencePolicyMatches: transformMetrics.featureEvidencePolicyMatches,
  featureEvidenceDurationMs: Number(transformMetrics.featureEvidenceDurationMs.toFixed(2)),
  nativeProjections: transformMetrics.nativeProjections,
  projectionBytes: transformMetrics.projectionBytes,
  projectionDurationMs: Number(transformMetrics.projectionDurationMs.toFixed(2)),
  nativeCompiles: transformMetrics.nativeCompiles,
  nativeCompileBytes: transformMetrics.nativeCompileBytes,
  nativeCompileSourceMaps: transformMetrics.nativeCompileSourceMaps,
  nativeCompileSourceMapMappings: transformMetrics.nativeCompileSourceMapMappings,
  nativeCompileBlocked: transformMetrics.nativeCompileBlocked,
  nativeCompileDurationMs: Number(transformMetrics.nativeCompileDurationMs.toFixed(2)),
  nativeTargetAdapterCompiles: transformMetrics.nativeTargetAdapterCompiles,
  nativeTargetAdapterBytes: transformMetrics.nativeTargetAdapterBytes,
  nativeTargetAdapterSourceMaps: transformMetrics.nativeTargetAdapterSourceMaps,
  nativeTargetAdapterDurationMs: Number(transformMetrics.nativeTargetAdapterDurationMs.toFixed(2)),
  regionScanImports: sourceChangeMetrics.regionScanImports,
  regionScanSymbols: sourceChangeMetrics.regionScanSymbols,
  regionScanDependencyRelations: sourceChangeMetrics.regionScanDependencyRelations,
  regionScanOwnershipRegions: sourceChangeMetrics.regionScanOwnershipRegions,
  regionScanDurationMs: Number(sourceChangeMetrics.regionScanDurationMs.toFixed(2)),
  changeProjectionSets: sourceChangeMetrics.changeProjectionSets,
  changedRegionProjections: sourceChangeMetrics.changedRegionProjections,
  changedRegionProjectionSourceMapLinks: sourceChangeMetrics.changedRegionProjectionSourceMapLinks,
  changeProjectionDurationMs: Number(sourceChangeMetrics.changeProjectionDurationMs.toFixed(2)),
  semanticLineageInferences: sourceChangeMetrics.semanticLineageInferences,
  semanticLineageEvents: sourceChangeMetrics.semanticLineageEvents,
  semanticLineageDeleted: sourceChangeMetrics.semanticLineageDeleted,
  semanticLineageInferenceDurationMs: Number(sourceChangeMetrics.semanticLineageInferenceDurationMs.toFixed(2)),
  bidirectionalTargetChanges: sourceChangeMetrics.bidirectionalTargetChanges,
  bidirectionalTargetChangeMatches: sourceChangeMetrics.bidirectionalTargetChangeMatches,
  bidirectionalTargetChangeSourceMapBacked: sourceChangeMetrics.bidirectionalTargetChangeSourceMapBacked,
  bidirectionalTargetChangeBlocked: sourceChangeMetrics.bidirectionalTargetChangeBlocked,
  bidirectionalTargetChangeDurationMs: Number(sourceChangeMetrics.bidirectionalTargetChangeDurationMs.toFixed(2)),
  externalSemanticImports: sourceChangeMetrics.externalSemanticImports,
  externalSemanticSymbols: sourceChangeMetrics.externalSemanticSymbols,
  externalSemanticMappings: sourceChangeMetrics.externalSemanticMappings,
  externalSemanticDurationMs: Number(sourceChangeMetrics.externalSemanticDurationMs.toFixed(2)),
  universalFixtureImports: universalFixtureMetrics.imports,
  universalFixtureLanguages: universalFixtureMetrics.languages,
  universalFixtureRoutes: universalFixtureMetrics.routes,
  universalFixtureTargetAdapterRoutes: universalFixtureMetrics.targetAdapterRoutes,
  universalFixtureSemanticIndexOnlyRoutes: universalFixtureMetrics.semanticIndexOnlyRoutes,
  universalFixtureRouteScoreMin: universalFixtureMetrics.routeScoreMin,
  universalFixtureRouteScoreMax: universalFixtureMetrics.routeScoreMax,
  universalFixtureLossSummaries: universalFixtureMetrics.lossSummaries,
  universalFixtureLossCategories: universalFixtureMetrics.lossCategories,
  universalFixtureCandidateRecords: universalFixtureMetrics.candidateRecords,
  universalFixtureBestCandidateSortKey: universalFixtureMetrics.bestCandidateSortKey,
  universalFixtureDurationMs: Number(universalFixtureMetrics.durationMs.toFixed(2)),
  ...realRepoCorpusMetrics
}));
}

function assertRealRepoCorpusSmokeMetrics(realRepoCorpusMetrics) {
  assertRealRepoCorpusOracleCoverageMetrics(realRepoCorpusMetrics);
  assert.equal(realRepoCorpusMetrics.realRepoCorpusRealisticPatternOracleFixtures >= 2, true, 'real-repo realistic-pattern oracle fixtures');
  assert.equal(realRepoCorpusMetrics.realRepoCorpusCheckoutProofEntries, realRepoCorpusMetrics.realRepoCorpusEntries, 'real-repo checkout proof rows');
  assert.equal(
    realRepoCorpusMetrics.realRepoCorpusCheckoutSkipped + realRepoCorpusMetrics.realRepoCorpusCheckoutCheckedOut,
    realRepoCorpusMetrics.realRepoCorpusEntries,
    'real-repo checkout proof skipped/checked-out accounting'
  );
  assert.equal(
    realRepoCorpusMetrics.realRepoCorpusCheckoutProofSkipped + realRepoCorpusMetrics.realRepoCorpusCheckoutProofExecuted,
    realRepoCorpusMetrics.realRepoCorpusEntries,
    'real-repo checkout proof skipped/executed accounting'
  );
  assert.equal(realRepoCorpusMetrics.realRepoCorpusCheckoutEvidenceRows.length, realRepoCorpusMetrics.realRepoCorpusEntries, 'real-repo checkout evidence rows');
  assert.equal(
    realRepoCorpusMetrics.realRepoCorpusCheckoutEvidenceSkipped + realRepoCorpusMetrics.realRepoCorpusCheckoutEvidenceExecuted,
    realRepoCorpusMetrics.realRepoCorpusEntries,
    'real-repo checkout evidence skipped/executed accounting'
  );
  assert.equal(
    realRepoCorpusMetrics.realRepoCorpusCheckoutIdentitySkipped + realRepoCorpusMetrics.realRepoCorpusCheckoutIdentityExecuted,
    realRepoCorpusMetrics.realRepoCorpusEntries,
    'real-repo checkout identity skipped/executed accounting'
  );
  assert.equal(Number.isInteger(realRepoCorpusMetrics.realRepoCorpusCheckoutGitDirectories), true, 'real-repo git directory proof metric');
  assert.equal(Number.isInteger(realRepoCorpusMetrics.realRepoCorpusCheckoutGitDirPointers), true, 'real-repo gitdir pointer proof metric');
  assert.equal(Number.isInteger(realRepoCorpusMetrics.realRepoCorpusCheckoutGitConfigsPresent), true, 'real-repo git config proof metric');
  assert.equal(Number.isInteger(realRepoCorpusMetrics.realRepoCorpusCheckoutGitOriginUrlsPresent), true, 'real-repo git origin proof metric');
  assert.equal(realRepoCorpusMetrics.realRepoCorpusRepositoryCommandsRun, 0, 'real-repo default bench must not execute repository commands');
  assert.equal(realRepoCorpusMetrics.realRepoCorpusDependencyInstallsRun, 0, 'real-repo default bench must not execute dependency installs');
  assert.equal(
    realRepoCorpusMetrics.realRepoCorpusRepositoryCommandDefaultOffRows,
    realRepoCorpusMetrics.realRepoCorpusEntries,
    'real-repo repository command default-off rows'
  );
  assert.equal(
    realRepoCorpusMetrics.realRepoCorpusCommandDryRunPhaseRows,
    realRepoCorpusMetrics.realRepoCorpusEntries * 3,
    'real-repo command dry-run phase rows'
  );
  assert.equal(realRepoCorpusMetrics.realRepoCorpusCommandDryRunPhaseKinds, 3, 'real-repo command dry-run phase kinds');
  assert.equal(
    realRepoCorpusMetrics.realRepoCorpusCommandDryRunSkippedPhases,
    realRepoCorpusMetrics.realRepoCorpusCheckoutEvidenceSkipped * 3,
    'real-repo command dry-run skipped phase accounting'
  );
  assert.equal(
    realRepoCorpusMetrics.realRepoCorpusCommandDryRunReadyPhases,
    realRepoCorpusMetrics.realRepoCorpusCheckoutEvidenceExecuted * 3,
    'real-repo command dry-run ready phase accounting'
  );
  assert.equal(
    realRepoCorpusMetrics.realRepoCorpusCommandDryRunOptInRequiredPhases,
    realRepoCorpusMetrics.realRepoCorpusCheckoutEvidenceExecuted * 3,
    'real-repo command dry-run opt-in phase accounting'
  );
  assert.equal(realRepoCorpusMetrics.realRepoCorpusCommandDryRunExecutedPhases, 0, 'real-repo command dry-run executed phases');
  assert.equal(
    realRepoCorpusMetrics.realRepoCorpusCommandDryRunDefaultOffPhases,
    realRepoCorpusMetrics.realRepoCorpusCommandDryRunPhaseRows,
    'real-repo command dry-run default-off phases'
  );
  assert.equal(realRepoCorpusMetrics.realRepoCorpusCommandRunRows, realRepoCorpusMetrics.realRepoCorpusEntries, 'real-repo command-run rows');
  assert.equal(realRepoCorpusMetrics.realRepoCorpusCommandRunEnabledRows, 0, 'real-repo default command-run enabled rows');
  assert.equal(realRepoCorpusMetrics.realRepoCorpusCommandRunDefaultOffRows, realRepoCorpusMetrics.realRepoCorpusEntries, 'real-repo default command-run rows');
  assert.equal(realRepoCorpusMetrics.realRepoCorpusCommandRunExecutedPhases, 0, 'real-repo command-run executed phases');
  assert.equal(realRepoCorpusMetrics.realRepoCorpusCommandRunFailedPhases, 0, 'real-repo command-run failed phases');
  assert.equal(realRepoCorpusMetrics.realRepoCorpusCommandRunTimedOutPhases, 0, 'real-repo command-run timed-out phases');
  assert.equal(realRepoCorpusMetrics.realRepoCorpusCommandRunOutputTruncatedPhases, 0, 'real-repo command-run truncated output phases');
}
