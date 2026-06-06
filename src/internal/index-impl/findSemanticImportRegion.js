export function findSemanticImportRegion(sidecar, region) {
  return (sidecar?.ownershipRegions ?? []).find((candidate) => (
    (region.id && candidate.id === region.id) ||
    (region.key && candidate.key === region.key)
  ));
}
