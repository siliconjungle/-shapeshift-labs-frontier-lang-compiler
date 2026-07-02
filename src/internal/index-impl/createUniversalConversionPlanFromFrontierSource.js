import { parseFrontierFile, parseFrontierSource } from '@shapeshift-labs/frontier-lang-parser';
import { createUniversalConversionPlan } from './createUniversalConversionPlan.js';
import { authoredTargetProjectionSummary, authoredTargetProjections } from './authoredTargetProjections.js';
import { normalizeDocumentConversionPlanMetadata } from './documentConversionPlanInput.js';

export function createUniversalConversionPlanFromFrontierSource(source, options = {}) {
  const { fileName, parse, sourcePath, ...planOptions } = options;
  const document = normalizeDocumentConversionPlanMetadata(fileName ? parseFrontierFile(fileName, source) : parseFrontierSource(source, parse));
  const plan = createUniversalConversionPlan({ ...planOptions, document });
  return {
    ...plan,
    document,
    ...(sourcePath ?? fileName ? { sourcePath: sourcePath ?? fileName } : {}),
    metadata: {
      ...plan.metadata,
      authoredFrontierSource: sourceMetadata(document, sourcePath ?? fileName)
    }
  };
}

function sourceMetadata(document, sourcePath) {
  const authored = document.metadata?.universalConversionPlan;
  const constraintSpaces = document.metadata?.constraintSpaces;
  const decisionGraph = document.metadata?.decisionGraph;
  const resourceGraphs = document.metadata?.semanticResourceGraphs;
  const interlingua = document.metadata?.universalInterlingua;
  const dialects = document.metadata?.dialects;
  const packageManifests = document.metadata?.packageManifests;
  const canvasSurfaces = document.metadata?.canvasSurfaces;
  const applicationSurfaces = document.metadata?.applicationSurfaces;
  const runtimeCapabilities = document.metadata?.runtimeCapabilities;
  const targetProjections = authoredTargetProjections(document);
  const targetProjectionSummary = authoredTargetProjectionSummary(targetProjections);
  return {
    documentId: document.id,
    ...(sourcePath ? { sourcePath } : {}),
    conversionPlanId: authored?.id,
    targets: authored?.targets ?? [],
    constraintFamilies: Object.keys(authored ?? {}).filter((key) => key.endsWith('Constraints') || key === 'resourceTransfers'),
    constraintSpaceId: constraintSpaces?.id,
    constraintSpaceIds: ids(constraintSpaces?.spaces),
    constraintSpaceVariableIds: constraintSpaces?.variableIds ?? [],
    constraintSpaceConstraintIds: constraintSpaces?.constraintIds ?? [],
    constraintSpacePreferenceIds: constraintSpaces?.preferenceIds ?? [],
    constraintSpaceCollapseStrategyIds: constraintSpaces?.collapseStrategyIds ?? [],
    constraintSpaceAdmissionIds: constraintSpaces?.admissionIds ?? [],
    constraintSpaceTargets: constraintSpaces?.targets ?? [],
    constraintSpaceEvidenceIds: uniqueConstraintSpaceEvidenceIds(constraintSpaces),
    constraintSpaceFailClosedIds: uniqueConstraintSpaceFailClosedIds(constraintSpaces),
    constraintSpaceSummary: constraintSpaces?.summary,
    sourceRuntimes: authored?.sourceRuntimes ?? {},
    targetRuntimes: authored?.targetRuntimes ?? {},
    runtimeRequirementIds: ids(authored?.runtimeRequirements),
    dialectRecordIds: ids(authored?.dialects),
    externRecordIds: ids(authored?.externs),
    dialectRegistryId: dialects?.id,
    dialectRegistryRecordIds: ids(dialects?.dialects),
    dialectRegistryExternIds: ids(dialects?.externs),
    dialectRegistrySummary: dialects?.summary,
    decisionGraphId: decisionGraph?.id,
    decisionGraphIds: decisionGraph?.graphIds ?? [],
    decisionGraphRecordIds: decisionGraph?.recordIds ?? [],
    decisionGraphGateIds: decisionGraph?.gateIds ?? [],
    decisionGraphEvidenceIds: decisionGraph?.evidenceIds ?? [],
    decisionGraphSemanticChangeIds: decisionGraph?.semanticChangeIds ?? [],
    decisionGraphPatchEventIds: decisionGraph?.patchEventIds ?? [],
    decisionGraphAdmissionDecisionIds: decisionGraph?.admissionDecisionIds ?? [],
    decisionGraphDecisionIds: decisionGraph?.decisionIds ?? [],
    decisionGraphReplayRecordIds: decisionGraph?.replayRecordIds ?? [],
    decisionGraphTournamentRecordIds: decisionGraph?.tournamentRecordIds ?? [],
    decisionGraphRsiLoopIds: decisionGraph?.rsiLoopIds ?? [],
    decisionGraphSummary: decisionGraph?.summary,
    semanticResourceGraphId: resourceGraphs?.id,
    semanticResourceGraphIds: resourceGraphs?.graphIds ?? [],
    semanticResourceGraphRecordIds: resourceGraphs?.recordIds ?? [],
    semanticResourceGraphResourceIds: resourceGraphs?.resourceIds ?? [],
    semanticResourceGraphOwnerIds: resourceGraphs?.ownerIds ?? [],
    semanticResourceGraphLoanIds: resourceGraphs?.loanIds ?? [],
    semanticResourceGraphAliasIds: resourceGraphs?.aliasIds ?? [],
    semanticResourceGraphMoveIds: resourceGraphs?.moveIds ?? [],
    semanticResourceGraphDropIds: resourceGraphs?.dropIds ?? [],
    semanticResourceGraphEscapeIds: resourceGraphs?.escapeIds ?? [],
    semanticResourceGraphLifetimeRegionIds: resourceGraphs?.lifetimeRegionIds ?? [],
    semanticResourceGraphLifetimeRelationIds: resourceGraphs?.lifetimeRelationIds ?? [],
    semanticResourceGraphBorrowScopeIds: resourceGraphs?.borrowScopeIds ?? [],
    semanticResourceGraphUnsafeBoundaryIds: resourceGraphs?.unsafeBoundaryIds ?? [],
    semanticResourceGraphConflictIds: resourceGraphs?.conflictIds ?? [],
    semanticResourceGraphProofObligationIds: resourceGraphs?.proofObligationIds ?? [],
    semanticResourceGraphSummary: resourceGraphs?.summary,
    universalInterlinguaId: interlingua?.id,
    universalInterlinguaRecordIds: interlingua?.interlinguaRecordIds ?? [],
    universalInterlinguaLayerIds: interlingua?.layerIds ?? [],
    universalInterlinguaConstraintIds: interlingua?.constraintIds ?? [],
    universalInterlinguaObligationIds: interlingua?.obligationIds ?? [],
    universalInterlinguaLoweringIds: interlingua?.loweringIds ?? [],
    universalInterlinguaLiftIds: interlingua?.liftIds ?? [],
    universalInterlinguaEvidenceIds: interlingua?.evidenceIds ?? [],
    universalInterlinguaRouteIds: interlingua?.routeIds ?? [],
    universalInterlinguaSummary: interlingua?.summary,
    packageManifestId: packageManifests?.id,
    packageManifestIds: packageManifests?.manifestIds ?? [],
    packageManifestRecordIds: packageManifests?.recordIds ?? [],
    packageManifestEvidenceIds: packageManifests?.evidenceIds ?? [],
    packageManifestProofGapCodes: packageManifests?.proofGapCodes ?? [],
    packageManifestSummary: packageManifests?.summary,
    canvasSurfaceId: canvasSurfaces?.id,
    canvasSurfaceIds: canvasSurfaces?.surfaceIds ?? [],
    canvasSurfaceRecordIds: canvasSurfaces?.recordIds ?? [],
    canvasSurfaceCommandTraceIds: canvasSurfaces?.commandTraceIds ?? [],
    canvasSurfaceEvidenceIds: canvasSurfaces?.evidenceIds ?? [],
    canvasSurfaceProofGapCodes: canvasSurfaces?.proofGapCodes ?? [],
    canvasSurfaceSummary: canvasSurfaces?.summary,
    applicationSurfaceId: applicationSurfaces?.id,
    applicationSurfaceIds: applicationSurfaces?.surfaceIds ?? [],
    applicationSurfaceRecordIds: applicationSurfaces?.recordIds ?? [],
    applicationSurfaceMountIds: applicationSurfaces?.mountIds ?? [],
    applicationSurfaceProvidedSurfaceIds: applicationSurfaces?.providedSurfaceIds ?? [],
    applicationSurfaceRequiredCapabilityIds: applicationSurfaces?.requiredCapabilityIds ?? [],
    applicationSurfaceRouteIds: applicationSurfaces?.routeIds ?? [],
    applicationSurfaceEventIds: applicationSurfaces?.eventIds ?? [],
    applicationSurfaceAssetIds: applicationSurfaces?.assetIds ?? [],
    applicationSurfaceGateIds: applicationSurfaces?.gateIds ?? [],
    applicationSurfaceEvidenceIds: applicationSurfaces?.evidenceIds ?? [],
    applicationSurfaceProofGapCodes: applicationSurfaces?.proofGapCodes ?? [],
    applicationSurfaceSummary: applicationSurfaces?.summary,
    runtimeCapabilityId: runtimeCapabilities?.id,
    runtimeCapabilityIds: runtimeCapabilities?.blockIds ?? [],
    runtimeCapabilityHostProfileIds: runtimeCapabilities?.hostProfileIds ?? [],
    runtimeCapabilitySourceHostIds: runtimeCapabilities?.sourceHostIds ?? [],
    runtimeCapabilityTargetHostIds: runtimeCapabilities?.targetHostIds ?? [],
    runtimeCapabilityHostCapabilityIds: runtimeCapabilities?.hostCapabilityIds ?? [],
    runtimeCapabilityHostBindingIds: runtimeCapabilities?.hostBindingIds ?? [],
    runtimeCapabilityRequirementIds: runtimeCapabilities?.runtimeRequirementIds ?? [],
    runtimeCapabilityEvidenceIds: runtimeCapabilities?.evidenceIds ?? [],
    runtimeCapabilityProofGapCodes: runtimeCapabilities?.proofGapCodes ?? [],
    runtimeCapabilitySummary: runtimeCapabilities?.summary,
    targetProjectionIds: targetProjectionSummary.contractIds,
    targetProjectionContractIds: targetProjectionSummary.contractIds,
    targetProjectionLayerIds: targetProjectionSummary.layerIds,
    targetProjectionAdapterIds: targetProjectionSummary.adapterIds,
    targetProjectionEvidenceIds: targetProjectionSummary.evidenceIds,
    targetProjectionProofEvidenceIds: targetProjectionSummary.proofEvidenceIds,
    targetProjectionLossIds: targetProjectionSummary.lossIds,
    targetProjectionMissingEvidence: targetProjectionSummary.missingEvidence,
    targetProjectionRepresentedLayerKinds: targetProjectionSummary.representedLayerKinds,
    targetProjectionMissingLayerKinds: targetProjectionSummary.missingLayerKinds,
    targetProjectionReadinesses: targetProjectionSummary.readinesses,
    targetProjectionSummary
  };
}

function ids(records = []) {
  return records.map((record) => record?.id).filter(Boolean);
}

function uniqueConstraintSpaceEvidenceIds(constraintSpaces) {
  return [...new Set((constraintSpaces?.spaces ?? []).flatMap((space) => [
    ...(space.variables ?? []).flatMap((record) => record.evidenceIds ?? []),
    ...(space.constraints ?? []).flatMap((record) => record.evidenceIds ?? []),
    ...(space.preferences ?? []).flatMap((record) => record.evidenceIds ?? []),
    ...(space.collapseStrategies ?? []).flatMap((record) => record.evidenceIds ?? []),
    ...(space.admissions ?? []).flatMap((record) => record.evidenceIds ?? [])
  ]).filter(Boolean))];
}

function uniqueConstraintSpaceFailClosedIds(constraintSpaces) {
  return [...new Set((constraintSpaces?.spaces ?? []).flatMap((space) => [
    ...(space.constraints ?? []),
    ...(space.admissions ?? [])
  ]).filter((record) => record.failClosed).map((record) => record.id).filter(Boolean))];
}
