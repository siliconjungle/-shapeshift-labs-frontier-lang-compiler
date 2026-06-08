import{uniqueStrings}from'../../native-import-utils.js';

export function nativeProjectionReview(input) {
  const lossIds = (input.losses ?? []).map((loss) => loss.id).filter(Boolean);
  const blockingLossIds = (input.losses ?? []).filter((loss) => loss.severity === 'error').map((loss) => loss.id).filter(Boolean);
  const targetLossIds = (input.targetLosses ?? []).map((loss) => loss.id).filter(Boolean);
  const fallbackReasons = nativeProjectionFallbackReasons(input, blockingLossIds, targetLossIds);
  const reviewRequired = input.readiness !== 'ready' || fallbackReasons.length > 0 || blockingLossIds.length > 0;
  const status = nativeProjectionReviewStatus(input, blockingLossIds);
  return {
    kind: 'frontier.lang.nativeProjectionReview',
    version: 1,
    status,
    reviewRequired,
    projectionMode: input.mode,
    outputMode: input.outputMode ?? input.mode,
    language: input.language,
    sourceLanguage: input.sourceLanguage ?? input.language,
    target: input.target,
    sourcePath: input.sourcePath,
    exactSourceAvailable: input.exactSourceAvailable === true,
    sourceTextAvailable: input.sourceTextAvailable === true,
    sourceHashVerified: input.sourceHashVerified === true,
    declarationCount: input.declarationCount ?? 0,
    sourceMapCount: input.sourceMapCount ?? 0,
    readiness: input.readiness,
    targetLossClass: input.targetCoverage?.lossClass,
    targetReadiness: input.targetCoverage?.readiness,
    targetSupported: input.targetCoverage?.supported,
    targetProjectionAdapterId: input.targetProjection?.adapter?.id,
    fallbackReasons,
    lossIds: uniqueStrings(lossIds),
    blockingLossIds: uniqueStrings(blockingLossIds),
    targetLossIds: uniqueStrings(targetLossIds),
    queryKeys: nativeProjectionReviewQueryKeys(input, status, fallbackReasons, reviewRequired)
  };
}

function nativeProjectionFallbackReasons(input, blockingLossIds, targetLossIds) {
  const reasons = [];
  if (input.exactSourceAvailable !== true) reasons.push('no-exact-source');
  if (input.sourceHashVerified !== true) reasons.push('source-hash-unverified');
  if (input.mode === 'native-source-stubs') reasons.push('declaration-stubs');
  if (input.outputMode === 'target-stubs') reasons.push('target-stubs');
  if (input.targetCoverage?.supported === false) reasons.push('target-unsupported');
  if (input.targetCoverage?.lossClass === 'missingAdapter') reasons.push('missing-target-adapter');
  if (blockingLossIds.length > 0) reasons.push('blocking-losses');
  if (targetLossIds.length > 0) reasons.push('target-losses');
  return uniqueStrings(reasons);
}

function nativeProjectionReviewStatus(input, blockingLossIds) {
  if (blockingLossIds.length > 0 || input.readiness === 'blocked' || input.targetCoverage?.readiness === 'blocked') return 'blocked';
  if (input.outputMode === 'target-adapter') return 'target-adapter';
  if (input.outputMode === 'target-stubs' || input.mode === 'native-source-stubs') return 'stub-only';
  if (input.sourceHashVerified === true && input.exactSourceAvailable === true) return 'preserved-source';
  return 'needs-review';
}

function nativeProjectionReviewQueryKeys(input, status, fallbackReasons, reviewRequired) {
  return uniqueStrings([
    `projection-review:${status}`,
    reviewRequired ? 'review-required' : 'review-not-required',
    input.language ? `language:${input.language}` : undefined,
    input.sourceLanguage ? `source-language:${input.sourceLanguage}` : undefined,
    input.target ? `target:${input.target}` : undefined,
    input.sourcePath ? `source:${input.sourcePath}` : undefined,
    input.mode ? `projection-mode:${input.mode}` : undefined,
    input.outputMode ? `output-mode:${input.outputMode}` : undefined,
    input.targetCoverage?.lossClass ? `target-loss-class:${input.targetCoverage.lossClass}` : undefined,
    ...fallbackReasons.map((reason) => `fallback:${reason}`)
  ].filter(Boolean));
}
