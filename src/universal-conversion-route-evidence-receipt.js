import { countBy, normalizeNativeLanguageId, uniqueStrings } from './native-import-utils.js';
import { createUniversalConversionPlan, queryUniversalConversionPlan } from './universal-conversion-plan.js';
import { conversionRouteEvidence } from './universal-conversion-route-evidence.js';

export function createUniversalConversionRouteEvidenceReceipt(routeOrInput = {}, options = {}, context = {}) {
  const route = selectRoute(routeOrInput, options, context);
  const suppliedEvidence = Array.isArray(options.evidence)
    ? options.evidence
    : Array.isArray(routeOrInput?.evidence)
      ? routeOrInput.evidence
      : [];
  const boundRecords = suppliedEvidence.length ? conversionRouteEvidence(suppliedEvidence, routeLanguage(route), route.target, route.id) : [];
  const boundRecordIds = uniqueStrings(boundRecords.map((record) => record.id));
  const rejectedRecords = options.includeRejectedEvidence === false
    ? []
    : rejectedEvidenceRecords(suppliedEvidence, route, boundRecordIds);
  const evidenceIds = uniqueStrings([
    ...(route.mergeRefs?.evidenceIds ?? []),
    ...(route.translationAdmission?.evidenceIds ?? []),
    ...boundRecordIds
  ]);
  const proofEvidenceIds = uniqueStrings([
    ...(route.mergeRefs?.proofIds ?? []),
    ...(route.translationAdmission?.proofEvidenceIds ?? []),
    ...proofIdsForEvidence(boundRecords)
  ]);
  const missingEvidence = uniqueStrings([
    ...(route.missingEvidence ?? []),
    ...(route.translationAdmission?.missingEvidence ?? []),
    ...(evidenceIds.length ? [] : ['route-bound-evidence']),
    ...(proofEvidenceIds.length ? [] : ['route-bound-proof-evidence'])
  ]);
  const boundSummaries = boundRecords.map((record) => evidenceRecordSummary(record, 'bound'));
  const rejectedSummaries = rejectedRecords.map(({ record, reason }) => ({
    ...evidenceRecordSummary(record, 'rejected'),
    reason
  }));
  return {
    kind: 'frontier.lang.universalConversionRouteEvidenceReceipt',
    version: 1,
    schema: 'frontier.lang.universalConversionRouteEvidenceReceipt.v1',
    routeId: route.id,
    planId: route.mergeRefs?.planId,
    sourceLanguage: route.sourceLanguage,
    languageIds: route.languageIds ?? [],
    target: route.target,
    mode: route.mode,
    readiness: route.readiness,
    admissionAction: route.admissionAction,
    translationAdmissionStatus: route.translationAdmission?.status,
    translationAdmissionAction: route.translationAdmission?.action,
    evidenceIds,
    proofEvidenceIds,
    missingEvidence,
    blockers: route.blockers ?? [],
    review: route.review ?? [],
    sources: route.mergeRefs?.sources ?? [],
    ownershipKeys: route.mergeRefs?.semanticOwnershipKeys ?? [],
    conflictKeys: route.mergeRefs?.conflictKeys ?? [],
    records: {
      bound: boundSummaries,
      rejected: rejectedSummaries
    },
    summary: {
      boundEvidence: boundSummaries.length,
      rejectedEvidence: rejectedSummaries.length,
      proofEvidence: proofEvidenceIds.length,
      missingEvidence: missingEvidence.length,
      blockers: route.blockers?.length ?? 0,
      reviewReasons: route.review?.length ?? 0,
      byKind: countBy(boundSummaries.map((record) => record.kind)),
      byStatus: countBy(boundSummaries.map((record) => record.status)),
      rejectedByReason: countBy(rejectedSummaries.map((record) => record.reason)),
      autoMergeClaims: 0,
      semanticEquivalenceClaims: 0
    },
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    metadata: {
      routeEvidenceRequired: true,
      sourceBound: route.mergeRefs?.sources?.length ? true : false,
      note: 'Route evidence receipts bind scoped evidence to one conversion route. They are admission receipts, not semantic-equivalence proof.'
    }
  };
}

