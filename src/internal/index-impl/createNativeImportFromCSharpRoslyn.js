import{adapterDiagnosticToLoss}from'./adapterDiagnosticToLoss.js';import{createAstNormalizationContext}from'./createAstNormalizationContext.js';import{csharpEvidenceSummary}from'./csharpEvidenceSummary.js';import{csharpGeneratedCodeLoss}from'./csharpGeneratedCodeLoss.js';import{mergeNativeLosses}from'./mergeNativeLosses.js';import{semanticIndexFromNativeDeclarations}from'./semanticIndexFromNativeDeclarations.js';import{truncatedAstLoss}from'./truncatedAstLoss.js';import{visitCSharpRoslynNode}from'./visitCSharpRoslynNode.js';
export function createNativeImportFromCSharpRoslyn(root, input, options) {
  const context = createAstNormalizationContext(input, options);
  visitCSharpRoslynNode(root, context, 'root');
  if (context.truncated) {
    context.losses.push(truncatedAstLoss(input, context, options));
  }
  if (options.generated && !context.losses.some((loss) => loss.kind === 'generatedCode')) {
    context.losses.push(csharpGeneratedCodeLoss(input, context.rootId, undefined, options));
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
      csharpVersion: options.csharpVersion,
      languageVersion: options.languageVersion,
      nullableContext: options.nullableContext,
      generated: options.generated,
      projectReferences: csharpEvidenceSummary(options.projectReferences),
      analyzerDiagnostics: csharpEvidenceSummary(options.analyzerDiagnostics),
      semanticModelEvidence: csharpEvidenceSummary(options.semanticModelEvidence),
      sourceGeneratorEvidence: csharpEvidenceSummary(options.sourceGeneratorEvidence),
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      truncated: context.truncated
    }
  };
}
