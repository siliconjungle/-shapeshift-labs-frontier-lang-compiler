import{adapterDiagnosticToLoss}from'./adapterDiagnosticToLoss.js';import{createAstNormalizationContext}from'./createAstNormalizationContext.js';import{mergeNativeLosses}from'./mergeNativeLosses.js';import{semanticIndexFromNativeDeclarations}from'./semanticIndexFromNativeDeclarations.js';import{swiftEvidenceSummary}from'./swiftEvidenceSummary.js';import{swiftGeneratedCodeLoss}from'./swiftGeneratedCodeLoss.js';import{truncatedAstLoss}from'./truncatedAstLoss.js';import{visitSwiftSyntaxNode}from'./visitSwiftSyntaxNode.js';
export function createNativeImportFromSwiftSyntax(root, input, options) {
  const context = createAstNormalizationContext(input, options);
  visitSwiftSyntaxNode(root, context, 'root');
  if (context.truncated) {
    context.losses.push(truncatedAstLoss(input, context, options));
  }
  if (options.generated && !context.losses.some((loss) => loss.kind === 'generatedCode')) {
    context.losses.push(swiftGeneratedCodeLoss(input, context.rootId, undefined, options));
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
      swiftVersion: options.swiftVersion,
      languageMode: options.languageMode,
      generated: options.generated,
      sourceKitEvidence: swiftEvidenceSummary(options.sourceKitEvidence),
      macroExpansionEvidence: swiftEvidenceSummary(options.macroExpansionEvidence),
      packageResolutionEvidence: swiftEvidenceSummary(options.packageResolutionEvidence),
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      truncated: context.truncated
    }
  };
}
