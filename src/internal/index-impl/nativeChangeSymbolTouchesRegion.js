export function nativeChangeSymbolTouchesRegion(symbol, region) {
  return Boolean(symbol && region && (
    (region.id && symbol.ownershipRegionId === region.id) ||
    (region.key && (
      symbol.ownershipKey === region.key ||
      symbol.beforeOwnershipKey === region.key ||
      symbol.afterOwnershipKey === region.key
    ))
  ));
}
