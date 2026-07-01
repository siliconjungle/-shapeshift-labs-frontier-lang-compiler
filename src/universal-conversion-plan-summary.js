import { countBy } from './native-import-utils.js';

const interlinguaCountKeys = 'Families Statuses Actions SourceIds RequiredKinds RepresentedKinds MissingKinds MissingEvidence ObligationKinds ObligationStatuses ObligationMissingEvidence'.split(' ');

export function conversionPlanSummary(routes) {
  const compactCounts = compactRouteCounts(routes);
  const summary = {
    routes: routes.length,
    byMode: {},
    byReadiness: {},
    byAdmissionAction: {},
    compactCounts,
    readyRoutes: 0,
    reviewRoutes: 0,
    blockedRoutes: 0,
    preserveSourceRoutes: 0,
    targetAdapterRoutes: 0,
    stubOnlyRoutes: 0,
    semanticIndexOnlyRoutes: 0,
    missingEvidence: 0,
    runtimeAdapterRequirements: 0,
    runtimeProofObligations: 0,
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
    summary.runtimeProofObligations += route.runtime?.proofObligations?.length ?? 0;
    if (route.runtimeAdapterRequirements.length) summary.runtimeRoutesWithAdapters += 1;
    summary.blockers += route.blockers.length;
    summary.reviewReasons += route.review.length;
    if (route.autoMergeClaim) summary.autoMergeClaims += 1;
    if (route.semanticEquivalenceClaim) summary.semanticEquivalenceClaims += 1;
  }
  return summary;
}

function compactRouteCounts(routes) {
  const constructs = routes.flatMap((route) => route.representation?.constructs ?? []);
  const missingConstructs = routes.flatMap((route) => route.representation?.missing ?? []);
  const translationAdmissions = routes.map((route) => route.translationAdmission ?? {});
  const interlinguaRecords = routes.map((route) => route.interlingua ?? {});
  return {
    representationConstructs: {
      total: constructs.length,
      represented: constructs.filter((construct) => construct.status === 'represented').length,
      missing: constructs.filter((construct) => construct.status === 'missing').length,
      review: constructs.filter((construct) => construct.status === 'review').length,
      blocked: constructs.filter((construct) => construct.status === 'blocked').length,
      byKind: countBy(constructs.map((construct) => construct.kind)),
      byStatus: countBy(constructs.map((construct) => construct.status))
    },
    missingConstructs: {
      total: missingConstructs.length,
      byKind: countBy(missingConstructs)
    },
    semanticEditReadiness: { routes: countBy(routes.map((route) => route.readiness)) },
    admissionStatuses: {
      byAction: countBy(routes.map((route) => route.admissionAction)),
      byRouteStatus: countBy(routes.map((route) => route.mergeRefs?.admissionStatus ?? route.admissionAction)),
      byRisk: countBy(routes.map((route) => route.mergeScore?.risk))
    },
    translationAdmission: compactTranslationAdmissionCounts(translationAdmissions),
    interlingua: compactInterlinguaCounts(interlinguaRecords)
  };
}

function compactTranslationAdmissionCounts(admissions) {
  return {
    byStatus: countBy(admissions.map((admission) => admission.status)),
    byAction: countBy(admissions.map((admission) => admission.action)),
    missingEvidence: countBy(admissions.flatMap((admission) => admission.missingEvidence ?? [])),
    proofEvidenceIds: countBy(admissions.flatMap((admission) => admission.proofEvidenceIds ?? [])),
    runtimeReadiness: countBy(admissions.map((admission) => admission.runtimeReadiness)),
    runtimeProofMissingSignals: countBy(admissions.flatMap((admission) => admission.runtimeProofMissingSignals ?? [])),
    dialectReadiness: countBy(admissions.map((admission) => admission.dialectReadiness))
  };
}

function compactInterlinguaCounts(records) {
  return {
    byLoweringDisposition: countBy(records.map(interlinguaLoweringDisposition)),
    layerKinds: countBy(records.flatMap((record) => interlinguaQueryList(record, 'layerKinds'))),
    representedLayerKinds: countBy(records.flatMap((record) => interlinguaQueryList(record, 'representedLayerKinds'))),
    missingLayerKinds: countBy(records.flatMap((record) => interlinguaQueryList(record, 'missingLayerKinds'))),
    reviewLayerKinds: countBy(records.flatMap((record) => interlinguaQueryList(record, 'reviewLayerKinds'))),
    blockedLayerKinds: countBy(records.flatMap((record) => interlinguaQueryList(record, 'blockedLayerKinds'))),
    ...compactInterlinguaConstraintCounts(records),
    missingEvidence: countBy(records.flatMap((record) => interlinguaLoweringList(record, 'missingEvidence'))),
    proofEvidenceIds: countBy(records.flatMap((record) => interlinguaLoweringList(record, 'proofEvidenceIds')))
  };
}

function interlinguaLoweringDisposition(record) {
  return record?.lowering?.disposition ?? record?.query?.loweringDisposition;
}

function interlinguaQueryList(record, key) {
  return record?.query?.[key] ?? record?.layers?.[layerSummaryKey(key)] ?? [];
}

function interlinguaLoweringList(record, key) {
  return record?.lowering?.[key] ?? record?.query?.[key] ?? [];
}

function compactInterlinguaConstraintCounts(records) {
  return Object.fromEntries(interlinguaCountKeys.map((key) => [
    `constraint${key}`,
    countBy(records.flatMap((record) => interlinguaConstraintList(record, `${key[0].toLowerCase()}${key.slice(1)}`)))
  ]));
}

function interlinguaConstraintList(record, key) {
  const queryKey = `constraint${key[0].toUpperCase()}${key.slice(1)}`;
  return record?.constraints?.[key] ?? record?.query?.[queryKey] ?? [];
}

function layerSummaryKey(queryKey) {
  if (queryKey === 'layerKinds') return 'kinds';
  if (queryKey === 'representedLayerKinds') return 'representedKinds';
  if (queryKey === 'missingLayerKinds') return 'missingKinds';
  if (queryKey === 'reviewLayerKinds') return 'reviewKinds';
  if (queryKey === 'blockedLayerKinds') return 'blockedKinds';
  return queryKey;
}
