export function universalConversionArtifactSummary(routeArtifacts, records) {
  const admissionRecords = records.admissionRecords;
  return {
    routes: routeArtifacts.length,
    histories: records.historyRecords.length,
    patchBundles: records.patchBundleRecords.length,
    admissionRecords: admissionRecords.length,
    semanticOperations: routeArtifacts.reduce((sum, artifact) => sum + artifact.semanticOperations.operations.length, 0),
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
