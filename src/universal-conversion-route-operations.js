import { createSemanticOperationSet } from '@shapeshift-labs/frontier-lang-kernel';
import { uniqueStrings } from './native-import-utils.js';

export function routeSemanticOperations(route, refs, sources, regions, sourceMapLinks) {
  const source = sources[0] ?? {};
  return createSemanticOperationSet({
    id: `semantic_operations_${route.id}`,
    operations: [{
      id: `semantic_operation_${route.id}`,
      operationKind: routeOperationKind(route),
      language: route.sourceLanguage,
      name: route.routeAction,
      target: typeof route.target === 'string' ? { language: route.target } : route.target,
      nativeSourceId: source.id,
      sourceMapIds: refs.sourceMapIds,
      sourceMapMappingIds: refs.sourceMapMappingIds,
      evidenceIds: refs.evidenceIds,
      proofArtifactIds: refs.proofIds,
      resources: routeOperationResources(route),
      ownershipKeys: regions.map((region) => region.key),
      conflictKeys: refs.conflictKeys,
      readiness: route.readiness,
      dynamic: route.mode === 'target-adapter' && route.readiness !== 'ready',
      opaque: route.readiness === 'blocked' || route.mode === 'semantic-index-only',
      metadata: routeOperationMetadata(route, source, sourceMapLinks)
    }]
  });
}

function routeOperationKind(route) {
  if (route.mode === 'preserve-source') return 'sourcePreservation';
  if (route.mode === 'target-adapter' || route.mode === 'stub-only') return 'projection';
  if (route.mode === 'semantic-index-only') return 'merge';
  return 'opaque';
}

function routeOperationResources(route) {
  return uniqueStrings([route.adapter, route.adapterKind, route.target].filter(Boolean).map(String));
}

function routeOperationMetadata(route, source, sourceMapLinks) {
  return {
    routeId: route.id,
    routeAction: route.routeAction,
    admissionAction: route.admissionAction,
    priority: route.priority,
    sourcePath: source.sourcePath,
    sourceHash: source.sourceHash,
    sourceMapLinkIds: sourceMapLinks.map((link) => link.id),
    representation: {
      constructKinds: route.representation?.constructKinds ?? [],
      runtimeCapabilities: route.representation?.surfaces?.runtime?.requiredCapabilities ?? [],
      sourceMapPrecisions: route.representation?.surfaces?.sourceMaps?.precisions ?? [],
      missing: route.representation?.missing ?? [],
      blockers: route.representation?.blockers ?? []
    },
    translationAdmission: route.translationAdmission,
    interlingua: routeOperationInterlinguaMetadata(route),
    targetLossKinds: route.evidence?.targetLossKinds ?? [],
    missingEvidence: route.missingEvidence ?? [],
    blockers: route.blockers ?? [],
    review: route.review ?? [],
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

function routeOperationInterlinguaMetadata(route) {
  const record = route.interlingua ?? {};
  const lowering = record.lowering ?? {};
  const query = record.query ?? {};
  const layers = record.layers ?? {};
  return {
    id: record.id,
    routeId: record.routeId ?? route.id,
    layerKinds: query.layerKinds ?? layers.kinds ?? [],
    representedLayerKinds: query.representedLayerKinds ?? layers.representedKinds ?? [],
    missingLayerKinds: query.missingLayerKinds ?? layers.missingKinds ?? [],
    reviewLayerKinds: query.reviewLayerKinds ?? layers.reviewKinds ?? [],
    blockedLayerKinds: query.blockedLayerKinds ?? layers.blockedKinds ?? [],
    loweringDisposition: lowering.disposition ?? query.loweringDisposition,
    adapterId: lowering.adapterId ?? query.targetAdapterId,
    missingEvidence: lowering.missingEvidence ?? query.missingEvidence ?? [],
    lossIds: lowering.lossIds ?? [],
    proofEvidenceIds: lowering.proofEvidenceIds ?? query.proofEvidenceIds ?? [],
    constraintFamilies: query.constraintFamilies ?? [],
    constraintStatuses: query.constraintStatuses ?? [],
    constraintActions: query.constraintActions ?? [],
    constraintSourceIds: query.constraintSourceIds ?? [],
    constraintRequiredKinds: query.constraintRequiredKinds ?? [],
    constraintRepresentedKinds: query.constraintRepresentedKinds ?? [],
    constraintMissingKinds: query.constraintMissingKinds ?? [],
    constraintMissingEvidence: query.constraintMissingEvidence ?? [],
    constraintObligationKinds: query.constraintObligationKinds ?? [],
    constraintObligationStatuses: query.constraintObligationStatuses ?? [],
    constraintObligationMissingEvidence: query.constraintObligationMissingEvidence ?? [],
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}
