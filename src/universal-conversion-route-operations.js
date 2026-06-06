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
    targetLossKinds: route.evidence?.targetLossKinds ?? [],
    missingEvidence: route.missingEvidence ?? [],
    blockers: route.blockers ?? [],
    review: route.review ?? [],
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}
