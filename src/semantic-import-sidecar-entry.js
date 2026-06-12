import { uniqueRecordsById, uniqueStrings } from './native-import-utils.js';
import { summarizeSemanticImportDependencyRelations } from './semantic-import-dependencies.js';
import { semanticOwnershipRegionForSymbol, semanticPatchHintForRegion, summarizeSemanticImportRegionTaxonomy } from './semantic-import-regions.js';
import { collectKernelSourcePreservationFromImport } from './semantic-import-source-preservation.js';
import {
  summarizeParadigmSemanticsLayer,
  summarizeProofSpecLayer,
  summarizeUniversalAstLayers
} from './semantic-import-layers.js';

function semanticImportSidecarEntry(imported, index, options) {
  const semanticIndex = imported?.semanticIndex ?? imported?.universalAst?.semanticIndex;
  const semanticSymbols = semanticSymbolsForImport(imported, semanticIndex);
  const nativeAst = imported?.nativeAst ?? imported?.nativeSource?.ast;
  const semanticFacts = semanticIndex?.facts ?? [];
  const sourceMaps = imported?.sourceMaps ?? imported?.universalAst?.sourceMaps ?? [];
  const sourceMapMappings = sourceMaps.flatMap((sourceMap) => sourceMap?.mappings ?? []);
  const importedOwnershipRegions = semanticOwnershipRegionsForImport(imported);
  const sourcePreservationRecords = collectKernelSourcePreservationFromImport(imported);
  const universalAstLayers = summarizeUniversalAstLayers(imported?.universalAst);
  const proofSpec = summarizeProofSpecLayer(imported?.universalAst?.proof ?? imported?.proof);
  const paradigmSemantics = summarizeParadigmSemanticsLayer(imported?.universalAst?.paradigmSemantics ?? imported?.paradigmSemantics);
  const dependencies = summarizeSemanticImportDependencyRelations(semanticIndex?.relations ?? []);
  const factSummary = summarizeSemanticFacts(semanticFacts);
  const readiness = semanticImportEntryReadiness(imported);
  const mappingsBySymbolId = new Map();
  for (const mapping of sourceMapMappings) {
    if (mapping.semanticSymbolId && !mappingsBySymbolId.has(mapping.semanticSymbolId)) {
      mappingsBySymbolId.set(mapping.semanticSymbolId, mapping);
    }
  }
  const symbols = [];
  const regions = [];
  for (const symbol of semanticSymbols) {
    const mapping = mappingsBySymbolId.get(symbol.id);
    const nativeNode = symbol.nativeAstNodeId ? nativeAst?.nodes?.[symbol.nativeAstNodeId] : undefined;
    const generatedRegion = semanticOwnershipRegionForSymbol(imported, symbol, mapping, nativeNode, options);
    const region = mergeSemanticOwnershipRegion(
      generatedRegion,
      semanticOwnershipRegionForImportedSymbol(importedOwnershipRegions, symbol, generatedRegion)
    );
    regions.push(region);
    symbols.push({
      id: symbol.id,
      name: symbol.name,
      kind: symbol.kind,
      language: symbol.language ?? imported?.language,
      nativeAstNodeId: symbol.nativeAstNodeId,
      semanticOccurrenceId: mapping?.semanticOccurrenceId,
      sourceMapMappingId: mapping?.id,
      sourceSpan: region.sourceSpan ?? mapping?.sourceSpan ?? symbol.definitionSpan ?? nativeNode?.span,
      signatureHash: symbol.signatureHash,
      ownershipRegionId: region.id,
      ownershipKey: region.key,
      ownershipRegionKind: region.regionKind,
      readiness
    });
  }
  for (const [regionIndex, region] of importedOwnershipRegions.entries()) {
    regions.push(normalizeImportedOwnershipRegion(imported, region, regionIndex, options));
  }
  const ownershipRegions = uniqueRecordsById(regions);
  const regionTaxonomy = summarizeSemanticImportRegionTaxonomy(ownershipRegions);
  const patchHints = ownershipRegions.map((region) => semanticPatchHintForRegion(region, readiness, options));
  const sourcePath = imported?.sourcePath ?? imported?.nativeSource?.sourcePath ?? nativeAst?.sourcePath;
  const qualityRecord = semanticImportSidecarQualityRecord({
    expected: options.expected === true || options.semanticImportExpected === true,
    expectedEmpty: options.expectedEmpty === true || options.semanticImportExpectedEmpty === true,
    importCount: 1,
    symbolCount: symbols.length,
    sourcePaths: [sourcePath]
  });
  return {
    id: imported?.id ?? `import_${index + 1}`,
    language: imported?.language,
    sourcePath,
    sourceHash: imported?.nativeSource?.sourceHash ?? nativeAst?.sourceHash ?? imported?.sourceHash,
    parser: imported?.nativeAst?.parser ?? nativeAst?.parser,
    nativeSourceId: imported?.nativeSource?.id,
    nativeAstId: nativeAst?.id,
    semanticIndexId: semanticIndex?.id,
    universalAstId: imported?.universalAst?.id,
    symbolCount: symbols.length,
    sourceMapCount: sourceMaps.length,
    sourceMapMappingCount: sourceMapMappings.length,
    sourcePreservationRecordCount: sourcePreservationRecords.length,
    sourcePreservationLevels: uniqueStrings(sourcePreservationRecords.map((record) => record.level).filter(Boolean)),
    universalAstLayerCount: universalAstLayers.total,
    universalAstLayerNames: universalAstLayers.names,
    universalAstLayerIds: universalAstLayers.ids,
    proofSpec,
    paradigmSemantics,
    dependencyRelationCount: dependencies.total,
    dependencyPredicates: dependencies.predicates,
    semanticFactCount: semanticFacts.length,
    semanticFactPredicates: factSummary.predicates,
    semanticFactSummary: factSummary.byPredicate,
    patchHintCount: patchHints.length,
    patchHintOperations: uniqueStrings(patchHints.map((hint) => hint.operation).filter(Boolean)),
    patchHints,
    readiness,
    emptySemanticIndex: symbols.length === 0,
    qualityRecord,
    regionTaxonomy,
    symbols,
    ownershipRegions
  };
}

