import{adapterDiagnosticToLoss}from'./adapterDiagnosticToLoss.js';import{createAstNormalizationContext}from'./createAstNormalizationContext.js';import{goTypeEvidenceSummary}from'./goTypeEvidenceSummary.js';import{mergeNativeLosses}from'./mergeNativeLosses.js';import{semanticIndexFromNativeDeclarations}from'./semanticIndexFromNativeDeclarations.js';import{truncatedAstLoss}from'./truncatedAstLoss.js';import{visitGoAstNode}from'./visitGoAstNode.js';
export function createNativeImportFromGoAst(root, input, options) {
  const context = createAstNormalizationContext(input, options);
  visitGoAstNode(root, context, 'root');
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
      goVersion: options.goVersion,
      packageName: options.packageName,
      includeComments: Boolean(options.includeComments),
      buildTags: Array.isArray(options.buildTags) ? options.buildTags.slice() : options.buildTags,
      generated: options.generated,
      fileSetEvidence: Boolean(options.fileSet),
      typeEvidence: goTypeEvidenceSummary(options.typeEvidence),
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      truncated: context.truncated
    }
  };
}
