import{idFragment}from'../../native-import-utils.js';import{attachInputUniversalDialectRegistry}from'@shapeshift-labs/frontier-lang-dialects';import{createUniversalAstEnvelope}from'@shapeshift-labs/frontier-lang-kernel';import{attachAppContractLayer}from'./createAppContractLayerFromDocument.js';
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
    packageManifestIds: input.packageManifestIds ?? authored.packageManifestIds ?? document.metadata?.packageManifests?.manifestIds,
    canvasSurfaceIds: input.canvasSurfaceIds ?? authored.canvasSurfaceIds ?? document.metadata?.canvasSurfaces?.surfaceIds,
    applicationSurfaceIds: input.applicationSurfaceIds ?? authored.applicationSurfaceIds ?? document.metadata?.applicationSurfaces?.surfaceIds,
    semanticOperations: input.semanticOperations ?? input.universalAstSemanticOperations ?? document.metadata?.semanticOperations,
    proof: input.proof ?? input.universalAstProof ?? document.metadata?.proof,
    paradigmSemantics: input.paradigmSemantics ?? input.universalAstParadigmSemantics ?? document.metadata?.paradigmSemantics,
    replayLinks: input.replayLinks,
    layers: attachAppContractLayer(input.layers, document, input),
    metadata: input.metadata ?? universalAstMetadata(authored, document)
  }), dialectInput);
}

function universalAstMetadata(authored, document) {
  return {
    ...(authored.metadata ?? {}),
    authoredPackageManifestIds: authored.packageManifestIds ?? document.metadata?.packageManifests?.manifestIds ?? authored.metadata?.authoredPackageManifestIds,
    authoredCanvasSurfaceIds: authored.canvasSurfaceIds ?? document.metadata?.canvasSurfaces?.surfaceIds ?? authored.metadata?.authoredCanvasSurfaceIds,
    authoredApplicationSurfaceIds: authored.applicationSurfaceIds ?? document.metadata?.applicationSurfaces?.surfaceIds ?? authored.metadata?.authoredApplicationSurfaceIds,
    packageManifestSummary: document.metadata?.packageManifests?.summary,
    canvasSurfaceSummary: document.metadata?.canvasSurfaces?.summary,
    applicationSurfaceSummary: document.metadata?.applicationSurfaces?.summary
  };
}

function nativeSourcesFromDocument(document) {
  return Object.values(document?.nodes ?? {}).filter((node) => node?.kind === 'nativeSource');
}
