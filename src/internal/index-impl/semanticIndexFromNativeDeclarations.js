import{idFragment,caseSensitiveIdFragment}from'../../native-import-utils.js';import{semanticOwnershipRegionForDeclaration}from'../../semantic-import-regions.js';import{createSemanticIndexRecord,hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';
import{relationPredicateForDeclaration}from'./relationPredicateForDeclaration.js';
export function semanticIndexFromNativeDeclarations(declarations, input, options) {
  const documentId = `doc_${idFragment(input.sourcePath ?? input.language)}_${idFragment(input.sourceHash)}`;
  const evidenceId = `evidence_${idFragment(input.sourcePath ?? input.language)}_${idFragment(options.astFormat ?? options.parser)}_import`;
  const symbols = [];
  const occurrences = [];
  const relations = [];
  const facts = input.sourceHash ? [fileHashFact(documentId, input, evidenceId)] : [];
  const mappings = [];
  for (const declaration of declarations) {
    const symbolId = declaration.symbolId ?? `symbol:${input.language}:${declaration.role === 'import' ? 'import:' : ''}${caseSensitiveIdFragment(declaration.name)}`;
    const normalizedDeclaration = {
      ...declaration,
      symbolId,
      regionKind: declarationRegionKind(declaration)
    };
    const occurrenceId = `occ_${idFragment(declaration.nativeNode.id)}_${declaration.role ?? 'definition'}`;
    const ownershipRegion = semanticOwnershipRegionForDeclaration(input, {
      ...normalizedDeclaration,
      nodeId: declaration.nativeNode.id,
      kind: declaration.nativeNode.kind,
      languageKind: declaration.nativeNode.languageKind,
      span: declaration.nativeNode.span,
      symbolId
    }, documentId);
    const relationId = `rel_${idFragment(documentId)}_${idFragment(declaration.nativeNode.id)}`;
    const moduleEdge = moduleEdgeForDeclaration(normalizedDeclaration, input, documentId, relationId, ownershipRegion);
    const publicContractRegion = publicContractRegionForDeclaration(normalizedDeclaration, ownershipRegion, moduleEdge);
    const reExportIdentity = reExportIdentityForDeclaration(normalizedDeclaration, input, documentId, relationId, ownershipRegion, moduleEdge);
    const graphMetadata = {
      ...(moduleEdge ? { moduleEdge } : {}),
      ...(publicContractRegion ? { publicContract: true, publicContractRegionId: publicContractRegion.id } : {}),
      ...(reExportIdentity ? { reExportIdentity } : {})
    };
    declaration.nativeNode.metadata = {
      ...declaration.nativeNode.metadata,
      ...declaration.metadata,
      ownershipRegionId: ownershipRegion.id,
      ownershipRegionKey: ownershipRegion.key,
      ownershipRegionKind: ownershipRegion.regionKind,
      ...graphMetadata
    };
    symbols.push({
      id: symbolId,
      scheme: 'frontier',
      name: declaration.name,
      kind: declaration.symbolKind,
      language: input.language,
      nativeAstNodeId: declaration.nativeNode.id,
      signatureHash: declaration.signatureHash ?? hashSemanticValue([input.language, declaration.nativeNode.kind, declaration.name, declaration.nativeNode.fields ?? {}]),
      definitionSpan: declaration.nativeNode.span,
      metadata: {
        ...declaration.nativeNode.metadata,
        ownershipRegionId: ownershipRegion.id,
        ownershipRegionKey: ownershipRegion.key,
        ownershipRegionKind: ownershipRegion.regionKind,
        ...graphMetadata
      }
    });
    occurrences.push({
      id: occurrenceId,
      documentId,
      symbolId,
      role: declaration.role ?? 'definition',
      span: declaration.nativeNode.span,
      nativeAstNodeId: declaration.nativeNode.id,
      ...(Object.keys(graphMetadata).length ? { metadata: graphMetadata } : {})
    });
    relations.push({
      id: relationId,
      sourceId: documentId,
      predicate: relationPredicateForDeclaration(declaration),
      targetId: symbolId,
      evidenceIds: [evidenceId],
      ...(Object.keys(graphMetadata).length ? { metadata: graphMetadata } : {})
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
    }, ...projectSymbolGraphFacts({ moduleEdge, publicContractRegion, reExportIdentity, relationId, symbolId, evidenceId }));
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
        sourceHash: input.sourceHash,
        graphRecords: {
          fileHashes: input.sourceHash ? 1 : 0,
          moduleEdges: facts.filter((fact) => fact.predicate === 'moduleEdge').length,
          reExportIdentities: facts.filter((fact) => fact.predicate === 'reExportIdentity').length,
          publicContractRegions: facts.filter((fact) => fact.predicate === 'publicContractRegion').length
        }
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
        coverage: 'native-ast-declarations',
        graphCoverage: 'module-edge-declarations'
      }
    }),
    mappings,
    evidence
  };
}

function fileHashFact(documentId, input, evidenceId) {
  return {
    id: `fact_${idFragment(documentId)}_file_hash`,
    predicate: 'fileHash',
    subjectId: documentId,
    value: { ...hashParts(input.sourceHash), sourcePath: input.sourcePath, language: input.language },
    evidenceIds: [evidenceId]
  };
}

function declarationRegionKind(declaration) {
  if (declaration.regionKind) return declaration.regionKind;
  if (declaration.role === 'import' || declaration.importPath) return 'import';
  if (declaration.role === 'export' || declaration.exported || declaration.reExport) return 'export';
  if (declaration.publicContract || declaration.metadata?.publicContract) return 'export';
  return undefined;
}

