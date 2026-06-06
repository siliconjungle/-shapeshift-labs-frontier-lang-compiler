import{idFragment,uniqueRecordsById,uniqueStrings}from'../../native-import-utils.js';
import{findSemanticImportRegion}from'./findSemanticImportRegion.js';import{nativeChangedRegionProjectionAction}from'./nativeChangedRegionProjectionAction.js';import{nativeChangeProjectionEndpoint}from'./nativeChangeProjectionEndpoint.js';import{nativeChangeProjectionSourceMapLinks}from'./nativeChangeProjectionSourceMapLinks.js';import{nativeChangeSymbolTouchesRegion}from'./nativeChangeSymbolTouchesRegion.js';
export function nativeChangedRegionProjectionMetadata(region, context) {
  const beforeRegion = findSemanticImportRegion(context.beforeSidecar, region);
  const afterRegion = findSemanticImportRegion(context.afterSidecar, region);
  const regionSymbols = (context.changedSymbols ?? []).filter((symbol) => nativeChangeSymbolTouchesRegion(symbol, region));
  const sourceMapLinks = uniqueRecordsById([
    ...nativeChangeProjectionSourceMapLinks(context.before, 'before', beforeRegion ?? region, regionSymbols),
    ...nativeChangeProjectionSourceMapLinks(context.after, 'after', afterRegion ?? region, regionSymbols)
  ]).slice(0, 24);
  const action = nativeChangedRegionProjectionAction(region, context.readiness);
  const conflictKeys = uniqueStrings([
    region.conflictKey,
    region.key ? `region:${region.key}` : undefined,
    region.id ? `region:${region.id}` : undefined,
    ...regionSymbols.map((symbol) => symbol.conflictKey)
  ].filter(Boolean));
  return {
    schema: 'frontier.lang.changedRegionProjection.v1',
    id: `changed_region_projection_${idFragment(region.conflictKey ?? region.key ?? region.id)}`,
    reviewRequired: true,
    autoMergeClaim: false,
    changeKind: region.changeKind,
    language: region.language ?? context.language,
    sourcePath: region.sourcePath ?? context.sourcePath,
    conflictKey: region.conflictKey,
    region: {
      id: region.id,
      key: region.key,
      kind: region.regionKind,
      granularity: region.granularity,
      precision: region.precision,
      sourceSpan: region.sourceSpan,
      nativeAstNodeId: region.nativeAstNodeId,
      symbolId: region.symbolId,
      symbolName: region.symbolName,
      symbolKind: region.symbolKind
    },
    before: nativeChangeProjectionEndpoint(context.before, context.beforeSidecar, beforeRegion ?? (region.changeKind === 'added' ? undefined : region), 'before'),
    after: nativeChangeProjectionEndpoint(context.after, context.afterSidecar, afterRegion ?? (region.changeKind === 'removed' ? undefined : region), 'after'),
    sourceMapLinks,
    admission: {
      readiness: context.readiness,
      action,
      reasons: context.reasons ?? [],
      conflictKeys
    }
  };
}
