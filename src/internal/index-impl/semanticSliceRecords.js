import{uniqueByEvidenceId,uniqueByLossId,uniqueRecordsById}from'../../native-import-utils.js';
import{mergeSemanticSliceSymbols}from'./mergeSemanticSliceSymbols.js';import{nativeAstNodes}from'./nativeAstNodes.js';import{nativeImportEntries}from'./nativeImportEntries.js';import{semanticSliceRegionFromMapping}from'./semanticSliceRegionFromMapping.js';import{semanticSliceRegionFromSymbol}from'./semanticSliceRegionFromSymbol.js';import{uniqueSemanticSliceNativeNodes}from'./uniqueSemanticSliceNativeNodes.js';import{uniqueSemanticSliceRegions}from'./uniqueSemanticSliceRegions.js';
export function semanticSliceRecords(context, sidecar) {
  const imports = context.importResult ? nativeImportEntries(context.importResult) : [];
  const universalAst = context.universalAst;
  const semanticIndexes = [
    context.semanticIndex,
    universalAst?.semanticIndex,
    ...imports.map((imported) => imported?.semanticIndex ?? imported?.universalAst?.semanticIndex)
  ].filter(Boolean);
  const sourceMaps = uniqueRecordsById([
    ...(context.importResult?.sourceMaps ?? []),
    ...(universalAst?.sourceMaps ?? []),
    ...imports.flatMap((imported) => imported?.sourceMaps ?? imported?.universalAst?.sourceMaps ?? [])
  ]);
  const symbols = mergeSemanticSliceSymbols([
    ...(sidecar?.symbols ?? []),
    ...semanticIndexes.flatMap((index) => index.symbols ?? [])
  ]);
  const regions = uniqueSemanticSliceRegions([
    ...(sidecar?.ownershipRegions ?? []),
    ...symbols.map((symbol) => semanticSliceRegionFromSymbol(symbol, context)).filter(Boolean),
    ...sourceMaps.flatMap((sourceMap) => (sourceMap.mappings ?? []).map((mapping) => semanticSliceRegionFromMapping(mapping, context)).filter(Boolean))
  ]);
  const nativeNodes = uniqueSemanticSliceNativeNodes([
    ...imports.flatMap((imported) => nativeAstNodes(imported?.nativeAst ?? imported?.nativeSource?.ast)),
    ...nativeAstNodes(context.nativeAst),
    ...((universalAst?.nativeSources ?? []).flatMap((source) => nativeAstNodes(source?.ast)))
  ]);
  const mappings = sourceMaps.flatMap((sourceMap) => (sourceMap.mappings ?? []).map((mapping) => ({
    ...mapping,
    sourceMapId: mapping.sourceMapId ?? sourceMap.id,
    sourceMapSourcePath: sourceMap.sourcePath,
    sourceMapSourceHash: sourceMap.sourceHash,
    sourceMapTargetPath: sourceMap.targetPath,
    sourceMapTargetHash: sourceMap.targetHash
  })));
  const losses = uniqueByLossId([
    ...(context.importResult?.losses ?? []),
    ...(universalAst?.losses ?? []),
    ...imports.flatMap((imported) => imported?.losses ?? imported?.nativeAst?.losses ?? [])
  ]);
  const evidence = uniqueByEvidenceId([
    ...(context.importResult?.evidence ?? []),
    ...(universalAst?.evidence ?? []),
    ...imports.flatMap((imported) => imported?.evidence ?? [])
  ]);
  return {
    symbols,
    symbolById: new Map(symbols.map((symbol) => [symbol.id, symbol])),
    regions,
    nativeNodes,
    nativeNodeById: new Map(nativeNodes.map((node) => [node.id, node])),
    mappings,
    sourceMaps,
    relations: uniqueRecordsById(semanticIndexes.flatMap((index) => index.relations ?? [])),
    occurrences: uniqueRecordsById(semanticIndexes.flatMap((index) => index.occurrences ?? [])),
    losses,
    evidence,
    sidecar
  };
}
