import{nativeAstNodes}from'./nativeAstNodes.js';import{normalizeNativeImporterSemanticCoverage}from'./normalizeNativeImporterSemanticCoverage.js';import{observedAdapterExactness}from'./observedAdapterExactness.js';
export function normalizeNativeImporterAdapterObservedCoverage(value = {}, declared = {}) {
  const diagnostics = Number(value.diagnostics ?? value.parserDiagnostics ?? 0) || 0;
  const semanticCoverage = normalizeNativeImporterSemanticCoverage({
    ...(value.semanticCoverage ?? {}),
    declarations: value.semanticCoverage?.declarations ?? value.declarations,
    symbols: value.semanticCoverage?.symbols ?? value.symbols,
    references: value.semanticCoverage?.references ?? value.references,
    types: value.semanticCoverage?.types ?? value.types,
    controlFlow: value.semanticCoverage?.controlFlow ?? value.controlFlow
  }, {});
  const nativeAstNodes = Number(value.nativeAstNodes ?? 0) || 0;
  const exactness = String(value.exactness ?? observedAdapterExactness(declared, nativeAstNodes));
  return Object.freeze({
    exactness,
    exactAst: Boolean(value.exactAst ?? (declared.exactAst && nativeAstNodes > 0)),
    tokens: Boolean(value.tokens),
    tokenCount: Number(value.tokenCount ?? 0) || 0,
    trivia: Boolean(value.trivia),
    triviaCount: Number(value.triviaCount ?? 0) || 0,
    diagnostics,
    parserDiagnostics: diagnostics,
    diagnosticErrors: Number(value.diagnosticErrors ?? 0) || 0,
    diagnosticWarnings: Number(value.diagnosticWarnings ?? 0) || 0,
    diagnosticInfos: Number(value.diagnosticInfos ?? 0) || 0,
    losses: Number(value.losses ?? 0) || 0,
    nativeAstNodes,
    semanticSymbols: Number(value.semanticSymbols ?? 0) || 0,
    semanticReferences: Number(value.semanticReferences ?? 0) || 0,
    semanticTypes: Number(value.semanticTypes ?? 0) || 0,
    semanticControlFlow: Number(value.semanticControlFlow ?? 0) || 0,
    references: Boolean(value.references ?? semanticCoverage.references),
    types: Boolean(value.types ?? semanticCoverage.types),
    controlFlow: Boolean(value.controlFlow ?? semanticCoverage.controlFlow),
    sourceMapMappings: Number(value.sourceMapMappings ?? 0) || 0,
    sourceRanges: Boolean(value.sourceRanges),
    sourceRangeNodes: Number(value.sourceRangeNodes ?? 0) || 0,
    sourceRangeMappings: Number(value.sourceRangeMappings ?? 0) || 0,
    generatedRanges: Boolean(value.generatedRanges),
    generatedRangeMappings: Number(value.generatedRangeMappings ?? 0) || 0,
    semanticCoverage
  });
}
