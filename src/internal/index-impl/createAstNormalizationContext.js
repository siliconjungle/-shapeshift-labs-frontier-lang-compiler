export function createAstNormalizationContext(input, options) {
  return {
    input,
    options,
    maxNodes: Number.isFinite(options.maxNodes) ? Math.max(1, options.maxNodes) : 5000,
    counter: 0,
    objectIds: new WeakMap(),
    nodes: {},
    declarations: [],
    losses: [],
    rootId: undefined,
    truncated: false
  };
}
