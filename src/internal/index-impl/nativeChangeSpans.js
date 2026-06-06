import{idFragment,uniqueRecordsById}from'../../native-import-utils.js';
import{nativeChangedRegionProjectionSpanMetadata}from'./nativeChangedRegionProjectionSpanMetadata.js';
export function nativeChangeSpans(changedSymbols, changedRegions, input) {
  const symbolSpans = changedSymbols
    .filter((symbol) => symbol.sourceSpan)
    .map((symbol) => ({
      id: `native_span_${idFragment(symbol.id ?? symbol.key)}`,
      sourceId: symbol.sourceSpan?.sourceId,
      path: symbol.sourceSpan?.path ?? input.sourcePath,
      language: symbol.language ?? input.language,
      nativeAstNodeId: symbol.nativeAstNodeId,
      symbolId: symbol.id,
      span: symbol.sourceSpan,
      conflictKey: symbol.conflictKey,
      metadata: { changeKind: symbol.changeKind }
    }));
  const regionSpans = changedRegions
    .filter((region) => region.sourceSpan || region.sourcePath)
    .map((region) => ({
      id: `native_span_${idFragment(region.id)}`,
      path: region.sourceSpan?.path ?? region.sourcePath ?? input.sourcePath,
      language: region.language ?? input.language,
      nativeAstNodeId: region.nativeAstNodeId,
      symbolId: region.symbolId,
      span: region.sourceSpan,
      conflictKey: region.conflictKey ?? `region:${region.key ?? region.id}`,
      metadata: {
        changeKind: region.changeKind,
        regionKind: region.regionKind,
        granularity: region.granularity,
        ...(region.metadata?.changedRegionProjection ? {
          changedRegionProjection: nativeChangedRegionProjectionSpanMetadata(region.metadata.changedRegionProjection)
        } : {})
      }
    }));
  return uniqueRecordsById([...symbolSpans, ...regionSpans]);
}
