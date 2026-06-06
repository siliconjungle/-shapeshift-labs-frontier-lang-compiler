import{normalizeProjectionMatrixTargets}from'../../coverage-matrix-profiles.js';import{idFragment,maxSemanticMergeReadiness,normalizeNativeLanguageId,normalizeSemanticMergeReadiness,uniqueByEvidenceId,uniqueByLossId,uniqueStrings}from'../../native-import-utils.js';import{hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';
import{classifyNativeImportReadiness}from'./classifyNativeImportReadiness.js';import{nativeTargetProjectionAdapterEvidence}from'./nativeTargetProjectionAdapterEvidence.js';import{nativeTargetProjectionDiagnosticToLoss}from'./nativeTargetProjectionDiagnosticToLoss.js';import{normalizeAdapterDiagnostics}from'./normalizeAdapterDiagnostics.js';import{normalizeNativeTargetProjectionAdapter}from'./normalizeNativeTargetProjectionAdapter.js';import{serializableDiagnostic}from'./serializableDiagnostic.js';import{summarizeNativeImportLosses}from'./summarizeNativeImportLosses.js';
export function runNativeTargetProjectionAdapter(adapter, input = {}) {
  const summary = normalizeNativeTargetProjectionAdapter(adapter);
  const sourceLanguage = normalizeNativeLanguageId(input.sourceLanguage ?? summary.sourceLanguage);
  const target = normalizeProjectionMatrixTargets([input.target ?? summary.target])[0] ?? summary.target;
  const diagnosticContext = {
    sourcePath: input.importResult?.sourcePath ?? input.importResult?.nativeSource?.sourcePath,
    sourceHash: input.importResult?.sourceHash ?? input.importResult?.nativeSource?.sourceHash,
    language: sourceLanguage,
    parser: `target:${target}`,
    parserVersion: summary.version
  };
  const projectInput = {
    importResult: input.importResult,
    sourceProjection: input.sourceProjection,
    sourceLanguage,
    target,
    targetPath: input.targetPath,
    targetCoverage: input.targetCoverage,
    options: input.options ?? {},
    metadata: input.metadata ?? {}
  };
  let projected;
  let thrownDiagnostic;
  try {
    projected = adapter.project(projectInput) ?? {};
  } catch (error) {
    thrownDiagnostic = {
      severity: 'error',
      code: 'targetAdapter.project.threw',
      phase: 'emit',
      kind: 'targetProjectionLoss',
      message: error instanceof Error ? error.message : String(error),
      metadata: {
        errorName: error instanceof Error ? error.name : undefined
      }
    };
    projected = {};
  }
  const diagnostics = [
    ...normalizeAdapterDiagnostics(summary.diagnostics, summary, diagnosticContext, 'target-adapter'),
    ...(thrownDiagnostic ? normalizeAdapterDiagnostics([thrownDiagnostic], summary, diagnosticContext, 'throw') : []),
    ...normalizeAdapterDiagnostics(projected.diagnostics, summary, diagnosticContext, 'project')
  ];
  const output = typeof projected.output === 'string' ? projected.output : input.sourceProjection?.sourceText ?? '';
  const outputHash = projected.outputHash ?? hashSemanticValue(output);
  const adapterEvidence = nativeTargetProjectionAdapterEvidence(summary, diagnostics, {
    ...diagnosticContext,
    sourceLanguage,
    target,
    outputHash,
    targetPath: input.targetPath
  });
  const evidence = uniqueByEvidenceId([
    ...(projected.evidence ?? []),
    adapterEvidence
  ]);
  const losses = uniqueByLossId([
    ...(projected.losses ?? []),
    ...diagnostics.map((diagnostic, index) => nativeTargetProjectionDiagnosticToLoss(diagnostic, index, summary, {
      ...diagnosticContext,
      sourceLanguage,
      target
    }))
  ]);
  const lossSummary = summarizeNativeImportLosses(losses, {
    evidence,
    parser: diagnosticContext.parser,
    scanKind: 'native-target-projection',
    semanticStatus: input.importResult?.metadata?.semanticStatus
  });
  const classifiedReadiness = classifyNativeImportReadiness(losses, {
    evidence,
    parser: diagnosticContext.parser,
    scanKind: 'native-target-projection',
    semanticStatus: input.importResult?.metadata?.semanticStatus
  });
  const declaredReadiness = normalizeSemanticMergeReadiness(projected.readiness ?? summary.coverage.readiness);
  const readiness = declaredReadiness
    ? {
      ...classifiedReadiness,
      readiness: maxSemanticMergeReadiness(classifiedReadiness.readiness, declaredReadiness),
      reasons: uniqueStrings([
        ...classifiedReadiness.reasons,
        ...(declaredReadiness === classifiedReadiness.readiness ? [] : [`Target adapter declared readiness ${declaredReadiness}.`])
      ])
    }
    : classifiedReadiness;
  return {
    kind: 'frontier.lang.nativeTargetProjection',
    version: 1,
    id: projected.id ?? `native_target_projection_${idFragment(summary.id)}_${idFragment(sourceLanguage)}_${idFragment(target)}`,
    sourceLanguage,
    target,
    targetPath: input.targetPath,
    adapter: summary,
    output,
    outputHash,
    outputMode: 'target-adapter',
    sourceMaps: projected.sourceMaps ?? [],
    losses,
    lossSummary,
    readiness,
    evidence,
    diagnostics: diagnostics.map(serializableDiagnostic),
    metadata: {
      importId: input.importResult?.id,
      projectionId: input.sourceProjection?.id,
      targetCoverageLossClass: input.targetCoverage?.lossClass,
      targetCoverageReadiness: input.targetCoverage?.readiness,
      ...projected.metadata
    }
  };
}
