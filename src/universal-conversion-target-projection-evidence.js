import { maxSemanticMergeReadiness, normalizeNativeLanguageId, uniqueStrings as u } from './native-import-utils.js';
import { normalizeProjectionMatrixTargets } from './coverage-matrix-profiles.js';

const routeFields = [
  'targetProjectionContractIds', 'targetProjectionLayerIds', 'targetProjectionAdapterIds', 'targetProjectionEvidenceIds',
  'targetProjectionProofEvidenceIds', 'targetProjectionLossIds', 'targetProjectionMissingEvidence',
  'targetProjectionRepresentedLayerKinds', 'targetProjectionMissingLayerKinds', 'targetProjectionReadinesses'
];

export function targetProjectionForRoute(records = [], language = {}, target) {
  const languageIds = u([language.language, ...(language.aliases ?? [])].map(normalizeNativeLanguageId));
  const normalizedTarget = normalizeProjectionMatrixTargets([target])[0];
  const matches = (records ?? []).filter((record) => {
    const recordTarget = normalizeProjectionMatrixTargets([record.target ?? record.targetLanguage])[0];
    const sourceLanguage = normalizeNativeLanguageId(record.sourceLanguage);
    return recordTarget === normalizedTarget && (!sourceLanguage || languageIds.includes(sourceLanguage));
  });
  if (!matches.length) return undefined;
  return {
    id: `target_projection_route_${normalizedTarget}_${languageIds[0] ?? 'source'}`,
    records: matches,
    contractIds: u(matches.map((record) => record.id)),
    layerIds: u(matches.flatMap((record) => record.layerIds ?? [])),
    adapterIds: u(matches.map((record) => record.adapterId)),
    evidenceIds: u(matches.flatMap((record) => record.evidenceIds ?? [])),
    proofEvidenceIds: u(matches.flatMap((record) => record.proofEvidenceIds ?? [])),
    lossIds: u(matches.flatMap((record) => record.lossIds ?? [])),
    missingEvidence: u(matches.flatMap((record) => record.missingEvidence ?? [])),
    representedLayerKinds: u(matches.flatMap((record) => record.representedLayerKinds ?? [])),
    missingLayerKinds: u(matches.flatMap((record) => record.missingLayerKinds ?? [])),
    blockers: u(matches.flatMap((record) => record.blockers ?? [])),
    review: u(matches.flatMap((record) => record.review ?? [])),
    readinesses: u(matches.map((record) => record.readiness)),
    readiness: matches.reduce((current, record) => maxSemanticMergeReadiness(current, record.readiness ?? 'needs-review'), 'ready'),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

export function targetProjectionRouteFields(projection) {
  if (!projection) return {};
  return {
    authoredTargetProjections: projection.records,
    authoredTargetProjectionIds: projection.contractIds,
    targetProjectionContractIds: projection.contractIds,
    targetProjectionLayerIds: projection.layerIds,
    targetProjectionAdapterIds: projection.adapterIds,
    targetProjectionEvidenceIds: projection.evidenceIds,
    targetProjectionProofEvidenceIds: projection.proofEvidenceIds,
    targetProjectionLossIds: projection.lossIds,
    targetProjectionMissingEvidence: projection.missingEvidence,
    targetProjectionRepresentedLayerKinds: projection.representedLayerKinds,
    targetProjectionMissingLayerKinds: projection.missingLayerKinds,
    targetProjectionReadiness: projection.readiness,
    targetProjectionReadinesses: projection.readinesses
  };
}

export function routeMatchesTargetProjectionQuery(route = {}, query = {}, match) {
  return match(query.targetProjectionContractId ?? query.authoredTargetProjectionId, route.targetProjectionContractIds)
    && match(query.targetProjectionLayerId, route.targetProjectionLayerIds)
    && match(query.targetProjectionAdapterId ?? query.authoredTargetProjectionAdapterId, route.targetProjectionAdapterIds)
    && match(query.targetProjectionEvidenceId, route.targetProjectionEvidenceIds)
    && match(query.targetProjectionProofEvidenceId, route.targetProjectionProofEvidenceIds)
    && match(query.targetProjectionLossId, route.targetProjectionLossIds)
    && match(query.targetProjectionMissingEvidence, route.targetProjectionMissingEvidence)
    && match(query.targetProjectionRepresentedLayerKind, route.targetProjectionRepresentedLayerKinds)
    && match(query.targetProjectionMissingLayerKind, route.targetProjectionMissingLayerKinds)
    && match(query.targetProjectionReadiness, route.targetProjectionReadinesses);
}

export function targetProjectionWorkItemFields(route = {}) {
  return Object.fromEntries(routeFields.map((field) => [field, route[field] ?? []]).concat([['authoredTargetProjectionAdapterIds', route.targetProjectionAdapterIds ?? []]]));
}

export function mergeTargetProjectionWorkItemFields(left = {}, right = {}) {
  return Object.fromEntries(routeFields.map((field) => [field, u([...(left[field] ?? []), ...(right[field] ?? [])])]).concat([['authoredTargetProjectionAdapterIds', u([...(left.authoredTargetProjectionAdapterIds ?? []), ...(right.authoredTargetProjectionAdapterIds ?? [])])]]));
}

export function targetProjectionWorklistSummary(items = []) {
  return Object.fromEntries(routeFields.map((field) => [field, u(items.flatMap((item) => item[field] ?? []))]).concat([['authoredTargetProjectionAdapterIds', u(items.flatMap((item) => item.authoredTargetProjectionAdapterIds ?? []))]]));
}

export function workItemMatchesTargetProjectionQuery(item = {}, query = {}, match) {
  return routeMatchesTargetProjectionQuery(item, query, match)
    && match(query.authoredTargetProjectionAdapterId, item.authoredTargetProjectionAdapterIds);
}
