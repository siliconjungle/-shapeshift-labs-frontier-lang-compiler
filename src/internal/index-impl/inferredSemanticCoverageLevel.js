export function inferredSemanticCoverageLevel(input) {
  if (input.references || input.types || input.controlFlow) return 'semantic-index';
  if (input.declarations || input.symbols) return 'declaration-index';
  return 'native-ast';
}
