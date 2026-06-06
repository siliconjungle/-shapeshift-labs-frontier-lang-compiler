export function unverifiedNativeAstLosses(input, nativeAst, context) {
  if (context.lightweight || context.exactAst || context.hasLosses) return [];
  if (!(input?.nativeAst || input?.nodes)) return [];
  return [{
    id: `loss_${context.importIdPart}_unverified_native_ast`,
    severity: 'warning',
    kind: 'unverifiedNativeAst',
    nodeId: nativeAst?.rootId,
    message: 'Caller supplied native AST nodes without explicit exactAst or adapter coverage evidence.',
    metadata: {
      reason: 'missing-exact-ast-evidence',
      nativeAstId: nativeAst?.id,
      parser: nativeAst?.parser
    }
  }];
}
