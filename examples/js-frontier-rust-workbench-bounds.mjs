export function conversionBounds(sourceLanguage, targetLanguage) {
  const targetDisplay = String(targetLanguage).replace('/', ' and ');
  return {
    sourceLanguage,
    targetLanguage,
    supportedNow: [
      'Top-level imports, functions, classes, types, constants, and simple ownership regions.',
      'Frontier universal AST envelopes, semantic indexes, source maps, losses, and sidecar patch hints.',
      'Deterministic scaffold projection through explicit demo target adapters.',
      'Manual run submission so every conversion has a source hash and evidence record.'
    ],
    reviewRequired: [
      'Function bodies are preserved as source evidence and emitted as TODO scaffolds.',
      `Types are declaration evidence, not a full ${targetDisplay} runtime or ownership proof.`,
      'Runtime APIs such as fetch, timers, storage, DOM, Node, and npm crates need adapters.',
      'Round trips are useful for review, but not automatic semantic equivalence proofs.'
    ],
    unsupportedToday: [
      'Behavior-preserving transpilation of arbitrary TypeScript into Rust or Python.',
      'Full generic constraints, overload resolution, conditional types, macros, and ownership inference.',
      'Async control-flow lowering, exception/error model conversion, and memory ownership synthesis.',
      'Perfect comments/trivia formatting in projected target code without richer parser evidence.'
    ]
  };
}
