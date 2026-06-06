import { countBy, idFragment, maxSemanticMergeReadiness, normalizeStringList, uniqueRecordsById, uniqueStrings } from './native-import-utils.js';
import { semanticImportSidecarEntry } from './semantic-import-sidecar-entry.js';
import { summarizeSemanticImportRegionTaxonomy } from './semantic-import-regions.js';

function collectImportSourceMaps(importResult, imports) {
  return uniqueRecordsById([
    ...(importResult?.sourceMaps ?? importResult?.universalAst?.sourceMaps ?? []),
    ...imports.flatMap((imported) => imported?.sourceMaps ?? imported?.universalAst?.sourceMaps ?? [])
  ]);
}

function summarizeImportSourceMaps(sourceMaps) {
  const mappings = sourceMaps.flatMap((sourceMap) => sourceMap?.mappings ?? []);
  return {
    total: sourceMaps.length,
    ids: sourceMaps.map((sourceMap) => sourceMap.id).filter(Boolean),
    mappingCount: mappings.length,
    sourcePaths: uniqueStrings([
      ...sourceMaps.map((sourceMap) => sourceMap.sourcePath),
      ...mappings.map((mapping) => mapping.sourceSpan?.path)
    ].filter(Boolean)),
    targetPaths: uniqueStrings([
      ...sourceMaps.map((sourceMap) => sourceMap.targetPath ?? sourceMap.target?.emitPath),
      ...mappings.map((mapping) => mapping.generatedSpan?.targetPath ?? mapping.target?.emitPath)
    ].filter(Boolean)),
    byPrecision: countBy(mappings.map((mapping) => mapping.precision ?? 'unknown')),
    sourceRangeMappings: mappings.filter((mapping) => mapping.sourceSpan).length,
    generatedRangeMappings: mappings.filter((mapping) => mapping.generatedSpan).length
  };
}

function summarizeImportRegions(importResult, imports, options = {}) {
  const entries = imports.map((imported, index) => semanticImportSidecarEntry(imported, index, options));
  const regions = uniqueRecordsById(entries.flatMap((entry) => entry.ownershipRegions ?? []));
  const taxonomy = summarizeSemanticImportRegionTaxonomy(regions);
  return {
    total: regions.length,
    ids: regions.map((region) => region.id),
    keys: regions.map((region) => region.key),
    sourcePaths: uniqueStrings(regions.map((region) => region.sourcePath).filter(Boolean)),
    byKind: taxonomy.byKind,
    byGranularity: countBy(regions.map((region) => region.granularity ?? 'unknown')),
    byPrecision: countBy(regions.map((region) => region.precision ?? 'unknown')),
    byLanguage: countBy(regions.map((region) => region.language ?? importResult?.language ?? 'unknown')),
    symbolIds: uniqueStrings(regions.map((region) => region.symbolId).filter(Boolean)),
    taxonomy
  };
}

function summarizeImportAdapterCoverage(importResult, imports) {
  const records = uniqueAdapterCoverageRecords([
    compactAdapterCoverageRecord(importResult),
    ...imports.map((imported) => compactAdapterCoverageRecord(imported))
  ].filter(Boolean));
  const observed = records.reduce((totals, record) => {
    for (const key of ['diagnostics', 'losses', 'nativeAstNodes', 'semanticSymbols', 'sourceMapMappings']) {
      totals[key] += record.observed?.[key] ?? 0;
    }
    totals.sourceRanges = totals.sourceRanges || record.observed?.sourceRanges === true;
    totals.generatedRanges = totals.generatedRanges || record.observed?.generatedRanges === true;
    return totals;
  }, {
    diagnostics: 0,
    losses: 0,
    nativeAstNodes: 0,
    semanticSymbols: 0,
    sourceMapMappings: 0,
    sourceRanges: false,
    generatedRanges: false
  });
  return {
    total: records.length,
    adapterIds: uniqueStrings(records.map((record) => record.adapterId).filter(Boolean)),
    parsers: uniqueStrings(records.map((record) => record.parser).filter(Boolean)),
    exactness: uniqueStrings(records.map((record) => record.exactness).filter(Boolean)),
    exactAst: records.filter((record) => record.exactAst).length,
    tokens: records.filter((record) => record.tokens).length,
    trivia: records.filter((record) => record.trivia).length,
    diagnostics: records.filter((record) => record.diagnostics).length,
    sourceRanges: records.filter((record) => record.sourceRanges).length,
    generatedRanges: records.filter((record) => record.generatedRanges).length,
    semanticCoverageLevels: uniqueStrings(records.map((record) => record.semanticCoverage?.level).filter(Boolean)),
    observed,
    records
  };
}

