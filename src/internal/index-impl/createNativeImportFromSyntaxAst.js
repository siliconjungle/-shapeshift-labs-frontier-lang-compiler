import { adapterDiagnosticToLoss } from './adapterDiagnosticToLoss.js';
import { createAstNormalizationContext } from './createAstNormalizationContext.js';
import { mergeNativeLosses } from './mergeNativeLosses.js';
import { missingInjectedParserResult } from './missingInjectedParserResult.js';
import { normalizeSyntaxAstRoot } from './normalizeSyntaxAstRoot.js';
import { semanticIndexFromNativeDeclarations } from './semanticIndexFromNativeDeclarations.js';
import { createSyntaxAstSourcePreservation } from './syntaxAstSourcePreservation.js';
import { truncatedAstLoss } from './truncatedAstLoss.js';
import { visitSyntaxAstNode } from './visitSyntaxAstNode.js';

export function createNativeImportFromSyntaxAst(ast, input, options) {
  const root = normalizeSyntaxAstRoot(ast, options.astFormat);
  if (!root) {
    return missingInjectedParserResult(input, {
      parser: options.parser,
      adapterId: input.adapterId,
      message: 'Injected AST did not contain an object root node.'
    });
  }
  const context = createAstNormalizationContext(input, options);
  visitSyntaxAstNode(root, context, 'root');
  if (context.truncated) {
    context.losses.push(truncatedAstLoss(input, context, options));
  }
  const semantic = semanticIndexFromNativeDeclarations(context.declarations, input, options);
  const sourcePreservation = createSyntaxAstSourcePreservation(ast, input, options);
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
    ...(sourcePreservation ? { sourcePreservation } : {}),
    metadata: {
      astFormat: options.astFormat,
      parser: options.parser,
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      ...(sourcePreservation ? {
        sourcePreservationId: sourcePreservation.id,
        sourcePreservationSummary: sourcePreservation.summary,
        parserTriviaExactness: sourcePreservation.metadata?.parserTriviaExactness
      } : {}),
      truncated: context.truncated
    }
  };
}
