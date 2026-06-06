import{effectiveAdapterExactness}from'./effectiveAdapterExactness.js';import{freezeNativeImporterAdapterCoverageSnapshot}from'./freezeNativeImporterAdapterCoverageSnapshot.js';import{maxSemanticCoverageLevel}from'./maxSemanticCoverageLevel.js';import{normalizeNativeImporterSemanticCoverage}from'./normalizeNativeImporterSemanticCoverage.js';
export function effectiveNativeImporterAdapterCoverage(declared, observed) {
  const semanticCoverage = normalizeNativeImporterSemanticCoverage({
    level: maxSemanticCoverageLevel(declared.semanticCoverage?.level, observed.semanticCoverage?.level),
    declarations: declared.semanticCoverage?.declarations || observed.semanticCoverage?.declarations,
    symbols: declared.semanticCoverage?.symbols || observed.semanticCoverage?.symbols,
    references: declared.semanticCoverage?.references || observed.semanticCoverage?.references,
    types: declared.semanticCoverage?.types || observed.semanticCoverage?.types,
    controlFlow: declared.semanticCoverage?.controlFlow || observed.semanticCoverage?.controlFlow
  }, {});
  return freezeNativeImporterAdapterCoverageSnapshot({
    exactness: effectiveAdapterExactness(declared, observed),
    exactAst: declared.exactAst || observed.exactAst,
    tokens: declared.tokens || observed.tokens,
    trivia: declared.trivia || observed.trivia,
    diagnostics: declared.diagnostics || observed.parserDiagnostics > 0,
    sourceRanges: declared.sourceRanges || observed.sourceRanges,
    generatedRanges: declared.generatedRanges || observed.generatedRanges,
    semanticCoverage
  });
}
