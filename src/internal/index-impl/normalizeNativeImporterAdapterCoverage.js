import{normalizeStringList,uniqueStrings}from'../../native-import-utils.js';
import{effectiveNativeImporterAdapterCoverage}from'./effectiveNativeImporterAdapterCoverage.js';import{freezeNativeImporterAdapterCoverageSnapshot}from'./freezeNativeImporterAdapterCoverageSnapshot.js';import{inferredAdapterCoverageNotes}from'./inferredAdapterCoverageNotes.js';import{inferredAdapterExactness}from'./inferredAdapterExactness.js';import{nativeImporterAdapterCapabilityEvidence}from'./nativeImporterAdapterCapabilityEvidence.js';import{normalizeNativeImporterAdapterObservedCoverage}from'./normalizeNativeImporterAdapterObservedCoverage.js';import{normalizeNativeImporterSemanticCoverage}from'./normalizeNativeImporterSemanticCoverage.js';
export function normalizeNativeImporterAdapterCoverage(value = {}, context = {}) {
  const capabilities = new Set(normalizeStringList(context.capabilities).map((capability) => capability.toLowerCase()));
  const hasCapability = (...names) => names.some((name) => capabilities.has(String(name).toLowerCase()));
  const exactAst = Boolean(value.exactAst ?? hasCapability('exactAst', 'exactAstImport'));
  const sourceRanges = Boolean(value.sourceRanges ?? hasCapability('sourceRanges', 'sourceRange', 'ranges', 'sourceMaps'));
  const generatedRanges = Boolean(value.generatedRanges ?? hasCapability('generatedRanges', 'generatedRange', 'generatedSourceMaps'));
  const diagnostics = Boolean(value.diagnostics ?? hasCapability('diagnostics', 'parserDiagnostics'));
  const declared = freezeNativeImporterAdapterCoverageSnapshot({
    exactness: String(value.exactness ?? inferredAdapterExactness(exactAst, capabilities)),
    exactAst,
    tokens: Boolean(value.tokens ?? hasCapability('tokens', 'tokenStream')),
    trivia: Boolean(value.trivia ?? hasCapability('trivia', 'comments', 'formatting')),
    diagnostics,
    sourceRanges,
    generatedRanges,
    semanticCoverage: normalizeNativeImporterSemanticCoverage(value.semanticCoverage, {
      capabilities,
      sourceRanges,
      generatedRanges
    })
  });
  const observed = normalizeNativeImporterAdapterObservedCoverage(value.observed, declared);
  const effective = effectiveNativeImporterAdapterCoverage(declared, observed);
  return Object.freeze({
    ...effective,
    declared,
    observed,
    notes: uniqueStrings(value.notes ?? inferredAdapterCoverageNotes(context, {
      exactAst,
      sourceRanges,
      generatedRanges,
      diagnostics
    })),
    capabilityEvidence: nativeImporterAdapterCapabilityEvidence(declared, observed, effective)
  });
}
