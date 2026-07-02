import { uniqueStrings } from './native-import-utils.js';

const LAYER_FIELDS = ['kinds', 'representedKinds', 'missingKinds', 'reviewKinds', 'blockedKinds'];
const CONSTRAINT_FIELDS = ['families', 'statuses', 'actions', 'sourceIds', 'evidenceIds', 'requiredKinds', 'representedKinds', 'missingKinds', 'missingEvidence', 'obligationKinds', 'obligationStatuses', 'obligationEvidenceIds', 'obligationMissingEvidence', 'blockers', 'review'];
const LOWERING_ARRAY_FIELDS = ['runtimeRequiredCapabilities', 'runtimeAdapterRequirementIds', 'dialectRecordIds', 'dialectProjectionDispositions', 'proofEvidenceIds', 'evidenceIds', 'missingEvidence', 'lossIds', 'blockers', 'review'];
const LIFT_ARRAY_FIELDS = ['sourceImportIds', 'sourcePaths', 'sourceHashes', 'sourceMapIds', 'sourceMapMappingIds', 'ownershipKeys', 'conflictKeys', 'evidenceIds', 'proofIds'];
const QUERY_ARRAY_FIELDS = ['layerKinds', 'representedLayerKinds', 'missingLayerKinds', 'reviewLayerKinds', 'blockedLayerKinds', 'constraintFamilies', 'constraintStatuses', 'constraintActions', 'constraintSourceIds', 'constraintEvidenceIds', 'constraintRequiredKinds', 'constraintRepresentedKinds', 'constraintMissingKinds', 'constraintMissingEvidence', 'constraintObligationKinds', 'constraintObligationStatuses', 'constraintObligationEvidenceIds', 'constraintObligationMissingEvidence', 'missingEvidence', 'proofEvidenceIds'];

export function mergeAuthoredInterlinguaForRoute(generated, route = {}, authoredRecords = []) {
  const authored = matchingAuthoredInterlingua(route, authoredRecords);
  if (!authored) return generated;
  const constraints = mergeConstraints(generated.constraints, authored.constraints);
  const layers = mergeLayers(generated.layers, authored.layers, constraints);
  const lowering = mergeLowering(generated.lowering, authored.lowering);
  const lift = mergeLift(generated.lift, authored.lift);
  const query = mergeQuery(generated.query, authored.query, { layers, constraints, lowering });
  return {
    ...generated,
    metadata: { ...(generated.metadata ?? {}), authoredInterlinguaId: authored.id, authoredFrontierInterlingua: true },
    lift,
    layers,
    constraints,
    lowering,
    query,
    claims: {
      ...generated.claims,
      exactSource: lowering.disposition === 'exact-source',
      adapterMediated: lowering.disposition === 'target-adapter',
      declarationOnly: lowering.disposition === 'declaration-stub',
      semanticIndexOnly: lowering.disposition === 'semantic-index-only',
      lossyReview: lowering.disposition === 'lossy-review',
      blocked: lowering.disposition === 'blocked',
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    },
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

function matchingAuthoredInterlingua(route, records = []) {
  return records.find((record) => record?.routeId && record.routeId === route.id)
    ?? records.find((record) => (!record?.sourceLanguage || same(record.sourceLanguage, route.sourceLanguage)) && (!record?.target || same(record.target, route.target)) && (!record?.mode || same(record.mode, route.mode)));
}

function mergeLayers(base = {}, authored = {}, constraints = {}) {
  const merged = {};
  for (const field of LAYER_FIELDS) merged[field] = uniqueStrings([...(base[field] ?? []), ...(authored[field] ?? [])]);
  merged.kinds = uniqueStrings([...(merged.kinds ?? []), ...(constraints.edges ?? []).map((edge) => edge.layerKind)]);
  merged.constructCount = (base.constructCount ?? 0) + (authored.constructCount ?? 0);
  merged.representedCount = merged.representedKinds.length;
  merged.missingCount = merged.missingKinds.length;
  merged.reviewCount = merged.reviewKinds.length;
  merged.blockedCount = merged.blockedKinds.length;
  return merged;
}

function mergeConstraints(base = {}, authored = {}) {
  const edges = uniqueRecords([...(base.edges ?? []), ...(authored.edges ?? [])].map(normalizeEdge));
  const obligations = uniqueRecords([...(base.obligations ?? []), ...(authored.obligations ?? [])].map(normalizeObligation));
  const merged = { edges, edgeCount: edges.length, obligations, obligationCount: obligations.length };
  for (const field of CONSTRAINT_FIELDS) merged[field] = uniqueStrings([...(base[field] ?? []), ...(authored[field] ?? [])]);
  merged.families = uniqueStrings([...merged.families, ...edges.map((edge) => edge.family)]);
  merged.missingEvidence = uniqueStrings([...merged.missingEvidence, ...obligations.flatMap((obligation) => obligation.missingEvidence ?? [])]);
  return merged;
}

function mergeLowering(base = {}, authored = {}) {
  const merged = { ...base, ...authored };
  for (const field of LOWERING_ARRAY_FIELDS) merged[field] = uniqueStrings([...(base[field] ?? []), ...(authored[field] ?? [])]);
  return merged;
}

function mergeLift(base = {}, authored = {}) {
  const merged = { ...base, ...authored };
  for (const field of LIFT_ARRAY_FIELDS) merged[field] = uniqueStrings([...(base[field] ?? []), ...(authored[field] ?? [])]);
  return merged;
}

function mergeQuery(base = {}, authored = {}, merged = {}) {
  const query = { ...base, ...authored };
  for (const field of QUERY_ARRAY_FIELDS) query[field] = uniqueStrings([...(base[field] ?? []), ...(authored[field] ?? [])]);
  query.layerKinds = uniqueStrings([...(query.layerKinds ?? []), ...(merged.layers?.kinds ?? [])]);
  query.constraintFamilies = uniqueStrings([...(query.constraintFamilies ?? []), ...(merged.constraints?.families ?? [])]);
  query.constraintMissingEvidence = uniqueStrings([...(query.constraintMissingEvidence ?? []), ...(merged.constraints?.missingEvidence ?? [])]);
  query.constraintObligationKinds = uniqueStrings([...(query.constraintObligationKinds ?? []), ...(merged.constraints?.obligationKinds ?? [])]);
  query.constraintObligationMissingEvidence = uniqueStrings([...(query.constraintObligationMissingEvidence ?? []), ...(merged.constraints?.obligationMissingEvidence ?? [])]);
  query.loweringDisposition = merged.lowering?.disposition ?? query.loweringDisposition;
  query.targetAdapterId = merged.lowering?.adapterId ?? query.targetAdapterId;
  return query;
}

function normalizeEdge(edge = {}) {
  return { obligations: [], blockers: [], review: [], requiredKinds: [], representedKinds: [], missingKinds: [], missingEvidence: [], evidenceIds: [], ...edge, autoMergeClaim: false, semanticEquivalenceClaim: false };
}

function normalizeObligation(obligation = {}) {
  return { evidenceIds: [], missingEvidence: [], sourceNodeIds: [], targetNodeIds: [], ...obligation, kind: obligation.kind ?? obligation.obligationKind, autoMergeClaim: false, semanticEquivalenceClaim: false };
}

function uniqueRecords(records = []) {
  const seen = new Set();
  return records.filter((record) => {
    if (!record) return false;
    const key = record.id ?? JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function same(left, right) { return String(left ?? '').toLowerCase() === String(right ?? '').toLowerCase(); }
