import{adapterDiagnosticToLoss}from'./adapterDiagnosticToLoss.js';import{createAstNormalizationContext}from'./createAstNormalizationContext.js';import{mergeNativeLosses}from'./mergeNativeLosses.js';import{semanticIndexFromNativeDeclarations}from'./semanticIndexFromNativeDeclarations.js';import{truncatedAstLoss}from'./truncatedAstLoss.js';import{visitPythonAstNode}from'./visitPythonAstNode.js';
export function createNativeImportFromPythonAst(root, input, options) {
  const context = createAstNormalizationContext(input, options);
  visitPythonAstNode(root, context, 'root');
  if (context.truncated) {
    context.losses.push(truncatedAstLoss(input, context, options));
  }
  const semantic = semanticIndexFromNativeDeclarations(context.declarations, input, options);
  return {
    rootId: context.rootId,
    nodes: context.nodes,
    semanticIndex: semantic.semanticIndex,
    mappings: semantic.mappings,
    losses: mergeNativeLosses(context.losses, options.diagnostics?.map((diagnostic, index) => adapterDiagnosticToLoss(diagnostic, index, {
      id: input.adapterId,
      version: input.adapterVersion
    }, input)) ?? []),
    evidence: semantic.evidence,
    diagnostics: options.diagnostics,
    metadata: {
      astFormat: options.astFormat,
      parser: options.parser,
      pythonVersion: options.pythonVersion,
      includeAttributes: Boolean(options.includeAttributes),
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      truncated: context.truncated
    }
  };
}
