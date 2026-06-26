import{idFragment,uniqueRecordsById}from'../../native-import-utils.js';import{lightweightDependencyRelations}from'../../lightweight-dependency-relations.js';import{lightweightCoverageLosses,scanNativeDeclarations}from'../../native-region-scanner.js';import{semanticOwnershipRegionForDeclaration,semanticPatchHintForRegion}from'../../semantic-import-regions.js';import{createSemanticIndexRecord,hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';import{dynamicImportExpressionEdgeFields}from'./dynamicImportExpressionMetadata.js';
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
  const ownershipRegions = [];
  const evidenceId = `evidence_${idFragment(input.sourcePath ?? input.language)}_lightweight_scan`;
  const dependencies = lightweightDependencyRelations(input, declarations, documentId);

  for (const declaration of declarations) {
    const ownershipRegion = semanticOwnershipRegionForDeclaration(input, declaration, documentId);
    ownershipRegions.push(ownershipRegion);
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
      const relationId = `rel_${idFragment(documentId)}_${idFragment(declaration.nodeId)}`;
      const moduleEdge = lightweightModuleEdge(declaration, input, documentId, relationId, ownershipRegion);
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
          ...declaration.metadata,
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
        id: relationId,
        sourceId: documentId,
        predicate: lightweightRelationPredicate(declaration),
        targetId: declaration.symbolId,
        ...(moduleEdge ? { metadata: { moduleEdge } } : {})
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
      if (moduleEdge) facts.push({
        id: `fact_${idFragment(relationId)}_${idFragment(declaration.symbolId)}_module_edge`,
        predicate: 'moduleEdge',
        subjectId: declaration.symbolId,
        objectId: declaration.symbolId,
        value: moduleEdge,
        evidenceIds: [evidenceId]
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
  const semanticOwnershipRegions = uniqueRecordsById(ownershipRegions);
  const semanticPatchHints = semanticOwnershipRegions.map((region) => semanticPatchHintForRegion(region, 'needs-review'));

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
    ownershipRegions: semanticOwnershipRegions,
    patchHints: semanticPatchHints,
    evidence: [{
      id: evidenceId,
      kind: 'import',
      status: 'passed',
      path: input.sourcePath,
      summary: `Lightweight declaration scan found ${symbols.length} symbol(s), ${dependencies.summary.total} dependency edge(s), and ${dependencies.summary.controlFlow + dependencies.summary.effects + dependencies.summary.mutations} semantic fact(s).`,
      metadata: { parser, dependencyRelations: dependencies.summary.total, semanticFacts: {
        controlFlow: dependencies.summary.controlFlow,
        effects: dependencies.summary.effects,
        mutations: dependencies.summary.mutations
      } }
    }],
    metadata: {
      parser,
      coverage: 'declarations-only',
      dependencyRelations: dependencies.summary,
      unsupported: ['full expression AST', 'type checking', 'full control-flow graph', 'comments and formatting preservation']
    }
  });

  return {
    parser,
    rootId,
    nodes,
    losses,
    semanticIndex,
    mappings,
    ownershipRegions: semanticOwnershipRegions,
    patchHints: semanticPatchHints,
    metadata: {
      parser,
      scanKind: 'lightweight-declaration-scan',
      declarationCount: declarations.length,
      dependencyRelationCount: dependencies.summary.total,
      dependencyOccurrenceCount: dependencies.occurrences.length,
      semanticFactCount: dependencies.summary.controlFlow + dependencies.summary.effects + dependencies.summary.mutations,
      semanticFactSummary: {
        controlFlow: dependencies.summary.controlFlow,
        effects: dependencies.summary.effects,
        mutations: dependencies.summary.mutations
      },
      ...(input.sourcePreservation ? {
        sourcePreservationId: input.sourcePreservation.id,
        sourcePreservationSummary: input.sourcePreservation.summary
      } : {})
    }
  };
}

function lightweightRelationPredicate(declaration) {
  if (declaration.role === 'import') return 'imports';
  if (declaration.role === 'export') return 'exports';
  return 'defines';
}

function lightweightModuleEdge(declaration, input, documentId, relationId, ownershipRegion) {
  if (declaration.role !== 'import' && declaration.role !== 'export') return undefined;
  const fields = declaration.fields ?? {};
  const metadata = declaration.metadata ?? {};
  const moduleSpecifier = fields.importPath ?? fields.moduleSpecifier ?? fields.exportPath ?? fields.source
    ?? metadata.importPath ?? metadata.moduleSpecifier ?? metadata.exportPath ?? metadata.source;
  return compactRecord({
    kind: 'frontier.lang.moduleEdge',
    version: 1,
    id: relationId,
    edgeKind: declaration.role === 'import' ? 'import' : moduleSpecifier || metadata.reexport ? 're-export' : 'export',
    role: declaration.role,
    sourceDocumentId: documentId,
    sourcePath: input.sourcePath,
    sourceHash: input.sourceHash,
    moduleSpecifier,
    symbolId: declaration.symbolId,
    relationId,
    ownershipRegionId: ownershipRegion.id,
    ownershipRegionKey: ownershipRegion.key,
    importKind: fields.importKind ?? metadata.importKind,
    exportKind: fields.exportKind ?? metadata.exportKind,
    importedName: fields.importedName ?? metadata.importedName,
    exportedName: fields.exportedName ?? metadata.exportedName,
    localName: fields.localName ?? metadata.localName,
    namespace: fields.namespace ?? metadata.namespace,
    exportStar: fields.exportStar ?? metadata.exportStar,
    isTypeOnly: fields.typeOnly ?? fields.isTypeOnly ?? metadata.typeOnly ?? metadata.isTypeOnly,
    ...dynamicImportExpressionEdgeFields(metadata),
    publicContract: declaration.role === 'export' || metadata.publicContract
  });
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}
