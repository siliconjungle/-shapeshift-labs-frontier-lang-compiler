import{idFragment}from'../../native-import-utils.js';
import{createAstNormalizationContext}from'./createAstNormalizationContext.js';import{semanticIndexFromNativeDeclarations}from'./semanticIndexFromNativeDeclarations.js';import{truncatedAstLoss}from'./truncatedAstLoss.js';import{visitTreeSitterNode}from'./visitTreeSitterNode.js';
export function createNativeImportFromTreeSitter(root, input, options) {
  const context = createAstNormalizationContext(input, options);
  visitTreeSitterNode(root, context, 'root');
  if (context.truncated) {
    context.losses.push(truncatedAstLoss(input, context, options));
  }
  const semantic = semanticIndexFromNativeDeclarations(context.declarations, input, options);
  const semanticSymbols = semantic.semanticIndex?.symbols?.length ?? 0;
  const declarationMappings = semantic.mappings.length;
  const syntaxEvidence = treeSitterCstEvidence(context, input, options, { semanticSymbols, declarationMappings });
  const syntaxBoundaryLosses = semanticSymbols > 0 && declarationMappings > 0 ? [] : [treeSitterSyntaxOnlyLoss(context, input, options, syntaxEvidence)];
  const losses = [...context.losses, ...syntaxBoundaryLosses];
  const nativeSyntaxEvidence = syntaxEvidence.metadata.nativeSyntaxEvidence;
  return {
    rootId: context.rootId,
    nodes: context.nodes,
    semanticIndex: semantic.semanticIndex,
    ...(semantic.mappings.length ? { mappings: semantic.mappings } : {}),
    losses,
    evidence: [syntaxEvidence, ...semantic.evidence],
    metadata: {
      astFormat: options.astFormat,
      parser: options.parser,
      nativeSyntaxEvidence,
      parserMetadata: nativeSyntaxEvidence.parser,
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      declarationSourceMapMappings: declarationMappings,
      truncated: context.truncated
    },
    nativeAstMetadata: {
      nativeSyntaxEvidence,
      semanticExactnessRequires: nativeSyntaxEvidence.semantic.requiredEvidence
    },
    nativeSourceMetadata: {
      nativeSyntaxEvidence
    },
    universalAstMetadata: {
      nativeSyntaxEvidence
    }
  };
}

function treeSitterCstEvidence(context, input, options, semantic) {
  const cstSummary = context.treeSitterCstSummary ?? {
    totalNodes: Object.keys(context.nodes).length,
    namedNodes: 0,
    anonymousNodes: 0,
    missingNodes: 0,
    errorNodes: 0,
    containingErrorNodes: 0,
    leafNodes: 0,
    maxDepth: 0,
    kinds: {}
  };
  const importIdPart = idFragment(input.sourcePath ?? input.language);
  const sourcePreservationId = typeof input.sourceText === 'string'
    ? `native_source_preservation_${idFragment(input.sourcePath ?? input.language)}_${idFragment(input.sourceHash)}`
    : undefined;
  const parser = {
    name: options.parser,
    version: input.parserVersion,
    astFormat: options.astFormat,
    tolerant: true,
    mode: 'tree-sitter-tolerant-cst',
    status: cstSummary.errorNodes || cstSummary.missingNodes || cstSummary.containingErrorNodes ? 'recovered-with-errors' : 'ok',
    errors: cstSummary.errorNodes,
    missingNodes: cstSummary.missingNodes,
    containingErrorNodes: cstSummary.containingErrorNodes,
    truncated: context.truncated
  };
  const nativeSyntaxEvidence = {
    kind: 'frontier.lang.nativeSyntaxEvidence',
    version: 1,
    syntaxKind: 'tree-sitter-cst',
    astFormat: options.astFormat,
    parser: { ...parser, sourcePath: input.sourcePath, sourceHash: input.sourceHash },
    sourcePreservation: {
      sourcePath: input.sourcePath,
      sourceHash: input.sourceHash,
      sourcePreservationId,
      rootNodeId: context.rootId,
      rootSpan: context.rootId ? context.nodes[context.rootId]?.span : undefined,
      exactSourceAvailable: typeof input.sourceText === 'string'
    },
    losslessSource: Boolean(typeof input.sourceText === 'string' && !context.truncated),
    cst: { ...cstSummary, kinds: { ...cstSummary.kinds } },
    semantic: {
      symbols: semantic.semanticSymbols,
      declarationSourceMapMappings: semantic.declarationMappings,
      exactness: semantic.semanticSymbols > 0 && semantic.declarationMappings > 0 ? 'declaration-linked' : 'syntax-only',
      requiredEvidence: ['semanticSymbols', 'declarationSourceMapMappings']
    }
  };
  return {
    id: `evidence_${importIdPart}_${idFragment(options.astFormat ?? options.parser)}_cst`,
    kind: 'nativeSyntax',
    status: parser.status === 'ok' ? 'passed' : 'failed',
    path: input.sourcePath,
    summary: `Imported ${options.parser} CST evidence with ${cstSummary.totalNodes} node(s), ${semantic.semanticSymbols} symbol(s), ${cstSummary.errorNodes} parse error node(s), and ${cstSummary.missingNodes} missing node(s).`,
    metadata: { parser: options.parser, astFormat: options.astFormat, language: input.language, sourceHash: input.sourceHash, nativeSyntaxEvidence }
  };
}

function treeSitterSyntaxOnlyLoss(context, input, options, syntaxEvidence) {
  return {
    id: `loss_${idFragment(input.sourcePath ?? input.language)}_${idFragment(options.astFormat ?? options.parser)}_syntax_only`,
    severity: 'warning',
    phase: 'index',
    sourceFormat: input.language,
    kind: 'partialSemanticIndex',
    message: 'Tree-sitter CST evidence preserves native syntax but does not prove semantic exactness without declaration symbols and declaration source-map mappings.',
    nodeId: context.rootId,
    metadata: {
      reason: 'tree-sitter-cst-syntax-only',
      parser: options.parser,
      astFormat: options.astFormat,
      evidenceIds: [syntaxEvidence.id],
      requiredEvidence: ['semanticSymbols', 'declarationSourceMapMappings'],
      semantic: syntaxEvidence.metadata.nativeSyntaxEvidence.semantic
    }
  };
}
