import { countBy } from './native-import-utils.js';

export function universalConversionArtifactSummary(routeArtifacts, records) {
  const admissionRecords = records.admissionRecords;
  const evidenceReceipts = records.evidenceReceipts ?? routeArtifacts.map((artifact) => artifact.evidenceReceipt).filter(Boolean);
  const semanticOperations = routeArtifacts.flatMap((artifact) => artifact.semanticOperations?.operations ?? []);
  const compactCounts = compactArtifactCounts(routeArtifacts, admissionRecords, semanticOperations);
  return {
    routes: routeArtifacts.length,
    histories: records.historyRecords.length,
    patchBundles: records.patchBundleRecords.length,
    admissionRecords: admissionRecords.length,
    evidenceReceipts: evidenceReceipts.length,
    semanticOperations: semanticOperations.length,
    compactCounts,
    mergeReady: countAdmissionBucket(admissionRecords, 'merge-ready'),
    needsEvidence: countAdmissionBucket(admissionRecords, 'needs-evidence'),
    needsAdapter: countAdmissionBucket(admissionRecords, 'needs-adapter'),
    needsReview: countAdmissionBucket(admissionRecords, 'needs-review'),
    admissionBlocked: countAdmissionBucket(admissionRecords, 'blocked'),
    lowRisk: countAdmissionRisk(admissionRecords, 'low'),
    mediumRisk: countAdmissionRisk(admissionRecords, 'medium'),
    highRisk: countAdmissionRisk(admissionRecords, 'high'),
    queued: routeArtifacts.filter((artifact) => artifact.admissionStatus === 'queued').length,
    reviewRequired: routeArtifacts.filter((artifact) => artifact.reviewRequired).length,
    blocked: routeArtifacts.filter((artifact) => artifact.admissionStatus === 'blocked').length,
    reasonCodes: admissionRecords.reduce((sum, record) => sum + record.reasons.length, 0),
    missingEvidence: admissionRecords.reduce((sum, record) => sum + record.evidence.missing.length, 0),
    blockers: admissionRecords.reduce((sum, record) => sum + record.evidence.blockers.length, 0),
    reviewReasons: admissionRecords.reduce((sum, record) => sum + record.evidence.review.length, 0),
    evidenceIds: admissionRecords.reduce((sum, record) => sum + record.ids.evidenceIds.length, 0),
    proofIds: admissionRecords.reduce((sum, record) => sum + record.ids.proofIds.length, 0),
    receiptBoundEvidence: evidenceReceipts.reduce((sum, receipt) => sum + receipt.summary.boundEvidence, 0),
    receiptRejectedEvidence: evidenceReceipts.reduce((sum, receipt) => sum + receipt.summary.rejectedEvidence, 0),
    receiptProofEvidence: evidenceReceipts.reduce((sum, receipt) => sum + receipt.summary.proofEvidence, 0),
    autoMergeClaims: 0,
    semanticEquivalenceClaims: 0
  };
}

function countAdmissionBucket(records, bucket) {
  return records.filter((record) => record.admissionBucket === bucket).length;
}

function countAdmissionRisk(records, risk) {
  return records.filter((record) => record.risk === risk).length;
}

