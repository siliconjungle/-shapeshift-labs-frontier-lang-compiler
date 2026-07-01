import { countBy, uniqueStrings } from './native-import-utils.js';

const keys = [
  'translationAdmissionStatuses',
  'translationAdmissionActions',
  'missingTranslationEvidence',
  'translationEvidenceIds',
  'translationProofEvidenceIds',
  'translationRuntimeReadinesses',
  'translationRuntimeAdapterRequirementIds',
  'translationRuntimeProofObligationIds',
  'translationRuntimeProofRequiredSignals',
  'translationRuntimeProofProvidedSignals',
  'translationRuntimeProofMissingSignals',
  'translationDialectReadinesses',
  'translationDialectRecordIds',
  'requiredTranslationConstructKinds',
  'representedTranslationConstructKinds',
  'targetAdapterIds'
];

export function compactTranslationAdmissionCounts(admissions) {
  return {
    byStatus: countBy(admissions.map((admission) => admission.status)),
    byAction: countBy(admissions.map((admission) => admission.action)),
    missingEvidence: countBy(admissions.flatMap((admission) => admission.missingEvidence ?? [])),
    evidenceIds: countBy(admissions.flatMap((admission) => admission.evidenceIds ?? [])),
    proofEvidenceIds: countBy(admissions.flatMap((admission) => admission.proofEvidenceIds ?? [])),
    runtimeReadiness: countBy(admissions.map((admission) => admission.runtimeReadiness)),
    runtimeAdapterRequirementIds: countBy(admissions.flatMap((admission) => admission.runtimeAdapterRequirementIds ?? [])),
    runtimeProofObligationIds: countBy(admissions.flatMap((admission) => admission.runtimeProofObligationIds ?? [])),
    runtimeProofRequiredSignals: countBy(admissions.flatMap((admission) => admission.runtimeProofRequiredSignals ?? [])),
    runtimeProofProvidedSignals: countBy(admissions.flatMap((admission) => admission.runtimeProofProvidedSignals ?? [])),
    runtimeProofMissingSignals: countBy(admissions.flatMap((admission) => admission.runtimeProofMissingSignals ?? [])),
    dialectReadiness: countBy(admissions.map((admission) => admission.dialectReadiness)),
    dialectRecordIds: countBy(admissions.flatMap((admission) => admission.dialectRecordIds ?? [])),
    requiredConstructKinds: countBy(admissions.flatMap((admission) => admission.requiredConstructKinds ?? [])),
    representedConstructKinds: countBy(admissions.flatMap((admission) => admission.representedConstructKinds ?? [])),
    targetAdapterIds: countBy(admissions.map((admission) => admission.targetAdapterId))
  };
}

export function translationAdmissionDenominatorIndex(admissions) {
  return {
    translationAdmissionStatuses: uniqueStrings(admissions.map((admission) => admission.status)),
    translationAdmissionActions: uniqueStrings(admissions.map((admission) => admission.action)),
    missingTranslationEvidence: uniqueStrings(admissions.flatMap((admission) => admission.missingEvidence ?? [])),
    translationEvidenceIds: uniqueStrings(admissions.flatMap((admission) => admission.evidenceIds ?? [])),
    translationProofEvidenceIds: uniqueStrings(admissions.flatMap((admission) => admission.proofEvidenceIds ?? [])),
    translationRuntimeReadinesses: uniqueStrings(admissions.map((admission) => admission.runtimeReadiness)),
    translationRuntimeAdapterRequirementIds: uniqueStrings(admissions.flatMap((admission) => admission.runtimeAdapterRequirementIds ?? [])),
    translationRuntimeProofObligationIds: uniqueStrings(admissions.flatMap((admission) => admission.runtimeProofObligationIds ?? [])),
    translationRuntimeProofRequiredSignals: uniqueStrings(admissions.flatMap((admission) => admission.runtimeProofRequiredSignals ?? [])),
    translationRuntimeProofProvidedSignals: uniqueStrings(admissions.flatMap((admission) => admission.runtimeProofProvidedSignals ?? [])),
    translationRuntimeProofMissingSignals: uniqueStrings(admissions.flatMap((admission) => admission.runtimeProofMissingSignals ?? [])),
    translationDialectReadinesses: uniqueStrings(admissions.map((admission) => admission.dialectReadiness)),
    translationDialectRecordIds: uniqueStrings(admissions.flatMap((admission) => admission.dialectRecordIds ?? [])),
    requiredTranslationConstructKinds: uniqueStrings(admissions.flatMap((admission) => admission.requiredConstructKinds ?? [])),
    representedTranslationConstructKinds: uniqueStrings(admissions.flatMap((admission) => admission.representedConstructKinds ?? [])),
    targetAdapterIds: uniqueStrings(admissions.map((admission) => admission.targetAdapterId))
  };
}

export function translationAdmissionDenominatorSummary(items) {
  return Object.fromEntries(keys.map((key) => [key, uniqueStrings(items.flatMap((item) => item[key] ?? []))]));
}

export function translationAdmissionDenominatorsForRoute(route) {
  const index = translationAdmissionDenominatorIndex([route.translationAdmission ?? {}]);
  return { ...index, targetAdapterIds: uniqueStrings([...index.targetAdapterIds, route.adapter]) };
}

export function mergeTranslationAdmissionDenominators(left, right) {
  return Object.fromEntries(keys.map((key) => [key, uniqueStrings([...(left[key] ?? []), ...(right[key] ?? [])])]));
}

export function translationAdmissionDenominatorMatches(record, query, match) {
  return match(query.translationAdmissionStatus, record.translationAdmissionStatuses)
    && match(query.translationAdmissionAction, record.translationAdmissionActions)
    && match(query.missingTranslationEvidence, record.missingTranslationEvidence)
    && match(query.translationEvidenceId, record.translationEvidenceIds)
    && match(query.translationProofEvidenceId, record.translationProofEvidenceIds)
    && match(query.translationRuntimeReadiness, record.translationRuntimeReadinesses)
    && match(query.translationRuntimeAdapterRequirementId, record.translationRuntimeAdapterRequirementIds)
    && match(query.translationRuntimeProofObligationId, record.translationRuntimeProofObligationIds)
    && match(query.translationRuntimeProofRequiredSignal, record.translationRuntimeProofRequiredSignals)
    && match(query.translationRuntimeProofProvidedSignal, record.translationRuntimeProofProvidedSignals)
    && match(query.translationRuntimeProofMissingSignal, record.translationRuntimeProofMissingSignals)
    && match(query.translationDialectReadiness, record.translationDialectReadinesses)
    && match(query.translationDialectRecordId, record.translationDialectRecordIds)
    && match(query.requiredTranslationConstructKind, record.requiredTranslationConstructKinds)
    && match(query.representedTranslationConstructKind, record.representedTranslationConstructKinds)
    && match(query.targetAdapterId, record.targetAdapterIds);
}
