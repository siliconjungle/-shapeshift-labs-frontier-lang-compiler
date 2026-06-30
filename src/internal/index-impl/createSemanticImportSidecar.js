import{idFragment,maxSemanticMergeReadiness,uniqueRecordsById}from'../../native-import-utils.js';import{summarizeSemanticImportDependencies}from'../../semantic-import-dependencies.js';import{createSemanticGraphLayerSummary}from'../../semantic-import-graph-layers.js';import{createSemanticImportImpact}from'../../semantic-import-impact.js';import{summarizeSemanticImportSidecarParadigmSemantics,summarizeSemanticImportSidecarProofSpec,summarizeSemanticImportSidecarUniversalAstLayers}from'../../semantic-import-layers.js';import{semanticPatchHintForRegion,summarizeSemanticImportRegionTaxonomy}from'../../semantic-import-regions.js';import{createSemanticResourceGraph}from'../../semantic-resource-graph.js';import{semanticImportSidecarEntry}from'../../semantic-import-sidecar-entry.js';import{summarizeKernelSourcePreservation}from'../../semantic-import-source-preservation.js';
import{createSemanticImportSidecarAdmission,createSemanticImportSidecarQuality}from'./createSemanticImportSidecarAdmission.js';
import{summarizeNativeImportLosses}from'./summarizeNativeImportLosses.js';
export function createSemanticImportSidecar(importResult, options = {}) {
  const imports = Array.isArray(importResult?.imports) ? importResult.imports : [importResult].filter(Boolean);
  const importEntries = imports.map((imported, index) => semanticImportSidecarEntry(imported, index, options));
  const symbols = importEntries.flatMap((entry) => entry.symbols);
  const ownershipRegions = uniqueRecordsById(importEntries.flatMap((entry) => entry.ownershipRegions));
  const sourceMaps = imports.flatMap((imported) => imported?.sourceMaps ?? imported?.universalAst?.sourceMaps ?? []);
  const sourceMapMappings = sourceMaps.flatMap((sourceMap) => sourceMap?.mappings ?? []);
  const losses = imports.flatMap((imported) => imported?.losses ?? []);
  const evidence = uniqueRecordsById(imports.flatMap((imported) => imported?.evidence ?? []));
  const mergeCandidates = imports.flatMap((imported) => imported?.mergeCandidates ?? []);
  const lossSummary = summarizeNativeImportLosses(losses, { evidence });
  const regionTaxonomy = summarizeSemanticImportRegionTaxonomy(ownershipRegions);
  const sourcePreservation = summarizeKernelSourcePreservation(importResult, imports);
  const universalAstLayers = summarizeSemanticImportSidecarUniversalAstLayers(importEntries);
  const proofSpec = summarizeSemanticImportSidecarProofSpec(importEntries);
  const paradigmSemantics = summarizeSemanticImportSidecarParadigmSemantics(importEntries);
  const dependencies = summarizeSemanticImportDependencies(imports);
  const resourceGraph = createSemanticResourceGraph({
    id: `resource_graph_${idFragment(importResult?.id ?? importResult?.projectRoot ?? imports[0]?.sourcePath ?? imports[0]?.language ?? 'source')}`,
    language: importResult?.language ?? (imports.length === 1 ? imports[0]?.language : 'mixed'),
    imports,
    ownershipRegions,
    paradigmSemantics,
    evidence
  });
  const entryReadiness = importEntries.reduce(
    (current, entry) => maxSemanticMergeReadiness(current, entry.readiness),
    lossSummary.semanticMergeReadiness
  );
  const readiness = mergeCandidates.reduce(
    (current, candidate) => maxSemanticMergeReadiness(current, candidate.readiness),
    entryReadiness
  );
  const patchHints = ownershipRegions.map((region) => semanticPatchHintForRegion(region, readiness, options));
  const quality = createSemanticImportSidecarQuality({
    expected: options.expected === true || options.semanticImportExpected === true,
    expectedEmpty: options.expectedEmpty === true || options.semanticImportExpectedEmpty === true,
    importEntries,
    symbols,
    ownershipRegions,
    patchHints,
    proofSpec,
    evidence,
    readiness
  });
  const admission = createSemanticImportSidecarAdmission(quality, readiness);
  const semanticImpact = createSemanticImportImpact({
    imports,
    symbols,
    ownershipRegions,
    sourceMapMappings,
    sourcePreservation,
    dependencies,
    patchHints,
    proofSpec,
    evidence: {
      total: evidence.length,
      failed: evidence.filter((record) => record.status === 'failed').map((record) => record.id),
      ids: evidence.map((record) => record.id)
    },
    readiness
  });
  const graphLayers = createSemanticGraphLayerSummary({
    importResult,
    imports,
    importEntries,
    symbols,
    ownershipRegions,
    sourceMaps,
    sourceMapMappings,
    sourcePreservation,
    universalAstLayers,
    proofSpec,
    paradigmSemantics,
    dependencies,
    semanticImpact,
    resourceGraph,
    patchHints,
    quality,
    admission,
    mergeCandidates,
    losses,
    evidence,
    readiness
  });
  return {
    kind: 'frontier.lang.semanticImportSidecar',
    version: 1,
    id: options.id ?? `semantic_import_${idFragment(importResult?.id ?? importResult?.projectRoot ?? imports[0]?.sourcePath ?? imports[0]?.language ?? 'source')}`,
    generatedAt: options.generatedAt ?? Date.now(),
    language: importResult?.language ?? (imports.length === 1 ? imports[0]?.language : 'mixed'),
    projectRoot: importResult?.projectRoot,
    imports: importEntries.map(({ ownershipRegions: _regions, symbols: _symbols, ...entry }) => entry),
    symbols,
    ownershipRegions,
    sourceMaps: {
      total: sourceMaps.length,
      mappings: sourceMapMappings.length,
      ids: sourceMaps.map((sourceMap) => sourceMap.id).filter(Boolean)
    },
    sourcePreservation,
    universalAstLayers,
    proofSpec,
    paradigmSemantics,
    dependencies,
    resourceGraph,
    graphLayers,
    semanticImpact,
    patchHints,
    quality,
    admission,
    mergeCandidates: mergeCandidates.map((candidate) => ({
      id: candidate.id,
      readiness: candidate.readiness,
      reasons: candidate.reasons ?? [],
      conflictClasses: (candidate.conflictClasses ?? candidate.metadata?.conflictClasses ?? []).map((record) => record.class).filter(Boolean),
      conflictSummary: candidate.conflictSummary ?? candidate.metadata?.conflictSummary,
      changedSemanticRegions: candidate.changedSemanticRegions?.length ?? candidate.mergeAdmission?.changedSemanticRegions?.length ?? 0,
      sourceHashes: candidate.sourceHashes ?? candidate.mergeAdmission?.sourceHashes,
      evidenceIds: candidate.evidenceIds ?? candidate.mergeAdmission?.evidenceIds ?? [],
      projectionRisk: candidate.projectionRisk ?? candidate.mergeAdmission?.projectionRisk,
      readinessSortKey: candidate.readinessSortKey ?? candidate.mergeAdmission?.readinessSortKey,
      overlapSummary: candidate.mergeAdmission?.overlapSummary,
      risk: candidate.risk,
      operationCount: candidate.operations?.length ?? candidate.patch?.operations?.length ?? 0
    })),
    losses: {
      total: losses.length,
      byKind: lossSummary.byKind,
      bySeverity: lossSummary.bySeverity,
      categories: lossSummary.categories,
      blockingLossIds: lossSummary.blockingLossIds,
      reviewLossIds: lossSummary.reviewLossIds
    },
    regionTaxonomy,
    evidence: {
      total: evidence.length,
      failed: evidence.filter((record) => record.status === 'failed').map((record) => record.id),
      ids: evidence.map((record) => record.id)
    },
    summary: {
      imports: imports.length,
      symbols: symbols.length,
      ownershipRegions: ownershipRegions.length,
      regionKinds: regionTaxonomy.presentKinds.length,
      sourceMapMappings: sourceMapMappings.length,
      sourcePreservationRecords: sourcePreservation.total,
      universalAstLayers: universalAstLayers.total,
      universalAstLayerNames: universalAstLayers.names,
      proofSpecRecords: proofSpec.total,
      proofSpecObligations: proofSpec.obligations,
      proofSpecFailedObligations: proofSpec.failed,
      paradigmSemanticsRecords: paradigmSemantics.total,
      paradigmSemanticsGroups: paradigmSemantics.groups.length,
      paradigmSemanticsLoweringRecords: paradigmSemantics.loweringRecords,
      resourceGraphRecords: resourceGraph.summary.records,
      resourceGraphResources: resourceGraph.summary.resources,
      resourceGraphLoans: resourceGraph.summary.loans,
      resourceGraphAliases: resourceGraph.summary.aliases,
      resourceGraphMoves: resourceGraph.summary.moves,
      resourceGraphDrops: resourceGraph.summary.drops,
      resourceGraphEscapes: resourceGraph.summary.escapes,
      resourceGraphLifetimeRegions: resourceGraph.summary.lifetimeRegions,
      resourceGraphUnsafeBoundaries: resourceGraph.summary.unsafeBoundaries,
      resourceGraphConflicts: resourceGraph.summary.conflicts,
      dependencyRelations: dependencies.total,
      dependencyPredicates: dependencies.predicates,
      graphLayers: graphLayers.summary.total,
      graphLayersUsable: graphLayers.summary.usable,
      graphLayerStatus: graphLayers.status,
      semanticImpactRecords: semanticImpact.summary.total,
      semanticImpactHighRiskRecords: semanticImpact.summary.byRisk.high ?? 0,
      semanticImpactRequiredVerificationSteps: semanticImpact.summary.requiredVerificationSteps,
      patchHints: patchHints.length,
      evidenceWarnings: quality.emptyEvidenceWarnings.length,
      semanticImportExpected: quality.expected,
      semanticImportExpectedEmpty: quality.expectedEmpty,
      semanticImportExpectedSatisfied: quality.expectedSatisfied,
      semanticImportExpectedMissingReasonCodes: quality.expectedMissingReasonCodes,
      semanticImportRecordClassification: quality.record.classification,
      semanticImportRecordReasonCode: quality.record.reasonCode,
      semanticImportRecordAction: quality.record.action,
      readiness,
      emptySemanticIndex: symbols.length === 0
    },
    metadata: {
      note: 'Sidecar is source-addressable semantic evidence for merge admission; lightweight scanner regions remain review-required unless exact parser evidence upgrades readiness.',
      ...options.metadata
    }
  };
}
