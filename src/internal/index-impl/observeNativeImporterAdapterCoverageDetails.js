import{adapterCoverageSourcePreservation}from'./adapterCoverageSourcePreservation.js';import{maxSemanticCoverageLevel}from'./maxSemanticCoverageLevel.js';import{nativeAstNodes}from'./nativeAstNodes.js';import{normalizeNativeImporterAdapterObservedCoverage}from'./normalizeNativeImporterAdapterObservedCoverage.js';import{normalizeNativeImporterSemanticCoverage}from'./normalizeNativeImporterSemanticCoverage.js';import{observedAdapterExactness}from'./observedAdapterExactness.js';import{observeNativeImporterSemanticEvidence}from'./observeNativeImporterSemanticEvidence.js';
export function observeNativeImporterAdapterCoverageDetails(parseResult = {}, context = {}, observedContext = {}) {
  const declared = observedContext.declared ?? {};
  const nodeList = observedContext.nodeList ?? Object.values(parseResult.nativeAst?.nodes ?? parseResult.nodes ?? {});
  const sourceMapMappings = observedContext.sourceMapMappings
    ?? parseResult.sourceMaps?.flatMap((sourceMap) => sourceMap.mappings ?? [])
    ?? parseResult.mappings
    ?? [];
  const semanticIndex = observedContext.semanticIndex ?? parseResult.semanticIndex;
  const semanticSymbols = observedContext.semanticSymbols ?? semanticIndex?.symbols?.length ?? 0;
  const diagnostics = context.diagnostics ?? [];
  const diagnosticErrors = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const diagnosticWarnings = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length;
  const diagnosticInfos = diagnostics.filter((diagnostic) => diagnostic.severity === 'info').length;
  const sourceRangeNodes = nodeList.filter((node) => Boolean(node?.span)).length;
  const sourceRangeMappings = sourceMapMappings.filter((mapping) => Boolean(mapping?.sourceSpan)).length;
  const generatedRangeMappings = sourceMapMappings.filter((mapping) => Boolean(mapping?.generatedSpan)).length;
  const preservation = adapterCoverageSourcePreservation(parseResult);
  const tokenCount = preservation?.summary?.tokens ?? preservation?.tokens?.length ?? 0;
  const triviaCount = preservation?.summary?.trivia ?? preservation?.trivia?.length ?? 0;
  const semanticEvidence = observeNativeImporterSemanticEvidence(semanticIndex);
  const semanticCoverage = normalizeNativeImporterSemanticCoverage({
    level: maxSemanticCoverageLevel(
      semanticSymbols || semanticEvidence.declarations
        ? 'declaration-index'
        : 'native-ast',
      semanticEvidence.references || semanticEvidence.types || semanticEvidence.controlFlow
        ? 'semantic-index'
        : semanticSymbols ? 'declaration-index' : 'native-ast'
    ),
    declarations: semanticSymbols > 0 || semanticEvidence.declarations > 0,
    symbols: semanticSymbols > 0,
    references: semanticEvidence.references > 0,
    types: semanticEvidence.types > 0,
    controlFlow: semanticEvidence.controlFlow > 0
  }, {});
  return normalizeNativeImporterAdapterObservedCoverage({
    exactness: observedAdapterExactness(declared, nodeList.length),
    exactAst: Boolean(declared.exactAst && nodeList.length > 0),
    tokens: tokenCount > 0,
    tokenCount,
    trivia: triviaCount > 0,
    triviaCount,
    diagnostics: diagnostics.length,
    parserDiagnostics: diagnostics.length,
    diagnosticErrors,
    diagnosticWarnings,
    diagnosticInfos,
    losses: context.losses?.length ?? 0,
    nativeAstNodes: nodeList.length,
    semanticSymbols,
    semanticReferences: semanticEvidence.references,
    semanticTypes: semanticEvidence.types,
    semanticControlFlow: semanticEvidence.controlFlow,
    references: semanticEvidence.references > 0,
    types: semanticEvidence.types > 0,
    controlFlow: semanticEvidence.controlFlow > 0,
    sourceMapMappings: sourceMapMappings.length,
    sourceRanges: sourceRangeNodes > 0 || sourceRangeMappings > 0,
    sourceRangeNodes,
    sourceRangeMappings,
    generatedRanges: generatedRangeMappings > 0,
    generatedRangeMappings,
    semanticCoverage
  }, declared);
}
