import{createAstNormalizationContext}from'./createAstNormalizationContext.js';import{semanticIndexFromNativeDeclarations}from'./semanticIndexFromNativeDeclarations.js';import{truncatedAstLoss}from'./truncatedAstLoss.js';import{visitTypeScriptAstNode}from'./visitTypeScriptAstNode.js';
export function createNativeImportFromTypeScriptAst(sourceFile, input, options) {
  const context = createAstNormalizationContext(input, options);
  visitTypeScriptAstNode(sourceFile, sourceFile, context, 'root', options.ts);
  if (context.truncated) {
    context.losses.push(truncatedAstLoss(input, context, options));
  }
  const semantic = semanticIndexFromNativeDeclarations(context.declarations, input, options);
  return {
    rootId: context.rootId,
    nodes: context.nodes,
    semanticIndex: semantic.semanticIndex,
    mappings: semantic.mappings,
    losses: context.losses,
    evidence: semantic.evidence,
    metadata: {
      astFormat: options.astFormat,
      parser: options.parser,
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      truncated: context.truncated
    }
  };
}
