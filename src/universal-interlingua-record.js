import { caseSensitiveIdFragment, idFragment, uniqueStrings } from './native-import-utils.js';

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
  'semantic-ownership', 'callable-boundary-contract', 'adt-pattern-contract',
  'numeric-semantics-contract', 'text-semantics-contract', 'collection-semantics-contract', 'serialization-semantics-contract', 'dependency-semantics-contract',
  'protocol-contract',
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

export const UniversalInterlinguaConstraintEdgeKinds = Object.freeze([
  'resource-transfer',
  'ownership',
  'lifetime',
  'control-flow', 'callable-boundary', 'adt-pattern',
  'borrow-scope',
  'borrow-checker',
  'data-layout',
  'concurrency-model',
  'error-model',
  'evaluation-model',
  'host-environment',
  'memory-model',
  'metaprogramming',
  'scope-binding',
  'effect',
  'module',
  'numeric-semantics', 'text-semantics', 'collection-semantics', 'serialization-semantics', 'dependency-semantics',
  'object-model',
  'protocol',
  'type'
]);

export function createUniversalInterlinguaRecord(input = {}) {
  const route = input.route ?? input;
  const representation = input.representation ?? route.representation ?? {};
  const translationAdmission = input.translationAdmission ?? route.translationAdmission ?? {};
  const mergeRefs = input.mergeRefs ?? route.mergeRefs ?? {};
  const runtime = input.runtime ?? route.runtime ?? {};
  const dialect = input.dialect ?? route.dialect ?? {};
  const constraints = interlinguaConstraintSummary(route);
  const layerSummary = interlinguaLayerSummary(representation, { constraints, translationAdmission });
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
    constraints,
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
      constraintFamilies: constraints.families,
      constraintStatuses: constraints.statuses,
      constraintActions: constraints.actions,
      constraintSourceIds: constraints.sourceIds,
      constraintRequiredKinds: constraints.requiredKinds,
      constraintRepresentedKinds: constraints.representedKinds,
      constraintMissingKinds: constraints.missingKinds,
      constraintMissingEvidence: constraints.missingEvidence,
      constraintObligationKinds: constraints.obligationKinds,
      constraintObligationStatuses: constraints.obligationStatuses,
      constraintObligationMissingEvidence: constraints.obligationMissingEvidence,
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
    && match(query.interlinguaConstraintFamily, record?.query?.constraintFamilies)
    && match(query.interlinguaConstraintStatus, record?.query?.constraintStatuses)
    && match(query.interlinguaConstraintAction, record?.query?.constraintActions)
    && match(query.interlinguaConstraintSourceId, record?.query?.constraintSourceIds)
    && match(query.interlinguaConstraintRequiredKind, record?.query?.constraintRequiredKinds)
    && match(query.interlinguaConstraintRepresentedKind, record?.query?.constraintRepresentedKinds)
    && match(query.interlinguaConstraintMissingKind, record?.query?.constraintMissingKinds)
    && match(query.interlinguaConstraintMissingEvidence, record?.query?.constraintMissingEvidence)
    && match(query.interlinguaConstraintObligationKind, record?.query?.constraintObligationKinds)
    && match(query.interlinguaConstraintObligationStatus, record?.query?.constraintObligationStatuses)
    && match(query.interlinguaConstraintObligationMissingEvidence, record?.query?.constraintObligationMissingEvidence)
    && match(query.interlinguaLoweringDisposition, [record?.query?.loweringDisposition])
    && match(query.interlinguaMissingEvidence, record?.query?.missingEvidence)
    && match(query.interlinguaProofEvidenceId, record?.query?.proofEvidenceIds)
    && match(query.interlinguaTargetAdapterId, [record?.query?.targetAdapterId]);
}

