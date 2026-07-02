import{idFragment}from'../../native-import-utils.js';import{attachInputUniversalDialectRegistry}from'@shapeshift-labs/frontier-lang-dialects';import{createUniversalAstEnvelope}from'@shapeshift-labs/frontier-lang-kernel';
export function createUniversalAstFromDocument(document, input = {}) {
  return attachInputUniversalDialectRegistry(createUniversalAstEnvelope({
    id: input.id ?? `universal_ast_${idFragment(document.id)}`,
    document,
    nativeSources: input.nativeSources,
    semanticIndex: input.semanticIndex,
    sourceMaps: input.sourceMaps ?? [],
    losses: input.losses,
    evidence: input.evidence ?? [],
    mergeCandidates: input.mergeCandidates,
    semanticOperations: input.semanticOperations,
    proof: input.proof ?? input.universalAstProof ?? document.metadata?.proof,
    paradigmSemantics: input.paradigmSemantics ?? input.universalAstParadigmSemantics ?? document.metadata?.paradigmSemantics,
    replayLinks: input.replayLinks,
    layers: input.layers,
    metadata: input.metadata
  }), input);
}
