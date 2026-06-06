export function inferredAdapterExactness(exactAst, capabilities) {
  if (exactAst) return 'exact-parser-ast';
  if (capabilities.has('nativeast')) return 'adapter-reported-native-ast';
  return 'loss-aware-native-ast';
}
