import { countBy, uniqueStrings } from './native-import-utils.js';

const keys = [
  'translationRuntimeReadinesses',
  'translationRuntimeAdapterRequirementIds',
  'translationRuntimeProofObligationIds',
  'translationRuntimeProofMissingSignals',
  'translationDialectReadinesses',
  'translationDialectRecordIds'
];

export function compactTranslationAdmissionCounts(admissions) {
  return {
    byStatus: countBy(admissions.map((admission) => admission.status)),
    byAction: countBy(admissions.map((admission) => admission.action)),
    missingEvidence: countBy(admissions.flatMap((admission) => admission.missingEvidence ?? [])),
    proofEvidenceIds: countBy(admissions.flatMap((admission) => admission.proofEvidenceIds ?? [])),
    runtimeReadiness: countBy(admissions.map((admission) => admission.runtimeReadiness)),
    runtimeAdapterRequirementIds: countBy(admissions.flatMap((admission) => admission.runtimeAdapterRequirementIds ?? [])),
    runtimeProofObligationIds: countBy(admissions.flatMap((admission) => admission.runtimeProofObligationIds ?? [])),
    runtimeProofMissingSignals: countBy(admissions.flatMap((admission) => admission.runtimeProofMissingSignals ?? [])),
    dialectReadiness: countBy(admissions.map((admission) => admission.dialectReadiness)),
    dialectRecordIds: countBy(admissions.flatMap((admission) => admission.dialectRecordIds ?? []))
  };
}

export function translationAdmissionDenominatorIndex(admissions) {
  return {
    translationRuntimeReadinesses: uniqueStrings(admissions.map((admission) => admission.runtimeReadiness)),
    translationRuntimeAdapterRequirementIds: uniqueStrings(admissions.flatMap((admission) => admission.runtimeAdapterRequirementIds ?? [])),
    translationRuntimeProofObligationIds: uniqueStrings(admissions.flatMap((admission) => admission.runtimeProofObligationIds ?? [])),
    translationRuntimeProofMissingSignals: uniqueStrings(admissions.flatMap((admission) => admission.runtimeProofMissingSignals ?? [])),
    translationDialectReadinesses: uniqueStrings(admissions.map((admission) => admission.dialectReadiness)),
    translationDialectRecordIds: uniqueStrings(admissions.flatMap((admission) => admission.dialectRecordIds ?? []))
  };
}

export function translationAdmissionDenominatorSummary(items) {
  return Object.fromEntries(keys.map((key) => [key, uniqueStrings(items.flatMap((item) => item[key] ?? []))]));
}

export function translationAdmissionDenominatorsForRoute(route) {
  return translationAdmissionDenominatorIndex([route.translationAdmission ?? {}]);
}

export function mergeTranslationAdmissionDenominators(left, right) {
  return Object.fromEntries(keys.map((key) => [key, uniqueStrings([...(left[key] ?? []), ...(right[key] ?? [])])]));
}

export function translationAdmissionDenominatorMatches(record, query, match) {
  return match(query.translationRuntimeReadiness, record.translationRuntimeReadinesses)
    && match(query.translationRuntimeAdapterRequirementId, record.translationRuntimeAdapterRequirementIds)
    && match(query.translationRuntimeProofObligationId, record.translationRuntimeProofObligationIds)
    && match(query.translationRuntimeProofMissingSignal, record.translationRuntimeProofMissingSignals)
    && match(query.translationDialectReadiness, record.translationDialectReadinesses)
    && match(query.translationDialectRecordId, record.translationDialectRecordIds);
}
