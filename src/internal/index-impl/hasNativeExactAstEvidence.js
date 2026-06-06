import{nativeAstNodes}from'./nativeAstNodes.js';
export function hasNativeExactAstEvidence(input, nativeAst, lightweight) {
  if (lightweight) return false;
  if (!(input?.nativeAst || input?.nodes)) return false;
  if (input.exactAst === true || input.metadata?.exactAst === true || input.nativeAstMetadata?.exactAst === true) return true;
  const coverage = input.metadata?.adapterCoverage
    ?? input.nativeAstMetadata?.adapterCoverage
    ?? input.nativeSourceMetadata?.adapterCoverage
    ?? nativeAst?.metadata?.adapterCoverage;
  if (coverage?.exactAst !== true) return false;
  const observedNodes = coverage.observed?.nativeAstNodes;
  return observedNodes === undefined || observedNodes > 0;
}
