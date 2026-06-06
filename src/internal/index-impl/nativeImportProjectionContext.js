import{idFragment}from'../../native-import-utils.js';
export function nativeImportProjectionContext(importResult, options) {
  const nativeSource = options.nativeSource
    ?? importResult.nativeSource
    ?? importResult.nativeSources?.[0]
    ?? importResult.universalAst?.nativeSources?.[0];
  const nativeAst = options.nativeAst
    ?? importResult.nativeAst
    ?? nativeSource?.ast
    ?? importResult.universalAst?.nativeSources?.[0]?.ast;
  const semanticIndex = options.semanticIndex
    ?? importResult.semanticIndex
    ?? importResult.universalAst?.semanticIndex;
  const language = options.language
    ?? importResult.language
    ?? nativeSource?.language
    ?? nativeAst?.language
    ?? importResult.universalAst?.metadata?.sourceLanguage
    ?? 'source';
  const sourcePath = options.sourcePath
    ?? importResult.sourcePath
    ?? nativeSource?.sourcePath
    ?? nativeAst?.sourcePath
    ?? importResult.universalAst?.metadata?.sourcePath;
  const sourceHash = options.expectedSourceHash
    ?? importResult.sourceHash
    ?? nativeSource?.sourceHash
    ?? nativeAst?.sourceHash;
  return {
    nativeSource,
    nativeAst,
    semanticIndex,
    language,
    sourcePath,
    sourceHash,
    parser: options.parser ?? nativeAst?.parser ?? nativeSource?.parser,
    semanticStatus: options.semanticStatus ?? importResult.metadata?.semanticStatus ?? nativeSource?.metadata?.semanticStatus,
    idPart: idFragment(options.id ?? importResult.id ?? nativeSource?.id ?? sourcePath ?? language)
  };
}
