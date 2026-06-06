import{uniqueStrings}from'../../native-import-utils.js';
export function nativeImportRoundtripReasons(status, input) {
  if (status === 'blocked') return uniqueStrings(input.blockingReasons);
  if (status === 'stub-only') {
    return uniqueStrings([
      `Native source projection emitted declaration stubs in ${input.projection.mode} mode.`,
      ...input.projectionReadiness.reasons,
      ...input.importReadiness.reasons.filter((reason) => input.importReadiness.readiness !== 'ready')
    ]);
  }
  if (status === 'needs-review') return uniqueStrings(input.reviewReasons);
  if (status === 'exact') {
    return ['Exact native AST import and verified preserved source projection are available.'];
  }
  if (status === 'preserved-source') {
    return uniqueStrings([
      'Verified native source text is preserved for projection; semantic import evidence may still require review.',
      ...input.importReadiness.reasons.filter((reason) => input.importReadiness.readiness !== 'ready')
    ]);
  }
  return ['Native import roundtrip readiness requires review.'];
}