function compactArtifactCounts(routeArtifacts, admissionRecords, semanticOperations) {
  const constructKinds = routeArtifacts.flatMap((artifact) => artifact.metadata?.representation?.constructKinds ?? []);
  const missingConstructs = routeArtifacts.flatMap((artifact) => artifact.metadata?.representation?.missing ?? []);
  const translationAdmissions = routeArtifacts.map((artifact) => artifact.translationAdmission ?? artifact.metadata?.translationAdmission ?? {});
  const evidenceReceipts = routeArtifacts.map((artifact) => artifact.evidenceReceipt ?? {});
  const interlinguaRecords = routeArtifacts.map((artifact) => artifact.interlingua ?? artifact.metadata?.interlingua ?? artifact.admissionRecord?.metadata?.interlingua ?? {});
  const resourceTransfers = routeArtifacts.map((artifact) => artifact.resourceTransfer ?? artifact.metadata?.resourceTransfer ?? artifact.admissionRecord?.metadata?.resourceTransfer ?? {});
  const lifetimeConstraints = routeArtifacts.map((artifact) => artifact.lifetimeConstraint ?? artifact.metadata?.lifetimeConstraint ?? artifact.admissionRecord?.metadata?.lifetimeConstraint ?? {});
  const controlFlowConstraints = routeArtifacts.map((artifact) => artifact.controlFlowConstraint ?? artifact.metadata?.controlFlowConstraint ?? artifact.admissionRecord?.metadata?.controlFlowConstraint ?? {});
  const callableBoundaryConstraints = routeArtifacts.map((artifact) => artifact.callableBoundaryConstraint ?? artifact.metadata?.callableBoundaryConstraint ?? artifact.admissionRecord?.metadata?.callableBoundaryConstraint ?? {});
  const adtPatternConstraints = routeArtifacts.map((artifact) => artifact.adtPatternConstraint ?? artifact.metadata?.adtPatternConstraint ?? artifact.admissionRecord?.metadata?.adtPatternConstraint ?? {});
  const borrowScopeConstraints = routeArtifacts.map((artifact) => artifact.borrowScopeConstraint ?? artifact.metadata?.borrowScopeConstraint ?? artifact.admissionRecord?.metadata?.borrowScopeConstraint ?? {});
  const borrowCheckerConstraints = routeArtifacts.map((artifact) => artifact.borrowCheckerConstraint ?? artifact.metadata?.borrowCheckerConstraint ?? artifact.admissionRecord?.metadata?.borrowCheckerConstraint ?? {});
  const dataLayoutConstraints = routeArtifacts.map((artifact) => artifact.dataLayoutConstraint ?? artifact.metadata?.dataLayoutConstraint ?? artifact.admissionRecord?.metadata?.dataLayoutConstraint ?? {});
  const effectConstraints = routeArtifacts.map((artifact) => artifact.effectConstraint ?? artifact.metadata?.effectConstraint ?? artifact.admissionRecord?.metadata?.effectConstraint ?? {});
  const concurrencyModelConstraints = routeArtifacts.map((artifact) => artifact.concurrencyModelConstraint ?? artifact.metadata?.concurrencyModelConstraint ?? artifact.admissionRecord?.metadata?.concurrencyModelConstraint ?? {});
  const errorModelConstraints = routeArtifacts.map((artifact) => artifact.errorModelConstraint ?? artifact.metadata?.errorModelConstraint ?? artifact.admissionRecord?.metadata?.errorModelConstraint ?? {});
  const evaluationModelConstraints = routeArtifacts.map((artifact) => artifact.evaluationModelConstraint ?? artifact.metadata?.evaluationModelConstraint ?? artifact.admissionRecord?.metadata?.evaluationModelConstraint ?? {});
  const hostEnvironmentConstraints = routeArtifacts.map((artifact) => artifact.hostEnvironmentConstraint ?? artifact.metadata?.hostEnvironmentConstraint ?? artifact.admissionRecord?.metadata?.hostEnvironmentConstraint ?? {});
  const memoryModelConstraints = routeArtifacts.map((artifact) => artifact.memoryModelConstraint ?? artifact.metadata?.memoryModelConstraint ?? artifact.admissionRecord?.metadata?.memoryModelConstraint ?? {});
  const metaprogrammingConstraints = routeArtifacts.map((artifact) => artifact.metaprogrammingConstraint ?? artifact.metadata?.metaprogrammingConstraint ?? artifact.admissionRecord?.metadata?.metaprogrammingConstraint ?? {});
  const scopeBindingConstraints = routeArtifacts.map((artifact) => artifact.scopeBindingConstraint ?? artifact.metadata?.scopeBindingConstraint ?? artifact.admissionRecord?.metadata?.scopeBindingConstraint ?? {});
  const moduleConstraints = routeArtifacts.map((artifact) => artifact.moduleConstraint ?? artifact.metadata?.moduleConstraint ?? artifact.admissionRecord?.metadata?.moduleConstraint ?? {});
  const numericSemanticsConstraints = routeArtifacts.map((artifact) => artifact.numericSemanticsConstraint ?? artifact.metadata?.numericSemanticsConstraint ?? artifact.admissionRecord?.metadata?.numericSemanticsConstraint ?? {});
  const textSemanticsConstraints = routeArtifacts.map((artifact) => artifact.textSemanticsConstraint ?? artifact.metadata?.textSemanticsConstraint ?? artifact.admissionRecord?.metadata?.textSemanticsConstraint ?? {});
  const collectionSemanticsConstraints = routeArtifacts.map((artifact) => artifact.collectionSemanticsConstraint ?? artifact.metadata?.collectionSemanticsConstraint ?? artifact.admissionRecord?.metadata?.collectionSemanticsConstraint ?? {});
  const serializationSemanticsConstraints = routeArtifacts.map((artifact) => artifact.serializationSemanticsConstraint ?? artifact.metadata?.serializationSemanticsConstraint ?? artifact.admissionRecord?.metadata?.serializationSemanticsConstraint ?? {});
  const dependencySemanticsConstraints = routeArtifacts.map((artifact) => artifact.dependencySemanticsConstraint ?? artifact.metadata?.dependencySemanticsConstraint ?? artifact.admissionRecord?.metadata?.dependencySemanticsConstraint ?? {});
  const objectModelConstraints = routeArtifacts.map((artifact) => artifact.objectModelConstraint ?? artifact.metadata?.objectModelConstraint ?? artifact.admissionRecord?.metadata?.objectModelConstraint ?? {});
  const protocolConstraints = routeArtifacts.map((artifact) => artifact.protocolConstraint ?? artifact.metadata?.protocolConstraint ?? artifact.admissionRecord?.metadata?.protocolConstraint ?? {});
  const typeConstraints = routeArtifacts.map((artifact) => artifact.typeConstraint ?? artifact.metadata?.typeConstraint ?? artifact.admissionRecord?.metadata?.typeConstraint ?? {});
  const semanticOperationInterlinguaRecords = semanticOperations.map((operation) => operation.metadata?.interlingua ?? {});
  return {
    representationConstructs: {
      total: constructKinds.length,
      routeArtifacts: routeArtifacts.filter((artifact) => artifact.metadata?.representation?.constructKinds?.length).length,
      byKind: countBy(constructKinds)
    },
    missingConstructs: {
      total: missingConstructs.length,
      routeArtifacts: routeArtifacts.filter((artifact) => artifact.metadata?.representation?.missing?.length).length,
      byKind: countBy(missingConstructs)
    },
    semanticEditReadiness: {
      routeArtifacts: countBy(routeArtifacts.map((artifact) => artifact.readiness)),
      semanticOperations: countBy(semanticOperations.map((operation) => operation.readiness))
    },
    admissionStatuses: {
      byStatus: countBy(routeArtifacts.map((artifact) => artifact.admissionStatus)),
      byBucket: countBy(admissionRecords.map((record) => record.admissionBucket)),
      byAction: countBy(admissionRecords.map((record) => record.admissionAction)),
      byRisk: countBy(admissionRecords.map((record) => record.risk))
    },
    translationAdmission: compactTranslationAdmissionCounts(translationAdmissions),
    runtimeProof: compactRuntimeProofCounts(routeArtifacts, evidenceReceipts),
    resourceTransfer: compactResourceTransferCounts(resourceTransfers),
    lifetimeConstraint: compactConstraintCounts(lifetimeConstraints),
    controlFlowConstraint: compactConstraintCounts(controlFlowConstraints),
    callableBoundaryConstraint: compactConstraintCounts(callableBoundaryConstraints),
    adtPatternConstraint: compactConstraintCounts(adtPatternConstraints),
    borrowScopeConstraint: compactConstraintCounts(borrowScopeConstraints),
    borrowCheckerConstraint: compactConstraintCounts(borrowCheckerConstraints),
    dataLayoutConstraint: compactConstraintCounts(dataLayoutConstraints),
    effectConstraint: compactEffectConstraintCounts(effectConstraints),
    concurrencyModelConstraint: compactConstraintCounts(concurrencyModelConstraints),
    errorModelConstraint: compactConstraintCounts(errorModelConstraints),
    evaluationModelConstraint: compactConstraintCounts(evaluationModelConstraints),
    hostEnvironmentConstraint: compactConstraintCounts(hostEnvironmentConstraints),
    memoryModelConstraint: compactConstraintCounts(memoryModelConstraints),
    metaprogrammingConstraint: compactConstraintCounts(metaprogrammingConstraints),
    scopeBindingConstraint: compactConstraintCounts(scopeBindingConstraints),
    moduleConstraint: compactConstraintCounts(moduleConstraints),
    numericSemanticsConstraint: compactConstraintCounts(numericSemanticsConstraints),
    textSemanticsConstraint: compactConstraintCounts(textSemanticsConstraints),
    collectionSemanticsConstraint: compactConstraintCounts(collectionSemanticsConstraints),
    serializationSemanticsConstraint: compactConstraintCounts(serializationSemanticsConstraints),
    dependencySemanticsConstraint: compactConstraintCounts(dependencySemanticsConstraints),
    objectModelConstraint: compactConstraintCounts(objectModelConstraints),
    protocolConstraint: compactConstraintCounts(protocolConstraints),
    typeConstraint: compactConstraintCounts(typeConstraints),
    evidenceReceipts: compactEvidenceReceiptCounts(evidenceReceipts),
    interlingua: compactInterlinguaCounts(interlinguaRecords),
    semanticOperationInterlingua: {
      operations: semanticOperations.length,
      operationRecords: semanticOperationInterlinguaRecords.filter((record) => record.id || record.loweringDisposition).length,
      ...compactOperationInterlinguaCounts(semanticOperationInterlinguaRecords)
    }
  };
}

