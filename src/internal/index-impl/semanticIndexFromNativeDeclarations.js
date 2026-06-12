import{idFragment,caseSensitiveIdFragment}from'../../native-import-utils.js';import{semanticOwnershipRegionForDeclaration}from'../../semantic-import-regions.js';import{createSemanticIndexRecord,hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';
import{relationPredicateForDeclaration}from'./relationPredicateForDeclaration.js';
export function semanticIndexFromNativeDeclarations(declarations, input, options) {
  const documentId = `doc_${idFragment(input.sourcePath ?? input.language)}_${idFragment(input.sourceHash)}`;
  const evidenceId = `evidence_${idFragment(input.sourcePath ?? input.language)}_${idFragment(options.astFormat ?? options.parser)}_import`;
  const symbols = [];
  const occurrences = [];
  const relations = [];
  const facts = [];
  const mappings = [];
  for (const declaration of declarations) {
    const symbolId = declaration.symbolId ?? `symbol:${input.language}:${declaration.role === 'import' ? 'import:' : ''}${caseSensitiveIdFragment(declaration.name)}`;
    const occurrenceId = `occ_${idFragment(declaration.nativeNode.id)}_${declaration.role ?? 'definition'}`;
    const ownershipRegion = semanticOwnershipRegionForDeclaration(input, {
      ...declaration,
      nodeId: declaration.nativeNode.id,
      kind: declaration.nativeNode.kind,
      languageKind: declaration.nativeNode.languageKind,
      span: declaration.nativeNode.span,
      symbolId
    }, documentId);
    declaration.nativeNode.metadata = {
      ...declaration.nativeNode.metadata,
      ownershipRegionId: ownershipRegion.id,
      ownershipRegionKey: ownershipRegion.key,
      ownershipRegionKind: ownershipRegion.regionKind
    };
    symbols.push({
      id: symbolId,
      scheme: 'frontier',
      name: declaration.name,
      kind: declaration.symbolKind,
      language: input.language,
      nativeAstNodeId: declaration.nativeNode.id,
      signatureHash: hashSemanticValue([input.language, declaration.nativeNode.kind, declaration.name, declaration.nativeNode.fields ?? {}]),
      definitionSpan: declaration.nativeNode.span,
      metadata: {
        ownershipRegionId: ownershipRegion.id,
        ownershipRegionKey: ownershipRegion.key,
        ownershipRegionKind: ownershipRegion.regionKind
      }
    });
    occurrences.push({
      id: occurrenceId,
      documentId,
      symbolId,
      role: declaration.role ?? 'definition',
      span: declaration.nativeNode.span,
      nativeAstNodeId: declaration.nativeNode.id
    });
    relations.push({
      id: `rel_${idFragment(documentId)}_${idFragment(declaration.nativeNode.id)}`,
      sourceId: documentId,
      predicate: relationPredicateForDeclaration(declaration),
      targetId: symbolId
    });
    facts.push({
      id: `fact_${idFragment(declaration.nativeNode.id)}_kind`,
      predicate: 'nativeKind',
      subjectId: symbolId,
      value: declaration.nativeNode.languageKind
    }, {
      id: `fact_${idFragment(declaration.nativeNode.id)}_ownership_region`,
      predicate: 'semanticOwnershipRegion',
      subjectId: symbolId,
      value: ownershipRegion
    }, {
      id: `fact_${idFragment(declaration.nativeNode.id)}_ownership_region_taxonomy`,
      predicate: 'semanticOwnershipRegionTaxonomy',
      subjectId: symbolId,
      value: {
        regionKind: ownershipRegion.regionKind,
        granularity: ownershipRegion.granularity,
        key: ownershipRegion.key
      }
    });
    mappings.push({
      id: `map_${idFragment(declaration.nativeNode.id)}`,
      nativeAstNodeId: declaration.nativeNode.id,
      semanticSymbolId: symbolId,
      semanticOccurrenceId: occurrenceId,
      sourceSpan: declaration.nativeNode.span,
      evidenceIds: [evidenceId],
      lossIds: [],
      ownershipRegionId: ownershipRegion.id,
      ownershipRegionKey: ownershipRegion.key,
      ownershipRegionKind: ownershipRegion.regionKind,
      precision: declaration.nativeNode.span ? 'declaration' : 'unknown'
    });
  }
  const evidence = [{
    id: evidenceId,
    kind: 'import',
    status: 'passed',
    path: input.sourcePath,
    summary: `Normalized ${options.astFormat ?? options.parser} native AST with ${declarations.length} declaration(s).`,
    metadata: {
      parser: options.parser,
      astFormat: options.astFormat,
      language: input.language,
      sourceHash: input.sourceHash
    }
  }];
  return {
    semanticIndex: createSemanticIndexRecord({
      id: `index_${idFragment(input.sourcePath ?? input.language)}_${idFragment(options.astFormat ?? options.parser)}`,
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
      evidence,
      metadata: {
        parser: options.parser,
        astFormat: options.astFormat,
        coverage: 'native-ast-declarations'
      }
    }),
    mappings,
    evidence
  };
}
