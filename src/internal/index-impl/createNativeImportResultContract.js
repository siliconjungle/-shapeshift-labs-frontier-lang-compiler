import{normalizeStringList,uniqueByEvidenceId,uniqueByLossId,uniqueStrings}from'../../native-import-utils.js';import{collectImportSourceMaps,compactImportContractSource,defaultSemanticImportSidecarId,summarizeImportAdapterCoverage,summarizeImportContractReadiness,summarizeImportRegions,summarizeImportSourceMaps}from'../../semantic-import-contract-summary.js';import{summarizeImportSourcePreservation}from'../../semantic-import-source-preservation.js';
import{nativeImportEntries}from'./nativeImportEntries.js';import{summarizeNativeImportLosses}from'./summarizeNativeImportLosses.js';
export function createNativeImportResultContract(importResult, options = {}) {
  if (!importResult || typeof importResult !== 'object') {
    throw new Error('createNativeImportResultContract requires a native import result');
  }
  const imports = nativeImportEntries(importResult);
  const evidence = uniqueByEvidenceId([
    ...(importResult.evidence ?? []),
    ...imports.flatMap((imported) => imported?.evidence ?? [])
  ]);
  const losses = uniqueByLossId([
    ...(importResult.losses ?? []),
    ...imports.flatMap((imported) => imported?.losses ?? imported?.nativeAst?.losses ?? [])
  ]);
  const sourceMaps = collectImportSourceMaps(importResult, imports);
  const regionSummary = summarizeImportRegions(importResult, imports, options);
  const sourceMapSummary = summarizeImportSourceMaps(sourceMaps);
  const sourcePreservation = summarizeImportSourcePreservation(importResult, imports);
  const adapterCoverage = summarizeImportAdapterCoverage(importResult, imports);
  const primary = imports[0] ?? importResult;
  const nativeSource = importResult.nativeSource ?? importResult.nativeSources?.[0] ?? primary?.nativeSource;
  const nativeAst = importResult.nativeAst ?? nativeSource?.ast ?? primary?.nativeAst ?? primary?.nativeSource?.ast;
  const semanticIndex = importResult.semanticIndex ?? importResult.universalAst?.semanticIndex ?? primary?.semanticIndex ?? primary?.universalAst?.semanticIndex;
  const lossSummary = options.lossSummary ?? importResult.metadata?.nativeImportLossSummary ?? summarizeNativeImportLosses(losses, {
    evidence,
    parser: nativeAst?.parser,
    scanKind: importResult.metadata?.scanKind,
    semanticStatus: importResult.metadata?.semanticStatus ?? importResult.universalAst?.metadata?.semanticStatus
  });
  const mergeCandidates = [
    ...(importResult.mergeCandidates ?? []),
    ...imports.flatMap((imported) => imported?.mergeCandidates ?? [])
  ];
  const readiness = summarizeImportContractReadiness(importResult, mergeCandidates, lossSummary);
  const defaultSidecarId = defaultSemanticImportSidecarId(importResult, imports);
  return {
    kind: 'frontier.lang.nativeImportResultContract',
    version: 1,
    importResultId: importResult.id,
    language: importResult.language ?? (imports.length === 1 ? imports[0]?.language : 'mixed'),
    sourcePath: importResult.sourcePath ?? primary?.sourcePath ?? nativeSource?.sourcePath ?? nativeAst?.sourcePath,
    sourceHash: nativeSource?.sourceHash ?? nativeAst?.sourceHash,
    sourceCount: imports.length,
    sources: imports.map((imported, index) => compactImportContractSource(imported, index)),
    ids: {
      nativeSourceId: nativeSource?.id,
      nativeAstId: nativeAst?.id,
      semanticIndexId: semanticIndex?.id,
      universalAstId: importResult.universalAst?.id ?? primary?.universalAst?.id,
      patchId: importResult.patch?.id,
      sourceMapIds: sourceMapSummary.ids,
      semanticSidecarIds: uniqueStrings([
        ...normalizeStringList(options.semanticSidecarIds ?? options.sidecarIds ?? options.sidecarId),
        defaultSidecarId
      ])
    },
    sourcePreservation,
    adapterCoverage,
    lossSummary,
    regions: regionSummary,
    sourceMaps: sourceMapSummary,
    readiness,
    evidence: {
      total: evidence.length,
      failed: evidence.filter((record) => record?.status === 'failed').map((record) => record.id).filter(Boolean),
      ids: evidence.map((record) => record.id).filter(Boolean)
    },
    metadata: {
      parser: nativeAst?.parser,
      semanticStatus: importResult.metadata?.semanticStatus ?? importResult.universalAst?.metadata?.semanticStatus,
      projectRoot: importResult.projectRoot,
      defaultSemanticSidecarId: defaultSidecarId,
      note: 'Contract summarizes import-result evidence for merge admission; it does not upgrade lightweight scans into exact semantic imports.',
      ...options.metadata
    }
  };
}
