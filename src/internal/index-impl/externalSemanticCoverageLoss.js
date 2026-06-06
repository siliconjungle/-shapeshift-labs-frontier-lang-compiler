import{idFragment}from'../../native-import-utils.js';
export function externalSemanticCoverageLoss(context) {
  return {
    id: `loss_${context.idPart}_${idFragment(context.format)}_partial_semantic_index`,
    severity: 'info',
    phase: 'index',
    sourceFormat: context.format,
    kind: 'partialSemanticIndex',
    message: `${context.format} payload imported symbols, occurrences, and facts as external semantic evidence; full parser AST, comments, trivia, and executable semantics still require a native parser adapter.`,
    semanticIndexId: context.semanticIndexId,
    metadata: {
      format: context.format,
      parser: context.parser,
      source: 'external-semantic-index'
    }
  };
}
