import{uniqueRecordsById}from'../../native-import-utils.js';
export function diffNativeOwnershipRegions(beforeSidecar, afterSidecar, changedSymbols) {
  const changedRegionIds = new Set(changedSymbols.map((symbol) => symbol.ownershipRegionId).filter(Boolean));
  const changedRegionKeys = new Set([
    ...changedSymbols.map((symbol) => symbol.beforeOwnershipKey).filter(Boolean),
    ...changedSymbols.map((symbol) => symbol.afterOwnershipKey).filter(Boolean)
  ]);
  const regions = uniqueRecordsById([...(beforeSidecar?.ownershipRegions ?? []), ...(afterSidecar?.ownershipRegions ?? [])])
    .filter((region) => changedRegionIds.has(region.id) || changedRegionKeys.has(region.key));
  return regions.map((region) => ({
    ...region,
    changeKind: changedSymbols.some((symbol) => symbol.changeKind === 'added' && symbol.afterOwnershipKey === region.key)
      ? 'added'
      : changedSymbols.some((symbol) => symbol.changeKind === 'removed' && symbol.beforeOwnershipKey === region.key)
        ? 'removed'
        : 'modified',
    conflictKey: region.key ? `region:${region.key}` : `region:${region.id}`
  }));
}
