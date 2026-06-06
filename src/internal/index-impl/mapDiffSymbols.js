import{hashNativeSpanText}from'./hashNativeSpanText.js';import{nativeDiffSymbolKey}from'./nativeDiffSymbolKey.js';import{nativeImportSourceText}from'./nativeImportSourceText.js';
export function mapDiffSymbols(imported, sidecar) {
  const symbolsById = new Map((imported?.semanticIndex?.symbols ?? []).map((symbol) => [symbol.id, symbol]));
  const mappingsBySymbolId = new Map((imported?.sourceMaps ?? [])
    .flatMap((sourceMap) => sourceMap.mappings ?? [])
    .filter((mapping) => mapping.semanticSymbolId)
    .map((mapping) => [mapping.semanticSymbolId, mapping]));
  const sourceText = nativeImportSourceText(imported);
  const entries = sidecar?.symbols?.length
    ? sidecar.symbols
    : (imported?.semanticIndex?.symbols ?? []).map((symbol) => ({ id: symbol.id, name: symbol.name, kind: symbol.kind, sourceSpan: symbol.definitionSpan }));
  const result = new Map();
  for (const entry of entries) {
    const symbol = symbolsById.get(entry.id) ?? {};
    const mapping = mappingsBySymbolId.get(entry.id);
    const sourceSpan = entry.sourceSpan ?? mapping?.sourceSpan ?? symbol.definitionSpan;
    const key = nativeDiffSymbolKey(entry, imported);
    result.set(key, {
      key,
      id: entry.id,
      name: entry.name ?? symbol.name,
      kind: entry.kind ?? symbol.kind,
      language: entry.language ?? symbol.language ?? imported?.language,
      nativeAstNodeId: entry.nativeAstNodeId ?? symbol.nativeAstNodeId ?? mapping?.nativeAstNodeId,
      semanticOccurrenceId: entry.semanticOccurrenceId ?? mapping?.semanticOccurrenceId,
      sourceMapMappingId: entry.sourceMapMappingId ?? mapping?.id,
      sourceSpan,
      signatureHash: entry.signatureHash ?? symbol.signatureHash,
      ownershipRegionId: entry.ownershipRegionId ?? symbol.metadata?.ownershipRegionId ?? mapping?.ownershipRegionId,
      ownershipKey: entry.ownershipKey ?? symbol.metadata?.ownershipRegionKey ?? mapping?.ownershipRegionKey,
      ownershipRegionKind: entry.ownershipRegionKind ?? symbol.metadata?.ownershipRegionKind ?? mapping?.ownershipRegionKind,
      spanHash: hashNativeSpanText(sourceText, sourceSpan),
      sourcePath: sourceSpan?.path ?? imported?.sourcePath,
      sourceHash: imported?.nativeSource?.sourceHash ?? imported?.nativeAst?.sourceHash,
      readiness: entry.readiness ?? imported?.metadata?.semanticMergeReadiness ?? imported?.mergeCandidates?.[0]?.readiness ?? 'needs-review'
    });
  }
  return result;
}
