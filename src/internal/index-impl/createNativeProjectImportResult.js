import{idFragment,uniqueByEvidenceId,uniqueByLossId,uniqueStrings}from'../../native-import-utils.js';import{createDocument,createPatch,createUniversalAstEnvelope}from'@shapeshift-labs/frontier-lang-kernel';
import{createNativeImportResultContract}from'./createNativeImportResultContract.js';import{createProjectImportAdmissionRecord}from'./createProjectImportAdmissionRecord.js';import{mergeSemanticIndexes}from'./mergeSemanticIndexes.js';import{summarizeNativeImportLosses}from'./summarizeNativeImportLosses.js';import{summarizeProjectSourcePreservation}from'./summarizeProjectSourcePreservation.js';
import{createProjectDocumentExportSymbolResolver,createProjectDocumentExportSymbolsResolver,createProjectModuleSymbolResolver,resolveProjectModule}from'./projectSymbolGraphModuleResolution.js';
import{createProjectCompilerGraphRecords}from'./projectSymbolGraphCompilerFacts.js';import{createProjectJsxGraphRecords}from'./projectSymbolGraphJsxRecords.js';import{createProjectRuntimeRegionRecords}from'./projectSymbolGraphRuntimeRegions.js';import{createProjectScopeUseDefRecords}from'./projectSymbolGraphScopeUseDefRecords.js';import{createProjectSourceEvidenceRecords}from'./projectSymbolGraphSourceRecords.js';import{createProjectCssModuleGraphRecords}from'./projectSymbolGraphCssModules.js';
import{publicContractRegionRecord}from'./projectSymbolGraphPublicContracts.js';
import{commonJsAliasReExportIdentityRecords,exportStarReExportIdentityRecords,isReExportImportEdge,reExportIdentityInputFromEdge,reExportIdentityRecord}from'./projectSymbolGraphReExports.js';import{createProjectModuleDeclarationShapeRecords}from'./projectSymbolGraphModuleDeclarationShapes.js';import{resolveReExportIdentityImportTargets}from'./projectSymbolGraphReExportImportTargets.js';
export function createNativeProjectImportResult(input, imports) {
  const idPart = idFragment(input.id ?? input.projectRoot ?? 'native_project');
  const nodes = {};
  const rootIds = [];
  const mergedSemanticIndex = mergeSemanticIndexes(imports, input, idPart);
  const projectSymbolGraph = createProjectSymbolGraphSummary(mergedSemanticIndex, imports, input);
  const semanticIndex = mergedSemanticIndex ? {
    ...mergedSemanticIndex,
    metadata: {
      ...mergedSemanticIndex.metadata,
      projectSymbolGraph
    }
  } : mergedSemanticIndex;
  const nativeSources = [];
  const sourceMaps = [];
  const losses = [];
  const evidence = [];
  const mergeCandidates = [];
  const operations = [];
  for (const result of imports) {
    for (const node of Object.values(result.document?.nodes ?? {})) {
      nodes[node.id] = node;
    }
    rootIds.push(...(result.document?.rootIds ?? []));
    if (result.nativeSource) nativeSources.push(result.nativeSource);
    sourceMaps.push(...(result.sourceMaps ?? []));
    losses.push(...(result.losses ?? []));
    evidence.push(...(result.evidence ?? []));
    mergeCandidates.push(...(result.mergeCandidates ?? []));
    operations.push(...(result.patch?.operations ?? []));
  }
  const uniqueLosses = uniqueByLossId(losses);
  const uniqueEvidence = uniqueByEvidenceId(evidence);
  const nativeImportLossSummary = summarizeNativeImportLosses(uniqueLosses, {
    evidence: uniqueEvidence,
    scanKind: 'native-project-import',
    semanticStatus: uniqueLosses.some((loss) => loss.severity === 'error') ? 'partial' : 'mapped'
  });
  const sourcePreservationSummary = summarizeProjectSourcePreservation(imports);
  const document = createDocument({
    id: input.documentId ?? `document_${idPart}`,
    name: input.documentName ?? input.name ?? 'NativeProject',
    nodes: Object.values(nodes),
    rootIds: uniqueStrings(rootIds),
    metadata: {
      sourceLanguage: input.language ?? 'mixed',
      semanticStatus: losses.some((loss) => loss.severity === 'error') ? 'partial' : 'mapped',
      projectRoot: input.projectRoot,
      sourceCount: imports.length,
      nativeImportLossSummary,
      sourcePreservationSummary,
      projectSymbolGraph,
      ...input.documentMetadata
    }
  });
  const universalAst = createUniversalAstEnvelope({
    id: input.universalAstId ?? `universal_ast_${idPart}`,
    document,
    nativeSources,
    semanticIndex,
    sourceMaps,
    losses: uniqueLosses,
    evidence: uniqueEvidence,
    metadata: {
      sourceLanguage: input.language ?? 'mixed',
      projectRoot: input.projectRoot,
      sourceCount: imports.length,
      nativeImportLossSummary,
      sourcePreservationSummary,
      projectSymbolGraph,
      ...input.universalAstMetadata
    }
  });
  const patch = createPatch({
    id: input.patchId ?? `patch_${idPart}_project_import`,
    author: input.author ?? '@shapeshift-labs/frontier-lang-compiler/importNativeProject',
    risk: losses.some((loss) => loss.severity === 'error') ? 'high' : losses.some((loss) => loss.severity === 'warning') ? 'medium' : 'low',
    operations,
    evidence: uniqueEvidence,
    metadata: {
      semanticIndexId: semanticIndex?.id,
      universalAstId: universalAst.id,
      sourceMapIds: sourceMaps.map((sourceMap) => sourceMap.id),
      sourceCount: imports.length,
      nativeImportLossSummary,
      sourcePreservationSummary,
      projectSymbolGraph
    }
  });
  const projectResult = {
    kind: 'frontier.lang.projectImportResult',
    version: 1,
    id: input.id ?? `project_import_${idPart}`,
    language: input.language ?? 'mixed',
    projectRoot: input.projectRoot,
    imports,
    document,
    patch,
    nativeSources,
    semanticIndex,
    universalAst,
    sourceMaps,
    losses: uniqueLosses,
    evidence: uniqueEvidence,
    mergeCandidates,
    projectSymbolGraph,
    metadata: {
      sourceCount: imports.length,
      sourcePaths: imports.map((result) => result.sourcePath).filter(Boolean),
      nativeImportLossSummary,
      sourcePreservationSummary,
      projectSymbolGraph,
      ...input.metadata
    }
  };
  const importResultContract = createNativeImportResultContract(projectResult, {
    lossSummary: nativeImportLossSummary
  });
  const projectAdmission = createProjectImportAdmissionRecord(projectResult, {
    importResultContract,
    lossSummary: nativeImportLossSummary
  });
  return {
    ...projectResult,
    metadata: {
      ...projectResult.metadata,
      importResultContract,
      projectAdmission,
      semanticMergeAdmission: projectAdmission,
      semanticMergeReadiness: importResultContract.readiness.semanticMergeReadiness,
      readinessReasons: importResultContract.readiness.reasons,
      regionSummary: importResultContract.regions,
      sourceMapSummary: importResultContract.sourceMaps,
      adapterCoverageSummary: importResultContract.adapterCoverage,
      projectSymbolGraph
    }
  };
}
const PROJECT_SYMBOL_GRAPH_REMAINING_FIELDS = Object.freeze([]);
function createProjectSymbolGraphSummary(semanticIndex, imports, input) {
  const documents = semanticIndex?.documents ?? [];
  const symbolsById = new Map((semanticIndex?.symbols ?? []).map((symbol) => [symbol.id, symbol]));
  const documentsById = new Map(documents.map((document) => [document.id, document]));
  const documentsByPath = new Map(documents.filter((document) => document.path).map((document) => [document.path, document]));
  const moduleResolution = input.moduleResolution ?? input.tsconfig;
  const resolveTargetSymbolId = createProjectModuleSymbolResolver(semanticIndex?.symbols ?? [], documents);
  const resolveDocumentExportSymbolId = createProjectDocumentExportSymbolResolver(semanticIndex?.symbols ?? [], documents);
  const resolveDocumentExportSymbols = createProjectDocumentExportSymbolsResolver(semanticIndex?.symbols ?? [], documents);
  const facts = semanticIndex?.facts ?? [];
  const moduleEdgeFacts = facts.filter((fact) => fact.predicate === 'moduleEdge');
  const moduleEdgeByRelation = new Map(moduleEdgeFacts.map((fact) => [objectValue(fact.value).relationId ?? fact.subjectId, fact]));
  const relations = semanticIndex?.relations ?? [];
  const importEdges = relations
    .filter((relation) => relation.predicate === 'imports')
    .map((relation) => moduleEdgeRecord(relation, moduleEdgeByRelation, symbolsById, documentsById, documentsByPath, moduleResolution, resolveTargetSymbolId));
  const exportEdges = relations
    .filter((relation) => relation.predicate === 'exports')
    .map((relation) => moduleEdgeRecord(relation, moduleEdgeByRelation, symbolsById, documentsById, documentsByPath, moduleResolution, resolveTargetSymbolId));
  const moduleEdgeById = new Map([...importEdges, ...exportEdges].map((edge) => [edge.id, edge]));
  const reExportIdentities = uniqueRecords([
    ...facts
      .filter((fact) => fact.predicate === 'reExportIdentity' && fact.value)
      .filter((fact) => hasConcreteReExportIdentity(objectValue(fact.value)))
      .map((fact) => reExportIdentityRecord(objectValue(fact.value), moduleEdgeById.get(objectValue(fact.value).relationId ?? fact.objectId), resolveDocumentExportSymbolId, { factId: fact.id })),
    ...importEdges
      .filter((edge) => isReExportImportEdge(edge))
      .flatMap((edge) => edge.exportStar
        ? exportStarReExportIdentityRecords(edge, resolveDocumentExportSymbols(edge.targetDocumentId))
        : [reExportIdentityRecord(reExportIdentityInputFromEdge(edge, `reexport_${idFragment(edge.id)}`), edge, resolveDocumentExportSymbolId)]),...commonJsAliasReExportIdentityRecords(importEdges, exportEdges, resolveDocumentExportSymbolId)
  ]);
  const resolvedImportEdges = resolveReExportIdentityImportTargets(importEdges, reExportIdentities);
  const publicContractRegions = uniqueRecords(facts
    .filter((fact) => fact.predicate === 'publicContractRegion' && fact.value)
    .map((fact) => publicContractRegionRecord(objectValue(fact.value), fact, symbolsById.get(fact.subjectId))));
  const compilerGraphRecords = createProjectCompilerGraphRecords(semanticIndex, symbolsById, documentsById, publicContractRegions); const runtimeRegionRecords = createProjectRuntimeRegionRecords(semanticIndex, imports, publicContractRegions); const scopeUseDefRecords = createProjectScopeUseDefRecords(semanticIndex, imports, publicContractRegions); const jsxGraphRecords = createProjectJsxGraphRecords(semanticIndex, imports, publicContractRegions, resolvedImportEdges, exportEdges); const cssModuleGraphRecords = createProjectCssModuleGraphRecords(semanticIndex, imports, resolvedImportEdges, scopeUseDefRecords.scopeReferenceRecords, jsxGraphRecords.jsxPropRecords); const sourceEvidenceRecords = createProjectSourceEvidenceRecords(imports); const moduleDeclarationShapeRecords = createProjectModuleDeclarationShapeRecords(semanticIndex, exportEdges);
  const fileHashes = uniqueRecords([
    ...documents.map((document) => fileHashRecord(document)),
    ...facts
      .filter((fact) => fact.predicate === 'fileHash' && fact.value)
      .map((fact) => ({ ...objectValue(fact.value), id: `file_hash_${idFragment(fact.subjectId)}`, factId: fact.id, documentId: fact.subjectId }))
  ].filter(Boolean));
  return {
    kind: 'frontier.lang.projectSymbolGraph',
    version: 1,
    projectRoot: input.projectRoot,
    sourceCount: imports.length,
    documentCount: documents.length,
    symbolCount: semanticIndex?.symbols?.length ?? 0,
    occurrenceCount: semanticIndex?.occurrences?.length ?? 0,
    relationCount: relations.length,
    factCount: facts.length,
    fileHashes,
    importEdges: resolvedImportEdges,
    exportEdges,
    reExportIdentities, moduleDeclarationRecords: moduleDeclarationShapeRecords.moduleDeclarationRecords, exportAssignmentRecords: moduleDeclarationShapeRecords.exportAssignmentRecords,
    publicContractRegions,
    sourceFileRecords: sourceEvidenceRecords.sourceFileRecords, sourceSpanRecords: sourceEvidenceRecords.sourceSpanRecords,
    compilerSymbolRecords: compilerGraphRecords.compilerSymbolRecords,
    compilerTypeRecords: compilerGraphRecords.compilerTypeRecords,
    runtimeRegionRecords,
    scopeBindingRecords: scopeUseDefRecords.scopeBindingRecords,
    scopeReferenceRecords: scopeUseDefRecords.scopeReferenceRecords,
    jsxElementRecords: jsxGraphRecords.jsxElementRecords,
    jsxPropRecords: jsxGraphRecords.jsxPropRecords,
    cssModuleImportBindings: cssModuleGraphRecords.cssModuleImportBindings, cssModuleUseSites: cssModuleGraphRecords.cssModuleUseSites,
    cssModuleUseSiteBlockers: cssModuleGraphRecords.cssModuleUseSiteBlockers, cssModuleUseSiteGraphs: cssModuleGraphRecords.cssModuleUseSiteGraphs,
    remainingFields: PROJECT_SYMBOL_GRAPH_REMAINING_FIELDS
  };
}

