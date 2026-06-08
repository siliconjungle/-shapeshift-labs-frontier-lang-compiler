import{idFragment,uniqueRecordsById}from'../../native-import-utils.js';import{semanticRegionKindForSymbol,semanticRegionMergePolicy}from'../../semantic-import-regions.js';
import{externalRelationPredicateForOccurrence}from'./externalRelationPredicateForOccurrence.js';
export function attachExternalOwnership(result, context) {
  const occurrencesBySymbol = new Map();
  const documentsById = new Map((result.documents ?? []).map((document) => [document.id, document]));
  const ownershipRegions = [];
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
    const document = documentsById.get(definition?.documentId);
    const sourceSpan = symbol.definitionSpan ?? definition?.span;
    const regionKind = semanticRegionKindForSymbol(symbol, undefined, undefined);
    const sourcePath = sourceSpan?.path ?? document?.path ?? context.sourcePath;
    const language = symbol.language ?? document?.language ?? context.language;
    const normalizedRegionKind = symbol.metadata?.ownershipRegionKind ?? regionKind;
    const key = [
      'external',
      language ?? 'unknown',
      sourcePath ?? 'memory',
      normalizedRegionKind,
      symbol.name ?? symbol.id
    ].join('#');
    const region = {
      id: symbol.metadata?.ownershipRegionId ?? `region_${idFragment(key)}`,
      key: symbol.metadata?.ownershipRegionKey ?? key,
      regionKind: normalizedRegionKind,
      granularity: 'symbol',
      language,
      documentId: definition?.documentId,
      sourcePath,
      sourceHash: sourceSpan?.sourceId ?? document?.sourceHash ?? context.sourceHash,
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
    ownershipRegions.push(region);
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
  result.ownershipRegions = uniqueRecordsById([...(result.ownershipRegions ?? []), ...ownershipRegions]);
}
