import{adapterDiagnosticToLoss}from'./adapterDiagnosticToLoss.js';import{clangPreprocessorRecords}from'./clangPreprocessorRecords.js';import{createAstNormalizationContext}from'./createAstNormalizationContext.js';import{mergeNativeLosses}from'./mergeNativeLosses.js';import{semanticIndexFromNativeDeclarations}from'./semanticIndexFromNativeDeclarations.js';import{serializableIncludeGraphSummary}from'./serializableIncludeGraphSummary.js';import{truncatedAstLoss}from'./truncatedAstLoss.js';import{visitClangAstNode}from'./visitClangAstNode.js';
export function createNativeImportFromClangAst(root, input, options) {
  const context = createAstNormalizationContext(input, options);
  visitClangAstNode(root, context, 'root');
  for (const [index, record] of clangPreprocessorRecords(options.preprocessorRecords).entries()) {
    visitClangAstNode(record, context, `preprocessorRecords[${index}]`);
  }
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
      cStandard: options.cStandard,
      compileFlags: Array.isArray(options.compileFlags) ? options.compileFlags.slice() : options.compileFlags,
      includeSystemHeaders: Boolean(options.includeSystemHeaders),
      preprocessorRecordCount: clangPreprocessorRecords(options.preprocessorRecords).length,
      includeGraph: serializableIncludeGraphSummary(options.includeGraph),
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      truncated: context.truncated
    }
  };
}