function compactResourceTransferCounts(transfers) {
  const constraints = transfers.map((transfer) => transfer.ownershipConstraints ?? {});
  return {
    byStatus: countBy(transfers.map((transfer) => transfer.status)),
    byAction: countBy(transfers.map((transfer) => transfer.action)),
    requiredKinds: countBy(transfers.flatMap((transfer) => transfer.requiredKinds ?? [])),
    representedKinds: countBy(transfers.flatMap((transfer) => transfer.representedKinds ?? [])),
    missingKinds: countBy(transfers.flatMap((transfer) => transfer.missingKinds ?? [])),
    missingEvidence: countBy(transfers.flatMap((transfer) => transfer.missingEvidence ?? [])),
    losses: countBy(transfers.flatMap((transfer) => (transfer.losses ?? []).map((loss) => loss.kind))),
    ownershipConstraintStatuses: countBy(constraints.map((record) => record.status)),
    ownershipConstraintMissingKinds: countBy(constraints.flatMap((record) => record.missingKinds ?? [])),
    ownershipConstraintMissingEvidence: countBy(constraints.flatMap((record) => record.missingEvidence ?? []))
  };
}

function compactEffectConstraintCounts(records) {
  return compactConstraintCounts(records);
}

function compactConstraintCounts(records) {
  return {
    byStatus: countBy(records.map((record) => record.status)),
    byAction: countBy(records.map((record) => record.action)),
    requiredKinds: countBy(records.flatMap((record) => record.requiredKinds ?? [])),
    representedKinds: countBy(records.flatMap((record) => record.representedKinds ?? [])),
    missingKinds: countBy(records.flatMap((record) => record.missingKinds ?? [])),
    missingEvidence: countBy(records.flatMap((record) => record.missingEvidence ?? []))
  };
}

