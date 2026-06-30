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
    memoryModelConstraintStatus: route.memoryModelConstraint?.status,
    memoryModelConstraintAction: route.memoryModelConstraint?.action,
    moduleConstraintStatus: route.moduleConstraint?.status,
    moduleConstraintAction: route.moduleConstraint?.action,
    objectModelConstraintStatus: route.objectModelConstraint?.status,
    objectModelConstraintAction: route.objectModelConstraint?.action,
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
    lifetimeConstraint: {
      id: route.lifetimeConstraint?.id,
      status: route.lifetimeConstraint?.status,
      action: route.lifetimeConstraint?.action,
      requiredKinds: route.lifetimeConstraint?.requiredKinds ?? [],
      representedKinds: route.lifetimeConstraint?.representedKinds ?? [],
      missingKinds: route.lifetimeConstraint?.missingKinds ?? [],
      missingEvidence: route.lifetimeConstraint?.missingEvidence ?? []
    },
    controlFlowConstraint: {
      id: route.controlFlowConstraint?.id,
      status: route.controlFlowConstraint?.status,
      action: route.controlFlowConstraint?.action,
      requiredKinds: route.controlFlowConstraint?.requiredKinds ?? [],
      representedKinds: route.controlFlowConstraint?.representedKinds ?? [],
      missingKinds: route.controlFlowConstraint?.missingKinds ?? [],
      missingEvidence: route.controlFlowConstraint?.missingEvidence ?? []
    },
    borrowScopeConstraint: {
      id: route.borrowScopeConstraint?.id,
      status: route.borrowScopeConstraint?.status,
      action: route.borrowScopeConstraint?.action,
      requiredKinds: route.borrowScopeConstraint?.requiredKinds ?? [],
      representedKinds: route.borrowScopeConstraint?.representedKinds ?? [],
      missingKinds: route.borrowScopeConstraint?.missingKinds ?? [],
      missingEvidence: route.borrowScopeConstraint?.missingEvidence ?? []
    },
    borrowCheckerConstraint: {
      id: route.borrowCheckerConstraint?.id,
      status: route.borrowCheckerConstraint?.status,
      action: route.borrowCheckerConstraint?.action,
      requiredKinds: route.borrowCheckerConstraint?.requiredKinds ?? [],
      representedKinds: route.borrowCheckerConstraint?.representedKinds ?? [],
      missingKinds: route.borrowCheckerConstraint?.missingKinds ?? [],
      missingEvidence: route.borrowCheckerConstraint?.missingEvidence ?? []
    },
    dataLayoutConstraint: { id: route.dataLayoutConstraint?.id, status: route.dataLayoutConstraint?.status, action: route.dataLayoutConstraint?.action, requiredKinds: route.dataLayoutConstraint?.requiredKinds ?? [], representedKinds: route.dataLayoutConstraint?.representedKinds ?? [], missingKinds: route.dataLayoutConstraint?.missingKinds ?? [], missingEvidence: route.dataLayoutConstraint?.missingEvidence ?? [] },
    effectConstraint: {
      id: route.effectConstraint?.id,
      status: route.effectConstraint?.status,
      action: route.effectConstraint?.action,
      requiredKinds: route.effectConstraint?.requiredKinds ?? [],
      representedKinds: route.effectConstraint?.representedKinds ?? [],
      missingKinds: route.effectConstraint?.missingKinds ?? [],
      missingEvidence: route.effectConstraint?.missingEvidence ?? []
    },
    concurrencyModelConstraint: {
      id: route.concurrencyModelConstraint?.id,
      status: route.concurrencyModelConstraint?.status,
      action: route.concurrencyModelConstraint?.action,
      requiredKinds: route.concurrencyModelConstraint?.requiredKinds ?? [],
      representedKinds: route.concurrencyModelConstraint?.representedKinds ?? [],
      missingKinds: route.concurrencyModelConstraint?.missingKinds ?? [],
      missingEvidence: route.concurrencyModelConstraint?.missingEvidence ?? []
    },
    errorModelConstraint: {
      id: route.errorModelConstraint?.id,
      status: route.errorModelConstraint?.status,
      action: route.errorModelConstraint?.action,
      requiredKinds: route.errorModelConstraint?.requiredKinds ?? [],
      representedKinds: route.errorModelConstraint?.representedKinds ?? [],
      missingKinds: route.errorModelConstraint?.missingKinds ?? [],
      missingEvidence: route.errorModelConstraint?.missingEvidence ?? []
    },
    evaluationModelConstraint: {
      id: route.evaluationModelConstraint?.id,
      status: route.evaluationModelConstraint?.status,
      action: route.evaluationModelConstraint?.action,
      requiredKinds: route.evaluationModelConstraint?.requiredKinds ?? [],
      representedKinds: route.evaluationModelConstraint?.representedKinds ?? [],
      missingKinds: route.evaluationModelConstraint?.missingKinds ?? [],
      missingEvidence: route.evaluationModelConstraint?.missingEvidence ?? []
    },
    memoryModelConstraint: {
      id: route.memoryModelConstraint?.id,
      status: route.memoryModelConstraint?.status,
      action: route.memoryModelConstraint?.action,
      requiredKinds: route.memoryModelConstraint?.requiredKinds ?? [],
      representedKinds: route.memoryModelConstraint?.representedKinds ?? [],
      missingKinds: route.memoryModelConstraint?.missingKinds ?? [],
      missingEvidence: route.memoryModelConstraint?.missingEvidence ?? []
    },
    moduleConstraint: {
      id: route.moduleConstraint?.id,
      status: route.moduleConstraint?.status,
      action: route.moduleConstraint?.action,
      requiredKinds: route.moduleConstraint?.requiredKinds ?? [],
      representedKinds: route.moduleConstraint?.representedKinds ?? [],
      missingKinds: route.moduleConstraint?.missingKinds ?? [],
      missingEvidence: route.moduleConstraint?.missingEvidence ?? []
    },
    objectModelConstraint: {
      id: route.objectModelConstraint?.id,
      status: route.objectModelConstraint?.status,
      action: route.objectModelConstraint?.action,
      requiredKinds: route.objectModelConstraint?.requiredKinds ?? [],
      representedKinds: route.objectModelConstraint?.representedKinds ?? [],
      missingKinds: route.objectModelConstraint?.missingKinds ?? [],
      missingEvidence: route.objectModelConstraint?.missingEvidence ?? []
    },
    typeConstraint: {
      id: route.typeConstraint?.id,
      status: route.typeConstraint?.status,
      action: route.typeConstraint?.action,
      requiredKinds: route.typeConstraint?.requiredKinds ?? [],
      representedKinds: route.typeConstraint?.representedKinds ?? [],
      missingKinds: route.typeConstraint?.missingKinds ?? [],
      missingEvidence: route.typeConstraint?.missingEvidence ?? []
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
      translationAdmission: route.translationAdmission,
      interlingua: route.interlingua,
      resourceTransfer: route.resourceTransfer,
      lifetimeConstraint: route.lifetimeConstraint,
      controlFlowConstraint: route.controlFlowConstraint,
      borrowScopeConstraint: route.borrowScopeConstraint,
      borrowCheckerConstraint: route.borrowCheckerConstraint,
      dataLayoutConstraint: route.dataLayoutConstraint,
      effectConstraint: route.effectConstraint,
      concurrencyModelConstraint: route.concurrencyModelConstraint,
      errorModelConstraint: route.errorModelConstraint,
      evaluationModelConstraint: route.evaluationModelConstraint,
      memoryModelConstraint: route.memoryModelConstraint,
      moduleConstraint: route.moduleConstraint,
      objectModelConstraint: route.objectModelConstraint,
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
