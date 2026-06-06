export function declarationSemanticCoverage() {
  return {
    level: 'declaration-index',
    declarations: true,
    symbols: true,
    references: false,
    types: false,
    controlFlow: false
  };
}
