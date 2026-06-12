const readinessScore = Object.freeze({ ready: 100, 'ready-with-losses': 75, 'needs-review': 45, blocked: 0 });

export function targetProjectionCoverageSignals(input) {
  const entries = targetProjectionEntries(input.projectResult, input.imports);
  const matrices = projectionMatrices(input.projectResult, input.imports);
  for (const matrix of matrices) {
    for (const language of matrix?.languages ?? []) entries.push(...(language?.targets ?? []));
  }
  const sourceMapSummary = input.contract?.sourceMaps ?? {};
  const summary = matrices.reduce((current, matrix) => {
    current.exactSourceProjection += matrix?.summary?.exactSourceProjection ?? 0;
    current.targetAdapterProjection += matrix?.summary?.targetAdapterProjection ?? 0;
    current.missingAdapters += matrix?.summary?.missingAdapters ?? 0;
    current.unsupportedTargetFeatures += matrix?.summary?.unsupportedTargetFeatures ?? 0;
    return current;
  }, { exactSourceProjection: 0, targetAdapterProjection: 0, missingAdapters: 0, unsupportedTargetFeatures: 0 });
  const targetEntries = entries.length;
  const supportedTargets = entries.filter((entry) => entry?.supported === true).length;
  const adapterProjectionTargets = entries.filter((entry) =>
    entry?.lossClass === 'targetAdapterProjection' || entry?.lossClass === 'exactSourceProjection' || entry?.adapter || entry?.adapterKind === 'targetProjection'
  ).length + summary.targetAdapterProjection + summary.exactSourceProjection;
  const readinessValues = entries.map((entry) => readinessScore[entry?.readiness] ?? 45);
  const readinessAverage = readinessValues.length ? readinessValues.reduce((sum, value) => sum + value, 0) / readinessValues.length : 0;
  return {
    targetEntries,
    supportedTargets,
    adapterProjectionTargets,
    exactSourceProjection: Math.max(summary.exactSourceProjection, input.sourcePreservation.exactSourceAvailable ?? 0),
    targetAdapterProjection: summary.targetAdapterProjection,
    missingAdapters: summary.missingAdapters + entries.filter((entry) => entry?.lossClass === 'missingAdapter' || entry?.supported === false).length,
    unsupportedTargetFeatures: summary.unsupportedTargetFeatures + entries.filter((entry) => entry?.lossClass === 'unsupportedTargetFeatures').length,
    readinessScore: roundScore(readinessAverage),
    sourceMapMappings: sourceMapSummary.mappingCount ?? 0,
    generatedRangeMappings: sourceMapSummary.generatedRangeMappings ?? 0,
    targetPaths: sourceMapSummary.targetPaths?.length ?? 0,
    adapterGeneratedRanges: input.contract?.adapterCoverage?.generatedRanges ?? 0
  };
}

function targetProjectionEntries(projectResult, imports) {
  return [
    projectResult?.targetCoverage,
    projectResult?.metadata?.targetCoverage,
    projectResult?.metadata?.targetProjectionCoverage,
    ...(projectResult?.targetCoverages ?? []),
    ...(projectResult?.metadata?.targetCoverages ?? []),
    ...(imports ?? []).flatMap((imported) => [
      imported?.targetCoverage,
      imported?.metadata?.targetCoverage,
      imported?.metadata?.targetProjectionCoverage,
      ...(imported?.targetCoverages ?? []),
      ...(imported?.metadata?.targetCoverages ?? [])
    ])
  ].flatMap((entry) => Array.isArray(entry) ? entry : [entry]).filter((entry) => entry && typeof entry === 'object' && (entry.target || entry.lossClass || entry.supported !== undefined));
}

function projectionMatrices(projectResult, imports) {
  return [
    projectResult?.projectionMatrix,
    projectResult?.metadata?.projectionMatrix,
    ...(projectResult?.projectionMatrices ?? []),
    ...(projectResult?.metadata?.projectionMatrices ?? []),
    ...(imports ?? []).flatMap((imported) => [
      imported?.projectionMatrix,
      imported?.metadata?.projectionMatrix,
      ...(imported?.projectionMatrices ?? []),
      ...(imported?.metadata?.projectionMatrices ?? [])
    ])
  ].filter((matrix) => matrix?.kind === 'frontier.lang.projectionTargetLossMatrix' || Array.isArray(matrix?.languages));
}

function roundScore(value) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}
