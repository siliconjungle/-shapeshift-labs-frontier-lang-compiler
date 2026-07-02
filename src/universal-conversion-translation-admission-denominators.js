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
  'translationRuntimeProofCapabilities',
  'translationRuntimeProofStatuses',
  'translationRuntimeProofRequiredSignals',
  'translationRuntimeProofProvidedSignals',
  'translationRuntimeProofMissingSignals',
  'translationDialectReadinesses',
  'translationDialectRecordIds',
  'requiredTranslationConstructKinds',
  'representedTranslationConstructKinds',
  'targetAdapterIds'
];

const flatTranslationAdmissionFieldKeys = [
  'translationAdmissionStatus',
  'translationAdmissionStatuses',
  'translationAdmissionAction',
  'translationAdmissionActions',
  'missingTranslationEvidence',
  'translationEvidenceId',
  'translationEvidenceIds',
  'translationProofEvidenceId',
  'translationProofEvidenceIds',
  'translationRuntimeReadiness',
  'translationRuntimeReadinesses',
  'translationRuntimeAdapterRequirementId',
  'translationRuntimeAdapterRequirementIds',
  'translationRuntimeProofObligationId',
  'translationRuntimeProofObligationIds',
  'translationRuntimeProofCapability',
  'translationRuntimeProofCapabilities',
  'translationRuntimeProofStatus',
  'translationRuntimeProofStatuses',
  'translationRuntimeProofRequiredSignal',
  'translationRuntimeProofRequiredSignals',
  'translationRuntimeProofProvidedSignal',
  'translationRuntimeProofProvidedSignals',
  'translationRuntimeProofMissingSignal',
  'translationRuntimeProofMissingSignals',
  'translationDialectReadiness',
  'translationDialectReadinesses',
  'translationDialectRecordId',
  'translationDialectRecordIds',
  'requiredTranslationConstructKind',
  'requiredTranslationConstructKinds',
  'representedTranslationConstructKind',
  'representedTranslationConstructKinds',
  'targetAdapterId',
  'targetAdapterIds',
  'adapter'
];

export function translationAdmissionDenominatorRecord(record = {}) {
  const nested = record.translationAdmission ?? record.metadata?.translationAdmission ?? record.admissionRecord?.metadata?.translationAdmission ?? {};
  return { ...pickTranslationAdmissionFields(record), ...nested };
}

export function compactTranslationAdmissionCounts(admissions = []) {
  const rows = admissions.map(translationAdmissionDenominatorFields);
  return {
    byStatus: countBy(rows.flatMap((admission) => admission.translationAdmissionStatuses)),
    byAction: countBy(rows.flatMap((admission) => admission.translationAdmissionActions)),
    missingEvidence: countBy(rows.flatMap((admission) => admission.missingTranslationEvidence)),
    evidenceIds: countBy(rows.flatMap((admission) => admission.translationEvidenceIds)),
    proofEvidenceIds: countBy(rows.flatMap((admission) => admission.translationProofEvidenceIds)),
    runtimeReadiness: countBy(rows.flatMap((admission) => admission.translationRuntimeReadinesses)),
    runtimeAdapterRequirementIds: countBy(rows.flatMap((admission) => admission.translationRuntimeAdapterRequirementIds)),
    runtimeProofObligationIds: countBy(rows.flatMap((admission) => admission.translationRuntimeProofObligationIds)),
    runtimeProofCapabilities: countBy(rows.flatMap((admission) => admission.translationRuntimeProofCapabilities)),
    runtimeProofStatuses: countBy(rows.flatMap((admission) => admission.translationRuntimeProofStatuses)),
    runtimeProofRequiredSignals: countBy(rows.flatMap((admission) => admission.translationRuntimeProofRequiredSignals)),
    runtimeProofProvidedSignals: countBy(rows.flatMap((admission) => admission.translationRuntimeProofProvidedSignals)),
    runtimeProofMissingSignals: countBy(rows.flatMap((admission) => admission.translationRuntimeProofMissingSignals)),
    dialectReadiness: countBy(rows.flatMap((admission) => admission.translationDialectReadinesses)),
    dialectRecordIds: countBy(rows.flatMap((admission) => admission.translationDialectRecordIds)),
    requiredConstructKinds: countBy(rows.flatMap((admission) => admission.requiredTranslationConstructKinds)),
    representedConstructKinds: countBy(rows.flatMap((admission) => admission.representedTranslationConstructKinds)),
    targetAdapterIds: countBy(rows.flatMap((admission) => admission.targetAdapterIds))
  };
}

export function translationAdmissionDenominatorIndex(admissions = []) {
  return translationAdmissionDenominatorSummary(admissions.map(translationAdmissionDenominatorFields));
}

export function translationAdmissionDenominatorSummary(items = []) {
  const rows = items.map(translationAdmissionDenominatorFields);
  return Object.fromEntries(keys.map((key) => [key, uniqueStrings(rows.flatMap((item) => item[key] ?? []))]));
}

export function translationAdmissionDenominatorsForRoute(route = {}) {
  const index = translationAdmissionDenominatorIndex([route.translationAdmission ?? {}]);
  return { ...index, targetAdapterIds: uniqueStrings([...index.targetAdapterIds, route.adapter]) };
}

export function mergeTranslationAdmissionDenominators(left = {}, right = {}) {
  return translationAdmissionDenominatorSummary([left, right]);
}

