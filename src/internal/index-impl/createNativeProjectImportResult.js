import{idFragment,uniqueByEvidenceId,uniqueByLossId,uniqueStrings}from'../../native-import-utils.js';import{createDocument,createPatch,createUniversalAstEnvelope}from'@shapeshift-labs/frontier-lang-kernel';
import{createNativeImportResultContract}from'./createNativeImportResultContract.js';import{createProjectImportAdmissionRecord}from'./createProjectImportAdmissionRecord.js';import{mergeSemanticIndexes}from'./mergeSemanticIndexes.js';import{summarizeNativeImportLosses}from'./summarizeNativeImportLosses.js';import{summarizeProjectSourcePreservation}from'./summarizeProjectSourcePreservation.js';
export function createNativeProjectImportResult(input, imports) {
  const idPart = idFragment(input.id ?? input.projectRoot ?? 'native_project');
  const nodes = {};
  const rootIds = [];
  const semanticIndex = mergeSemanticIndexes(imports, input, idPart);
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
      sourcePreservationSummary
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
    metadata: {
      sourceCount: imports.length,
      sourcePaths: imports.map((result) => result.sourcePath).filter(Boolean),
      nativeImportLossSummary,
      sourcePreservationSummary,
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
      adapterCoverageSummary: importResultContract.adapterCoverage
    }
  };
}
