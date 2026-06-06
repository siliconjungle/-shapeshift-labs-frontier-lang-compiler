export function nativeSourceCompileEvidence(input) {
  const failed = input.targetLosses.some((loss) => loss.severity === 'error')
    || input.projection.evidence?.some((record) => record.status === 'failed')
    || input.targetCoverage.readiness === 'blocked';
  return {
    id: input.id,
    kind: 'projection',
    status: failed ? 'failed' : 'passed',
    path: input.importResult.sourcePath ?? input.importResult.nativeSource?.sourcePath,
    summary: failed
      ? `Compiled ${input.sourceLanguage} native source to ${input.target} with blocked projection evidence.`
      : `Compiled ${input.sourceLanguage} native source to ${input.target} as ${input.outputMode}.`,
    metadata: {
      importId: input.importResult.id,
      projectionId: input.projection.id,
      targetProjectionId: input.targetProjection?.id,
      targetProjectionAdapterId: input.targetProjection?.adapter?.id,
      sourceLanguage: input.sourceLanguage,
      target: input.target,
      outputHash: input.outputHash ?? input.projection.outputHash,
      outputMode: input.outputMode,
      projectionMode: input.projection.mode,
      targetLossClass: input.targetCoverage.lossClass,
      targetReadiness: input.targetCoverage.readiness,
      targetSupported: input.targetCoverage.supported,
      targetReason: input.targetCoverage.reason,
      targetLossIds: input.targetLosses.map((loss) => loss.id)
    }
  };
}