function semanticImportSidecarQualityRecord(input = {}) {
  const expected = input.expected === true;
  const expectedEmpty = input.expectedEmpty === true || input.semanticImportExpectedEmpty === true;
  const importCount = Number(input.importCount ?? 0);
  const symbolCount = Number(input.symbolCount ?? 0);
  const sourcePaths = uniqueStrings(input.sourcePaths ?? []);
  if (importCount === 0) {
    return {
      classification: 'missing',
      reasonCode: expected || expectedEmpty ? 'expected-semantic-import-missing' : 'missing-imports',
      message: 'Semantic import produced no selected import records.',
      action: 'check-semantic-import-include-globs-and-workspace-paths',
      sourcePaths
    };
  }
  if (symbolCount === 0 && expectedEmpty) {
    return {
      classification: 'expected-empty',
      reasonCode: 'semantic-import-expected-empty',
      message: 'Semantic import was expected to produce no semantic symbols for this source set.',
      action: 'skip-expected-empty',
      sourcePaths
    };
  }
  if (symbolCount === 0) {
    return {
      classification: 'unexpectedly-empty',
      reasonCode: expected ? 'expected-semantic-import-empty' : 'empty-semantic-index',
      message: 'Semantic import selected sources but produced zero semantic symbols.',
      action: 'rerun-importer-with-semantic-source-selection',
      sourcePaths
    };
  }
  return {
    classification: 'useful',
    reasonCode: 'semantic-import-useful',
    message: 'Semantic import produced semantic symbols for merge review.',
    action: 'use-semantic-import-evidence',
    sourcePaths
  };
}

function semanticSymbolsForImport(imported, semanticIndex) {
  if (Array.isArray(semanticIndex?.symbols)) return semanticIndex.symbols;
  for (const symbols of [
    imported?.semanticSymbols,
    imported?.symbols,
    imported?.metadata?.semanticSymbols,
    imported?.metadata?.symbols
  ]) {
    if (Array.isArray(symbols)) return symbols;
  }
  return [];
}

function semanticOwnershipRegionsForImport(imported) {
  return [
    ...(Array.isArray(imported?.ownershipRegions) ? imported.ownershipRegions : []),
    ...(Array.isArray(imported?.semanticOwnershipRegions) ? imported.semanticOwnershipRegions : []),
    ...(Array.isArray(imported?.semanticIndex?.ownershipRegions) ? imported.semanticIndex.ownershipRegions : []),
    ...(Array.isArray(imported?.universalAst?.ownershipRegions) ? imported.universalAst.ownershipRegions : []),
    ...(Array.isArray(imported?.metadata?.ownershipRegions) ? imported.metadata.ownershipRegions : [])
  ].filter((region) => region && typeof region === 'object');
}

