import{uniqueRecordsById}from'../../native-import-utils.js';
import{semanticOwnershipRegionsFromSemanticIndex,semanticPatchHintForRegion}from'../../semantic-import-regions.js';

export function createNativeImportSemanticIndex(input, lightweight, semanticIndex) {
  const ownershipRegions = uniqueRecordsById([
    ...(Array.isArray(input.ownershipRegions) ? input.ownershipRegions : []),
    ...(Array.isArray(input.semanticOwnershipRegions) ? input.semanticOwnershipRegions : []),
    ...(lightweight?.ownershipRegions ?? []),
    ...semanticOwnershipRegionsFromSemanticIndex(semanticIndex),
    ...(Array.isArray(input.universalAst?.ownershipRegions) ? input.universalAst.ownershipRegions : []),
    ...(Array.isArray(input.metadata?.ownershipRegions) ? input.metadata.ownershipRegions : [])
  ]);
  const patchHints = uniqueRecordsById([
    ...(Array.isArray(input.patchHints) ? input.patchHints : []),
    ...(Array.isArray(input.semanticPatchHints) ? input.semanticPatchHints : []),
    ...(lightweight?.patchHints ?? []),
    ...(Array.isArray(semanticIndex?.patchHints) ? semanticIndex.patchHints : []),
    ...(Array.isArray(input.universalAst?.patchHints) ? input.universalAst.patchHints : []),
    ...(Array.isArray(input.metadata?.patchHints) ? input.metadata.patchHints : [])
  ]);
  const resultPatchHints = patchHints.length
    ? patchHints
    : ownershipRegions.map((region) => semanticPatchHintForRegion(region, 'needs-review'));
  return {
    ownershipRegions,
    patchHints: resultPatchHints,
    semanticIndexForResult: semanticIndex ? {
      ...semanticIndex,
      ownershipRegions,
      patchHints: resultPatchHints
    } : semanticIndex
  };
}
