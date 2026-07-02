import{idFragment}from'../../native-import-utils.js';import{attachInputUniversalDialectRegistry}from'@shapeshift-labs/frontier-lang-dialects';import{createUniversalAstEnvelope}from'@shapeshift-labs/frontier-lang-kernel';import{targetProjectionMetadataFields,authoredTargetProjections}from'./authoredTargetProjections.js';import{attachAppContractLayer}from'./createAppContractLayerFromDocument.js';
export function createUniversalAstFromDocument(document, input = {}) {
  const authored = document.metadata?.universalAst ?? {};
  const dialectInput = document.metadata?.dialects
    ? { universalDialectRegistry: document.metadata.dialects, ...input }
    : input;
  return attachInputUniversalDialectRegistry(createUniversalAstEnvelope({
    id: input.id ?? `universal_ast_${idFragment(document.id)}`,
    document,
    nativeSources: input.nativeSources ?? authored.nativeSources ?? nativeSourcesFromDocument(document),
    semanticIndex: input.semanticIndex,
    sourceMaps: input.sourceMaps ?? authored.sourceMaps ?? [],
    losses: input.losses ?? authored.losses,
    evidence: input.evidence ?? authored.evidence ?? [],
    mergeCandidates: input.mergeCandidates ?? authored.mergeCandidates,
    packageManifests: input.packageManifests ?? authored.packageManifests ?? document.metadata?.packageManifests?.manifests,
    canvasSurfaces: input.canvasSurfaces ?? authored.canvasSurfaces ?? document.metadata?.canvasSurfaces?.surfaces,
    applicationSurfaces: input.applicationSurfaces ?? authored.applicationSurfaces ?? document.metadata?.applicationSurfaces?.surfaces,
    runtimeCapabilities: input.runtimeCapabilities ?? authored.runtimeCapabilities ?? document.metadata?.runtimeCapabilities?.blocks,
    targetProjections: input.targetProjections ?? authored.targetProjections ?? document.metadata?.targetProjections,
    constraintSpaces: input.constraintSpaces ?? authored.constraintSpaces ?? document.metadata?.constraintSpaces?.spaces,
    packageManifestIds: input.packageManifestIds ?? authored.packageManifestIds ?? document.metadata?.packageManifests?.manifestIds,
    canvasSurfaceIds: input.canvasSurfaceIds ?? authored.canvasSurfaceIds ?? document.metadata?.canvasSurfaces?.surfaceIds,
    applicationSurfaceIds: input.applicationSurfaceIds ?? authored.applicationSurfaceIds ?? document.metadata?.applicationSurfaces?.surfaceIds,
    runtimeCapabilityIds: input.runtimeCapabilityIds ?? authored.runtimeCapabilityIds ?? document.metadata?.runtimeCapabilities?.blockIds,
    targetProjectionContractIds: input.targetProjectionContractIds ?? authored.targetProjectionContractIds ?? document.metadata?.targetProjections?.projectionContractIds,
    constraintSpaceIds: input.constraintSpaceIds ?? authored.constraintSpaceIds ?? document.metadata?.constraintSpaces?.constraintSpaceIds ?? document.metadata?.constraintSpaces?.spaces?.map((space) => space.id).filter(Boolean),
    semanticOperations: input.semanticOperations ?? input.universalAstSemanticOperations ?? document.metadata?.semanticOperations,
    proof: input.proof ?? input.universalAstProof ?? document.metadata?.proof,
    paradigmSemantics: input.paradigmSemantics ?? input.universalAstParadigmSemantics ?? document.metadata?.paradigmSemantics,
    replayLinks: input.replayLinks,
    layers: attachAppContractLayer(input.layers, document, input),
    metadata: input.metadata ?? universalAstMetadata(authored, document)
  }), dialectInput);
}

function universalAstMetadata(authored, document) {
  const targetProjectionRecords = authoredTargetProjections(document);
  return {
    ...(authored.metadata ?? {}),
    authoredPackageManifestIds: authored.packageManifestIds ?? document.metadata?.packageManifests?.manifestIds ?? authored.metadata?.authoredPackageManifestIds,
    authoredCanvasSurfaceIds: authored.canvasSurfaceIds ?? document.metadata?.canvasSurfaces?.surfaceIds ?? authored.metadata?.authoredCanvasSurfaceIds,
    authoredApplicationSurfaceIds: authored.applicationSurfaceIds ?? document.metadata?.applicationSurfaces?.surfaceIds ?? authored.metadata?.authoredApplicationSurfaceIds,
    authoredRuntimeCapabilityIds: authored.runtimeCapabilityIds ?? document.metadata?.runtimeCapabilities?.blockIds ?? authored.metadata?.authoredRuntimeCapabilityIds,
    ...(targetProjectionRecords.length ? targetProjectionMetadataFields(targetProjectionRecords) : {}),
    packageManifestSummary: document.metadata?.packageManifests?.summary,
    canvasSurfaceSummary: document.metadata?.canvasSurfaces?.summary,
    applicationSurfaceSummary: document.metadata?.applicationSurfaces?.summary,
    runtimeCapabilitySummary: document.metadata?.runtimeCapabilities?.summary,
    constraintSpaceSummary: document.metadata?.constraintSpaces?.summary
  };
}

function nativeSourcesFromDocument(document) {
  return Object.values(document?.nodes ?? {}).filter((node) => node?.kind === 'nativeSource');
}
