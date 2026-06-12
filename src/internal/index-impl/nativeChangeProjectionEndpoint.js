import{uniqueStrings}from'../../native-import-utils.js';import{nativeChangeMappingTouchesRegion}from'./nativeChangeMappingTouchesRegion.js';import{nativeImportSourcePreservationRecord}from'./nativeImportSourcePreservationRecord.js';
export function nativeChangeProjectionEndpoint(imported, sidecar, region, side) {
  if (!imported && !region) return undefined;
  const preservation = nativeImportSourcePreservationRecord(imported);
  const sourceMaps = imported?.sourceMaps ?? imported?.universalAst?.sourceMaps ?? [];
  const regionMappings = sourceMaps
    .flatMap((sourceMap) => (sourceMap?.mappings ?? []).map((mapping) => ({ sourceMap, mapping })))
    .filter(({ mapping }) => nativeChangeMappingTouchesRegion(mapping, region, []));
  const sourceMapIds = uniqueStrings(sourceMaps.map((sourceMap) => sourceMap?.id));
  const sourceMapMappingIds = uniqueStrings(regionMappings.map(({ mapping }) => mapping?.id));
  const importId = imported?.id;
  const nativeSourceId = imported?.nativeSource?.id;
  const nativeAstId = imported?.nativeAst?.id;
  const semanticIndexId = imported?.semanticIndex?.id;
  const universalAstId = imported?.universalAst?.id;
  const sourcePath = imported?.sourcePath ?? region?.sourcePath;
  const sourceHash = imported?.nativeSource?.sourceHash ?? imported?.nativeAst?.sourceHash ?? region?.sourceHash;
  const sourcePreservationId = preservation?.id;
  const exactSourceAvailable = preservation?.summary?.exactSourceAvailable === true;
  const ownershipRegionId = region?.id;
  const ownershipKey = region?.key;
  const ownershipRegionKind = region?.regionKind;
  const sourceSpan = region?.sourceSpan;
  const identity = compactRecord({
    schema: 'frontier.lang.nativeChangeProjectionEndpointIdentity.v1',
    version: 1,
    side,
    importId,
    nativeSourceId,
    nativeAstId,
    semanticIndexId,
    universalAstId,
    sourcePath,
    sourceHash,
    sourcePreservationId,
    exactSourceAvailable,
    ownershipRegionId,
    ownershipKey,
    ownershipRegionKind,
    sourceSpan,
    sourceMapIds,
    sourceMapMappingIds
  });
  return {
    side,
    importId,
    sidecarId: sidecar?.id,
    nativeSourceId,
    nativeAstId,
    semanticIndexId,
    universalAstId,
    sourcePath,
    sourceHash,
    sourcePreservationId,
    exactSourceAvailable,
    ownershipRegionId,
    ownershipKey,
    ownershipRegionKind,
    sourceSpan,
    sourceMapIds,
    sourceMapMappingIds,
    identity
  };
}

function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}
