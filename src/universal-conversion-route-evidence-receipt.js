import{countBy,normalizeNativeLanguageId,uniqueStrings}from './native-import-utils.js'; import{createUniversalConversionPlan,queryUniversalConversionPlan}from './universal-conversion-plan.js';
import{conversionRouteEvidence}from './universal-conversion-route-evidence.js'; import{routeRuntimeDenominators}from './universal-conversion-artifact-runtime-routes.js'; import{artifactSemanticEditIndex,semanticEditIndexCounts}from './universal-conversion-artifact-semantic-edit.js';
import{compactTranslationAdmissionCounts,translationAdmissionDenominatorsForRoute}from './universal-conversion-translation-admission-denominators.js'; import{summarizeRuntimeProofObligations}from './universal-runtime-proof-obligations.js';

export function createUniversalConversionRouteEvidenceReceipt(routeOrInput = {}, options = {}, context = {}) {
  const route = selectRoute(routeOrInput, options, context);
  const suppliedEvidence = Array.isArray(options.evidence)
    ? options.evidence
    : Array.isArray(routeOrInput?.evidence)
      ? routeOrInput.evidence
      : [];
  const boundRecords = suppliedEvidence.length ? conversionRouteEvidence(suppliedEvidence, routeLanguage(route), route.target, route.id) : [];
  const boundRecordIds = uniqueStrings(boundRecords.map((record) => record.id));
  const runtimeProofObligations = route.runtime?.proofObligations ?? [];
  const runtimeRoute = routeRuntimeDenominators(route);
  const runtimeProofRecords = runtimeProofObligations.map(runtimeProofRecordSummary);
  const runtimeProofEvidenceIds = uniqueStrings(runtimeProofObligations.flatMap((record) => record.evidenceIds ?? []));
  const runtimeProofSummary = summarizeRuntimeProofObligations(runtimeProofObligations);
  const semanticEdit = artifactSemanticEditIndex(route);
  const interlingua = route.interlingua ?? {};
  const interlinguaQuery = interlingua.query ?? {};
  const interlinguaObligationRecords = (interlingua.constraints?.obligations ?? []).map(interlinguaObligationRecordSummary);
  const interlinguaObligationMissingEvidence = interlinguaObligationRecords.flatMap((record) => record.missingEvidence);
  const interlinguaConstraintEvidenceIds = interlinguaQuery.constraintEvidenceIds ?? [];
  const interlinguaConstraintObligationEvidenceIds = uniqueStrings([...(interlinguaQuery.constraintObligationEvidenceIds ?? []), ...interlinguaObligationRecords.flatMap((record) => record.evidenceIds ?? [])]);
  const interlinguaMissingEvidence = uniqueStrings([
    ...(interlinguaQuery.constraintMissingEvidence ?? []),
    ...(interlinguaQuery.constraintObligationMissingEvidence ?? []),
    ...(interlingua.lowering?.missingEvidence ?? [])
  ]);
  const acceptedEvidenceIds = uniqueStrings([...boundRecordIds, ...runtimeProofEvidenceIds]);
  const rejectedRecords = options.includeRejectedEvidence === false
    ? []
    : rejectedEvidenceRecords(suppliedEvidence, route, acceptedEvidenceIds);
  const evidenceIds = uniqueStrings([
    ...(route.mergeRefs?.evidenceIds ?? []),
    ...(route.translationAdmission?.evidenceIds ?? []),
    ...runtimeProofEvidenceIds,
    ...boundRecordIds
  ]);
  const proofEvidenceIds = uniqueStrings([
    ...(route.mergeRefs?.proofIds ?? []),
    ...(route.translationAdmission?.proofEvidenceIds ?? []),
    ...runtimeProofEvidenceIds,
    ...proofIdsForEvidence(boundRecords)
  ]);
  const sourceMapIds = uniqueStrings(route.mergeRefs?.sourceMapIds ?? []);
  const sourceMapMappingIds = uniqueStrings(route.mergeRefs?.sourceMapMappingIds ?? []);
  const sourceMapLinkIds = uniqueStrings(route.mergeRefs?.sourceMapLinkIds ?? []);
  const missingEvidence = uniqueStrings([
    ...(route.missingEvidence ?? []),
    ...(route.translationAdmission?.missingEvidence ?? []),
    ...runtimeProofObligations.flatMap((record) => record.missingEvidence ?? []),
    ...interlinguaMissingEvidence,
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
    id: `evidence_receipt_${route.id}`,
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
    ...translationAdmissionDenominatorsForRoute(route),
    ...runtimeRoute,
    runtimeAdapterRequirementIds: uniqueStrings((route.runtimeAdapterRequirements ?? []).map((entry) => entry.id ?? entry.capability)),
    runtimeProofObligationIds: uniqueStrings(runtimeProofObligations.map((record) => record.id)),
    runtimeProofCapabilities: uniqueStrings(runtimeProofObligations.map((record) => record.capability)),
    runtimeProofStatuses: uniqueStrings(runtimeProofObligations.map((record) => record.status)),
    runtimeProofRequiredSignals: uniqueStrings(runtimeProofObligations.flatMap((record) => record.requiredSignals ?? [])),
    runtimeProofProvidedSignals: uniqueStrings(runtimeProofObligations.flatMap((record) => record.providedSignals ?? [])),
    runtimeProofMissingSignals: uniqueStrings(runtimeProofObligations.flatMap((record) => record.missingSignals ?? [])),
    interlinguaRecordId: interlingua.id,
    interlinguaLoweringDisposition: interlingua.lowering?.disposition,
    interlinguaConstraintFamilies: interlinguaQuery.constraintFamilies ?? [],
    interlinguaConstraintStatuses: interlinguaQuery.constraintStatuses ?? [],
    interlinguaConstraintActions: interlinguaQuery.constraintActions ?? [],
    interlinguaConstraintSourceIds: interlinguaQuery.constraintSourceIds ?? [],
    interlinguaConstraintEvidenceIds,
    interlinguaConstraintRequiredKinds: interlinguaQuery.constraintRequiredKinds ?? [],
    interlinguaConstraintRepresentedKinds: interlinguaQuery.constraintRepresentedKinds ?? [],
    interlinguaConstraintMissingKinds: interlinguaQuery.constraintMissingKinds ?? [],
    interlinguaConstraintMissingEvidence: interlinguaQuery.constraintMissingEvidence ?? [],
    interlinguaConstraintObligationKinds: interlinguaQuery.constraintObligationKinds ?? [],
    interlinguaConstraintObligationStatuses: interlinguaQuery.constraintObligationStatuses ?? [],
    interlinguaConstraintObligationEvidenceIds,
    interlinguaConstraintObligationMissingEvidence: interlinguaQuery.constraintObligationMissingEvidence ?? [],
    evidenceIds,
    proofEvidenceIds,
    missingEvidence,
    blockers: route.blockers ?? [],
    review: route.review ?? [],
    sources: route.mergeRefs?.sources ?? [],
    ownershipKeys: route.mergeRefs?.semanticOwnershipKeys ?? [],
    conflictKeys: route.mergeRefs?.conflictKeys ?? [],
    sourceMapIds,
    sourceMapMappingIds,
    sourceMapLinkIds,
    ...semanticEdit,
    records: {
      bound: boundSummaries,
      rejected: rejectedSummaries,
      runtimeProof: runtimeProofRecords,
      interlinguaObligations: interlinguaObligationRecords
    },
    summary: {
      boundEvidence: boundSummaries.length,
      rejectedEvidence: rejectedSummaries.length,
      proofEvidence: proofEvidenceIds.length,
      sourceMapIds: countBy(sourceMapIds),
      sourceMapMappingIds: countBy(sourceMapMappingIds),
      sourceMapLinkIds: countBy(sourceMapLinkIds),
      semanticEdit: semanticEditIndexCounts(semanticEdit),
      missingEvidence: missingEvidence.length,
      translationAdmission: compactTranslationAdmissionCounts([route.translationAdmission ?? {}]),
      runtimeProofObligations: runtimeProofSummary.obligations,
      runtimeProofByStatus: runtimeProofSummary.byStatus,
      runtimeProofByCapability: runtimeProofSummary.byCapability,
      runtimeProofRequiredSignals: runtimeProofSummary.requiredSignals, runtimeProofMissingSignals: runtimeProofSummary.missingSignals,
      runtimeProofProvidedSignals: runtimeProofSummary.providedSignals,
      interlinguaConstraintObligations: interlinguaObligationRecords.length,
      interlinguaConstraintByFamily: countBy(interlinguaObligationRecords.map((record) => record.family)),
      interlinguaConstraintByStatus: countBy(interlinguaObligationRecords.map((record) => record.status)),
      interlinguaConstraintActions: countBy(interlinguaQuery.constraintActions ?? []),
      interlinguaConstraintSourceIds: countBy([...(interlinguaQuery.constraintSourceIds ?? []), ...interlinguaObligationRecords.map((record) => record.sourceId)]),
      interlinguaConstraintEvidenceIds: countBy(interlinguaConstraintEvidenceIds),
      interlinguaConstraintRequiredKinds: countBy(interlinguaQuery.constraintRequiredKinds ?? []),
      interlinguaConstraintRepresentedKinds: countBy(interlinguaQuery.constraintRepresentedKinds ?? []),
      interlinguaConstraintMissingKinds: countBy(interlinguaQuery.constraintMissingKinds ?? []),
      interlinguaConstraintMissingEvidence: countBy([...(interlinguaQuery.constraintMissingEvidence ?? []), ...interlinguaObligationMissingEvidence]),
      interlinguaConstraintObligationKinds: countBy(interlinguaObligationRecords.map((record) => record.kind)), interlinguaConstraintObligationStatuses: countBy(interlinguaObligationRecords.map((record) => record.status)),
      interlinguaConstraintObligationEvidenceIds: countBy(interlinguaConstraintObligationEvidenceIds),
      interlinguaConstraintObligationMissingEvidence: countBy(interlinguaObligationMissingEvidence),
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
      runtimeProofRequired: runtimeProofObligations.length > 0,
      semanticEditEvidenceRequired: semanticEdit.semanticEditScriptIds.length > 0 || semanticEdit.semanticEditReplayIds.length > 0,
      interlinguaConstraintsRequired: interlinguaObligationRecords.length > 0,
      sourceBound: route.mergeRefs?.sources?.length ? true : false,
      sourceMapped: sourceMapIds.length > 0 || sourceMapMappingIds.length > 0 || sourceMapLinkIds.length > 0,
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
    runtimeRouteId: options.runtimeRouteId,
    sourceHostId: options.sourceHostId,
    targetHostId: options.targetHostId,
    sourceRuntime: options.sourceRuntime ?? options.runtime,
    targetRuntime: options.targetRuntime,
    runtimeReadiness: options.runtimeReadiness,
    missingRuntimeCapability: options.missingRuntimeCapability,
    runtimeAdapterRequirementId: options.runtimeAdapterRequirementId,
    runtimeProofObligationId: options.runtimeProofObligationId, runtimeProofCapability: options.runtimeProofCapability, runtimeProofStatus: options.runtimeProofStatus, runtimeProofRequiredSignal: options.runtimeProofRequiredSignal, runtimeProofProvidedSignal: options.runtimeProofProvidedSignal, runtimeProofMissingSignal: options.runtimeProofMissingSignal, dialectReadiness: options.dialectReadiness, dialectRegistryId: options.dialectRegistryId, dialectRecordId: options.dialectRecordId, dialectConstructKind: options.dialectConstructKind, dialectExternKind: options.dialectExternKind, dialectDisposition: options.dialectDisposition, dialectEvidenceId: options.dialectEvidenceId, dialectLossId: options.dialectLossId,
    translationRuntimeReadiness: options.translationRuntimeReadiness, translationRuntimeAdapterRequirementId: options.translationRuntimeAdapterRequirementId, translationRuntimeProofObligationId: options.translationRuntimeProofObligationId, translationRuntimeProofCapability: options.translationRuntimeProofCapability, translationRuntimeProofStatus: options.translationRuntimeProofStatus, translationRuntimeProofRequiredSignal: options.translationRuntimeProofRequiredSignal, translationRuntimeProofProvidedSignal: options.translationRuntimeProofProvidedSignal, translationRuntimeProofMissingSignal: options.translationRuntimeProofMissingSignal, translationDialectReadiness: options.translationDialectReadiness, translationDialectRecordId: options.translationDialectRecordId,
    translationAdmissionStatus: options.translationAdmissionStatus,
    translationAdmissionAction: options.translationAdmissionAction,
    missingTranslationEvidence: options.missingTranslationEvidence, translationEvidenceId: options.translationEvidenceId, translationProofEvidenceId: options.translationProofEvidenceId, requiredTranslationConstructKind: options.requiredTranslationConstructKind, representedTranslationConstructKind: options.representedTranslationConstructKind,
    targetAdapterId: options.targetAdapterId
  };
  const queried = queryUniversalConversionPlan(plan, query, context);
  const route = queried.bestRoute;
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

function runtimeProofRecordSummary(record) {
  return {
    id: record.id,
    capability: record.capability,
    adapterRequirementId: record.adapterRequirementId,
    adapterKind: record.adapterKind,
    sourceHost: record.sourceHost,
    targetHost: record.targetHost,
    status: record.status ?? 'unknown',
    action: record.action,
    requiredSignals: record.requiredSignals ?? [],
    providedSignals: record.providedSignals ?? [],
    missingSignals: record.missingSignals ?? [],
    missingEvidence: record.missingEvidence ?? [],
    evidenceIds: record.evidenceIds ?? [],
    runtimeEquivalenceClaim: false,
    renderEquivalenceClaim: false,
    semanticEquivalenceClaim: false,
    autoMergeClaim: false
  };
}

function interlinguaObligationRecordSummary(record) {
  return {
    id: record.id,
    edgeId: record.edgeId,
    family: record.family,
    kind: record.kind,
    status: record.status ?? 'unknown',
    sourceId: record.sourceId,
    sourceNodeIds: record.sourceNodeIds ?? [],
    targetNodeIds: record.targetNodeIds ?? [],
    evidenceIds: record.evidenceIds ?? [],
    missingEvidence: record.missingEvidence ?? [],
    severity: record.severity ?? 'unknown',
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