export function interlinguaConstraintSummary(route = {}) {
  const edges = [
    constraintEdge('resource-transfer', route.resourceTransfer, 'semantic-ownership', route),
    constraintEdge('ownership', route.resourceTransfer?.ownershipConstraints, 'semantic-ownership', route),
    constraintEdge('lifetime', route.lifetimeConstraint, 'semantic-ownership', route),
    constraintEdge('control-flow', route.controlFlowConstraint, 'runtime-capability', route),
    constraintEdge('callable-boundary', route.callableBoundaryConstraint, 'callable-boundary-contract', route),
    constraintEdge('adt-pattern', route.adtPatternConstraint, 'adt-pattern-contract', route),
    constraintEdge('borrow-scope', route.borrowScopeConstraint, 'semantic-ownership', route),
    constraintEdge('borrow-checker', route.borrowCheckerConstraint, 'semantic-ownership', route),
    constraintEdge('data-layout', route.dataLayoutConstraint, 'runtime-capability', route),
    constraintEdge('concurrency-model', route.concurrencyModelConstraint, 'runtime-capability', route),
    constraintEdge('error-model', route.errorModelConstraint, 'runtime-capability', route),
    constraintEdge('evaluation-model', route.evaluationModelConstraint, 'runtime-capability', route),
    constraintEdge('host-environment', route.hostEnvironmentConstraint, 'runtime-capability', route),
    constraintEdge('memory-model', route.memoryModelConstraint, 'runtime-capability', route),
    constraintEdge('metaprogramming', route.metaprogrammingConstraint, 'parser-feature', route),
    constraintEdge('scope-binding', route.scopeBindingConstraint, 'semantic-symbol', route),
    constraintEdge('effect', route.effectConstraint, 'runtime-capability', route),
    constraintEdge('module', route.moduleConstraint, 'source-import', route), constraintEdge('numeric-semantics', route.numericSemanticsConstraint, 'numeric-semantics-contract', route), constraintEdge('text-semantics', route.textSemanticsConstraint, 'text-semantics-contract', route), constraintEdge('collection-semantics', route.collectionSemanticsConstraint, 'collection-semantics-contract', route), constraintEdge('serialization-semantics', route.serializationSemanticsConstraint, 'serialization-semantics-contract', route), constraintEdge('dependency-semantics', route.dependencySemanticsConstraint, 'dependency-semantics-contract', route),
    constraintEdge('object-model', route.objectModelConstraint, 'semantic-symbol', route),
    constraintEdge('protocol', route.protocolConstraint, 'protocol-contract', route),
    constraintEdge('type', route.typeConstraint, 'semantic-symbol', route)
  ].filter(Boolean);
  const obligations = edges.flatMap((edge) => edge.obligations);
  return {
    edges,
    edgeCount: edges.length,
    obligations,
    obligationCount: obligations.length,
    families: uniqueStrings(edges.map((edge) => edge.family)),
    statuses: uniqueStrings(edges.map((edge) => edge.status)),
    actions: uniqueStrings(edges.map((edge) => edge.action)),
    sourceIds: uniqueStrings(edges.map((edge) => edge.sourceId)),
    requiredKinds: uniqueStrings(edges.flatMap((edge) => edge.requiredKinds)),
    representedKinds: uniqueStrings(edges.flatMap((edge) => edge.representedKinds)),
    missingKinds: uniqueStrings(edges.flatMap((edge) => edge.missingKinds)),
    missingEvidence: uniqueStrings(edges.flatMap((edge) => edge.missingEvidence)),
    obligationKinds: uniqueStrings(obligations.map((obligation) => obligation.kind)),
    obligationStatuses: uniqueStrings(obligations.map((obligation) => obligation.status)),
    obligationMissingEvidence: uniqueStrings(obligations.flatMap((obligation) => obligation.missingEvidence)),
    blockers: uniqueStrings(edges.flatMap((edge) => edge.blockers)),
    review: uniqueStrings(edges.flatMap((edge) => edge.review))
  };
}

