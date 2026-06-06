import{nativeProjectionLoss}from'./nativeProjectionLoss.js';
export function nativeProjectionStubLosses(context, candidateSource, declarations, options) {
  const reason = candidateSource?.mismatch
    ? 'source-hash-mismatch'
    : options.preferPreservedSource === false && candidateSource?.sourceText
      ? 'preserved-source-disabled'
      : 'exact-source-unavailable';
  const message = candidateSource?.mismatch
    ? 'Provided native source text hash did not match the import result source hash; emitted declaration stubs instead of preserving stale source.'
    : options.preferPreservedSource === false && candidateSource?.sourceText
      ? 'Native source projection was asked to emit declaration stubs instead of preserving available source text.'
      : 'Exact native source text was not provided; emitted declaration stubs reconstructed from import metadata.';
  const losses = [nativeProjectionLoss(context, {
    id: `loss_${context.idPart}_native_source_stub`,
    kind: candidateSource?.mismatch ? 'sourcePreservation' : 'targetProjectionLoss',
    severity: 'warning',
    message,
    metadata: {
      reason,
      projectionMode: 'native-source-stubs',
      expectedSourceHash: context.sourceHash,
      providedSourceHash: candidateSource?.sourceHash,
      declaredSourceHash: candidateSource?.declaredSourceHash
    }
  })];
  if (!declarations.length) {
    losses.push(nativeProjectionLoss(context, {
      id: `loss_${context.idPart}_native_source_stub_empty`,
      kind: 'declarationOnlyCoverage',
      severity: 'warning',
      message: 'Native import result did not expose semantic declarations for source stub generation.',
      metadata: { reason: 'no-stub-declarations', projectionMode: 'native-source-stubs' }
    }));
  }
  return losses;
}
