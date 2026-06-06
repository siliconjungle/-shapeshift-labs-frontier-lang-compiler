import{normalizeNativeImporterSemanticCoverage}from'./normalizeNativeImporterSemanticCoverage.js';
export function freezeNativeImporterAdapterCoverageSnapshot(value = {}) {
  return Object.freeze({
    exactness: String(value.exactness ?? 'unknown'),
    exactAst: Boolean(value.exactAst),
    tokens: Boolean(value.tokens),
    trivia: Boolean(value.trivia),
    diagnostics: Boolean(value.diagnostics),
    sourceRanges: Boolean(value.sourceRanges),
    generatedRanges: Boolean(value.generatedRanges),
    semanticCoverage: normalizeNativeImporterSemanticCoverage(value.semanticCoverage, {})
  });
}