function constraintEdge(family, evidence, layerKind, route) {
  if (!evidence?.id && !evidence?.status && !(evidence?.missingKinds ?? []).length) return undefined;
  const missingKinds = evidence.missingKinds ?? [];
  const missingEvidence = evidence.missingEvidence ?? [];
  const id = `interlingua_constraint_${idFragment([route.id, family, evidence.id, evidence.status, missingKinds.join('_')].join('_'))}`;
  const obligations = constraintObligations(family, evidence, id);
  return {
    id,
    family,
    layerKind,
    sourceId: evidence.id,
    status: evidence.status,
    action: evidence.action,
    requiredKinds: evidence.requiredKinds ?? [],
    representedKinds: evidence.representedKinds ?? [],
    missingKinds,
    missingEvidence,
    obligations,
    blockers: evidence.blockers ?? [],
    review: evidence.review ?? [],
    severity: constraintSeverity(evidence.status, missingKinds),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

function constraintObligations(family, evidence, edgeId) {
  const records = constraintRecords(evidence);
  const kinds = uniqueStrings([
    ...records.map((record) => record.kind),
    ...(evidence.requiredKinds ?? []),
    ...(evidence.representedKinds ?? []),
    ...(evidence.missingKinds ?? [])
  ]);
  return kinds.map((kind) => {
    const record = records.find((entry) => entry.kind === kind) ?? {};
    const status = record.status ?? ((evidence.missingKinds ?? []).includes(kind) ? 'missing' : (evidence.representedKinds ?? []).includes(kind) ? 'represented' : 'required');
    return {
      id: `interlingua_obligation_${caseSensitiveIdFragment([edgeId, kind, status].join('_'))}`,
      edgeId,
      family,
      kind,
      status,
      sourceId: evidence.id,
      sourceNodeIds: nodeIds(record, 'source'),
      targetNodeIds: nodeIds(record, 'target'),
      evidenceIds: evidence.evidenceIds ?? [],
      missingEvidence: status === 'missing' ? missingEvidenceForKind(kind, evidence.missingEvidence ?? []) : [],
      severity: record.severity ?? constraintSeverity(status, status === 'missing' ? [kind] : []),
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    };
  });
}

function constraintRecords(evidence = {}) {
  return evidence.constraints ?? evidence.controlFlowConstraints ?? evidence.callableBoundaryConstraints ?? evidence.adtPatternConstraints ?? evidence.dataLayoutConstraints ?? evidence.effectConstraints ?? evidence.concurrencyModelConstraints ?? evidence.errorModelConstraints ?? evidence.evaluationModelConstraints ?? evidence.hostEnvironmentConstraints ?? evidence.memoryModelConstraints ?? evidence.metaprogrammingConstraints ?? evidence.scopeBindingConstraints ?? evidence.moduleConstraints ?? evidence.numericSemanticsConstraints ?? evidence.textSemanticsConstraints ?? evidence.collectionSemanticsConstraints ?? evidence.serializationSemanticsConstraints ?? evidence.dependencySemanticsConstraints ?? evidence.objectModelConstraints ?? evidence.protocolConstraints ?? evidence.typeConstraints ?? [];
}

function nodeIds(record = {}, prefix) {
  return uniqueStrings(Object.entries(record).filter(([key]) => key.startsWith(prefix) && key.endsWith('Ids')).flatMap(([, value]) => value ?? []));
}

function missingEvidenceForKind(kind, missingEvidence) {
  const scoped = (missingEvidence ?? []).filter((entry) => String(entry).includes(kind));
  return scoped.length ? scoped : missingEvidence ?? [];
}

function constraintSeverity(status, missingKinds) {
  if (status === 'blocked') return 'error';
  if ((missingKinds ?? []).length) return 'warning';
  if (status === 'degraded' || status === 'needs-evidence') return 'warning';
  return 'info';
}

export function interlinguaLayerSummary(representation = {}, options = {}) {
  const constructs = representation.constructs ?? [];
  const byStatus = (status) => uniqueStrings(constructs.filter((construct) => construct.status === status).map((construct) => construct.kind));
  const constraints = options.constraints ?? {};
  const translationAdmission = options.translationAdmission ?? {};
  const constraintLayerKinds = (predicate) => uniqueStrings((constraints.edges ?? []).filter(predicate).map((edge) => edge.layerKind));
  const representedKinds = uniqueStrings([...byStatus('represented'), ...(translationAdmission.representedConstructKinds ?? []), ...constraintLayerKinds((edge) => edge.status === 'satisfied' && !(edge.missingKinds ?? []).length && !(edge.missingEvidence ?? []).length)]);
  const missingKinds = uniqueStrings([...(representation.missing ?? []), ...byStatus('missing'), ...(translationAdmission.missingConstructKinds ?? []), ...constraintLayerKinds((edge) => edge.status === 'needs-evidence' || (edge.missingKinds ?? []).length || (edge.missingEvidence ?? []).length)]);
  const reviewKinds = uniqueStrings([...byStatus('review'), ...constraintLayerKinds((edge) => edge.status === 'degraded' || (edge.review ?? []).length)]);
  const blockedKinds = uniqueStrings([...byStatus('blocked'), ...constraintLayerKinds((edge) => edge.status === 'blocked' || (edge.blockers ?? []).length)]);
  const kinds = uniqueStrings([...(representation.constructKinds ?? []), ...constructs.map((construct) => construct.kind), ...(translationAdmission.requiredConstructKinds ?? []), ...(constraints.edges ?? []).map((edge) => edge.layerKind)]);
  return { kinds, representedKinds, missingKinds, reviewKinds, blockedKinds, constructCount: constructs.length, representedCount: representedKinds.length, missingCount: missingKinds.length, reviewCount: reviewKinds.length, blockedCount: blockedKinds.length };
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
