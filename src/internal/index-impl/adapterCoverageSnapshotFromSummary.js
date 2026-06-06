import{freezeNativeImporterAdapterCoverageSnapshot}from'./freezeNativeImporterAdapterCoverageSnapshot.js';
export function adapterCoverageSnapshotFromSummary(coverage = {}) {
  return freezeNativeImporterAdapterCoverageSnapshot({
    exactness: coverage.exactness ?? 'unknown',
    exactAst: coverage.exactAst,
    tokens: coverage.tokens,
    trivia: coverage.trivia,
    diagnostics: coverage.diagnostics,
    sourceRanges: coverage.sourceRanges,
    generatedRanges: coverage.generatedRanges,
    semanticCoverage: coverage.semanticCoverage
  });
}
