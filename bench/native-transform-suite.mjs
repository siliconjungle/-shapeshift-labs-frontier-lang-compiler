import { performance } from 'node:perf_hooks';
import {
  compileNativeSource,
  createNativeSourcePreservation,
  createSemanticLineageEvent,
  createSemanticLineageMap,
  createSemanticImportSidecar,
  createSemanticSlice,
  createSemanticSliceAdmissionRecord,
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  projectNativeImportToSource,
  resolveSemanticLineageBatch,
  summarizeNativeImportFeatureEvidence,
  testSemanticSlice
} from '../dist/index.js';

export function measureNativeTransformations(nativeImportResults) {
  const preservationStart = performance.now();
  const preservationRecords = nativeImportResults.map((imported) => imported.metadata.sourcePreservation ?? createNativeSourcePreservation({
    language: imported.language,
    sourcePath: imported.sourcePath,
    sourceText: imported.metadata.sourcePreservation?.sourceText ?? ''
  }));
  const sourcePreservationDurationMs = performance.now() - preservationStart;
  const sourcePreservationTokens = preservationRecords.reduce((sum, record) => sum + record.tokens.length + record.trivia.length, 0);

  const sidecarStart = performance.now();
  const semanticSidecars = nativeImportResults.map((imported) => createSemanticImportSidecar(imported));
  const sidecarDurationMs = performance.now() - sidecarStart;
  const sidecarOwnershipRegions = semanticSidecars.reduce((sum, sidecar) => sum + sidecar.ownershipRegions.length, 0);

  const sliceStart = performance.now();
  const semanticSlices = nativeImportResults.slice(0, 100).map((imported, index) => {
    const symbol = imported.semanticIndex?.symbols?.[0]?.name ?? imported.semanticIndex?.symbols?.[0]?.id;
    return createSemanticSlice(imported, {
      entryRefs: symbol ? [`symbol:${symbol}`] : [],
      includeDependencies: index % 2 === 0,
      focusedCommands: [`npm test -- semantic-slice-${index}`]
    });
  });
  const sliceDurationMs = performance.now() - sliceStart;
  const sliceSourceMapLinks = semanticSlices.reduce((sum, slice) => sum + slice.sourceMapLinks.length, 0);
  const sliceConflictKeys = semanticSlices.reduce((sum, slice) => sum + slice.mergeAdmission.conflictKeys.length, 0);
  const sliceGateStart = performance.now();
  const semanticSliceGates = semanticSlices.map((slice) => testSemanticSlice(slice, { requireSourceMapLinks: false }));
  const sliceGateDurationMs = performance.now() - sliceGateStart;
  const sliceGateFailures = semanticSliceGates.filter((gate) => gate.status === 'failed').length;
  const sliceAdmissionStart = performance.now();
  const semanticSliceAdmissions = semanticSlices.map((slice, index) => createSemanticSliceAdmissionRecord(slice, {
    testResult: semanticSliceGates[index]
  }));
  const sliceAdmissionDurationMs = performance.now() - sliceAdmissionStart;

  const conversionPlanStart = performance.now();
  const conversionPlan = createUniversalConversionPlan({
    imports: nativeImportResults.slice(0, 100),
    targets: ['javascript', 'rust', 'python']
  });
  const conversionPlanDurationMs = performance.now() - conversionPlanStart;
  const conversionArtifactsStart = performance.now();
  const conversionArtifacts = createUniversalConversionArtifacts(conversionPlan);
  const conversionArtifactsDurationMs = performance.now() - conversionArtifactsStart;

  const lineageResolutionStart = performance.now();
  const lineageEvents = [];
  const lineageQueries = [];
  for (let index = 0; index < 100; index += 1) {
    const fromKey = `bench#lineage#${index}#0`;
    const midKey = `bench#lineage#${index}#1`;
    const targetKey = `bench#lineage#${index}#2`;
    lineageQueries.push(fromKey);
    lineageEvents.push(createSemanticLineageEvent({
      id: `bench_lineage_${index}_move`,
      createdAt: index * 2,
      eventKind: 'moved',
      from: { key: fromKey, sourcePath: `src/${index}.ts` },
      to: { key: midKey, sourcePath: `src/runtime/${index}.ts` },
      confidence: 0.96
    }));
    lineageEvents.push(createSemanticLineageEvent({
      id: `bench_lineage_${index}_rename`,
      createdAt: index * 2 + 1,
      eventKind: index % 10 === 0 ? 'split' : 'renamed',
      from: { key: midKey, sourcePath: `src/runtime/${index}.ts` },
      to: index % 10 === 0
        ? [{ key: `${targetKey}:a` }, { key: `${targetKey}:b` }]
        : { key: targetKey, sourcePath: `src/runtime/${index}.ts` },
      confidence: 0.91
    }));
  }
  const lineageResolutions = resolveSemanticLineageBatch(createSemanticLineageMap(lineageEvents), lineageQueries);
  const lineageResolutionDurationMs = performance.now() - lineageResolutionStart;

  const featureEvidenceStart = performance.now();
  const featureEvidenceSummaries = nativeImportResults.map((imported) => summarizeNativeImportFeatureEvidence(imported.losses, {
    evidence: imported.evidence
  }));
  const featureEvidenceDurationMs = performance.now() - featureEvidenceStart;
  const featureEvidencePolicyMatches = featureEvidenceSummaries.reduce((sum, summary) => sum + summary.total, 0);

  const projectionStart = performance.now();
  const nativeProjections = nativeImportResults.map((imported) => projectNativeImportToSource(imported));
  const projectionDurationMs = performance.now() - projectionStart;
  const projectionBytes = nativeProjections.reduce((sum, projection) => sum + projection.sourceText.length, 0);

  const compileMetrics = measureNativeCompiles(nativeImportResults);
  const targetAdapterMetrics = measureNativeTargetAdapterCompiles(nativeImportResults);
  return {
    sourcePreservationRecords: preservationRecords.length,
    sourcePreservationTokens,
    sourcePreservationDurationMs,
    semanticSidecars: semanticSidecars.length,
    sidecarOwnershipRegions,
    sidecarDurationMs,
    semanticSlices: semanticSlices.length,
    sliceDurationMs,
    sliceGateDurationMs,
    sliceAdmissionDurationMs,
    sliceSourceMapLinks,
    sliceConflictKeys,
    sliceGateFailures,
    sliceAdmissions: semanticSliceAdmissions.length,
    sliceAdmissionRejected: semanticSliceAdmissions.filter((admission) => admission.action === 'reject').length,
    conversionPlanRoutes: conversionPlan.routes.length,
    conversionPlanBlocked: conversionPlan.summary.blockedRoutes,
    conversionPlanDurationMs,
    conversionArtifacts: conversionArtifacts.summary.routes,
    conversionArtifactHistories: conversionArtifacts.summary.histories,
    conversionArtifactPatchBundles: conversionArtifacts.summary.patchBundles,
    conversionArtifactAdmissionRecords: conversionArtifacts.summary.admissionRecords,
    conversionArtifactMergeReady: conversionArtifacts.summary.mergeReady,
    conversionArtifactNeedsEvidence: conversionArtifacts.summary.needsEvidence,
    conversionArtifactNeedsAdapter: conversionArtifacts.summary.needsAdapter,
    conversionArtifactNeedsReview: conversionArtifacts.summary.needsReview,
    conversionArtifactAdmissionBlocked: conversionArtifacts.summary.admissionBlocked,
    conversionArtifactLowRisk: conversionArtifacts.summary.lowRisk,
    conversionArtifactMediumRisk: conversionArtifacts.summary.mediumRisk,
    conversionArtifactHighRisk: conversionArtifacts.summary.highRisk,
    conversionArtifactQueued: conversionArtifacts.summary.queued,
    conversionArtifactAdmissionReasonCodes: conversionArtifacts.summary.reasonCodes,
    conversionArtifactAdmissionMissingEvidence: conversionArtifacts.summary.missingEvidence,
    conversionArtifactAdmissionBlockers: conversionArtifacts.summary.blockers,
    conversionArtifactAdmissionReviewReasons: conversionArtifacts.summary.reviewReasons,
    conversionArtifactAdmissionEvidenceIds: conversionArtifacts.summary.evidenceIds,
    conversionArtifactAdmissionProofIds: conversionArtifacts.summary.proofIds,
    conversionArtifactsDurationMs,
    lineageResolutionEvents: lineageEvents.length,
    lineageResolutions: lineageResolutions.length,
    lineageResolutionAmbiguous: lineageResolutions.filter((result) => result.status === 'ambiguous').length,
    lineageResolutionDurationMs,
    featureEvidencePolicyMatches,
    featureEvidenceDurationMs,
    nativeProjections: nativeProjections.length,
    projectionBytes,
    projectionDurationMs,
    ...compileMetrics,
    ...targetAdapterMetrics
  };
}

