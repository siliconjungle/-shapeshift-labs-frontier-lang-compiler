import{idFragment}from'../../native-import-utils.js';import{lightweightDependencyRelations}from'../../lightweight-dependency-relations.js';import{lightweightCoverageLosses,scanNativeDeclarations}from'../../native-region-scanner.js';import{semanticOwnershipRegionForDeclaration}from'../../semantic-import-regions.js';import{createSemanticIndexRecord,hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';
export function createLightweightNativeImport(input) {
  const parser = input.parser ?? `${input.language}.lightweight-declaration-scan`;
  const rootId = 'native_root';
  const nodes = {
    [rootId]: {
      id: rootId,
      kind: 'Program',
      languageKind: `${input.language}.program`,
      children: [],
      metadata: { parser, sourceHash: input.sourceHash }
    }
  };
  const declarations = scanNativeDeclarations(input);
  const losses = [];
  const documentId = `doc_${idFragment(input.sourcePath ?? input.language)}`;
  const symbols = [];
  const occurrences = [];
  const relations = [];
  const facts = [];
  const mappings = [];
  const evidenceId = `evidence_${idFragment(input.sourcePath ?? input.language)}_lightweight_scan`;
  const dependencies = lightweightDependencyRelations(input, declarations, documentId);

  for (const declaration of declarations) {
    const ownershipRegion = semanticOwnershipRegionForDeclaration(input, declaration, documentId);
    nodes[rootId].children.push(declaration.nodeId);
    nodes[declaration.nodeId] = {
      id: declaration.nodeId,
      kind: declaration.kind,
      languageKind: declaration.languageKind,
      span: declaration.span,
      value: declaration.name ?? declaration.importPath ?? null,
      fields: declaration.fields,
      metadata: {
        ...declaration.metadata,
        ownershipRegionId: ownershipRegion.id,
        ownershipRegionKey: ownershipRegion.key,
        ownershipRegionKind: ownershipRegion.regionKind
      }
    };
    if (declaration.symbolId) {
      const occurrenceId = `occ_${idFragment(declaration.nodeId)}_def`;
      symbols.push({
        id: declaration.symbolId,
        scheme: 'frontier',
        name: declaration.name,
        kind: declaration.symbolKind,
        language: input.language,
        nativeAstNodeId: declaration.nodeId,
        signatureHash: hashSemanticValue([input.language, declaration.kind, declaration.name, declaration.fields ?? {}]),
        definitionSpan: declaration.span,
        metadata: {
          ownershipRegionId: ownershipRegion.id,
          ownershipRegionKey: ownershipRegion.key,
          ownershipRegionKind: ownershipRegion.regionKind
        }
      });
      occurrences.push({
        id: occurrenceId,
        documentId,
        symbolId: declaration.symbolId,
        role: declaration.role ?? 'definition',
        span: declaration.span,
        nativeAstNodeId: declaration.nodeId
      });
      relations.push({
        id: `rel_${idFragment(documentId)}_${idFragment(declaration.nodeId)}`,
        sourceId: documentId,
        predicate: declaration.role === 'import' ? 'imports' : 'defines',
        targetId: declaration.symbolId
      });
      facts.push({
        id: `fact_${idFragment(declaration.nodeId)}_kind`,
        predicate: 'nativeKind',
        subjectId: declaration.symbolId,
        value: declaration.languageKind
      }, {
        id: `fact_${idFragment(declaration.nodeId)}_ownership_region`,
        predicate: 'semanticOwnershipRegion',
        subjectId: declaration.symbolId,
        value: ownershipRegion
      }, {
        id: `fact_${idFragment(declaration.nodeId)}_ownership_region_taxonomy`,
        predicate: 'semanticOwnershipRegionTaxonomy',
        subjectId: declaration.symbolId,
        value: {
          regionKind: ownershipRegion.regionKind,
          granularity: ownershipRegion.granularity,
          key: ownershipRegion.key
        }
      });
      mappings.push({
        id: `map_${idFragment(declaration.nodeId)}`,
        nativeAstNodeId: declaration.nodeId,
        semanticSymbolId: declaration.symbolId,
        semanticOccurrenceId: occurrenceId,
        sourceSpan: declaration.span,
        evidenceIds: [evidenceId],
        lossIds: declaration.loss ? [declaration.loss.id] : [],
        ownershipRegionId: ownershipRegion.id,
        ownershipRegionKey: ownershipRegion.key,
        ownershipRegionKind: ownershipRegion.regionKind,
        precision: 'declaration'
      });
    }
    if (declaration.loss) losses.push(declaration.loss);
  }
  occurrences.push(...dependencies.occurrences);
  relations.push(...dependencies.relations);
  facts.push(...dependencies.facts);
  for (const occurrence of dependencies.occurrences) {
    mappings.push({
      id: `map_${idFragment(occurrence.id)}`,
      nativeAstNodeId: occurrence.nativeAstNodeId,
      semanticSymbolId: occurrence.symbolId,
      semanticOccurrenceId: occurrence.id,
      sourceSpan: occurrence.span,
      evidenceIds: [evidenceId],
      lossIds: [],
      precision: 'line'
    });
  }
  losses.push(...lightweightCoverageLosses(input, declarations, input.sourcePreservation));

  const semanticIndex = createSemanticIndexRecord({
    id: `index_${idFragment(input.sourcePath ?? input.language)}`,
    documents: [{
      id: documentId,
      path: input.sourcePath ?? `${input.language}:memory`,
      language: input.language,
      sourceHash: input.sourceHash
    }],
    symbols,
    occurrences,
    relations,
    facts,
    evidence: [{
      id: evidenceId,
      kind: 'import',
      status: 'passed',
      path: input.sourcePath,
      summary: `Lightweight declaration scan found ${symbols.length} symbol(s) and ${dependencies.summary.total} dependency edge(s).`,
      metadata: { parser, dependencyRelations: dependencies.summary.total }
    }],
    metadata: {
      parser,
      coverage: 'declarations-only',
      dependencyRelations: dependencies.summary,
      unsupported: ['full expression AST', 'type checking', 'control flow', 'comments and formatting preservation']
    }
  });

  return {
    parser,
    rootId,
    nodes,
    losses,
    semanticIndex,
    mappings,
    metadata: {
      parser,
      scanKind: 'lightweight-declaration-scan',
      declarationCount: declarations.length,
      dependencyRelationCount: dependencies.summary.total,
      dependencyOccurrenceCount: dependencies.occurrences.length,
      ...(input.sourcePreservation ? {
        sourcePreservationId: input.sourcePreservation.id,
        sourcePreservationSummary: input.sourcePreservation.summary
      } : {})
    }
  };
}
