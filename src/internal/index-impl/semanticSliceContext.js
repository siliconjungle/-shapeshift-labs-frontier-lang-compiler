import{semanticSliceImportResult}from'./semanticSliceImportResult.js';import{semanticSliceSourceHashMap}from'./semanticSliceSourceHashMap.js';import{semanticSliceSourceTextMap}from'./semanticSliceSourceTextMap.js';
export function semanticSliceContext(input, options = {}) {
  const value = input?.importResult ?? input?.import ?? input?.source ?? input;
  const imported = semanticSliceImportResult(value, options);
  const universalAst = imported?.universalAst ?? (value?.kind === 'frontier.lang.universalAst' ? value : value?.universalAst);
  const sidecar = value?.kind === 'frontier.lang.semanticImportSidecar' ? value : input?.sidecar ?? options.sidecar;
  const nativeSource = imported?.nativeSource ?? universalAst?.nativeSources?.[0];
  const nativeAst = imported?.nativeAst ?? nativeSource?.ast;
  const semanticIndex = imported?.semanticIndex ?? universalAst?.semanticIndex;
  const language = options.language ?? imported?.language ?? universalAst?.metadata?.sourceLanguage ?? nativeSource?.language ?? sidecar?.language;
  const sourcePath = options.sourcePath ?? imported?.sourcePath ?? universalAst?.metadata?.sourcePath ?? nativeSource?.sourcePath ?? semanticIndex?.documents?.[0]?.path;
  return {
    importResult: imported,
    universalAst,
    sidecar,
    nativeSource,
    nativeAst,
    semanticIndex,
    language,
    sourcePath,
    sourceTexts: semanticSliceSourceTextMap(imported, universalAst, value, options),
    sourceHashes: semanticSliceSourceHashMap(imported, universalAst, value, options)
  };
}
