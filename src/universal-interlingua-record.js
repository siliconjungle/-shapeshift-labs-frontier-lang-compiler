import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalInterlinguaLayerKinds = Object.freeze([
  'source-import',
  'semantic-symbol',
  'source-map',
  'parser-feature',
  'source-preservation',
  'declaration-stub',
  'target-adapter',
  'runtime-capability',
  'dialect-projection',
  'semantic-ownership',
  'proof-evidence'
]);

export const UniversalInterlinguaLoweringDispositions = Object.freeze([
  'exact-source',
  'target-adapter',
  'declaration-stub',
  'semantic-index-only',
  'lossy-review',
  'blocked'
]);

export function createUniversalInterlinguaRecord(input = {}) {
  const route = input.route ?? input;
  const representation = input.representation ?? route.representation ?? {};
  const translationAdmission = input.translationAdmission ?? route.translationAdmission ?? {};
  const mergeRefs = input.mergeRefs ?? route.mergeRefs ?? {};
  const runtime = input.runtime ?? route.runtime ?? {};
  const dialect = input.dialect ?? route.dialect ?? {};
  const layerSummary = interlinguaLayerSummary(representation);
  const disposition = loweringDisposition(route);
  const missingEvidence = uniqueStrings([
    ...(route.missingEvidence ?? []),
    ...(translationAdmission.missingEvidence ?? [])
  ]);
  const blockers = uniqueStrings([...(route.blockers ?? []), ...(translationAdmission.blockers ?? [])]);
  const review = uniqueStrings([...(route.review ?? []), ...(translationAdmission.review ?? [])]);
  return {
    kind: 'frontier.lang.universalInterlinguaRecord',
    version: 1,
    id: input.id ?? `interlingua_${idFragment(route.id ?? [route.sourceLanguage, route.target, route.mode].join('_'))}`,
    routeId: route.id,
    sourceLanguage: route.sourceLanguage,
    target: route.target,
    lift: {
      sourceLanguage: route.sourceLanguage,
      sourceImportIds: uniqueStrings((mergeRefs.sources ?? []).map((source) => source.importId).filter(Boolean)),
      sourcePaths: uniqueStrings((mergeRefs.sources ?? []).map((source) => source.sourcePath).filter(Boolean)),
      sourceHashes: uniqueStrings((mergeRefs.sources ?? []).map((source) => source.sourceHash).filter(Boolean)),
      sourceMapIds: mergeRefs.sourceMapIds ?? [],
      sourceMapMappingIds: mergeRefs.sourceMapMappingIds ?? [],
      ownershipKeys: mergeRefs.semanticOwnershipKeys ?? [],
      conflictKeys: mergeRefs.conflictKeys ?? [],
      evidenceIds: mergeRefs.evidenceIds ?? [],
      proofIds: mergeRefs.proofIds ?? []
    },
    layers: layerSummary,
    lowering: {
      disposition,
      mode: route.mode,
      routeAction: route.routeAction,
      lossClass: route.lossClass,
      adapterId: route.adapter ?? translationAdmission.targetAdapterId,
      adapterKind: route.adapterKind,
      readiness: route.readiness,
      targetSupported: route.evidence?.targetSupported === true,
      runtimeReadiness: runtime.readiness ?? translationAdmission.runtimeReadiness,
      runtimeRequiredCapabilities: runtime.requiredCapabilities ?? [],
      runtimeAdapterRequirementIds: translationAdmission.runtimeAdapterRequirementIds ?? (runtime.adapterRequirements ?? []).map((entry) => entry.id ?? entry.capability).filter(Boolean),
      dialectReadiness: dialect.readiness ?? translationAdmission.dialectReadiness,
      dialectRecordIds: translationAdmission.dialectRecordIds ?? dialect.recordIds ?? [],
      dialectProjectionDispositions: dialect.projectionDispositions ?? [],
      proofEvidenceIds: translationAdmission.proofEvidenceIds ?? mergeRefs.proofIds ?? [],
      evidenceIds: translationAdmission.evidenceIds ?? mergeRefs.evidenceIds ?? [],
      missingEvidence,
      lossIds: uniqueStrings([...(dialect.lossIds ?? []), ...(route.evidence?.targetLossKinds ?? [])]),
      blockers,
      review
    },
    claims: {
      exactSource: disposition === 'exact-source',
      adapterMediated: disposition === 'target-adapter',
      declarationOnly: disposition === 'declaration-stub',
      semanticIndexOnly: disposition === 'semantic-index-only',
      lossyReview: disposition === 'lossy-review',
      blocked: disposition === 'blocked',
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    },
    query: {
      layerKinds: layerSummary.kinds,
      representedLayerKinds: layerSummary.representedKinds,
      missingLayerKinds: layerSummary.missingKinds,
      reviewLayerKinds: layerSummary.reviewKinds,
      blockedLayerKinds: layerSummary.blockedKinds,
      loweringDisposition: disposition,
      missingEvidence,
      proofEvidenceIds: translationAdmission.proofEvidenceIds ?? mergeRefs.proofIds ?? [],
      targetAdapterId: route.adapter ?? translationAdmission.targetAdapterId
    },
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

export function interlinguaRecordMatches(record, query = {}) {
  return match(query.interlinguaLayerKind, record?.query?.layerKinds)
    && match(query.interlinguaRepresentedLayerKind, record?.query?.representedLayerKinds)
    && match(query.interlinguaMissingLayerKind, record?.query?.missingLayerKinds)
    && match(query.interlinguaReviewLayerKind, record?.query?.reviewLayerKinds)
    && match(query.interlinguaBlockedLayerKind, record?.query?.blockedLayerKinds)
    && match(query.interlinguaLoweringDisposition, [record?.query?.loweringDisposition])
    && match(query.interlinguaMissingEvidence, record?.query?.missingEvidence)
    && match(query.interlinguaProofEvidenceId, record?.query?.proofEvidenceIds)
    && match(query.interlinguaTargetAdapterId, [record?.query?.targetAdapterId]);
}

export function interlinguaLayerSummary(representation = {}) {
  const constructs = representation.constructs ?? [];
  const byStatus = (status) => uniqueStrings(constructs.filter((construct) => construct.status === status).map((construct) => construct.kind));
  return {
    kinds: uniqueStrings([...(representation.constructKinds ?? []), ...constructs.map((construct) => construct.kind)]),
    representedKinds: byStatus('represented'),
    missingKinds: uniqueStrings([...(representation.missing ?? []), ...byStatus('missing')]),
    reviewKinds: byStatus('review'),
    blockedKinds: byStatus('blocked'),
    constructCount: constructs.length,
    representedCount: representation.summary?.representedConstructs ?? byStatus('represented').length,
    missingCount: representation.summary?.missing ?? representation.missing?.length ?? 0,
    reviewCount: representation.summary?.reviewConstructs ?? byStatus('review').length,
    blockedCount: representation.summary?.blockedConstructs ?? byStatus('blocked').length
  };
}

function loweringDisposition(route = {}) {
  if (route.readiness === 'blocked' || (route.blockers ?? []).length) return 'blocked';
  if (route.mode === 'preserve-source') return 'exact-source';
  if (route.mode === 'stub-only') return 'declaration-stub';
  if (route.mode === 'semantic-index-only') return 'semantic-index-only';
  if (route.mode === 'target-adapter' && route.lossClass === 'unsupportedTargetFeatures') return 'lossy-review';
  if (route.mode === 'target-adapter') return 'target-adapter';
  return 'blocked';
}

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).filter(Boolean).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
