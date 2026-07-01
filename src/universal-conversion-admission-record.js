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
  const hasBoundEvidence = evidenceIds.length > 0 || proofIds.length > 0;
  const missingEvidence = uniqueStrings([
    ...(route.missingEvidence ?? []),
    ...(route.translationAdmission?.missingEvidence ?? []),
    ...(hasBoundEvidence ? [] : ['route-bound-evidence'])
  ]);
  const blockers = route.blockers ?? [];
  const bucket = admissionBucket({
    action: score.action ?? route.admissionAction,
    blockers,
    missingEvidence,
    mode: route.mode,
    operationKinds,
    opaqueOperations: operations.filter((operation) => operation.opaque).length,
    hasBoundEvidence,
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
    translationAdmissionStatus: route.translationAdmission?.status,
    translationAdmissionAction: route.translationAdmission?.action,
    interlinguaRecordId: route.interlingua?.id,
    interlinguaLoweringDisposition: route.interlingua?.lowering?.disposition,
    resourceTransferStatus: route.resourceTransfer?.status,
    resourceTransferAction: route.resourceTransfer?.action,
    lifetimeConstraintStatus: route.lifetimeConstraint?.status,
    lifetimeConstraintAction: route.lifetimeConstraint?.action,
    controlFlowConstraintStatus: route.controlFlowConstraint?.status,
    controlFlowConstraintAction: route.controlFlowConstraint?.action,
    adtPatternConstraintStatus: route.adtPatternConstraint?.status,
    adtPatternConstraintAction: route.adtPatternConstraint?.action,
    borrowScopeConstraintStatus: route.borrowScopeConstraint?.status,
    borrowScopeConstraintAction: route.borrowScopeConstraint?.action,
    borrowCheckerConstraintStatus: route.borrowCheckerConstraint?.status,
    borrowCheckerConstraintAction: route.borrowCheckerConstraint?.action,
    dataLayoutConstraintStatus: route.dataLayoutConstraint?.status,
    dataLayoutConstraintAction: route.dataLayoutConstraint?.action,
    effectConstraintStatus: route.effectConstraint?.status,
    effectConstraintAction: route.effectConstraint?.action,
    concurrencyModelConstraintStatus: route.concurrencyModelConstraint?.status,
    concurrencyModelConstraintAction: route.concurrencyModelConstraint?.action,
    errorModelConstraintStatus: route.errorModelConstraint?.status,
    errorModelConstraintAction: route.errorModelConstraint?.action,
    evaluationModelConstraintStatus: route.evaluationModelConstraint?.status,
    evaluationModelConstraintAction: route.evaluationModelConstraint?.action,
    hostEnvironmentConstraintStatus: route.hostEnvironmentConstraint?.status,
    hostEnvironmentConstraintAction: route.hostEnvironmentConstraint?.action,
    memoryModelConstraintStatus: route.memoryModelConstraint?.status,
    memoryModelConstraintAction: route.memoryModelConstraint?.action,
    metaprogrammingConstraintStatus: route.metaprogrammingConstraint?.status,
    metaprogrammingConstraintAction: route.metaprogrammingConstraint?.action,
    scopeBindingConstraintStatus: route.scopeBindingConstraint?.status, scopeBindingConstraintAction: route.scopeBindingConstraint?.action,
    moduleConstraintStatus: route.moduleConstraint?.status,
    moduleConstraintAction: route.moduleConstraint?.action,
    objectModelConstraintStatus: route.objectModelConstraint?.status,
    objectModelConstraintAction: route.objectModelConstraint?.action,
    protocolConstraintStatus: route.protocolConstraint?.status,
    protocolConstraintAction: route.protocolConstraint?.action,
    typeConstraintStatus: route.typeConstraint?.status,
    typeConstraintAction: route.typeConstraint?.action,
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
    interlingua: {
      id: route.interlingua?.id,
      loweringDisposition: route.interlingua?.lowering?.disposition,
      representedLayerKinds: route.interlingua?.layers?.representedKinds ?? [],
      missingLayerKinds: route.interlingua?.layers?.missingKinds ?? [],
      reviewLayerKinds: route.interlingua?.layers?.reviewKinds ?? [],
      blockedLayerKinds: route.interlingua?.layers?.blockedKinds ?? [],
      lossIds: route.interlingua?.lowering?.lossIds ?? [],
      missingEvidence: route.interlingua?.lowering?.missingEvidence ?? []
    },
    resourceTransfer: {
      id: route.resourceTransfer?.id,
      status: route.resourceTransfer?.status,
      action: route.resourceTransfer?.action,
      requiredKinds: route.resourceTransfer?.requiredKinds ?? [],
      representedKinds: route.resourceTransfer?.representedKinds ?? [],
      missingKinds: route.resourceTransfer?.missingKinds ?? [],
      missingEvidence: route.resourceTransfer?.missingEvidence ?? [],
      losses: (route.resourceTransfer?.losses ?? []).map((loss) => loss.kind),
      ownershipConstraints: {
        id: route.resourceTransfer?.ownershipConstraints?.id,
        status: route.resourceTransfer?.ownershipConstraints?.status,
        action: route.resourceTransfer?.ownershipConstraints?.action,
        requiredKinds: route.resourceTransfer?.ownershipConstraints?.requiredKinds ?? [],
        representedKinds: route.resourceTransfer?.ownershipConstraints?.representedKinds ?? [],
        missingKinds: route.resourceTransfer?.ownershipConstraints?.missingKinds ?? [],
        missingEvidence: route.resourceTransfer?.ownershipConstraints?.missingEvidence ?? []
      }
    },
    lifetimeConstraint: constraintRecord(route.lifetimeConstraint),
    controlFlowConstraint: constraintRecord(route.controlFlowConstraint),
    adtPatternConstraint: constraintRecord(route.adtPatternConstraint),
    borrowScopeConstraint: constraintRecord(route.borrowScopeConstraint),
    borrowCheckerConstraint: constraintRecord(route.borrowCheckerConstraint),
    dataLayoutConstraint: constraintRecord(route.dataLayoutConstraint),
    effectConstraint: constraintRecord(route.effectConstraint),
    concurrencyModelConstraint: constraintRecord(route.concurrencyModelConstraint),
    errorModelConstraint: constraintRecord(route.errorModelConstraint),
    evaluationModelConstraint: constraintRecord(route.evaluationModelConstraint),
    hostEnvironmentConstraint: constraintRecord(route.hostEnvironmentConstraint),
    memoryModelConstraint: constraintRecord(route.memoryModelConstraint),
    metaprogrammingConstraint: constraintRecord(route.metaprogrammingConstraint),
    scopeBindingConstraint: constraintRecord(route.scopeBindingConstraint),
    moduleConstraint: constraintRecord(route.moduleConstraint),
    objectModelConstraint: constraintRecord(route.objectModelConstraint),
    protocolConstraint: constraintRecord(route.protocolConstraint),
    typeConstraint: constraintRecord(route.typeConstraint),
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
      translationAdmission: route.translationAdmission,
      interlingua: route.interlingua,
      resourceTransfer: route.resourceTransfer,
      lifetimeConstraint: route.lifetimeConstraint,
      controlFlowConstraint: route.controlFlowConstraint,
      adtPatternConstraint: route.adtPatternConstraint,
      borrowScopeConstraint: route.borrowScopeConstraint,
      borrowCheckerConstraint: route.borrowCheckerConstraint,
      dataLayoutConstraint: route.dataLayoutConstraint,
      effectConstraint: route.effectConstraint,
      concurrencyModelConstraint: route.concurrencyModelConstraint,
      errorModelConstraint: route.errorModelConstraint,
      evaluationModelConstraint: route.evaluationModelConstraint,
      hostEnvironmentConstraint: route.hostEnvironmentConstraint,
      memoryModelConstraint: route.memoryModelConstraint,
      metaprogrammingConstraint: route.metaprogrammingConstraint, scopeBindingConstraint: route.scopeBindingConstraint,
      moduleConstraint: route.moduleConstraint,
      objectModelConstraint: route.objectModelConstraint,
      protocolConstraint: route.protocolConstraint,
      typeConstraint: route.typeConstraint,
      note: 'Admission records are sortable merge-review evidence, not proof of target semantic equivalence.'
    }
  };
}

function admissionBucket(input) {
  if (input.status === 'blocked' || input.action === 'reject' || input.blockers.length) return 'blocked';
  if (input.mode === 'semantic-index-only' || input.missingEvidence.includes('target-adapter')) return 'needs-adapter';
  if (!input.hasBoundEvidence || input.missingEvidence.length || input.opaqueOperations || input.operationKinds.includes('merge')) return 'needs-evidence';
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

function constraintRecord(evidence) {
  return { id: evidence?.id, status: evidence?.status, action: evidence?.action, requiredKinds: evidence?.requiredKinds ?? [], representedKinds: evidence?.representedKinds ?? [], missingKinds: evidence?.missingKinds ?? [], missingEvidence: evidence?.missingEvidence ?? [] };
}
