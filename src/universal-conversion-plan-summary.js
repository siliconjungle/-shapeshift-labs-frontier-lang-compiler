export function conversionPlanSummary(routes) {
  const summary = {
    routes: routes.length,
    byMode: {},
    byReadiness: {},
    byAdmissionAction: {},
    readyRoutes: 0,
    reviewRoutes: 0,
    blockedRoutes: 0,
    preserveSourceRoutes: 0,
    targetAdapterRoutes: 0,
    stubOnlyRoutes: 0,
    semanticIndexOnlyRoutes: 0,
    missingEvidence: 0,
    runtimeAdapterRequirements: 0,
    runtimeRoutesWithAdapters: 0,
    blockers: 0,
    reviewReasons: 0,
    autoMergeClaims: 0,
    semanticEquivalenceClaims: 0
  };
  for (const route of routes) {
    summary.byMode[route.mode] = (summary.byMode[route.mode] ?? 0) + 1;
    summary.byReadiness[route.readiness] = (summary.byReadiness[route.readiness] ?? 0) + 1;
    summary.byAdmissionAction[route.admissionAction] = (summary.byAdmissionAction[route.admissionAction] ?? 0) + 1;
    if (route.readiness === 'ready') summary.readyRoutes += 1;
    if (route.readiness === 'needs-review' || route.readiness === 'ready-with-losses') summary.reviewRoutes += 1;
    if (route.readiness === 'blocked') summary.blockedRoutes += 1;
    if (route.mode === 'preserve-source') summary.preserveSourceRoutes += 1;
    if (route.mode === 'target-adapter') summary.targetAdapterRoutes += 1;
    if (route.mode === 'stub-only') summary.stubOnlyRoutes += 1;
    if (route.mode === 'semantic-index-only') summary.semanticIndexOnlyRoutes += 1;
    summary.missingEvidence += route.missingEvidence.length;
    summary.runtimeAdapterRequirements += route.runtimeAdapterRequirements.length;
    if (route.runtimeAdapterRequirements.length) summary.runtimeRoutesWithAdapters += 1;
    summary.blockers += route.blockers.length;
    summary.reviewReasons += route.review.length;
    if (route.autoMergeClaim) summary.autoMergeClaims += 1;
    if (route.semanticEquivalenceClaim) summary.semanticEquivalenceClaims += 1;
  }
  return summary;
}
