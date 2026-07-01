import { idFragment, uniqueStrings } from './native-import-utils.js';
import { universalConversionArtifactSummary } from './universal-conversion-artifact-summary.js';
import { createUniversalConversionPlan } from './universal-conversion-plan.js';
import { artifactIndex } from './universal-conversion-artifact-query.js';
import { createUniversalConversionAdmissionRecord } from './universal-conversion-admission-record.js';
import { createUniversalConversionRouteEvidenceReceipt } from './universal-conversion-route-evidence-receipt.js';
import {
  routeAdmissionMetadata,
  routeAdmissionStatus,
  routeReasonCodes,
  routeRecordMetadata,
  routeSemanticEditBundle
} from './universal-conversion-route-metadata.js';
import { routeSemanticOperations } from './universal-conversion-route-operations.js';
import { createSemanticHistoryRecord } from './internal/index-impl/semanticHistoryRecords.js';
import { createSemanticPatchBundleRecord } from './internal/index-impl/semanticPatchBundleRecords.js';

export { queryUniversalConversionArtifacts } from './universal-conversion-artifact-query.js';

export function createUniversalConversionArtifacts(input = {}, options = {}) {
  const generatedAt = options.generatedAt ?? input.generatedAt ?? Date.now();
  const context = options.context ?? {};
  const plan = input?.kind === 'frontier.lang.universalConversionPlan'
    ? input
    : input?.target && input?.sourceLanguage
      ? undefined
      : createUniversalConversionPlan(input, context);
  const routes = selectRoutes(plan?.routes ?? (input?.target && input?.sourceLanguage ? [input] : []), options);
  const routeArtifacts = routes.map((route) => createRouteArtifact(route, {
    generatedAt,
    planId: options.planId ?? plan?.id ?? route.mergeRefs?.planId,
    evidence: options.evidence ?? input?.evidence,
    metadata: options.metadata
  }));
  const historyRecords = routeArtifacts.map((artifact) => artifact.history);
  const patchBundleRecords = routeArtifacts.map((artifact) => artifact.patchBundle);
  const admissionRecords = routeArtifacts.map((artifact) => artifact.admissionRecord);
  const evidenceReceipts = routeArtifacts.map((artifact) => artifact.evidenceReceipt);
  const index = artifactIndex(routeArtifacts);
  return {
    kind: 'frontier.lang.universalConversionArtifacts',
    version: 1,
    schema: 'frontier.lang.universalConversionArtifacts.v1',
    id: options.id ?? `universal_conversion_artifacts_${idFragment(index.routeIds.join('_') || plan?.id || 'routes')}`,
    planId: plan?.id ?? options.planId,
    generatedAt,
    routeArtifacts,
    historyRecords,
    patchBundleRecords,
    admissionRecords,
    evidenceReceipts,
    index,
    summary: universalConversionArtifactSummary(routeArtifacts, {
      historyRecords,
      patchBundleRecords,
      admissionRecords,
      evidenceReceipts
    }),
    metadata: {
      ...options.metadata,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      note: 'Materialized conversion artifacts are merge-review records. They preserve provenance and admission state but do not prove target semantic equivalence.'
    }
  };
}