function moduleEdgeForDeclaration(declaration, input, documentId, relationId, ownershipRegion) {
  const role = declaration.role;
  if (role !== 'import' && role !== 'export') return undefined;
  const moduleSpecifier = moduleSpecifierForDeclaration(declaration);
  const edgeKind = role === 'import' ? 'import' : moduleSpecifier || declaration.reExport ? 're-export' : 'export';
  return compactRecord({
    kind: 'frontier.lang.moduleEdge',
    version: 1,
    id: relationId,
    edgeKind,
    role,
    sourceDocumentId: documentId,
    sourcePath: input.sourcePath,
    sourceHash: input.sourceHash,
    moduleSpecifier,
    symbolId: declaration.symbolId,
    relationId,
    ownershipRegionId: ownershipRegion.id,
    ownershipRegionKey: ownershipRegion.key,
    importKind: declaration.importKind ?? declaration.metadata?.importKind,
    exportKind: declaration.exportKind ?? declaration.metadata?.exportKind,
    importedName: declaration.importedName ?? declaration.metadata?.importedName,
    exportedName: declaration.exportedName ?? declaration.metadata?.exportedName,
    localName: declaration.localName ?? declaration.metadata?.localName,
    namespace: declaration.namespace ?? declaration.metadata?.namespace,
    isTypeOnly: declaration.isTypeOnly ?? declaration.metadata?.isTypeOnly,
    isReExport: edgeKind === 're-export',
    publicContract: publicContractForDeclaration(declaration, edgeKind)
  });
}

function moduleSpecifierForDeclaration(declaration) {
  return firstString(
    declaration.moduleSpecifier,
    declaration.importPath,
    declaration.exportPath,
    declaration.source,
    declaration.metadata?.moduleSpecifier,
    declaration.metadata?.importPath,
    declaration.metadata?.exportPath,
    declaration.metadata?.source,
    declaration.symbolKind === 'module' ? declaration.name : undefined
  );
}

function publicContractForDeclaration(declaration, edgeKind) {
  return Boolean(
    declaration.publicContract
    || declaration.exported
    || declaration.metadata?.publicContract
    || declaration.metadata?.publicContractRegion
    || declaration.role === 'export'
    || edgeKind === 'export'
    || edgeKind === 're-export'
  );
}

function publicContractRegionForDeclaration(declaration, ownershipRegion, moduleEdge) {
  if (!publicContractForDeclaration(declaration, moduleEdge?.edgeKind)) return undefined;
  return {
    ...ownershipRegion,
    regionKind: declaration.publicContractRegionKind ?? declaration.metadata?.publicContractRegionKind ?? ownershipRegion.regionKind,
    publicContract: true,
    exportedName: declaration.exportedName ?? declaration.metadata?.exportedName,
    moduleSpecifier: moduleEdge?.moduleSpecifier,
    edgeKind: moduleEdge?.edgeKind
  };
}

function reExportIdentityForDeclaration(declaration, input, documentId, relationId, ownershipRegion, moduleEdge) {
  if (!moduleEdge?.isReExport && !declaration.reExport) return undefined;
  return compactRecord({
    kind: 'frontier.lang.reExportIdentity',
    version: 1,
    id: `reexport_${idFragment(relationId)}`,
    sourceDocumentId: documentId,
    sourcePath: input.sourcePath,
    sourceHash: input.sourceHash,
    moduleSpecifier: moduleEdge?.moduleSpecifier,
    exportedName: declaration.exportedName ?? declaration.metadata?.exportedName,
    importedName: declaration.importedName ?? declaration.metadata?.importedName,
    localName: declaration.localName ?? declaration.metadata?.localName,
    namespace: declaration.namespace ?? declaration.metadata?.namespace,
    isTypeOnly: declaration.isTypeOnly ?? declaration.metadata?.isTypeOnly,
    symbolId: declaration.symbolId,
    relationId,
    ownershipRegionId: ownershipRegion.id,
    ownershipRegionKey: ownershipRegion.key,
    publicContract: true
  });
}

function projectSymbolGraphFacts({ moduleEdge, publicContractRegion, reExportIdentity, relationId, symbolId, evidenceId }) {
  return [
    moduleEdge ? {
      id: `fact_${idFragment(relationId)}_module_edge`,
      predicate: 'moduleEdge',
      subjectId: relationId,
      objectId: symbolId,
      value: moduleEdge,
      evidenceIds: [evidenceId]
    } : undefined,
    reExportIdentity ? {
      id: `fact_${idFragment(relationId)}_re_export_identity`,
      predicate: 'reExportIdentity',
      subjectId: symbolId,
      objectId: relationId,
      value: reExportIdentity,
      evidenceIds: [evidenceId]
    } : undefined,
    publicContractRegion ? {
      id: `fact_${idFragment(symbolId)}_public_contract_region`,
      predicate: 'publicContractRegion',
      subjectId: symbolId,
      objectId: publicContractRegion.id,
      value: publicContractRegion,
      evidenceIds: [evidenceId]
    } : undefined
  ].filter(Boolean);
}

function hashParts(sourceHash) {
  const text = String(sourceHash);
  const separator = text.indexOf(':');
  return {
    sourceHash: text,
    ...(separator > 0 ? { algorithm: text.slice(0, separator), value: text.slice(separator + 1) } : { value: text })
  };
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function firstString(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value)) return String(value);
  }
  return undefined;
}
