export function nativeImportReadinessReasons(input) {
  if (input.failedEvidenceIds.length) {
    return [`Failed native import evidence prevents merge: ${input.failedEvidenceIds.join(', ')}`];
  }
  if (input.blockingLossIds.length) {
    return [`Native import error loss(es) block semantic merge: ${input.blockingLossIds.join(', ')}`];
  }
  if (input.reviewLossIds.length) {
    return [`Native import warning loss(es) require review: ${input.reviewLossIds.join(', ')}`];
  }
  if (input.informationalLossIds.length) {
    return [`Native import recorded informational loss(es): ${input.informationalLossIds.join(', ')}`];
  }
  if (input.exactAst) return ['Native import supplied exact AST coverage with no recorded loss.'];
  return ['Native import has no recorded loss.'];
}