function moduleEdgeRecord(relation, moduleEdgeByRelation, symbolsById, documentsById, documentsByPath, moduleResolution, resolveTargetSymbolId) {
  const fact = moduleEdgeByRelation.get(relation.id);
  const value = objectValue(fact?.value);
  const metadata = objectValue(relation.metadata);
  const moduleEdge = objectValue(metadata.moduleEdge);
  const symbol = symbolsById.get(relation.targetId);
  const symbolMetadata = objectValue(symbol?.metadata);
  const document = documentsById.get(relation.sourceId);
  const moduleSpecifier = firstString(
    moduleEdge.moduleSpecifier,
    value.moduleSpecifier,
    metadata.moduleSpecifier,
    symbolMetadata.moduleSpecifier,
    symbolMetadata.importPath,
    symbolMetadata.exportPath,
    symbolMetadata.source,
    symbol?.kind === 'module' ? symbol.name : undefined
  );
  const runtimeEdgeMetadata = compactRecord({ importKind: firstString(moduleEdge.importKind, value.importKind, symbolMetadata.importKind), exportKind: firstString(moduleEdge.exportKind, value.exportKind, symbolMetadata.exportKind), dynamicImport: firstBoolean(moduleEdge.dynamicImport, value.dynamicImport, metadata.dynamicImport, symbolMetadata.dynamicImport), hostDependencyKind: firstString(moduleEdge.hostDependencyKind, value.hostDependencyKind, metadata.hostDependencyKind, symbolMetadata.hostDependencyKind), commonJs: firstBoolean(moduleEdge.commonJs, value.commonJs, metadata.commonJs, symbolMetadata.commonJs), interopHelper: firstString(moduleEdge.interopHelper, value.interopHelper, metadata.interopHelper, symbolMetadata.interopHelper), packageEnvironmentCondition: firstString(moduleEdge.packageEnvironmentCondition, value.packageEnvironmentCondition, metadata.packageEnvironmentCondition, symbolMetadata.packageEnvironmentCondition) });
  const resolution = resolveProjectModule(document?.path, moduleSpecifier, documentsByPath, moduleResolution, runtimeEdgeMetadata);
  const record = {
    id: relation.id,
    sourceDocumentId: relation.sourceId,
    targetSymbolId: relation.targetId,
    predicate: relation.predicate,
    edgeKind: firstString(moduleEdge.edgeKind, value.edgeKind, relation.predicate === 'imports' ? 'import' : moduleSpecifier ? 're-export' : 'export'),
    sourcePath: document?.path,
    sourceHash: document?.sourceHash,
    moduleSpecifier,
    resolvedModulePath: resolution?.path,
    targetDocumentId: resolution?.documentId,
    resolutionKind: resolution?.kind,
    resolutionPathVariant: resolution?.resolutionPathVariant,
    packageName: resolution?.packageName,
    packageSubpath: resolution?.packageSubpath,
    packageExportKey: resolution?.packageExportKey,
    packageExportCondition: resolution?.packageExportCondition,
    packageExportTarget: resolution?.packageExportTarget,
    packageRuntimeCondition: resolution?.packageRuntimeCondition, packageRuntimeConditionEvidenceSource: resolution?.packageRuntimeConditionEvidenceSource, packageRuntimeConditionEdgeKind: resolution?.packageRuntimeConditionEdgeKind, packageRuntimeConditionCandidates: resolution?.packageRuntimeConditionCandidates, packageRuntimeConditionReasonCode: resolution?.packageRuntimeConditionReasonCode, packageEnvironmentCondition: resolution?.packageEnvironmentCondition, packageEnvironmentConditionEvidenceSource: resolution?.packageEnvironmentConditionEvidenceSource, packageEnvironmentConditionCandidates: resolution?.packageEnvironmentConditionCandidates, packageEnvironmentConditionReasonCode: resolution?.packageEnvironmentConditionReasonCode, packageWorkspaceRootAmbiguous: resolution?.packageWorkspaceRootAmbiguous, packageWorkspaceRoots: resolution?.packageWorkspaceRoots, packageResolutionReasonCode: resolution?.packageResolutionReasonCode,
    packageType: resolution?.packageType,
    packageImportKey: resolution?.packageImportKey,
    packageImportCondition: resolution?.packageImportCondition,
    packageImportTarget: resolution?.packageImportTarget,
    importKind: firstString(moduleEdge.importKind, value.importKind, symbolMetadata.importKind), commonJs: firstBoolean(moduleEdge.commonJs, value.commonJs, metadata.commonJs, symbolMetadata.commonJs), interopHelper: firstString(moduleEdge.interopHelper, value.interopHelper, metadata.interopHelper, symbolMetadata.interopHelper), dynamicImport: firstBoolean(moduleEdge.dynamicImport, value.dynamicImport, metadata.dynamicImport, symbolMetadata.dynamicImport), dynamicImportSpecifierKind: firstString(moduleEdge.dynamicImportSpecifierKind, value.dynamicImportSpecifierKind, metadata.dynamicImportSpecifierKind, symbolMetadata.dynamicImportSpecifierKind), dynamicImportExpressionText: firstString(moduleEdge.dynamicImportExpressionText, value.dynamicImportExpressionText, metadata.dynamicImportExpressionText, symbolMetadata.dynamicImportExpressionText), dynamicImportExpressionHash: firstString(moduleEdge.dynamicImportExpressionHash, value.dynamicImportExpressionHash, metadata.dynamicImportExpressionHash, symbolMetadata.dynamicImportExpressionHash), dynamicImportStaticSpecifierEvidence: firstBoolean(moduleEdge.dynamicImportStaticSpecifierEvidence, value.dynamicImportStaticSpecifierEvidence, metadata.dynamicImportStaticSpecifierEvidence, symbolMetadata.dynamicImportStaticSpecifierEvidence), dynamicImportRuntimeResolutionClaim: firstBoolean(moduleEdge.dynamicImportRuntimeResolutionClaim, value.dynamicImportRuntimeResolutionClaim, metadata.dynamicImportRuntimeResolutionClaim, symbolMetadata.dynamicImportRuntimeResolutionClaim), dynamicImportResolutionProofRequired: firstBoolean(moduleEdge.dynamicImportResolutionProofRequired, value.dynamicImportResolutionProofRequired, metadata.dynamicImportResolutionProofRequired, symbolMetadata.dynamicImportResolutionProofRequired), hostDependency: firstBoolean(moduleEdge.hostDependency, value.hostDependency, metadata.hostDependency, symbolMetadata.hostDependency), hostDependencyKind: firstString(moduleEdge.hostDependencyKind, value.hostDependencyKind, metadata.hostDependencyKind, symbolMetadata.hostDependencyKind), hostDependencyBase: firstString(moduleEdge.hostDependencyBase, value.hostDependencyBase, metadata.hostDependencyBase, symbolMetadata.hostDependencyBase), hostDependencyExpressionText: firstString(moduleEdge.hostDependencyExpressionText, value.hostDependencyExpressionText, metadata.hostDependencyExpressionText, symbolMetadata.hostDependencyExpressionText), hostDependencyExpressionHash: firstString(moduleEdge.hostDependencyExpressionHash, value.hostDependencyExpressionHash, metadata.hostDependencyExpressionHash, symbolMetadata.hostDependencyExpressionHash), hostDependencyStaticSpecifierEvidence: firstBoolean(moduleEdge.hostDependencyStaticSpecifierEvidence, value.hostDependencyStaticSpecifierEvidence, metadata.hostDependencyStaticSpecifierEvidence, symbolMetadata.hostDependencyStaticSpecifierEvidence), hostDependencyRuntimeResolutionClaim: firstBoolean(moduleEdge.hostDependencyRuntimeResolutionClaim, value.hostDependencyRuntimeResolutionClaim, metadata.hostDependencyRuntimeResolutionClaim, symbolMetadata.hostDependencyRuntimeResolutionClaim), hostDependencyResolutionProofRequired: firstBoolean(moduleEdge.hostDependencyResolutionProofRequired, value.hostDependencyResolutionProofRequired, metadata.hostDependencyResolutionProofRequired, symbolMetadata.hostDependencyResolutionProofRequired), hasImportAttributes: firstBoolean(moduleEdge.hasImportAttributes, value.hasImportAttributes, metadata.hasImportAttributes, symbolMetadata.hasImportAttributes), importAttributeCount: moduleEdge.importAttributeCount ?? value.importAttributeCount ?? metadata.importAttributeCount ?? symbolMetadata.importAttributeCount, importAttributeKeys: moduleEdge.importAttributeKeys ?? value.importAttributeKeys ?? metadata.importAttributeKeys ?? symbolMetadata.importAttributeKeys, importAttributeHash: firstString(moduleEdge.importAttributeHash, value.importAttributeHash, metadata.importAttributeHash, symbolMetadata.importAttributeHash), importAttributes: moduleEdge.importAttributes ?? value.importAttributes ?? metadata.importAttributes ?? symbolMetadata.importAttributes,
    exportKind: firstString(moduleEdge.exportKind, value.exportKind, symbolMetadata.exportKind),
    importedName: firstString(moduleEdge.importedName, value.importedName, symbolMetadata.importedName),
    exportedName: firstString(moduleEdge.exportedName, value.exportedName, symbolMetadata.exportedName),
    localName: firstString(moduleEdge.localName, value.localName, symbolMetadata.localName),
    namespace: firstString(moduleEdge.namespace, value.namespace, symbolMetadata.namespace),
    exportStar: firstBoolean(moduleEdge.exportStar, value.exportStar, symbolMetadata.exportStar),
    isTypeOnly: firstBoolean(moduleEdge.isTypeOnly, value.isTypeOnly, symbolMetadata.isTypeOnly, symbolMetadata.typeOnly),
    isReExport: firstBoolean(moduleEdge.isReExport, value.isReExport, symbolMetadata.reexport) ?? (relation.predicate === 'exports' && Boolean(moduleSpecifier)),
    publicContract: firstBoolean(moduleEdge.publicContract, value.publicContract, metadata.publicContract, symbolMetadata.publicContract),
    evidenceIds: uniqueStrings([...(relation.evidenceIds ?? []), ...(fact?.evidenceIds ?? [])])
  };
  return compactRecord({ ...record, resolvedTargetSymbolId: resolveTargetSymbolId(record) });
}

function fileHashRecord(document) {
  if (!document?.sourceHash) return undefined;
  const sourceHash = String(document.sourceHash);
  const separator = sourceHash.indexOf(':');
  return compactRecord({
    id: `file_hash_${idFragment(document.id)}`,
    documentId: document.id,
    sourcePath: document.path,
    language: document.language,
    sourceHash,
    algorithm: separator > 0 ? sourceHash.slice(0, separator) : undefined,
    value: separator > 0 ? sourceHash.slice(separator + 1) : sourceHash
  });
}

function objectValue(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function hasConcreteReExportIdentity(identity) { return Boolean(identity.exportedName || identity.importedName || identity.localName || identity.namespace); }

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function uniqueRecords(records) {
  const seen = new Set();
  const result = [];
  for (const record of records) {
    const key = record.id ?? record.factId ?? JSON.stringify(record);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(record);
  }
  return result;
}
function firstString(...values) { for (const value of values) if (value !== undefined && value !== null && String(value)) return String(value); return undefined; }
function firstBoolean(...values) { for (const value of values) if (typeof value === 'boolean') return value; return undefined; }
