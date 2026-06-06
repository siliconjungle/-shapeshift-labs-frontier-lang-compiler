import{nativeChangeMappingTouchesRegion}from'./nativeChangeMappingTouchesRegion.js';import{nativeImportSourcePreservationRecord}from'./nativeImportSourcePreservationRecord.js';
export function nativeChangeProjectionEndpoint(imported, sidecar, region, side) {
  if (!imported && !region) return undefined;
  const preservation = nativeImportSourcePreservationRecord(imported);
  const sourceMaps = imported?.sourceMaps ?? imported?.universalAst?.sourceMaps ?? [];
  const regionMappings = sourceMaps
    .flatMap((sourceMap) => (sourceMap?.mappings ?? []).map((mapping) => ({ sourceMap, mapping })))
    .filter(({ mapping }) => nativeChangeMappingTouchesRegion(mapping, region, []));
  return {
    side,
    importId: imported?.id,
    sidecarId: sidecar?.id,
    nativeSourceId: imported?.nativeSource?.id,
    nativeAstId: imported?.nativeAst?.id,
    semanticIndexId: imported?.semanticIndex?.id,
    universalAstId: imported?.universalAst?.id,
    sourcePath: imported?.sourcePath ?? region?.sourcePath,
    sourceHash: imported?.nativeSource?.sourceHash ?? imported?.nativeAst?.sourceHash ?? region?.sourceHash,
    sourcePreservationId: preservation?.id,
    exactSourceAvailable: preservation?.summary?.exactSourceAvailable === true,
    ownershipRegionId: region?.id,
    ownershipKey: region?.key,
    ownershipRegionKind: region?.regionKind,
    sourceSpan: region?.sourceSpan,
    sourceMapIds: sourceMaps.map((sourceMap) => sourceMap?.id).filter(Boolean),
    sourceMapMappingIds: regionMappings.map(({ mapping }) => mapping?.id).filter(Boolean)
  };
}
