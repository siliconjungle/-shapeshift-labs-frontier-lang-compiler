export function nativeChangedRegionProjectionAction(region, readiness) {
  if (readiness === 'blocked') return 'rerun-or-human-port';
  if (region.changeKind === 'added') return 'review-addition';
  if (region.changeKind === 'removed') return 'review-removal';
  if (region.granularity === 'file') return 'review-file';
  return 'review-port';
}
