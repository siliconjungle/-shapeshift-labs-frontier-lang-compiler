import{countBy}from'../../native-import-utils.js';
export function summarizeNativeChangedRegionProjections(regions) {
  const projections = (regions ?? [])
    .map((region) => region?.metadata?.changedRegionProjection)
    .filter(Boolean);
  return {
    schema: 'frontier.lang.changedRegionProjectionSummary.v1',
    total: regions?.length ?? 0,
    withProjection: projections.length,
    reviewRequired: projections.filter((projection) => projection.reviewRequired === true).length,
    autoMergeClaims: projections.filter((projection) => projection.autoMergeClaim === true).length,
    sourceMapLinks: projections.reduce((sum, projection) => sum + (projection.sourceMapLinks?.length ?? 0), 0),
    byAction: countBy(projections.map((projection) => projection.admission?.action ?? 'unknown')),
    byRegionKind: countBy(projections.map((projection) => projection.region?.kind ?? 'unknown'))
  };
}
