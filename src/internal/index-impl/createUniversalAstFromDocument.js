import{idFragment}from'../../native-import-utils.js';import{attachInputUniversalDialectRegistry}from'../../universal-dialect-registry.js';import{createUniversalAstEnvelope}from'@shapeshift-labs/frontier-lang-kernel';
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
    layers: input.layers,
    metadata: input.metadata
  }), input);
}