export function translationAdmissionDenominatorMatches(record = {}, query = {}, match) {
  const row = translationAdmissionDenominatorFields(record);
  return match(query.translationAdmissionStatus, row.translationAdmissionStatuses)
    && match(query.translationAdmissionAction, row.translationAdmissionActions)
    && match(query.missingTranslationEvidence, row.missingTranslationEvidence)
    && match(query.translationEvidenceId, row.translationEvidenceIds)
    && match(query.translationProofEvidenceId, row.translationProofEvidenceIds)
    && match(query.translationRuntimeReadiness, row.translationRuntimeReadinesses)
    && match(query.translationRuntimeAdapterRequirementId, row.translationRuntimeAdapterRequirementIds)
    && match(query.translationRuntimeProofObligationId, row.translationRuntimeProofObligationIds)
    && match(query.translationRuntimeProofCapability, row.translationRuntimeProofCapabilities)
    && match(query.translationRuntimeProofStatus, row.translationRuntimeProofStatuses)
    && match(query.translationRuntimeProofRequiredSignal, row.translationRuntimeProofRequiredSignals)
    && match(query.translationRuntimeProofProvidedSignal, row.translationRuntimeProofProvidedSignals)
    && match(query.translationRuntimeProofMissingSignal, row.translationRuntimeProofMissingSignals)
    && match(query.translationDialectReadiness, row.translationDialectReadinesses)
    && match(query.translationDialectRecordId, row.translationDialectRecordIds)
    && match(query.requiredTranslationConstructKind, row.requiredTranslationConstructKinds)
    && match(query.representedTranslationConstructKind, row.representedTranslationConstructKinds)
    && match(query.targetAdapterId, row.targetAdapterIds);
}

function translationAdmissionDenominatorFields(record = {}) {
  return {
    translationAdmissionStatuses: uniqueStrings([
      ...listField(record.translationAdmissionStatus),
      ...listField(record.translationAdmissionStatuses),
      ...listField(record.status)
    ]),
    translationAdmissionActions: uniqueStrings([
      ...listField(record.translationAdmissionAction),
      ...listField(record.translationAdmissionActions),
      ...listField(record.action)
    ]),
    missingTranslationEvidence: uniqueStrings([
      ...listField(record.missingTranslationEvidence),
      ...listField(record.missingEvidence)
    ]),
    translationEvidenceIds: uniqueStrings([
      ...listField(record.translationEvidenceId),
      ...listField(record.translationEvidenceIds),
      ...listField(record.evidenceIds)
    ]),
    translationProofEvidenceIds: uniqueStrings([
      ...listField(record.translationProofEvidenceId),
      ...listField(record.translationProofEvidenceIds),
      ...listField(record.proofEvidenceIds)
    ]),
    translationRuntimeReadinesses: uniqueStrings([
      ...listField(record.translationRuntimeReadiness),
      ...listField(record.translationRuntimeReadinesses),
      ...listField(record.runtimeReadiness)
    ]),
    translationRuntimeAdapterRequirementIds: uniqueStrings([
      ...listField(record.translationRuntimeAdapterRequirementId),
      ...listField(record.translationRuntimeAdapterRequirementIds),
      ...listField(record.runtimeAdapterRequirementIds)
    ]),
    translationRuntimeProofObligationIds: uniqueStrings([
      ...listField(record.translationRuntimeProofObligationId),
      ...listField(record.translationRuntimeProofObligationIds),
      ...listField(record.runtimeProofObligationIds)
    ]),
    translationRuntimeProofCapabilities: uniqueStrings([
      ...listField(record.translationRuntimeProofCapability),
      ...listField(record.translationRuntimeProofCapabilities),
      ...listField(record.runtimeProofCapabilities)
    ]),
    translationRuntimeProofStatuses: uniqueStrings([
      ...listField(record.translationRuntimeProofStatus),
      ...listField(record.translationRuntimeProofStatuses),
      ...listField(record.runtimeProofStatuses)
    ]),
    translationRuntimeProofRequiredSignals: uniqueStrings([
      ...listField(record.translationRuntimeProofRequiredSignal),
      ...listField(record.translationRuntimeProofRequiredSignals),
      ...listField(record.runtimeProofRequiredSignals)
    ]),
    translationRuntimeProofProvidedSignals: uniqueStrings([
      ...listField(record.translationRuntimeProofProvidedSignal),
      ...listField(record.translationRuntimeProofProvidedSignals),
      ...listField(record.runtimeProofProvidedSignals)
    ]),
    translationRuntimeProofMissingSignals: uniqueStrings([
      ...listField(record.translationRuntimeProofMissingSignal),
      ...listField(record.translationRuntimeProofMissingSignals),
      ...listField(record.runtimeProofMissingSignals)
    ]),
    translationDialectReadinesses: uniqueStrings([
      ...listField(record.translationDialectReadiness),
      ...listField(record.translationDialectReadinesses),
      ...listField(record.dialectReadiness)
    ]),
    translationDialectRecordIds: uniqueStrings([
      ...listField(record.translationDialectRecordId),
      ...listField(record.translationDialectRecordIds),
      ...listField(record.dialectRecordIds)
    ]),
    requiredTranslationConstructKinds: uniqueStrings([
      ...listField(record.requiredTranslationConstructKind),
      ...listField(record.requiredTranslationConstructKinds),
      ...listField(record.requiredConstructKinds)
    ]),
    representedTranslationConstructKinds: uniqueStrings([
      ...listField(record.representedTranslationConstructKind),
      ...listField(record.representedTranslationConstructKinds),
      ...listField(record.representedConstructKinds)
    ]),
    targetAdapterIds: uniqueStrings([
      ...listField(record.targetAdapterId),
      ...listField(record.targetAdapterIds),
      ...listField(record.adapter)
    ])
  };
}

function listField(value) {
  if (Array.isArray(value)) return value;
  return value === undefined ? [] : [value];
}

function pickTranslationAdmissionFields(record = {}) {
  return Object.fromEntries(flatTranslationAdmissionFieldKeys
    .filter((key) => Object.prototype.hasOwnProperty.call(record, key))
    .map((key) => [key, record[key]]));
}