function compactEvidenceReceiptCounts(receipts) {
  const runtimeProofRecords = receipts.flatMap((receipt) => receipt.records?.runtimeProof ?? []);
  const interlinguaObligationRecords = receipts.flatMap((receipt) => receipt.records?.interlinguaObligations ?? []);
  return {
    routeArtifacts: receipts.filter((receipt) => receipt.id).length,
    boundEvidence: receipts.reduce((sum, receipt) => sum + Number(receipt.summary?.boundEvidence ?? 0), 0),
    rejectedEvidence: receipts.reduce((sum, receipt) => sum + Number(receipt.summary?.rejectedEvidence ?? 0), 0),
    proofEvidence: receipts.reduce((sum, receipt) => sum + Number(receipt.summary?.proofEvidence ?? 0), 0),
    runtimeProofObligations: runtimeProofRecords.length,
    runtimeProofByStatus: countBy(runtimeProofRecords.map((record) => record.status)),
    runtimeProofByCapability: countBy(runtimeProofRecords.map((record) => record.capability)),
    runtimeProofMissingSignals: countBy(runtimeProofRecords.flatMap((record) => record.missingSignals ?? [])),
    runtimeProofProvidedSignals: countBy(runtimeProofRecords.flatMap((record) => record.providedSignals ?? [])),
    interlinguaConstraintObligations: interlinguaObligationRecords.length,
    interlinguaConstraintByFamily: countBy(interlinguaObligationRecords.map((record) => record.family)),
    interlinguaConstraintByStatus: countBy(interlinguaObligationRecords.map((record) => record.status)),
    interlinguaConstraintMissingKinds: countBy(receipts.flatMap((receipt) => receipt.interlinguaConstraintMissingKinds ?? [])),
    interlinguaConstraintMissingEvidence: countBy([...receipts.flatMap((receipt) => receipt.interlinguaConstraintMissingEvidence ?? []), ...interlinguaObligationRecords.flatMap((record) => record.missingEvidence ?? [])]),
    interlinguaConstraintObligationKinds: countBy([...receipts.flatMap((receipt) => receipt.interlinguaConstraintObligationKinds ?? []), ...interlinguaObligationRecords.map((record) => record.kind)]),
    interlinguaConstraintObligationStatuses: countBy([...receipts.flatMap((receipt) => receipt.interlinguaConstraintObligationStatuses ?? []), ...interlinguaObligationRecords.map((record) => record.status)]),
    interlinguaConstraintObligationEvidenceIds: countBy(interlinguaObligationRecords.flatMap((record) => record.evidenceIds ?? [])),
    interlinguaConstraintObligationMissingEvidence: countBy([...receipts.flatMap((receipt) => receipt.interlinguaConstraintObligationMissingEvidence ?? []), ...interlinguaObligationRecords.flatMap((record) => record.missingEvidence ?? [])]),
    missingEvidence: countBy(receipts.flatMap((receipt) => receipt.missingEvidence ?? [])),
    proofEvidenceIds: countBy(receipts.flatMap((receipt) => receipt.proofEvidenceIds ?? [])),
    rejectedByReason: countBy(receipts.flatMap((receipt) => (receipt.records?.rejected ?? []).map((record) => record.reason)))
  };
}

