function compactProjectMergeRoutingCalibration(missingEvidence = [], proofEvidence = undefined) {
  const missingRoutes = missingEvidence.map(missingRouteRecord).filter(Boolean);
  const proofSummary = proofEvidence?.summary ?? {};
  const focusedRouteCounts = proofSummary.unsupportedSurfaceProofGapRouteCounts ?? {};
  const focusedLaneCounts = proofSummary.unsupportedSurfaceProofGapRouteLaneCounts ?? {};
  const byRoute = mergeCounts(countField(missingRoutes, 'routeId'), focusedRouteCounts);
  const byLane = mergeCounts(countField(missingRoutes, 'routeLane'), focusedLaneCounts);
  const routeWorklist = compactRouteWorklist(missingRoutes, proofSummary, byRoute);
  const next = missingRoutes[0];
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectMergeRoutingCalibration',
    version: 1,
    schema: 'frontier.lang.jsTsProjectMergeRoutingCalibration.v1',
    routes: Object.keys(byRoute).length,
    missingRoutes: missingRoutes.length,
    focusedProofGapRoutes: sumCounts(focusedRouteCounts),
    byRoute,
    byLane,
    byAction: countField(missingEvidence, 'action'),
    byProofLevel: countField(missingEvidence, 'proofLevel'),
    routeWorklist,
    routeWorklistCount: routeWorklist.length,
    nextRouteWork: routeWorklist[0],
    nextRouteId: next?.routeId,
    nextRouteLane: next?.routeLane,
    nextRouteNext: next?.routeNext,
    nextAction: next?.action,
    nextProofLevel: next?.proofLevel,
    nextFocusedProofGapRouteId: proofSummary.nextUnsupportedSurfaceProofGapRouteId,
    nextFocusedProofGapRouteLane: proofSummary.nextUnsupportedSurfaceProofGapRouteLane,
    nextFocusedProofGapCode: proofSummary.nextUnsupportedSurfaceProofGapCode
  });
}

function compactRouteWorklist(missingRoutes, proofSummary = {}, byRoute = {}) {
  const byId = new Map();
  for (const route of missingRoutes) {
    const existing = byId.get(route.routeId) ?? {
      routeId: route.routeId,
      routeLane: route.routeLane,
      routeNext: route.routeNext,
      action: route.action,
      proofLevel: route.proofLevel,
      codes: [],
      missingEvidenceCount: 0,
      focusedProofGapCount: 0
    };
    existing.codes = uniqueStrings([...existing.codes, route.code]);
    existing.missingEvidenceCount += 1;
    byId.set(route.routeId, existing);
  }
  for (const routeId of Object.keys(proofSummary.unsupportedSurfaceProofGapRouteCounts ?? {}).sort()) {
    const existing = byId.get(routeId) ?? {
      routeId,
      routeLane: focusedRouteLane(routeId, proofSummary),
      routeNext: undefined,
      action: 'review',
      proofLevel: 'unsupported-js-ts-surface-review',
      codes: [],
      missingEvidenceCount: 0,
      focusedProofGapCount: 0
    };
    existing.focusedProofGapCount += Number(proofSummary.unsupportedSurfaceProofGapRouteCounts?.[routeId] ?? 0);
    existing.codes = uniqueStrings([...existing.codes, focusedRouteCode(routeId, proofSummary)]);
    byId.set(routeId, existing);
  }
  return [...byId.values()]
    .map((route) => compactRecord({
      ...route,
      count: Number(byRoute[route.routeId] ?? 0) || route.missingEvidenceCount + route.focusedProofGapCount,
      codes: route.codes.length ? route.codes : undefined
    }))
    .sort((left, right) => routeRank(left) - routeRank(right) || left.routeId.localeCompare(right.routeId));
}

function routeRank(route) {
  const actionRank = route.action === 'rerun-gate' ? 0 : route.action === 'block' ? 1 : 2;
  return actionRank * 100000 - Number(route.count ?? 0) * 1000;
}

function focusedRouteLane(routeId, proofSummary) {
  if (routeId === proofSummary.nextUnsupportedSurfaceProofGapRouteId) return proofSummary.nextUnsupportedSurfaceProofGapRouteLane;
  const routeIds = proofSummary.unsupportedSurfaceProofGapRouteIds ?? [];
  const lanes = proofSummary.unsupportedSurfaceProofGapRouteLanes ?? [];
  const index = routeIds.indexOf(routeId);
  return index >= 0 ? lanes[index] : undefined;
}

function focusedRouteCode(routeId, proofSummary) {
  return routeId === proofSummary.nextUnsupportedSurfaceProofGapRouteId
    ? proofSummary.nextUnsupportedSurfaceProofGapCode
    : undefined;
}

function missingRouteRecord(item) {
  const route = item?.route ?? {};
  const routeId = item?.routeId ?? route.id;
  if (!routeId) return undefined;
  return compactRecord({
    routeId,
    routeLane: item?.routeLane ?? route.lane,
    routeNext: item?.routeNext ?? route.next,
    action: item?.action,
    proofLevel: item?.proofLevel,
    code: item?.code
  });
}

function countField(items, field) {
  const counts = {};
  for (const item of items) if (item?.[field]) counts[item[field]] = (counts[item[field]] ?? 0) + 1;
  return counts;
}

function mergeCounts(...countsList) {
  const merged = {};
  for (const counts of countsList) for (const [key, value] of Object.entries(counts ?? {})) merged[key] = (merged[key] ?? 0) + Number(value ?? 0);
  return merged;
}

function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }
function sumCounts(counts) { return Object.values(counts ?? {}).reduce((total, value) => total + Number(value ?? 0), 0); }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { compactProjectMergeRoutingCalibration };
