import{nativeAstNodes}from'./nativeAstNodes.js';
export function effectiveAdapterExactness(declared, observed) {
  if (declared.exactAst || observed.exactAst) return declared.exactness ?? 'exact-parser-ast';
  if (observed.nativeAstNodes > 0) return observed.exactness ?? 'adapter-reported-native-ast';
  return declared.exactness ?? 'unknown';
}
