import{semanticMergeAdmissionForSeverity}from'./semanticMergeAdmissionForSeverity.js';
export function nativeSourceCompileTargetLoss(input) {
  const rootSpan = input.importResult.nativeAst?.nodes?.[input.importResult.nativeAst?.rootId]?.span
    ?? input.importResult.nativeSource?.ast?.nodes?.[input.importResult.nativeSource?.ast?.rootId]?.span;
  return {
    id: input.id,
    severity: input.severity,
    phase: 'emit',
    sourceFormat: input.sourceLanguage,
    kind: 'targetProjectionLoss',
    message: input.message,
    span: rootSpan ?? {
      sourceId: input.importResult.nativeSource?.sourceHash ?? input.importResult.sourceHash,
      path: input.importResult.sourcePath ?? input.importResult.nativeSource?.sourcePath,
      startLine: 1,
      startColumn: 1
    },
    metadata: {
      target: input.target,
      sourceLanguage: input.sourceLanguage,
      projectionId: input.projection.id,
      projectionMode: input.projection.mode,
      targetLossClass: input.targetCoverage.lossClass,
      targetReadiness: input.targetCoverage.readiness,
      targetSupported: input.targetCoverage.supported,
      targetAdapter: input.targetCoverage.adapter,
      targetLossKinds: input.targetCoverage.lossKinds,
      lossCategory: 'targetProjectionLoss',
      semanticMergeAdmission: semanticMergeAdmissionForSeverity(input.severity)
    }
  };
}
