import{nativeProjectionDeclarationKind}from'./nativeProjectionDeclarationKind.js';import{nativeProjectionImportOnlySymbol}from'./nativeProjectionImportOnlySymbol.js';import{nativeProjectionKindForNode}from'./nativeProjectionKindForNode.js';import{uniqueNativeProjectionDeclarations}from'./uniqueNativeProjectionDeclarations.js';
export function nativeProjectionDeclarations(importResult, context) {
  const semanticIndex = context.semanticIndex;
  const occurrencesBySymbol = new Map();
  for (const occurrence of semanticIndex?.occurrences ?? []) {
    const list = occurrencesBySymbol.get(occurrence.symbolId) ?? [];
    list.push(occurrence);
    occurrencesBySymbol.set(occurrence.symbolId, list);
  }
  const declarations = (semanticIndex?.symbols ?? [])
    .filter((symbol) => !nativeProjectionImportOnlySymbol(symbol, occurrencesBySymbol.get(symbol.id)))
    .map((symbol) => {
      const occurrence = occurrencesBySymbol.get(symbol.id)?.find((item) => item.role !== 'import');
      const mapping = (importResult.sourceMaps ?? importResult.universalAst?.sourceMaps ?? [])
        .flatMap((sourceMap) => sourceMap.mappings ?? [])
        .find((item) => item.semanticSymbolId === symbol.id);
      return {
        name: symbol.name,
        kind: nativeProjectionDeclarationKind(symbol.kind),
        symbolId: symbol.id,
        nativeAstNodeId: symbol.nativeAstNodeId ?? occurrence?.nativeAstNodeId,
        sourceSpan: symbol.definitionSpan ?? occurrence?.span ?? mapping?.sourceSpan,
        ownershipRegionId: mapping?.ownershipRegionId ?? symbol.metadata?.ownershipRegionId,
        metadata: {
          semanticKind: symbol.kind,
          language: symbol.language,
          signatureHash: symbol.signatureHash
        }
      };
    })
    .filter((declaration) => declaration.name);
  if (declarations.length) return uniqueNativeProjectionDeclarations(declarations);
  return uniqueNativeProjectionDeclarations(Object.values(context.nativeAst?.nodes ?? {})
    .map((node) => {
      const name = typeof node.value === 'string' && node.value.trim() ? node.value.trim() : node.fields?.name;
      const kind = nativeProjectionKindForNode(node);
      if (!name || !kind) return undefined;
      return {
        name,
        kind,
        nativeAstNodeId: node.id,
        sourceSpan: node.span,
        ownershipRegionId: node.metadata?.ownershipRegionId,
        metadata: { nativeKind: node.kind, language: context.language }
      };
    })
    .filter(Boolean));
}
