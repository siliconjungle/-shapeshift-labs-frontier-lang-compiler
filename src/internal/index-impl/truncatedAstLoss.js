import{idFragment}from'../../native-import-utils.js';
export function truncatedAstLoss(input, context, options) {
  return {
    id: `loss_${idFragment(input.sourcePath ?? input.language)}_${idFragment(options.astFormat ?? options.parser)}_truncated`,
    severity: 'warning',
    phase: 'read',
    sourceFormat: input.language,
    kind: 'opaqueNative',
    message: `Native AST normalization stopped after ${context.maxNodes} node(s).`,
    metadata: {
      parser: options.parser,
      astFormat: options.astFormat,
      maxNodes: context.maxNodes
    }
  };
}
