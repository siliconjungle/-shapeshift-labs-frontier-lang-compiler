export function nativeChangeTouchedSymbol(symbol) {
  return {
    id: symbol.id ?? symbol.key,
    name: symbol.name,
    kind: symbol.kind,
    nativeAstNodeId: symbol.nativeAstNodeId,
    span: symbol.sourceSpan,
    conflictKey: symbol.conflictKey,
    metadata: {
      changeKind: symbol.changeKind,
      beforeSignatureHash: symbol.beforeSignatureHash,
      afterSignatureHash: symbol.afterSignatureHash,
      beforeSpanHash: symbol.beforeSpanHash,
      afterSpanHash: symbol.afterSpanHash,
      beforeNativeAstNodeId: symbol.beforeNativeAstNodeId,
      afterNativeAstNodeId: symbol.afterNativeAstNodeId,
      ownershipRegionId: symbol.ownershipRegionId,
      ownershipRegionKind: symbol.ownershipRegionKind
    }
  };
}
