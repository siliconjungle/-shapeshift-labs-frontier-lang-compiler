export function nativeAstNodes(nativeAst) {
  if (!nativeAst?.nodes) return [];
  return Object.values(nativeAst.nodes);
}
