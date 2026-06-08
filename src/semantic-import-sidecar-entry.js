import { uniqueRecordsById, uniqueStrings } from './native-import-utils.js';
import { summarizeSemanticImportDependencyRelations } from './semantic-import-dependencies.js';
import { semanticOwnershipRegionForSymbol, summarizeSemanticImportRegionTaxonomy } from './semantic-import-regions.js';
import { collectKernelSourcePreservationFromImport } from './semantic-import-source-preservation.js';
import {
  summarizeParadigmSemanticsLayer,
  summarizeProofSpecLayer,
  summarizeUniversalAstLayers
} from './semantic-import-layers.js';

function semanticImportSidecarEntry(imported, index, options) {
  const semanticIndex = imported?.semanticIndex ?? imported?.universalAst?.semanticIndex;
  const nativeAst = imported?.nativeAst ?? imported?.nativeSource?.ast;
  const semanticFacts = semanticIndex?.facts ?? [];
  const sourceMaps = imported?.sourceMaps ?? imported?.universalAst?.sourceMaps ?? [];
  const sourceMapMappings = sourceMaps.flatMap((sourceMap) => sourceMap?.mappings ?? []);
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
  for (const symbol of semanticIndex?.symbols ?? []) {
    const mapping = mappingsBySymbolId.get(symbol.id);
    const nativeNode = symbol.nativeAstNodeId ? nativeAst?.nodes?.[symbol.nativeAstNodeId] : undefined;
    const region = semanticOwnershipRegionForSymbol(imported, symbol, mapping, nativeNode, options);
    regions.push(region);
    symbols.push({
      id: symbol.id,
      name: symbol.name,
      kind: symbol.kind,
      language: symbol.language ?? imported?.language,
      nativeAstNodeId: symbol.nativeAstNodeId,
      semanticOccurrenceId: mapping?.semanticOccurrenceId,
      sourceMapMappingId: mapping?.id,
      sourceSpan: mapping?.sourceSpan ?? symbol.definitionSpan ?? nativeNode?.span,
      signatureHash: symbol.signatureHash,
      ownershipRegionId: region.id,
      ownershipKey: region.key,
      ownershipRegionKind: region.regionKind,
      readiness
    });
  }
  const ownershipRegions = uniqueRecordsById(regions);
  const regionTaxonomy = summarizeSemanticImportRegionTaxonomy(ownershipRegions);
  return {
    id: imported?.id ?? `import_${index + 1}`,
    language: imported?.language,
    sourcePath: imported?.sourcePath ?? imported?.nativeSource?.sourcePath ?? nativeAst?.sourcePath,
    sourceHash: imported?.nativeSource?.sourceHash ?? nativeAst?.sourceHash,
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
    readiness,
    emptySemanticIndex: symbols.length === 0,
    regionTaxonomy,
    symbols,
    ownershipRegions
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

export { semanticImportSidecarEntry };