function createRouteArtifact(route, options) {
  const refs = route.mergeRefs ?? {};
  const planId = options.planId ?? refs.planId;
  const sources = normalizeSources(refs.sources, route);
  const regions = routeRegions(route, refs, sources);
  const sourceMapLinks = routeSourceMapLinks(route, refs, sources, regions);
  const semanticOperations = routeSemanticOperations(route, refs, sources, regions, sourceMapLinks);
  const semanticEditBundle = routeSemanticEditBundle(route);
  const recordMetadata = routeRecordMetadata(route, planId, options.metadata);
  const admissionStatus = routeAdmissionStatus(route);
  const reasonCodes = routeReasonCodes(route);
  const evidenceReceipt = createUniversalConversionRouteEvidenceReceipt({ ...route, mergeRefs: { ...refs, sourceMapLinkIds: sourceMapLinks.map((link) => link.id) } }, { evidence: options.evidence });
  const runtimeProof = routeRuntimeProofIndex(route);
  const historyId = refs.historyIds?.[0] ?? `history_${route.id}`;
  const patchBundleId = refs.patchBundleIds?.[0] ?? `semantic_patch_bundle_${route.id}`;
  const history = createSemanticHistoryRecord({
    id: historyId,
    createdAt: options.generatedAt,
    language: route.sourceLanguage,
    sourcePath: sources[0]?.sourcePath,
    sources,
    ownershipRegions: regions,
    semanticCandidates: routeSemanticCandidates(route, refs),
    evidenceIds: refs.evidenceIds,
    proofIds: refs.proofIds,
    replayLinks: refs.replayLinks,
    admission: {
      status: admissionStatus,
      readiness: route.readiness,
      reasonCodes,
      evidenceIds: refs.evidenceIds,
      metadata: routeAdmissionMetadata(route, planId)
    },
    metadata: recordMetadata
  }, { id: historyId, createdAt: options.generatedAt });
  const patchBundle = createSemanticPatchBundleRecord({
    id: patchBundleId,
    language: route.sourceLanguage,
    sourcePath: sources[0]?.sourcePath,
    sources,
    changedRegions: regions,
    sourceMapLinks,
    semanticOperationIds: semanticOperations.operations.map((operation) => operation.id),
    evidenceIds: refs.evidenceIds,
    proofIds: refs.proofIds,
    historyIds: [history.id],
    readiness: route.readiness,
    conflictKeys: refs.conflictKeys,
    ...semanticEditBundle,
    admission: {
      status: admissionStatus,
      readiness: route.readiness,
      reviewRequired: true,
      reasonCodes,
      conflictKeys: refs.conflictKeys,
      evidenceIds: refs.evidenceIds,
      metadata: routeAdmissionMetadata(route, planId)
    },
    metadata: recordMetadata
  }, { id: patchBundleId, createdAt: options.generatedAt });
  const materialization = {
    status: 'materialized',
    plannedHistoryIds: refs.historyIds ?? [],
    materializedHistoryIds: [history.id],
    patchBundleIds: [patchBundle.id],
    sourceMapIds: patchBundle.index.sourceMapIds, sourceMapMappingIds: patchBundle.index.sourceMapMappingIds, sourceMapLinkIds: patchBundle.index.sourceMapLinkIds,
    semanticOperationIds: semanticOperations.operations.map((operation) => operation.id),
    evidenceReceiptIds: [evidenceReceipt.id],
    evidenceIds: history.evidenceIds,
    proofIds: history.proofIds,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
  const admissionRecord = createUniversalConversionAdmissionRecord({
    route,
    planId,
    admissionStatus,
    reasonCodes,
    history,
    patchBundle,
    semanticOperations,
    materialization
  });
  return {
    kind: 'frontier.lang.universalConversionRouteArtifact',
    version: 1,
    schema: 'frontier.lang.universalConversionRouteArtifact.v1',
    routeId: route.id,
    planId,
    sourceLanguage: route.sourceLanguage,
    target: route.target,
    mode: route.mode,
    routeAction: route.routeAction,
    priority: route.priority,
    readiness: route.readiness,
    lossClass: route.lossClass,
    adapter: route.adapter,
    adapterKind: route.adapterKind,
    missingEvidence: route.missingEvidence ?? [],
    runtimeAdapterRequirementIds: (route.runtimeAdapterRequirements ?? []).map((entry) => entry.id ?? entry.capability).filter(Boolean),
    runtimeProofObligationIds: runtimeProof.obligationIds,
    runtimeProofCapabilities: runtimeProof.capabilities,
    runtimeProofStatuses: runtimeProof.statuses,
    runtimeProofRequiredSignals: runtimeProof.requiredSignals,
    runtimeProofProvidedSignals: runtimeProof.providedSignals,
    runtimeProofMissingSignals: runtimeProof.missingSignals,
    blockers: route.blockers ?? [],
    review: route.review ?? [],
    admissionAction: route.admissionAction,
    translationAdmission: route.translationAdmission,
    interlingua: route.interlingua,
    ...routeConstraintFields(route),
    admissionStatus,
    reviewRequired: true,
    history,
    patchBundle,
    admissionRecord,
    evidenceReceipt,
    semanticOperations,
    materialization,
    mergeScore: route.mergeScore,
    admissionBucket: admissionRecord.admissionBucket,
    autoMergeClaim: false, semanticEquivalenceClaim: false,
    metadata: { ...recordMetadata, materialization, ...routeConstraintFields(route) }
  };
}

function routeConstraintFields(route) {
  return Object.fromEntries(['resourceTransfer', 'lifetimeConstraint', 'controlFlowConstraint', 'callableBoundaryConstraint', 'adtPatternConstraint', 'borrowScopeConstraint', 'borrowCheckerConstraint', 'dataLayoutConstraint', 'effectConstraint', 'concurrencyModelConstraint', 'errorModelConstraint', 'evaluationModelConstraint', 'hostEnvironmentConstraint', 'memoryModelConstraint', 'metaprogrammingConstraint', 'scopeBindingConstraint', 'moduleConstraint', 'numericSemanticsConstraint', 'textSemanticsConstraint', 'collectionSemanticsConstraint', 'serializationSemanticsConstraint', 'dependencySemanticsConstraint', 'objectModelConstraint', 'protocolConstraint', 'typeConstraint'].map((key) => [key, route[key]]));
}

function routeRuntimeProofIndex(route) {
  const obligations = route.runtime?.proofObligations ?? [];
  return {
    obligationIds: uniqueStrings(obligations.map((entry) => entry.id)),
    capabilities: uniqueStrings(obligations.map((entry) => entry.capability)),
    statuses: uniqueStrings(obligations.map((entry) => entry.status)),
    requiredSignals: uniqueStrings(obligations.flatMap((entry) => entry.requiredSignals ?? [])),
    providedSignals: uniqueStrings(obligations.flatMap((entry) => entry.providedSignals ?? [])),
    missingSignals: uniqueStrings(obligations.flatMap((entry) => entry.missingSignals ?? []))
  };
}

function selectRoutes(routes, options) {
  const selected = (routes ?? []).filter((route) => {
    if (options.routeId && route.id !== options.routeId) return false;
    if (options.sourceLanguage && route.sourceLanguage !== options.sourceLanguage) return false;
    if (options.target && route.target !== options.target) return false;
    if (options.mode && route.mode !== options.mode) return false;
    if (options.readiness && route.readiness !== options.readiness) return false;
    if (options.admissionAction && route.admissionAction !== options.admissionAction) return false;
    return true;
  });
  return Number.isFinite(options.maxRoutes) ? selected.slice(0, Math.max(0, Number(options.maxRoutes))) : selected;
}

function normalizeSources(sources, route) {
  return (sources?.length ? sources : [{}]).map((source, index) => ({
    id: source.sourceId ?? source.id ?? `route_source_${idFragment(route.id)}_${index + 1}`,
    importId: source.importId,
    language: route.sourceLanguage,
    sourcePath: source.sourcePath,
    sourceHash: source.sourceHash,
    baseHash: source.baseHash,
    targetHash: source.targetHash,
    metadata: {
      routeId: route.id,
      target: route.target,
      mode: route.mode
    }
  }));
}

function routeRegions(route, refs, sources) {
  const source = sources[0] ?? {};
  const keys = refs.semanticOwnershipKeys?.length
    ? refs.semanticOwnershipKeys
    : [`conversion#${route.sourceLanguage ?? 'source'}#${route.target ?? 'target'}#${route.id}`];
  return uniqueStrings(keys).map((key, index) => ({
    id: `route_region_${idFragment(route.id)}_${index + 1}`,
    key,
    conflictKey: refs.conflictKeys?.[index] ?? refs.conflictKeys?.[0] ?? key,
    changeKind: 'conversion-route',
    regionKind: route.mode,
    granularity: 'conversion-route',
    precision: route.mode === 'preserve-source' ? 'exact-source' : 'semantic-route',
    language: route.sourceLanguage,
    sourcePath: source.sourcePath,
    sourceHash: source.sourceHash,
    sourceMapIds: refs.sourceMapIds,
    sourceMapMappingIds: refs.sourceMapMappingIds,
    admission: {
      readiness: route.readiness,
      action: route.admissionAction,
      conflictKeys: refs.conflictKeys
    },
    metadata: {
      routeId: route.id,
      target: route.target,
      mode: route.mode,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    }
  }));
}

function routeSourceMapLinks(route, refs, sources, regions) {
  const source = sources[0] ?? {};
  const max = Math.max(refs.sourceMapIds?.length ?? 0, refs.sourceMapMappingIds?.length ?? 0, refs.sourceMapLinkIds?.length ?? 0);
  const targetPaths = refs.generatedTargetPaths ?? refs.targetPaths ?? refs.sourceMapTargetPaths ?? refs.sourceMapTargets ?? [];
  return Array.from({ length: max }, (_, index) => ({
    id: refs.sourceMapLinkIds?.[index] ?? `route_source_map_link_${idFragment(route.id)}_${index + 1}`,
    sourceMapId: refs.sourceMapIds?.[index] ?? refs.sourceMapIds?.[0],
    sourceMapMappingId: refs.sourceMapMappingIds?.[index],
    sourcePath: source.sourcePath,
    sourceHash: source.sourceHash,
    targetPath: targetPathForSourceMapLink(route, source, targetPaths, index),
    precision: route.mode === 'preserve-source' ? 'exact-source' : 'semantic-route',
    regionKey: regions[index % Math.max(1, regions.length)]?.key,
    regionKind: route.mode
  }));
}

function targetPathForSourceMapLink(route, source, targetPaths, index) {
  const target = targetPaths[index] ?? targetPaths[0];
  if (typeof target === 'string' && target) return target;
  if (target && typeof target === 'object') {
    return target.targetPath ?? target.path ?? target.generatedPath ?? target.generatedTargetPath;
  }
  return `${route.target}:${source.sourcePath ?? route.id}`;
}

function routeSemanticCandidates(route, refs) {
  const ids = refs.mergeCandidateIds?.length ? refs.mergeCandidateIds : [`candidate_${route.id}`];
  return uniqueStrings(ids).map((id) => ({
    id,
    sourcePath: refs.sources?.[0]?.sourcePath,
    baseHash: refs.sources?.[0]?.baseHash,
    targetHash: refs.sources?.[0]?.targetHash,
    readiness: route.readiness,
    conflictKeys: refs.conflictKeys ?? [],
    ownershipKeys: refs.semanticOwnershipKeys ?? [],
    evidenceIds: refs.evidenceIds ?? [],
    proofIds: refs.proofIds ?? [],
    replayIds: (refs.replayLinks ?? []).map((link) => link?.id).filter(Boolean),
    metadata: {
      routeId: route.id,
      target: route.target,
      mode: route.mode,
      risk: route.mergeScore?.risk
    }
  }));
}