function semanticOwnershipRegionForImportedSymbol(regions, symbol, generatedRegion) {
  const metadata = symbol?.metadata ?? {};
  return regions.find((region) => metadata.ownershipRegionId && region.id === metadata.ownershipRegionId)
    ?? regions.find((region) => metadata.ownershipRegionKey && region.key === metadata.ownershipRegionKey)
    ?? regions.find((region) => generatedRegion.id && region.id === generatedRegion.id)
    ?? regions.find((region) => generatedRegion.key && region.key === generatedRegion.key)
    ?? regions.find((region) => symbol.id && region.symbolId === symbol.id)
    ?? regions.find((region) => symbol.name && region.symbolName === symbol.name && region.sourcePath === generatedRegion.sourcePath);
}

function normalizeImportedOwnershipRegion(imported, region, index, options) {
  const symbol = {
    id: region.symbolId ?? region.id ?? region.key ?? `ownership_region_${index + 1}`,
    name: region.symbolName ?? region.name ?? region.key ?? region.id,
    kind: region.symbolKind,
    language: region.language ?? imported?.language,
    nativeAstNodeId: region.nativeAstNodeId,
    definitionSpan: region.sourceSpan,
    metadata: {
      ownershipRegionId: region.id,
      ownershipRegionKey: region.key,
      ownershipRegionKind: region.regionKind
    }
  };
  return mergeSemanticOwnershipRegion(
    semanticOwnershipRegionForSymbol(imported, symbol, undefined, undefined, options),
    region
  );
}

function mergeSemanticOwnershipRegion(generatedRegion, importedRegion) {
  if (!importedRegion) return generatedRegion;
  return {
    ...generatedRegion,
    ...importedRegion,
    id: importedRegion.id ?? generatedRegion.id,
    key: importedRegion.key ?? generatedRegion.key,
    regionKind: importedRegion.regionKind ?? generatedRegion.regionKind,
    granularity: importedRegion.granularity ?? generatedRegion.granularity,
    language: importedRegion.language ?? generatedRegion.language,
    sourcePath: importedRegion.sourcePath ?? generatedRegion.sourcePath,
    sourceHash: importedRegion.sourceHash ?? generatedRegion.sourceHash,
    symbolId: importedRegion.symbolId ?? generatedRegion.symbolId,
    symbolName: importedRegion.symbolName ?? generatedRegion.symbolName,
    symbolKind: importedRegion.symbolKind ?? generatedRegion.symbolKind,
    nativeAstNodeId: importedRegion.nativeAstNodeId ?? generatedRegion.nativeAstNodeId,
    sourceSpan: importedRegion.sourceSpan ?? generatedRegion.sourceSpan,
    precision: importedRegion.precision ?? generatedRegion.precision,
    mergePolicy: importedRegion.mergePolicy ?? generatedRegion.mergePolicy,
    metadata: {
      ...generatedRegion.metadata,
      ...importedRegion.metadata,
      semanticRegionTaxonomy: true
    }
  };
}

function semanticImportEntryReadiness(imported) {
  const readiness = imported?.metadata?.semanticMergeReadiness
    ?? imported?.metadata?.nativeImportLossSummary?.semanticMergeReadiness
    ?? imported?.readiness?.semanticMergeReadiness
    ?? imported?.readiness?.readiness
    ?? (typeof imported?.readiness === 'string' ? imported.readiness : undefined)
    ?? imported?.mergeCandidates?.[0]?.readiness;
  return readiness ?? 'needs-review';
}

function summarizeSemanticFacts(facts) {
  const byPredicate = {};
  for (const fact of facts ?? []) {
    const predicate = String(fact?.predicate ?? '').trim();
    if (!predicate) continue;
    byPredicate[predicate] = (byPredicate[predicate] ?? 0) + 1;
  }
  return { byPredicate, predicates: Object.keys(byPredicate).sort() };
}

export { semanticImportSidecarEntry, semanticImportSidecarQualityRecord };
