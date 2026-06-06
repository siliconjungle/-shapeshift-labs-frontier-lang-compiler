import{adapterCoverageSnapshotFromSummary}from'./adapterCoverageSnapshotFromSummary.js';import{effectiveNativeImporterAdapterCoverage}from'./effectiveNativeImporterAdapterCoverage.js';import{nativeImporterAdapterCapabilityEvidence}from'./nativeImporterAdapterCapabilityEvidence.js';import{observeNativeImporterAdapterCoverageDetails}from'./observeNativeImporterAdapterCoverageDetails.js';
export function observeNativeImporterAdapterCoverage(coverage, parseResult = {}, context = {}) {
  const nodes = parseResult.nativeAst?.nodes ?? parseResult.nodes ?? {};
  const nodeList = Object.values(nodes);
  const sourceMapMappings = parseResult.sourceMaps?.flatMap((sourceMap) => sourceMap.mappings ?? []) ?? parseResult.mappings ?? [];
  const semanticIndex = parseResult.semanticIndex;
  const semanticSymbols = semanticIndex?.symbols?.length ?? 0;
  const declared = coverage.declared ?? adapterCoverageSnapshotFromSummary(coverage);
  const observed = observeNativeImporterAdapterCoverageDetails(parseResult, context, {
    declared,
    nodeList,
    sourceMapMappings,
    semanticIndex,
    semanticSymbols
  });
  const effective = effectiveNativeImporterAdapterCoverage(declared, observed);
  return Object.freeze({
    ...coverage,
    ...effective,
    declared,
    observed,
    capabilityEvidence: nativeImporterAdapterCapabilityEvidence(declared, observed, effective)
  });
}
