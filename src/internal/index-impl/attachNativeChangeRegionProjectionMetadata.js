import{nativeChangedRegionProjectionMetadata}from'./nativeChangedRegionProjectionMetadata.js';
export function attachNativeChangeRegionProjectionMetadata(regions, context) {
  return (regions ?? []).map((region) => {
    const projection = nativeChangedRegionProjectionMetadata(region, context);
    return {
      ...region,
      metadata: {
        ...(region.metadata ?? {}),
        changedRegionProjection: projection
      }
    };
  });
}