function measureNativeCompiles(nativeImportResults) {
  const nativeCompileStart = performance.now();
  const nativeCompiles = nativeImportResults.map((imported, index) => compileNativeSource(imported, {
    target: index % 2 === 0 ? 'javascript' : 'rust',
    emitOnBlocked: true
  }));
  const nativeCompileDurationMs = performance.now() - nativeCompileStart;
  return {
    nativeCompiles: nativeCompiles.length,
    nativeCompileBytes: nativeCompiles.reduce((sum, result) => sum + result.output.length, 0),
    nativeCompileSourceMaps: nativeCompiles.reduce((sum, result) => sum + result.sourceMaps.length, 0),
    nativeCompileSourceMapMappings: nativeCompiles.reduce((sum, result) => sum + result.sourceMaps.reduce((mapSum, sourceMap) => mapSum + sourceMap.mappings.length, 0), 0),
    nativeCompileBlocked: nativeCompiles.filter((result) => result.readiness.readiness === 'blocked').length,
    nativeCompileDurationMs
  };
}

function measureNativeTargetAdapterCompiles(nativeImportResults) {
  const nativeTargetAdapterStart = performance.now();
  const nativeTargetAdapterCompiles = nativeImportResults.slice(0, 25).map((imported, index) => {
    const target = index % 2 === 0 ? 'rust' : 'python';
    return compileNativeSource(imported, {
      target,
      targetAdapters: [{
        id: `bench-target-adapter-${index}`,
        sourceLanguage: imported.language,
        target,
        coverage: {
          readiness: 'needs-review',
          handledLossKinds: ['dynamicRuntime', 'dynamicDispatch', 'typeInference', 'overloadResolution']
        },
        project() {
          return { output: `// bench target adapter ${index}\n`, readiness: 'needs-review' };
        }
      }]
    });
  });
  const nativeTargetAdapterDurationMs = performance.now() - nativeTargetAdapterStart;
  return {
    nativeTargetAdapterCompiles: nativeTargetAdapterCompiles.length,
    nativeTargetAdapterBytes: nativeTargetAdapterCompiles.reduce((sum, result) => sum + result.output.length, 0),
    nativeTargetAdapterSourceMaps: nativeTargetAdapterCompiles.reduce((sum, result) => sum + result.sourceMaps.length, 0),
    nativeTargetAdapterDurationMs
  };
}
