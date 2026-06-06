import{adapterDiagnosticToLoss}from'./adapterDiagnosticToLoss.js';import{createAstNormalizationContext}from'./createAstNormalizationContext.js';import{kotlinEvidenceSummary}from'./kotlinEvidenceSummary.js';import{kotlinGeneratedCodeLoss}from'./kotlinGeneratedCodeLoss.js';import{kotlinScriptLoss}from'./kotlinScriptLoss.js';import{mergeNativeLosses}from'./mergeNativeLosses.js';import{semanticIndexFromNativeDeclarations}from'./semanticIndexFromNativeDeclarations.js';import{truncatedAstLoss}from'./truncatedAstLoss.js';import{visitKotlinPsiNode}from'./visitKotlinPsiNode.js';
export function createNativeImportFromKotlinPsi(root, input, options) {
  const context = createAstNormalizationContext(input, options);
  visitKotlinPsiNode(root, context, 'root');
  if (context.truncated) {
    context.losses.push(truncatedAstLoss(input, context, options));
  }
  if (options.generated && !context.losses.some((loss) => loss.kind === 'generatedCode')) {
    context.losses.push(kotlinGeneratedCodeLoss(input, context.rootId, undefined, options));
  }
  if (options.script && !context.losses.some((loss) => loss.metadata?.script === true)) {
    context.losses.push(kotlinScriptLoss(input, context.rootId, undefined, options));
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
      kotlinVersion: options.kotlinVersion,
      languageVersion: options.languageVersion,
      apiVersion: options.apiVersion,
      script: Boolean(options.script),
      generated: options.generated,
      analysisApiEvidence: kotlinEvidenceSummary(options.analysisApiEvidence),
      firEvidence: kotlinEvidenceSummary(options.firEvidence),
      compilerPluginEvidence: kotlinEvidenceSummary(options.compilerPluginEvidence),
      kspEvidence: kotlinEvidenceSummary(options.kspEvidence),
      kaptEvidence: kotlinEvidenceSummary(options.kaptEvidence),
      multiplatformEvidence: kotlinEvidenceSummary(options.multiplatformEvidence),
      buildVariantEvidence: kotlinEvidenceSummary(options.buildVariantEvidence),
      includeAnnotations: Boolean(options.includeAnnotations),
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      truncated: context.truncated
    }
  };
}
