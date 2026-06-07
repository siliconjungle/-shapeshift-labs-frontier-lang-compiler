import { countBy, idFragment, uniqueStrings } from './native-import-utils.js';

export function createUniversalConversionAdmissionRecord(input) {
  const route = input.route;
  const operations = input.semanticOperations?.operations ?? [];
  const operationKinds = uniqueStrings(operations.map((operation) => operation.operationKind));
  const sourceRecords = input.patchBundle?.sources ?? input.history?.sources ?? [];
  const evidenceIds = uniqueStrings([
    ...(input.history?.evidenceIds ?? []),
    ...(input.patchBundle?.evidenceIds ?? []),
    ...(input.materialization?.evidenceIds ?? [])
  ]);
  const proofIds = uniqueStrings([
    ...(input.history?.proofIds ?? []),
    ...(input.patchBundle?.proofIds ?? []),
    ...(input.materialization?.proofIds ?? [])
  ]);
  const score = route.mergeScore ?? {};
  const missingEvidence = route.missingEvidence ?? [];
  const blockers = route.blockers ?? [];
  const bucket = admissionBucket({
    action: score.action ?? route.admissionAction,
    blockers,
    missingEvidence,
    mode: route.mode,
    operationKinds,
    opaqueOperations: operations.filter((operation) => operation.opaque).length,
    scoreValue: score.value,
    status: input.admissionStatus
  });
  return {
    kind: 'frontier.lang.universalConversionAdmissionRecord',
    version: 1,
    schema: 'frontier.lang.universalConversionAdmissionRecord.v1',
    id: `admission_${idFragment(route.id)}`,
    routeId: route.id,
    planId: input.planId,
    sourceLanguage: route.sourceLanguage,
    target: route.target,
    mode: route.mode,
    routeAction: route.routeAction,
    admissionStatus: input.admissionStatus,
    admissionAction: score.action ?? route.admissionAction,
    admissionBucket: bucket,
    reviewRequired: true,
    readiness: route.readiness,
    risk: score.risk ?? riskForRoute(route, input.admissionStatus),
    score: {
      value: Number(score.value ?? 0),
      uncappedValue: Number(score.uncappedValue ?? score.value ?? 0),
      sortKey: Number(score.sortKey ?? score.value ?? 0),
      higherIsBetter: true,
      componentStatuses: componentStatuses(score.components),
      penalties: score.penalties ?? []
    },
    ids: {
      historyId: input.history?.id,
      patchBundleId: input.patchBundle?.id,
      semanticOperationIds: operations.map((operation) => operation.id),
      sourceMapLinkIds: input.materialization?.sourceMapLinkIds ?? [],
      evidenceIds,
      proofIds
    },
    semanticOperations: {
      total: operations.length,
      byKind: countBy(operations.map((operation) => operation.operationKind)),
      kinds: operationKinds,
      dynamic: operations.filter((operation) => operation.dynamic).map((operation) => operation.id),
      opaque: operations.filter((operation) => operation.opaque).map((operation) => operation.id)
    },
    ownership: {
      keys: uniqueStrings(input.history?.index?.ownershipKeys ?? input.patchBundle?.index?.ownershipKeys ?? []),
      conflictKeys: uniqueStrings(input.history?.index?.conflictKeys ?? input.patchBundle?.index?.conflictKeys ?? [])
    },
    source: {
      paths: uniqueStrings(sourceRecords.map((source) => source.sourcePath)),
      hashes: uniqueStrings(sourceRecords.map((source) => source.sourceHash)),
      baseHashes: uniqueStrings(sourceRecords.map((source) => source.baseHash)),
      targetHashes: uniqueStrings(sourceRecords.map((source) => source.targetHash))
    },
    evidence: {
      total: evidenceIds.length,
      proofArtifacts: proofIds.length,
      missing: missingEvidence,
      blockers,
      review: route.review ?? []
    },
    reasons: uniqueStrings([
      ...(input.reasonCodes ?? []),
      ...missingEvidence.map((reason) => `missing:${reason}`),
      ...blockers.map((reason) => `blocker:${reason}`),
      ...(route.review ?? []).map((reason) => `review:${reason}`),
      ...(score.penalties ?? [])
    ]),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    metadata: {
      routeId: route.id,
      planId: input.planId,
      mergeScoreSchema: score.schema,
      note: 'Admission records are sortable merge-review evidence, not proof of target semantic equivalence.'
    }
  };
}

function admissionBucket(input) {
  if (input.status === 'blocked' || input.action === 'reject' || input.blockers.length) return 'blocked';
  if (input.mode === 'semantic-index-only' || input.missingEvidence.includes('target-adapter')) return 'needs-adapter';
  if (input.missingEvidence.length || input.opaqueOperations || input.operationKinds.includes('merge')) return 'needs-evidence';
  if (Number(input.scoreValue ?? 0) >= 80) return 'merge-ready';
  return 'needs-review';
}

function riskForRoute(route, status) {
  if (status === 'blocked' || route.readiness === 'blocked') return 'high';
  if (route.readiness === 'needs-review' || route.mode === 'stub-only') return 'medium';
  return 'low';
}

function componentStatuses(components = {}) {
  return Object.fromEntries(Object.entries(components).map(([key, component]) => [key, component.status]));
}
