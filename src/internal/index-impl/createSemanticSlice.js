import{idFragment,uniqueStrings}from'../../native-import-utils.js';import{createSemanticMergeCandidateRecord}from'@shapeshift-labs/frontier-lang-kernel';
import{createSemanticImportSidecar}from'./createSemanticImportSidecar.js';import{nativeNodeId}from'./nativeNodeId.js';import{readStringArray}from'./readStringArray.js';import{selectSemanticSliceRecords}from'./selectSemanticSliceRecords.js';import{semanticSliceContext}from'./semanticSliceContext.js';import{semanticSliceExpectedAssertions}from'./semanticSliceExpectedAssertions.js';import{semanticSliceReadiness}from'./semanticSliceReadiness.js';import{semanticSliceReasons}from'./semanticSliceReasons.js';import{semanticSliceRecords}from'./semanticSliceRecords.js';import{semanticSliceSourceFiles}from'./semanticSliceSourceFiles.js';import{semanticSliceSourceMapLinks}from'./semanticSliceSourceMapLinks.js';import{semanticSliceSourceSpans}from'./semanticSliceSourceSpans.js';import{semanticSliceTouchedSymbol}from'./semanticSliceTouchedSymbol.js';
export function createSemanticSlice(input, options = {}) {
  const context = semanticSliceContext(input, options);
  const sidecar = context.sidecar ?? (context.importResult ? createSemanticImportSidecar(context.importResult, {
    generatedAt: options.generatedAt,
    regionPrefix: options.regionPrefix
  }) : undefined);
  const records = semanticSliceRecords(context, sidecar);
  const entryRefs = uniqueStrings([
    ...readStringArray(options.entryRefs),
    ...readStringArray(options.semanticRefs),
    ...readStringArray(options.refs),
    ...(options.symbol ? [`symbol:${options.symbol}`] : []),
    ...(options.region ? [`region:${options.region}`] : []),
    ...(options.nativeNodeId ? [`native:${options.nativeNodeId}`] : []),
    ...(options.sourcePath ? [`path:${options.sourcePath}`] : [])
  ]);
  const selection = selectSemanticSliceRecords(records, {
    entryRefs,
    includeDependencies: options.includeDependencies !== false,
    maxDependencyDepth: Number.isFinite(options.maxDependencyDepth) ? Math.max(0, Math.floor(options.maxDependencyDepth)) : 2
  });
  const sourceSpans = semanticSliceSourceSpans(selection);
  const sourceFiles = semanticSliceSourceFiles(sourceSpans, context, options);
  const sourceMapLinks = semanticSliceSourceMapLinks(selection);
  const conflictKeys = uniqueStrings([
    ...selection.regions.map((region) => region.conflictKey),
    ...selection.regions.map((region) => region.key ? `region:${region.key}` : region.id ? `region:${region.id}` : undefined),
    ...selection.symbols.map((symbol) => symbol.metadata?.ownershipRegionKey ? `region:${symbol.metadata.ownershipRegionKey}` : undefined),
    ...selection.symbols.map((symbol) => symbol.id ? `symbol:${symbol.id}` : undefined),
    ...sourceFiles.map((file) => file.path ? `source:${file.path}` : undefined)
  ].filter(Boolean));
  const unresolvedEntryRefs = entryRefs.filter((entryRef) => !selection.matchedEntryRefs.includes(entryRef));
  const readiness = semanticSliceReadiness(context, selection, unresolvedEntryRefs);
  const reasons = semanticSliceReasons(context, selection, unresolvedEntryRefs, readiness);
  const idPart = idFragment(options.id ?? entryRefs.join('_') ?? context.sourcePath ?? context.language ?? context.importResult?.id ?? context.universalAst?.id ?? 'semantic_slice');
  const evidence = [{
    id: options.evidenceId ?? `evidence_${idPart}_semantic_slice`,
    kind: 'semantic-slice',
    status: readiness === 'blocked' ? 'failed' : 'passed',
    path: context.sourcePath,
    summary: `Created semantic slice with ${selection.symbols.length} symbol(s), ${selection.regions.length} ownership region(s), and ${sourceMapLinks.length} source-map link(s).`,
    metadata: {
      entryRefs,
      unresolvedEntryRefs,
      importId: context.importResult?.id,
      universalAstId: context.universalAst?.id,
      semanticIndexId: context.semanticIndex?.id,
      sidecarId: sidecar?.id
    }
  }];
  const mergeCandidate = createSemanticMergeCandidateRecord({
    id: options.mergeCandidateId ?? `merge_candidate_${idPart}_semantic_slice`,
    importResultId: context.importResult?.id,
    language: context.language,
    sourcePath: context.sourcePath,
    touchedSymbols: selection.symbols.map(semanticSliceTouchedSymbol),
    touchedSemanticNodes: [],
    nativeSpans: sourceSpans,
    conflictKeys,
    readiness,
    reasons,
    evidence,
    metadata: {
      kind: 'semantic-slice',
      sidecarId: sidecar?.id,
      sourceMapLinks: sourceMapLinks.length,
      nativeNodeIds: selection.nativeNodes.map((node) => node.id),
      dependencyRelationIds: selection.relations.map((relation) => relation.id).filter(Boolean),
      autoMergeClaim: false
    }
  });
  return {
    kind: 'frontier.lang.semanticSlice',
    version: 1,
    id: options.id ?? `semantic_slice_${idPart}`,
    generatedAt: options.generatedAt ?? Date.now(),
    language: context.language,
    sourcePath: context.sourcePath,
    importId: context.importResult?.id,
    universalAstId: context.universalAst?.id,
    semanticIndexId: context.semanticIndex?.id,
    sidecarId: sidecar?.id,
    entryRefs,
    matchedEntryRefs: selection.matchedEntryRefs,
    unresolvedEntryRefs,
    symbols: selection.symbols,
    ownershipRegions: selection.regions,
    nativeNodes: selection.nativeNodes,
    relations: selection.relations,
    occurrences: selection.occurrences,
    sourceMapLinks,
    sourceSpans,
    sourceFiles,
    losses: selection.losses,
    evidence,
    mergeCandidate,
    verification: {
      focusedCommands: readStringArray(options.focusedCommands),
      fixtureHints: readStringArray(options.fixtureHints),
      expectedAssertions: semanticSliceExpectedAssertions(selection, unresolvedEntryRefs)
    },
    summary: {
      symbols: selection.symbols.length,
      ownershipRegions: selection.regions.length,
      nativeNodes: selection.nativeNodes.length,
      relations: selection.relations.length,
      occurrences: selection.occurrences.length,
      sourceMapLinks: sourceMapLinks.length,
      sourceFiles: sourceFiles.length,
      losses: selection.losses.length,
      conflictKeys: conflictKeys.length,
      readiness,
      unresolvedEntryRefs: unresolvedEntryRefs.length,
      sourceTextAvailable: sourceFiles.some((file) => file.excerptCount > 0)
    },
    mergeAdmission: {
      autoMergeClaim: false,
      reviewRequired: readiness !== 'ready',
      readiness,
      reasons,
      conflictKeys,
      ownershipKeys: uniqueStrings(selection.regions.map((region) => region.key).filter(Boolean)),
      sourceHashes: sourceFiles.map((file) => ({ path: file.path, sourceHash: file.sourceHash })).filter((file) => file.path || file.sourceHash),
      staleCheck: {
        mode: 'source-hash',
        requiresCurrentSource: sourceFiles.some((file) => file.sourceHash),
        sourceFiles: sourceFiles.length
      }
    },
    metadata: {
      note: 'Semantic slices are focused source-addressable evidence for agent isolation and merge admission; they are not correctness proofs.',
      ...options.metadata
    }
  };
}
