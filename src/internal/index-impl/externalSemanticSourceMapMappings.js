import{idFragment}from'../../native-import-utils.js';
export function externalSemanticSourceMapMappings(semanticIndex, context) {
  const symbolsById = new Map((semanticIndex.symbols ?? []).map((symbol) => [symbol.id, symbol]));
  const evidenceIds = (context.evidence ?? []).map((record) => record.id).filter(Boolean);
  const lossIds = (context.losses ?? []).map((loss) => loss.id).filter(Boolean);
  return (semanticIndex.occurrences ?? [])
    .filter((occurrence) => occurrence.span)
    .map((occurrence, index) => {
      const symbol = symbolsById.get(occurrence.symbolId);
      return {
        id: `map_${idFragment(occurrence.id ?? `${occurrence.symbolId}_${index + 1}`)}`,
        semanticSymbolId: occurrence.symbolId,
        semanticOccurrenceId: occurrence.id,
        sourceSpan: occurrence.span,
        evidenceIds,
        lossIds,
        ownershipRegionId: symbol?.metadata?.ownershipRegionId,
        ownershipRegionKey: symbol?.metadata?.ownershipRegionKey,
        ownershipRegionKind: symbol?.metadata?.ownershipRegionKind,
        precision: occurrence.span ? 'declaration' : 'unknown',
        metadata: {
          source: 'external-semantic-index'
        }
      };
    });
}
