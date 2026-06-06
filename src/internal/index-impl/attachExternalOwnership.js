import{idFragment}from'../../native-import-utils.js';import{semanticRegionKindForSymbol,semanticRegionMergePolicy}from'../../semantic-import-regions.js';
import{externalRelationPredicateForOccurrence}from'./externalRelationPredicateForOccurrence.js';
export function attachExternalOwnership(result, context) {
  const occurrencesBySymbol = new Map();
  for (const occurrence of result.occurrences) {
    if (!occurrencesBySymbol.has(occurrence.symbolId)) occurrencesBySymbol.set(occurrence.symbolId, []);
    occurrencesBySymbol.get(occurrence.symbolId).push(occurrence);
    result.relations.push({
      id: `rel_${idFragment(occurrence.documentId)}_${idFragment(occurrence.id)}_${idFragment(occurrence.role)}`,
      sourceId: occurrence.documentId,
      predicate: externalRelationPredicateForOccurrence(occurrence),
      targetId: occurrence.symbolId,
      metadata: {
        format: context.format,
        source: 'external-semantic-index',
        occurrenceId: occurrence.id,
        role: occurrence.role
      }
    });
  }
  result.symbols = result.symbols.map((symbol) => {
    const occurrences = occurrencesBySymbol.get(symbol.id) ?? [];
    const definition = occurrences.find((occurrence) => occurrence.role === 'definition') ?? occurrences[0];
    const sourceSpan = symbol.definitionSpan ?? definition?.span;
    const regionKind = semanticRegionKindForSymbol(symbol, undefined, undefined);
    const key = [
      'external',
      symbol.language ?? context.language ?? 'unknown',
      sourceSpan?.path ?? context.sourcePath ?? 'memory',
      regionKind,
      symbol.name ?? symbol.id
    ].join('#');
    const region = {
      id: `region_${idFragment(key)}`,
      key,
      regionKind,
      granularity: 'symbol',
      language: symbol.language ?? context.language,
      documentId: definition?.documentId,
      sourcePath: sourceSpan?.path ?? context.sourcePath,
      sourceHash: context.sourceHash,
      symbolId: symbol.id,
      symbolName: symbol.name,
      symbolKind: symbol.kind,
      sourceSpan,
      precision: sourceSpan ? 'declaration' : 'unknown',
      mergePolicy: semanticRegionMergePolicy(regionKind),
      metadata: {
        format: context.format,
        source: 'external-semantic-index'
      }
    };
    result.facts.push({
      id: `fact_${idFragment(symbol.id)}_ownership_region`,
      predicate: 'semanticOwnershipRegion',
      subjectId: symbol.id,
      value: region
    }, {
      id: `fact_${idFragment(symbol.id)}_ownership_region_taxonomy`,
      predicate: 'semanticOwnershipRegionTaxonomy',
      subjectId: symbol.id,
      value: {
        regionKind: region.regionKind,
        granularity: region.granularity,
        key: region.key
      }
    });
    return {
      ...symbol,
      definitionSpan: symbol.definitionSpan ?? definition?.span,
      metadata: {
        ...symbol.metadata,
        ownershipRegionId: symbol.metadata?.ownershipRegionId ?? region.id,
        ownershipRegionKey: symbol.metadata?.ownershipRegionKey ?? region.key,
        ownershipRegionKind: symbol.metadata?.ownershipRegionKind ?? region.regionKind
      }
    };
  });
}
