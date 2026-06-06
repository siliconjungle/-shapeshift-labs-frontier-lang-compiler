export function adapterCoverageSourcePreservation(parseResult = {}) {
  return parseResult.sourcePreservation
    ?? parseResult.nativeAst?.metadata?.sourcePreservation
    ?? parseResult.nativeAstMetadata?.sourcePreservation
    ?? parseResult.metadata?.sourcePreservation;
}