function selectRoute(routeOrInput, options, context) {
  if (isConversionRoute(routeOrInput)) return routeOrInput;
  const plan = routeOrInput?.kind === 'frontier.lang.universalConversionPlan'
    ? routeOrInput
    : createUniversalConversionPlan(routeOrInput, context);
  const query = {
    routeId: options.routeId,
    sourceLanguage: options.sourceLanguage ?? options.language,
    target: options.target,
    mode: options.mode,
    readiness: options.readiness,
    admissionAction: options.admissionAction,
    translationAdmissionStatus: options.translationAdmissionStatus,
    translationAdmissionAction: options.translationAdmissionAction,
    targetAdapterId: options.targetAdapterId
  };
  const queried = queryUniversalConversionPlan(plan, query, context);
  const route = options.routeId
    ? queried.routes.find((entry) => entry.id === options.routeId)
    : queried.bestRoute;
  if (!route) throw new Error(`No conversion route matched routeId=${options.routeId ?? '*'} source=${options.sourceLanguage ?? options.language ?? '*'} target=${options.target ?? '*'}.`);
  return route;
}

function isConversionRoute(value) {
  return Boolean(value?.id && value?.sourceLanguage && value?.target && value?.mergeRefs);
}

function routeLanguage(route) {
  return {
    language: route.sourceLanguage,
    aliases: route.languageIds ?? []
  };
}

function rejectedEvidenceRecords(evidence, route, boundRecordIds) {
  return (evidence ?? [])
    .filter((record) => record?.id && !boundRecordIds.includes(record.id))
    .map((record) => ({ record, reason: rejectionReason(record, route) }))
    .filter((entry) => entry.reason);
}

function rejectionReason(record, route) {
  const routeIds = evidenceValues(record, 'routeId', 'routeIds');
  const sourceLanguages = evidenceValues(record, 'sourceLanguage', 'sourceLanguages', 'language', 'languages').map(normalizeNativeLanguageId);
  const targets = evidenceValues(record, 'target', 'targets', 'targetLanguage', 'targetLanguages');
  if (!routeIds.length && !sourceLanguages.length && !targets.length) return 'unscoped-evidence';
  if (routeIds.length && !routeIds.includes(route.id)) return 'route-id-mismatch';
  const routeLanguageIds = new Set((route.languageIds ?? [route.sourceLanguage]).map(normalizeNativeLanguageId));
  if (sourceLanguages.length && !sourceLanguages.some((language) => routeLanguageIds.has(language))) return 'source-language-mismatch';
  if (targets.length && !targets.includes(String(route.target))) return 'target-mismatch';
  return 'not-route-bound';
}

function evidenceRecordSummary(record, binding) {
  return {
    id: record.id,
    kind: evidenceKind(record),
    status: record.status ?? 'unknown',
    binding,
    routeIds: evidenceValues(record, 'routeId', 'routeIds'),
    sourceLanguages: evidenceValues(record, 'sourceLanguage', 'sourceLanguages', 'language', 'languages'),
    targets: evidenceValues(record, 'target', 'targets', 'targetLanguage', 'targetLanguages'),
    proof: isProofEvidence(record),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

function proofIdsForEvidence(evidence) {
  return (evidence ?? []).filter(isProofEvidence).map((record) => record.id).filter(Boolean);
}

function isProofEvidence(record) {
  return passed(record) && /proof|replay|oracle|test|gate|verification|runtime/i.test(evidenceKind(record));
}

function passed(record) {
  return record?.status === 'passed' || record?.status === 'ok' || record?.status === 'success';
}

function evidenceKind(record) {
  return String(record?.kind ?? record?.type ?? record?.scope ?? record?.metadata?.kind ?? '');
}

function evidenceValues(record, singleKey, pluralKey, alternateSingleKey, alternatePluralKey) {
  return uniqueStrings([
    record?.[singleKey],
    ...array(record?.[pluralKey]),
    alternateSingleKey ? record?.[alternateSingleKey] : undefined,
    ...array(alternatePluralKey ? record?.[alternatePluralKey] : undefined),
    record?.metadata?.[singleKey],
    ...array(record?.metadata?.[pluralKey]),
    alternateSingleKey ? record?.metadata?.[alternateSingleKey] : undefined,
    ...array(alternatePluralKey ? record?.metadata?.[alternatePluralKey] : undefined)
  ]);
}

function array(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}
