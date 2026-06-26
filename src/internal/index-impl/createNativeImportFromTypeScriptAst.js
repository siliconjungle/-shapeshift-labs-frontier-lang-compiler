import { createAstNormalizationContext } from './createAstNormalizationContext.js';
import { semanticIndexFromNativeDeclarations } from './semanticIndexFromNativeDeclarations.js';
import {
  attachTypeScriptCompilerReferenceGraph,
  createTypeScriptCompilerReferenceGraph
} from './typeScriptCompilerReferenceGraph.js';
import { createTypeScriptSourceFilePreservation } from './typeScriptSourceFilePreservation.js';
import { truncatedAstLoss } from './truncatedAstLoss.js';
import { visitTypeScriptAstNode } from './visitTypeScriptAstNode.js';

export function createNativeImportFromTypeScriptAst(sourceFile, input, options) {
  const context = createAstNormalizationContext(input, options);
  visitTypeScriptAstNode(sourceFile, sourceFile, context, 'root', options.ts);
  if (context.truncated) {
    context.losses.push(truncatedAstLoss(input, context, options));
  }
  const semantic = semanticIndexFromNativeDeclarations(context.declarations, input, options);
  const referenceGraph = createTypeScriptCompilerReferenceGraph(
    sourceFile,
    input,
    options,
    context,
    semantic.semanticIndex
  );
  const sourcePreservation = createTypeScriptSourceFilePreservation(sourceFile, input, options);
  return {
    rootId: context.rootId,
    nodes: context.nodes,
    semanticIndex: attachTypeScriptCompilerReferenceGraph(semantic.semanticIndex, referenceGraph),
    mappings: [...semantic.mappings, ...referenceGraph.mappings],
    losses: context.losses,
    evidence: [...semantic.evidence, ...referenceGraph.evidence],
    ...(sourcePreservation ? { sourcePreservation } : {}),
    metadata: {
      astFormat: options.astFormat,
      parser: options.parser,
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      compilerReferenceGraph: referenceGraph.summary,
      ...(sourcePreservation ? {
        sourcePreservationId: sourcePreservation.id,
        sourcePreservationSummary: sourcePreservation.summary,
        parserTriviaExactness: sourcePreservation.metadata?.parserTriviaExactness
      } : {}),
      truncated: context.truncated
    }
  };
}
