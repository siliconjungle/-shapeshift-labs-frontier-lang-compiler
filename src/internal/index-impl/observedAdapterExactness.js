import{nativeAstNodes}from'./nativeAstNodes.js';
export function observedAdapterExactness(declared = {}, nativeAstNodes = 0) {
  if (!nativeAstNodes) return 'unknown';
  if (declared.exactAst) return declared.exactness ?? 'exact-parser-ast';
  return 'adapter-reported-native-ast';
}