function compactRuntimeProofCounts(routeArtifacts, receipts) {
  const receiptRecords = receipts.flatMap((receipt) => receipt.records?.runtimeProof ?? []);
  return {
    routeArtifacts: routeArtifacts.filter((artifact) => artifact.runtimeProofObligationIds?.length).length,
    obligations: routeArtifacts.reduce((sum, artifact) => sum + (artifact.runtimeProofObligationIds?.length ?? 0), 0),
    byCapability: countBy(routeArtifacts.flatMap((artifact) => artifact.runtimeProofCapabilities ?? [])),
    byStatus: countBy(routeArtifacts.flatMap((artifact) => artifact.runtimeProofStatuses ?? [])),
    requiredSignals: countBy(routeArtifacts.flatMap((artifact) => artifact.runtimeProofRequiredSignals ?? [])),
    providedSignals: countBy(routeArtifacts.flatMap((artifact) => artifact.runtimeProofProvidedSignals ?? [])),
    missingSignals: countBy(routeArtifacts.flatMap((artifact) => artifact.runtimeProofMissingSignals ?? [])),
    receiptRecords: receiptRecords.length,
    receiptByStatus: countBy(receiptRecords.map((record) => record.status)),
    receiptMissingEvidence: countBy(receiptRecords.flatMap((record) => record.missingEvidence ?? []))
  };
}

