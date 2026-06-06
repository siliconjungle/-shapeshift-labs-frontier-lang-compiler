import{semanticSliceSymbolSpan}from'./semanticSliceSymbolSpan.js';
export function semanticSliceTouchedSymbol(symbol) {
  return {
    id: symbol.id,
    name: symbol.name,
    kind: symbol.kind,
    nativeAstNodeId: symbol.nativeAstNodeId,
    span: semanticSliceSymbolSpan(symbol),
    conflictKey: symbol.metadata?.ownershipRegionKey ? `region:${symbol.metadata.ownershipRegionKey}` : `symbol:${symbol.id}`,
    metadata: {
      ownershipRegionId: symbol.ownershipRegionId ?? symbol.metadata?.ownershipRegionId,
      ownershipRegionKind: symbol.ownershipRegionKind ?? symbol.metadata?.ownershipRegionKind,
      signatureHash: symbol.signatureHash
    }
  };
}