function compactAdapterCoverageRecord(imported) {
  const nativeAst = imported?.nativeAst ?? imported?.nativeSource?.ast;
  const nativeSource = imported?.nativeSource;
  const coverage = imported?.adapter?.coverage
    ?? imported?.metadata?.adapterCoverage
    ?? nativeAst?.metadata?.adapterCoverage
    ?? nativeSource?.metadata?.adapterCoverage;
  if (!coverage) return undefined;
  return {
    adapterId: imported?.adapter?.id ?? imported?.metadata?.adapterId ?? nativeAst?.metadata?.adapterId ?? nativeSource?.metadata?.adapterId,
    adapterVersion: imported?.adapter?.version ?? imported?.metadata?.adapterVersion ?? nativeAst?.metadata?.adapterVersion ?? nativeSource?.metadata?.adapterVersion,
    parser: imported?.adapter?.parser ?? nativeAst?.parser ?? nativeSource?.parser ?? imported?.metadata?.parser,
    capabilities: uniqueStrings(imported?.adapter?.capabilities ?? imported?.metadata?.adapterCapabilities ?? []),
    supportedExtensions: uniqueStrings(imported?.adapter?.supportedExtensions ?? imported?.metadata?.supportedExtensions ?? []),
    exactness: coverage.exactness,
    exactAst: Boolean(coverage.exactAst),
    tokens: Boolean(coverage.tokens),
    trivia: Boolean(coverage.trivia),
    diagnostics: Boolean(coverage.diagnostics),
    sourceRanges: Boolean(coverage.sourceRanges),
    generatedRanges: Boolean(coverage.generatedRanges),
    semanticCoverage: coverage.semanticCoverage,
    observed: coverage.observed,
    notes: uniqueStrings(coverage.notes ?? [])
  };
}

function uniqueAdapterCoverageRecords(records) {
  const seen = new Set();
  const result = [];
  for (const record of records) {
    const key = [record.adapterId, record.adapterVersion, record.parser, record.exactness].join('#');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(record);
  }
  return result;
}

function compactImportContractSource(imported, index) {
  const nativeAst = imported?.nativeAst ?? imported?.nativeSource?.ast;
  const nativeSource = imported?.nativeSource;
  const semanticIndex = imported?.semanticIndex ?? imported?.universalAst?.semanticIndex;
  const sourceMaps = collectImportSourceMaps(imported, [imported].filter(Boolean));
  return {
    id: imported?.id ?? `import_${index + 1}`,
    language: imported?.language ?? nativeSource?.language ?? nativeAst?.language,
    sourcePath: imported?.sourcePath ?? nativeSource?.sourcePath ?? nativeAst?.sourcePath,
    sourceHash: nativeSource?.sourceHash ?? nativeAst?.sourceHash,
    parser: nativeAst?.parser ?? nativeSource?.parser,
    nativeSourceId: nativeSource?.id,
    nativeAstId: nativeAst?.id,
    semanticIndexId: semanticIndex?.id,
    universalAstId: imported?.universalAst?.id,
    patchId: imported?.patch?.id,
    sourceMapIds: sourceMaps.map((sourceMap) => sourceMap.id).filter(Boolean),
    sourceMapMappings: sourceMaps.reduce((sum, sourceMap) => sum + (sourceMap.mappings?.length ?? 0), 0),
    symbolCount: semanticIndex?.symbols?.length ?? 0,
    lossCount: imported?.losses?.length ?? nativeAst?.losses?.length ?? 0,
    evidenceCount: imported?.evidence?.length ?? 0,
    readiness: imported?.metadata?.semanticMergeReadiness ?? imported?.mergeCandidates?.[0]?.readiness
  };
}

function summarizeImportContractReadiness(importResult, mergeCandidates, lossSummary) {
  const candidateReadiness = mergeCandidates.reduce(
    (current, candidate) => maxSemanticMergeReadiness(current, candidate.readiness),
    lossSummary.semanticMergeReadiness
  );
  const semanticMergeReadiness = maxSemanticMergeReadiness(
    importResult?.metadata?.semanticMergeReadiness ?? lossSummary.semanticMergeReadiness,
    candidateReadiness
  );
  return {
    semanticMergeReadiness,
    severityReadiness: lossSummary.semanticMergeReadiness,
    reasons: uniqueStrings([
      ...(lossSummary.readinessReasons ?? []),
      ...mergeCandidates.flatMap((candidate) => candidate?.reasons ?? []),
      ...normalizeStringList(importResult?.metadata?.readinessReasons)
    ]),
    failedEvidenceIds: lossSummary.failedEvidenceIds,
    blockingLossIds: lossSummary.blockingLossIds,
    reviewLossIds: lossSummary.reviewLossIds,
    informationalLossIds: lossSummary.informationalLossIds
  };
}

function defaultSemanticImportSidecarId(importResult, imports = []) {
  return `semantic_import_${idFragment(importResult?.id ?? importResult?.projectRoot ?? imports[0]?.sourcePath ?? imports[0]?.language ?? 'source')}`;
}

export {
  collectImportSourceMaps,
  compactImportContractSource,
  defaultSemanticImportSidecarId,
  summarizeImportAdapterCoverage,
  summarizeImportContractReadiness,
  summarizeImportRegions,
  summarizeImportSourceMaps
};
