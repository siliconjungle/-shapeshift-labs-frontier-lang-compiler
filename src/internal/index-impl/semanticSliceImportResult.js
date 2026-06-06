import{idFragment}from'../../native-import-utils.js';
import{importNativeSource}from'./importNativeSource.js';
export function semanticSliceImportResult(value, options = {}) {
  if (!value) return undefined;
  if (value.kind === 'frontier.lang.importResult') return value;
  if (value.kind === 'frontier.lang.universalAst') {
    const nativeSource = value.nativeSources?.[0];
    return {
      kind: 'frontier.lang.importResult',
      version: 1,
      id: value.metadata?.nativeImportId ?? `import_${idFragment(value.id)}`,
      language: value.metadata?.sourceLanguage ?? nativeSource?.language ?? options.language,
      sourcePath: value.metadata?.sourcePath ?? nativeSource?.sourcePath ?? options.sourcePath,
      document: value.document,
      nativeSource,
      nativeAst: nativeSource?.ast,
      semanticIndex: value.semanticIndex,
      universalAst: value,
      sourceMaps: value.sourceMaps ?? [],
      losses: value.losses ?? [],
      evidence: value.evidence ?? [],
      mergeCandidates: value.mergeCandidates ?? [],
      metadata: value.metadata ?? {}
    };
  }
  if (value.kind === 'frontier.lang.semanticImportSidecar') return undefined;
  if (value.universalAst || value.semanticIndex || value.nativeSource || value.nativeAst) return value;
  if (value.sourceText || value.nodes || value.nativeAst) return importNativeSource(value);
  return undefined;
}