function compactTranslationAdmissionCounts(admissions) {
  return {
    byStatus: countBy(admissions.map((admission) => admission.status)),
    byAction: countBy(admissions.map((admission) => admission.action)),
    missingEvidence: countBy(admissions.flatMap((admission) => admission.missingEvidence ?? [])),
    proofEvidenceIds: countBy(admissions.flatMap((admission) => admission.proofEvidenceIds ?? [])),
    runtimeReadiness: countBy(admissions.map((admission) => admission.runtimeReadiness)),
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
    constraintFamilies: countBy(records.flatMap((record) => interlinguaConstraintList(record, 'families'))),
    constraintStatuses: countBy(records.flatMap((record) => interlinguaConstraintList(record, 'statuses'))),
    constraintMissingKinds: countBy(records.flatMap((record) => interlinguaConstraintList(record, 'missingKinds'))),
    constraintMissingEvidence: countBy(records.flatMap((record) => interlinguaConstraintList(record, 'missingEvidence'))),
    constraintObligationKinds: countBy(records.flatMap((record) => interlinguaConstraintList(record, 'obligationKinds'))),
    constraintObligationStatuses: countBy(records.flatMap((record) => interlinguaConstraintList(record, 'obligationStatuses'))),
    constraintObligationMissingEvidence: countBy(records.flatMap((record) => interlinguaConstraintList(record, 'obligationMissingEvidence'))),
    missingEvidence: countBy(records.flatMap((record) => interlinguaLoweringList(record, 'missingEvidence'))),
    proofEvidenceIds: countBy(records.flatMap((record) => interlinguaLoweringList(record, 'proofEvidenceIds')))
  };
}

function compactOperationInterlinguaCounts(records) {
  return {
    byLoweringDisposition: countBy(records.map((record) => record.loweringDisposition)),
    layerKinds: countBy(records.flatMap((record) => record.layerKinds ?? [])),
    representedLayerKinds: countBy(records.flatMap((record) => record.representedLayerKinds ?? [])),
    missingLayerKinds: countBy(records.flatMap((record) => record.missingLayerKinds ?? [])),
    reviewLayerKinds: countBy(records.flatMap((record) => record.reviewLayerKinds ?? [])),
    blockedLayerKinds: countBy(records.flatMap((record) => record.blockedLayerKinds ?? [])),
    constraintFamilies: countBy(records.flatMap((record) => record.constraintFamilies ?? [])),
    constraintStatuses: countBy(records.flatMap((record) => record.constraintStatuses ?? [])),
    constraintMissingKinds: countBy(records.flatMap((record) => record.constraintMissingKinds ?? [])),
    constraintMissingEvidence: countBy(records.flatMap((record) => record.constraintMissingEvidence ?? [])),
    constraintObligationKinds: countBy(records.flatMap((record) => record.constraintObligationKinds ?? [])),
    constraintObligationStatuses: countBy(records.flatMap((record) => record.constraintObligationStatuses ?? [])),
    missingEvidence: countBy(records.flatMap((record) => record.missingEvidence ?? [])),
    proofEvidenceIds: countBy(records.flatMap((record) => record.proofEvidenceIds ?? []))
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
