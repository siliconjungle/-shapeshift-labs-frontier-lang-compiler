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
    resourceTransfer: compactResourceTransferCounts(resourceTransfers),
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

function compactEvidenceReceiptCounts(receipts) {
  return {
    routeArtifacts: receipts.filter((receipt) => receipt.id).length,
    boundEvidence: receipts.reduce((sum, receipt) => sum + Number(receipt.summary?.boundEvidence ?? 0), 0),
    rejectedEvidence: receipts.reduce((sum, receipt) => sum + Number(receipt.summary?.rejectedEvidence ?? 0), 0),
    proofEvidence: receipts.reduce((sum, receipt) => sum + Number(receipt.summary?.proofEvidence ?? 0), 0),
    missingEvidence: countBy(receipts.flatMap((receipt) => receipt.missingEvidence ?? [])),
    proofEvidenceIds: countBy(receipts.flatMap((receipt) => receipt.proofEvidenceIds ?? [])),
    rejectedByReason: countBy(receipts.flatMap((receipt) => (receipt.records?.rejected ?? []).map((record) => record.reason)))
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

function layerSummaryKey(queryKey) {
  if (queryKey === 'layerKinds') return 'kinds';
  if (queryKey === 'representedLayerKinds') return 'representedKinds';
  if (queryKey === 'missingLayerKinds') return 'missingKinds';
  if (queryKey === 'reviewLayerKinds') return 'reviewKinds';
  if (queryKey === 'blockedLayerKinds') return 'blockedKinds';
  return queryKey;
}
