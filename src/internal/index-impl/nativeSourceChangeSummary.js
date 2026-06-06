import{countBy}from'../../native-import-utils.js';
export function nativeSourceChangeSummary(changedSymbols, changedRegions, sourceChanged) {
  return {
    sourceChanged,
    symbols: changedSymbols.length,
    regions: changedRegions.length,
    addedSymbols: changedSymbols.filter((symbol) => symbol.changeKind === 'added').length,
    removedSymbols: changedSymbols.filter((symbol) => symbol.changeKind === 'removed').length,
    modifiedSymbols: changedSymbols.filter((symbol) => symbol.changeKind === 'modified').length,
    byRegionKind: countBy(changedRegions.map((region) => region.regionKind ?? 'unknown')),
    byChangeKind: countBy([...changedSymbols.map((symbol) => symbol.changeKind), ...changedRegions.map((region) => region.changeKind)])
  };
}
