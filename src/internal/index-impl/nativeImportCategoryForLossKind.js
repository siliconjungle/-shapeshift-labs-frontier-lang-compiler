export function nativeImportCategoryForLossKind(kind) {
  if (kind === 'declarationOnlyCoverage') return 'declarationsOnly';
  if (kind === 'opaqueNative') return 'opaqueBodies';
  if (kind === 'macroExpansion') return 'macroExpansion';
  if (kind === 'preprocessor' || kind === 'conditionalCompilation' || kind === 'macroHygiene') return 'preprocessor';
  if (kind === 'metaprogramming' || kind === 'reflection' || kind === 'dynamicDispatch' || kind === 'dynamicRuntime') return 'metaprogramming';
  if (kind === 'generatedCode') return 'generatedCode';
  if (kind === 'overloadResolution' || kind === 'typeInference') return 'overloadTypeInference';
  if (kind === 'sourcePreservation' || kind === 'commentsTrivia' || kind === 'nonRoundTrippable') return 'sourcePreservation';
  if (kind === 'parserDiagnostic') return 'parserDiagnostics';
  if (kind === 'unsupportedSyntax' || kind === 'unsupportedSemantic') return 'unsupportedSyntax';
  if (kind === 'partialSemanticIndex' || kind === 'unverifiedNativeAst') return 'partialSemanticIndex';
  if (kind === 'sourceMapApproximation') return 'sourceMapApproximation';
  if (kind === 'targetProjectionLoss') return 'targetProjectionLoss';
  return String(kind ?? 'opaqueNative');
}
