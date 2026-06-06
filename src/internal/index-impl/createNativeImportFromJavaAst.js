import{adapterDiagnosticToLoss}from'./adapterDiagnosticToLoss.js';import{createAstNormalizationContext}from'./createAstNormalizationContext.js';import{javaAnnotationProcessingSummary}from'./javaAnnotationProcessingSummary.js';import{javaBindingEvidenceSummary}from'./javaBindingEvidenceSummary.js';import{javaGeneratedCodeLoss}from'./javaGeneratedCodeLoss.js';import{javaPathEvidenceSummary}from'./javaPathEvidenceSummary.js';import{mergeNativeLosses}from'./mergeNativeLosses.js';import{semanticIndexFromNativeDeclarations}from'./semanticIndexFromNativeDeclarations.js';import{truncatedAstLoss}from'./truncatedAstLoss.js';import{visitJavaAstNode}from'./visitJavaAstNode.js';
export function createNativeImportFromJavaAst(root, input, options) {
  const context = createAstNormalizationContext(input, options);
  visitJavaAstNode(root, context, 'root');
  if (context.truncated) {
    context.losses.push(truncatedAstLoss(input, context, options));
  }
  if (options.generated && !context.losses.some((loss) => loss.kind === 'generatedCode')) {
    context.losses.push(javaGeneratedCodeLoss(input, context.rootId, undefined, options));
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
      javaVersion: options.javaVersion,
      sourceLevel: options.sourceLevel,
      classPathEvidence: javaPathEvidenceSummary(options.classPath),
      modulePathEvidence: javaPathEvidenceSummary(options.modulePath),
      annotationProcessing: javaAnnotationProcessingSummary(options.annotationProcessing),
      bindingEvidence: javaBindingEvidenceSummary(options.bindingEvidence),
      generated: options.generated,
      includeAnnotations: Boolean(options.includeAnnotations),
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      truncated: context.truncated
    }
  };
}
