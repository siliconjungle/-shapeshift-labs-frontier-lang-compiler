import { countBy } from './native-import-utils.js';

export function universalConversionArtifactSummary(routeArtifacts, records) {
  const admissionRecords = records.admissionRecords;
  const semanticOperations = routeArtifacts.flatMap((artifact) => artifact.semanticOperations?.operations ?? []);
  const compactCounts = compactArtifactCounts(routeArtifacts, admissionRecords, semanticOperations);
  return {
    routes: routeArtifacts.length,
    histories: records.historyRecords.length,
    patchBundles: records.patchBundleRecords.length,
    admissionRecords: admissionRecords.length,
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
    }
  };
}
