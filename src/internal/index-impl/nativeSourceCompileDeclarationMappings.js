import{idFragment,reserveUniqueId}from'../../native-import-utils.js';import{lossIdsForNativeNode}from'../../native-source-maps.js';
import{nativeSourceCompileDeclarationGeneratedSpan}from'./nativeSourceCompileDeclarationGeneratedSpan.js';
export function nativeSourceCompileDeclarationMappings(input) {
  const usedIds = new Set();
  return (input.projection.declarations ?? []).map((declaration, index) => {
    const generated = nativeSourceCompileDeclarationGeneratedSpan(input, declaration);
    return {
      id: reserveUniqueId(`compile_map_${idFragment(declaration.symbolId ?? declaration.nativeAstNodeId ?? declaration.name ?? index + 1)}`, usedIds),
      nativeSourceId: input.importResult.nativeSource?.id,
      nativeAstNodeId: declaration.nativeAstNodeId,
      semanticSymbolId: declaration.symbolId,
      sourceSpan: declaration.sourceSpan,
      generatedSpan: generated.span,
      target: input.target,
      generatedName: generated.name,
      evidenceIds: (input.evidence ?? []).map((record) => record.id).filter(Boolean),
      lossIds: lossIdsForNativeNode(input.losses ?? [], declaration.nativeAstNodeId),
      ownershipRegionId: declaration.ownershipRegionId,
      ownershipRegionKey: declaration.metadata?.ownershipRegionKey,
      ownershipRegionKind: declaration.metadata?.ownershipRegionKind,
      precision: generated.exactName ? 'declaration' : 'estimated',
      preservation: generated.exactName ? 'declaration' : 'estimated',
      metadata: {
        ...declaration.metadata,
        compileResultId: input.compileResultId,
        declarationKind: declaration.kind,
        sourceMapOrigin: input.outputMode === 'target-adapter' ? 'target-adapter-fallback' : 'declaration-stub'
      }
    };
  });
}
