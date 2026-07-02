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
    semanticOperations: input.semanticOperations ?? input.universalAstSemanticOperations ?? document.metadata?.semanticOperations,
    proof: input.proof ?? input.universalAstProof ?? document.metadata?.proof,
    paradigmSemantics: input.paradigmSemantics ?? input.universalAstParadigmSemantics ?? document.metadata?.paradigmSemantics,
    replayLinks: input.replayLinks,
    layers: attachAppContractLayer(input.layers, document, input),
    metadata: input.metadata ?? authored.metadata
  }), dialectInput);
}

function nativeSourcesFromDocument(document) {
  return Object.values(document?.nodes ?? {}).filter((node) => node?.kind === 'nativeSource');
}
