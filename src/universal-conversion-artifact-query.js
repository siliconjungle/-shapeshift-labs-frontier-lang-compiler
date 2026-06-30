import { uniqueStrings } from './native-import-utils.js';
import { artifactSemanticEditIndex } from './universal-conversion-artifact-semantic-edit.js';
import { interlinguaRecordMatches } from './universal-interlingua-record.js';
import { resourceTransferMatches } from './universal-resource-transfer.js';

export function queryUniversalConversionArtifacts(records, query = {}) {
  return artifactRecords(records)
    .filter((record) => matchesArtifact(record, query))
    .sort((left, right) => Number(right.mergeScore?.sortKey ?? 0) - Number(left.mergeScore?.sortKey ?? 0)
      || String(left.routeId).localeCompare(String(right.routeId)));
}

export function artifactIndex(routeArtifacts) {
  const semanticEditIndexes = routeArtifacts.map(artifactSemanticEditIndex);
  const semanticOperations = routeArtifacts.flatMap(artifactSemanticOperations);
  return {
    routeIds: uniqueStrings(routeArtifacts.map((artifact) => artifact.routeId)),
    historyIds: uniqueStrings(routeArtifacts.map((artifact) => artifact.history.id)),
    patchBundleIds: uniqueStrings(routeArtifacts.map((artifact) => artifact.patchBundle.id)),
    admissionRecordIds: uniqueStrings(routeArtifacts.map((artifact) => artifact.admissionRecord.id)),
    evidenceReceiptIds: uniqueStrings(routeArtifacts.map((artifact) => artifact.evidenceReceipt?.id)),
    languages: uniqueStrings(routeArtifacts.map((artifact) => artifact.sourceLanguage)),
    targets: uniqueStrings(routeArtifacts.map((artifact) => artifact.target)),
    modes: uniqueStrings(routeArtifacts.map((artifact) => artifact.mode)),
    lossClasses: uniqueStrings(routeArtifacts.map((artifact) => artifact.lossClass)),
    adapterIds: uniqueStrings(routeArtifacts.map((artifact) => artifact.adapter)),
    adapterKinds: uniqueStrings(routeArtifacts.map((artifact) => artifact.adapterKind)),
    routeMissingEvidence: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.missingEvidence ?? [])),
    runtimeAdapterRequirementIds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.runtimeAdapterRequirementIds ?? [])),
    blockers: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.blockers ?? [])),
    reviewReasons: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.review ?? [])),
    readinesses: uniqueStrings(routeArtifacts.map((artifact) => artifact.readiness)),
    admissionStatuses: uniqueStrings(routeArtifacts.map((artifact) => artifact.admissionStatus)),
    admissionBuckets: uniqueStrings(routeArtifacts.map((artifact) => artifact.admissionRecord.admissionBucket)),
    admissionRisks: uniqueStrings(routeArtifacts.map((artifact) => artifact.admissionRecord.risk)),
    sourcePaths: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.history.index.sourcePaths)),
    sourceHashes: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.history.index.sourceHashes)),
    ownershipKeys: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.history.index.ownershipKeys)),
    conflictKeys: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.history.index.conflictKeys)),
    evidenceIds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.history.evidenceIds)),
    proofIds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.history.proofIds)),
    evidenceReceiptEvidenceIds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.evidenceReceipt?.evidenceIds ?? [])),
    evidenceReceiptProofEvidenceIds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.evidenceReceipt?.proofEvidenceIds ?? [])),
    evidenceReceiptMissingEvidence: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.evidenceReceipt?.missingEvidence ?? [])),
    evidenceReceiptRejectedReasons: uniqueStrings(routeArtifacts.flatMap((artifact) => (artifact.evidenceReceipt?.records?.rejected ?? []).map((record) => record.reason))),
    evidenceReceiptRejectedIds: uniqueStrings(routeArtifacts.flatMap((artifact) => (artifact.evidenceReceipt?.records?.rejected ?? []).map((record) => record.id))),
    semanticOperationIds: uniqueStrings(semanticOperations.map((operation) => operation.id)),
    semanticOperationKinds: uniqueStrings(semanticOperations.map((operation) => operation.operationKind)),
    semanticOperationInterlinguaRecordIds: uniqueStrings(semanticOperations.map((operation) => operation.metadata?.interlingua?.id)),
    semanticOperationInterlinguaLoweringDispositions: uniqueStrings(semanticOperations.map((operation) => operation.metadata?.interlingua?.loweringDisposition)),
    semanticOperationInterlinguaMissingEvidence: uniqueStrings(semanticOperations.flatMap((operation) => operation.metadata?.interlingua?.missingEvidence ?? [])),
    semanticOperationInterlinguaProofEvidenceIds: uniqueStrings(semanticOperations.flatMap((operation) => operation.metadata?.interlingua?.proofEvidenceIds ?? [])),
    semanticEditStatuses: uniqueStrings(semanticEditIndexes.flatMap((index) => index.semanticEditStatuses)),
    semanticEditScriptIds: uniqueStrings(semanticEditIndexes.flatMap((index) => index.semanticEditScriptIds)),
    semanticEditProjectionIds: uniqueStrings(semanticEditIndexes.flatMap((index) => index.semanticEditProjectionIds)),
    semanticEditReplayIds: uniqueStrings(semanticEditIndexes.flatMap((index) => index.semanticEditReplayIds)),
    semanticEditReplayStatuses: uniqueStrings(semanticEditIndexes.flatMap((index) => index.semanticEditReplayStatuses)),
    semanticEditReplayActions: uniqueStrings(semanticEditIndexes.flatMap((index) => index.semanticEditReplayActions)),
    semanticEditAdmissionStatuses: uniqueStrings(semanticEditIndexes.flatMap((index) => index.semanticEditAdmissionStatuses)),
    semanticEditAdmissionActions: uniqueStrings(semanticEditIndexes.flatMap((index) => index.semanticEditAdmissionActions)),
    semanticEditAdmissionReadinesses: uniqueStrings(semanticEditIndexes.flatMap((index) => index.semanticEditAdmissionReadinesses)),
    semanticEditReplayCurrentHashes: uniqueStrings(semanticEditIndexes.flatMap((index) => index.semanticEditReplayCurrentHashes)),
    semanticEditReplayOutputHashes: uniqueStrings(semanticEditIndexes.flatMap((index) => index.semanticEditReplayOutputHashes)),
    semanticEditKeys: uniqueStrings(semanticEditIndexes.flatMap((index) => index.semanticEditKeys)),
    semanticEditHashes: uniqueStrings(semanticEditIndexes.flatMap((index) => index.semanticEditHashes)),
    semanticIdentityHashes: uniqueStrings(semanticEditIndexes.flatMap((index) => index.semanticIdentityHashes)),
    sourceIdentityHashes: uniqueStrings(semanticEditIndexes.flatMap((index) => index.sourceIdentityHashes)),
    operationContentHashes: uniqueStrings(semanticEditIndexes.flatMap((index) => index.operationContentHashes)),
    editContentHashes: uniqueStrings(semanticEditIndexes.flatMap((index) => index.editContentHashes)),
    sourceBackprojectionModes: uniqueStrings(semanticEditIndexes.flatMap((index) => index.sourceBackprojectionModes)),
    semanticTransformReadinesses: uniqueStrings(semanticEditIndexes.flatMap((index) => index.semanticTransformReadinesses)),
    transformSourceLanguages: uniqueStrings(semanticEditIndexes.flatMap((index) => index.transformSourceLanguages)),
    transformTargetLanguages: uniqueStrings(semanticEditIndexes.flatMap((index) => index.transformTargetLanguages)),
    transformSourcePaths: uniqueStrings(semanticEditIndexes.flatMap((index) => index.transformSourcePaths)),
    transformTargetPaths: uniqueStrings(semanticEditIndexes.flatMap((index) => index.transformTargetPaths)),
    transformCrossLanguages: uniqueStrings(semanticEditIndexes.flatMap((index) => index.transformCrossLanguages)),
    transformSourceMapIds: uniqueStrings(semanticEditIndexes.flatMap((index) => index.transformSourceMapIds)),
    transformSourceMapLinkIds: uniqueStrings(semanticEditIndexes.flatMap((index) => index.transformSourceMapLinkIds)),
    transformSourceMapMappingIds: uniqueStrings(semanticEditIndexes.flatMap((index) => index.transformSourceMapMappingIds)),
    transformBaseHashes: uniqueStrings(semanticEditIndexes.flatMap((index) => index.transformBaseHashes)),
    transformTargetHashes: uniqueStrings(semanticEditIndexes.flatMap((index) => index.transformTargetHashes)),
    targetPortabilityStatuses: uniqueStrings(semanticEditIndexes.flatMap((index) => index.targetPortabilityStatuses)),
    targetPortabilityActions: uniqueStrings(semanticEditIndexes.flatMap((index) => index.targetPortabilityActions)),
    targetPortabilityReasonCodes: uniqueStrings(semanticEditIndexes.flatMap((index) => index.targetPortabilityReasonCodes)),
    representationConstructKinds: uniqueStrings(routeArtifacts.flatMap(artifactConstructKinds)),
    runtimeCapabilities: uniqueStrings(routeArtifacts.flatMap(artifactRuntimeCapabilities)),
    sourceMapPrecisions: uniqueStrings(routeArtifacts.flatMap(artifactSourceMapPrecisions)),
    translationAdmissionStatuses: uniqueStrings(routeArtifacts.map((artifact) => artifactTranslationAdmission(artifact).status)),
    translationAdmissionActions: uniqueStrings(routeArtifacts.map((artifact) => artifactTranslationAdmission(artifact).action)),
    missingTranslationEvidence: uniqueStrings(routeArtifacts.flatMap((artifact) => artifactTranslationAdmission(artifact).missingEvidence ?? [])),
    translationEvidenceIds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifactTranslationAdmission(artifact).evidenceIds ?? [])),
    translationProofEvidenceIds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifactTranslationAdmission(artifact).proofEvidenceIds ?? [])),
    requiredTranslationConstructKinds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifactTranslationAdmission(artifact).requiredConstructKinds ?? [])),
    representedTranslationConstructKinds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifactTranslationAdmission(artifact).representedConstructKinds ?? [])),
    targetAdapterIds: uniqueStrings(routeArtifacts.map((artifact) => artifactTranslationAdmission(artifact).targetAdapterId)),
    resourceTransferStatuses: uniqueStrings(routeArtifacts.map((artifact) => artifactResourceTransfer(artifact).status)),
    resourceTransferActions: uniqueStrings(routeArtifacts.map((artifact) => artifactResourceTransfer(artifact).action)),
    resourceTransferMissingEvidence: uniqueStrings(routeArtifacts.flatMap((artifact) => artifactResourceTransfer(artifact).missingEvidence ?? [])),
    resourceTransferLossKinds: uniqueStrings(routeArtifacts.flatMap((artifact) => (artifactResourceTransfer(artifact).losses ?? []).map((loss) => loss.kind))),
    interlinguaRecordIds: uniqueStrings(routeArtifacts.map((artifact) => artifactInterlingua(artifact).id)),
    interlinguaLayerKinds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifactInterlingua(artifact).query?.layerKinds ?? [])),
    interlinguaRepresentedLayerKinds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifactInterlingua(artifact).query?.representedLayerKinds ?? [])),
    interlinguaMissingLayerKinds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifactInterlingua(artifact).query?.missingLayerKinds ?? [])),
    interlinguaReviewLayerKinds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifactInterlingua(artifact).query?.reviewLayerKinds ?? [])),
    interlinguaBlockedLayerKinds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifactInterlingua(artifact).query?.blockedLayerKinds ?? [])),
    interlinguaLoweringDispositions: uniqueStrings(routeArtifacts.map((artifact) => artifactInterlingua(artifact).query?.loweringDisposition)),
    interlinguaMissingEvidence: uniqueStrings(routeArtifacts.flatMap((artifact) => artifactInterlingua(artifact).query?.missingEvidence ?? [])),
    interlinguaProofEvidenceIds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifactInterlingua(artifact).query?.proofEvidenceIds ?? [])),
    transformIdentityHashes: uniqueStrings(routeArtifacts.flatMap(artifactTransformIdentityHashes))
  };
}

function artifactRecords(records) {
  if (Array.isArray(records)) return records.flatMap(artifactRecords);
  if (records?.kind === 'frontier.lang.universalConversionArtifacts') return records.routeArtifacts ?? [];
  if (records?.kind === 'frontier.lang.universalConversionRouteArtifact') return [records];
  return [];
}

function matchesArtifact(record, query) {
  const semanticEditIndex = artifactSemanticEditIndex(record);
  const semanticOperations = artifactSemanticOperations(record);
  return match(query.routeId, [record.routeId])
    && match(query.historyId, [record.history.id])
    && match(query.patchBundleId, [record.patchBundle.id])
    && match(query.admissionRecordId, [record.admissionRecord.id])
    && match(query.evidenceReceiptId, [record.evidenceReceipt?.id])
    && match(query.sourceLanguage, [record.sourceLanguage])
    && match(query.target, [record.target])
    && match(query.mode, [record.mode])
    && match(query.lossClass, [record.lossClass])
    && match(query.adapterId, [record.adapter])
    && match(query.adapterKind, [record.adapterKind])
    && match(query.routeMissingEvidence, record.missingEvidence)
    && match(query.runtimeAdapterRequirementId, record.runtimeAdapterRequirementIds)
    && match(query.blocker, record.blockers)
    && match(query.reviewReason, record.review)
    && match(query.routeAction, [record.routeAction])
    && match(query.priority, [record.priority])
    && match(query.readiness, [record.readiness])
    && match(query.admissionStatus, [record.admissionStatus])
    && match(query.admissionBucket, [record.admissionRecord.admissionBucket])
    && match(query.risk, [record.admissionRecord.risk])
    && match(query.sourcePath, record.history.index.sourcePaths)
    && match(query.sourceHash, record.history.index.sourceHashes)
    && match(query.ownershipKey, record.history.index.ownershipKeys)
    && match(query.conflictKey, record.history.index.conflictKeys)
    && match(query.evidenceId, record.history.evidenceIds)
    && match(query.proofId, record.history.proofIds)
    && match(query.evidenceReceiptEvidenceId, record.evidenceReceipt?.evidenceIds ?? [])
    && match(query.evidenceReceiptProofEvidenceId, record.evidenceReceipt?.proofEvidenceIds ?? [])
    && match(query.evidenceReceiptMissingEvidence, record.evidenceReceipt?.missingEvidence ?? [])
    && match(query.evidenceReceiptRejectedReason, (record.evidenceReceipt?.records?.rejected ?? []).map((entry) => entry.reason))
    && match(query.evidenceReceiptRejectedId, (record.evidenceReceipt?.records?.rejected ?? []).map((entry) => entry.id))
    && match(query.semanticOperationId, semanticOperations.map((operation) => operation.id))
    && match(query.semanticOperationKind, semanticOperations.map((operation) => operation.operationKind))
    && match(query.semanticOperationInterlinguaRecordId, semanticOperations.map((operation) => operation.metadata?.interlingua?.id))
    && match(query.semanticOperationInterlinguaLoweringDisposition, semanticOperations.map((operation) => operation.metadata?.interlingua?.loweringDisposition))
    && match(query.semanticOperationInterlinguaMissingEvidence, semanticOperations.flatMap((operation) => operation.metadata?.interlingua?.missingEvidence ?? []))
    && match(query.semanticOperationInterlinguaProofEvidenceId, semanticOperations.flatMap((operation) => operation.metadata?.interlingua?.proofEvidenceIds ?? []))
    && match(query.semanticEditStatus ?? query.semanticEditStatuses, semanticEditIndex.semanticEditStatuses)
    && match(query.semanticEditScriptId ?? query.semanticEditScriptIds, semanticEditIndex.semanticEditScriptIds)
    && match(query.semanticEditProjectionId ?? query.semanticEditProjectionIds, semanticEditIndex.semanticEditProjectionIds)
    && match(query.semanticEditReplayId ?? query.semanticEditReplayIds, semanticEditIndex.semanticEditReplayIds)
    && match(query.semanticEditReplayStatus ?? query.semanticEditReplayStatuses, semanticEditIndex.semanticEditReplayStatuses)
    && match(query.semanticEditReplayAction ?? query.semanticEditReplayActions, semanticEditIndex.semanticEditReplayActions)
    && match(query.semanticEditAdmission ?? query.semanticEditAdmissionStatus ?? query.semanticEditAdmissionStatuses, semanticEditIndex.semanticEditAdmissionStatuses)
    && match(query.semanticEditAdmissionAction ?? query.semanticEditAdmissionActions, semanticEditIndex.semanticEditAdmissionActions)
    && match(query.semanticEditAdmissionReadiness ?? query.semanticEditAdmissionReadinesses, semanticEditIndex.semanticEditAdmissionReadinesses)
    && match(query.semanticEditReplayCurrentHash ?? query.semanticEditReplayCurrentHashes, semanticEditIndex.semanticEditReplayCurrentHashes)
    && match(query.semanticEditReplayOutputHash ?? query.semanticEditReplayOutputHashes, semanticEditIndex.semanticEditReplayOutputHashes)
    && match(query.semanticEditKey ?? query.semanticEditKeys, semanticEditIndex.semanticEditKeys)
    && match(query.semanticEditHash ?? query.semanticEditHashes, semanticEditIndex.semanticEditHashes)
    && match(query.semanticIdentityHash ?? query.semanticIdentityHashes, semanticEditIndex.semanticIdentityHashes)
    && match(query.sourceIdentityHash ?? query.sourceIdentityHashes, semanticEditIndex.sourceIdentityHashes)
    && match(query.operationContentHash ?? query.operationContentHashes, semanticEditIndex.operationContentHashes)
    && match(query.editContentHash ?? query.editContentHashes, semanticEditIndex.editContentHashes)
    && match(query.sourceBackprojectionMode ?? query.sourceBackprojectionModes, semanticEditIndex.sourceBackprojectionModes)
    && match(query.semanticTransformReadiness ?? query.semanticTransformReadinesses, semanticEditIndex.semanticTransformReadinesses)
    && match(query.transformSourceLanguage ?? query.transformSourceLanguages, semanticEditIndex.transformSourceLanguages)
    && match(query.transformTargetLanguage ?? query.transformTargetLanguages, semanticEditIndex.transformTargetLanguages)
    && match(query.transformSourcePath ?? query.transformSourcePaths, semanticEditIndex.transformSourcePaths)
    && match(query.transformTargetPath ?? query.transformTargetPaths, semanticEditIndex.transformTargetPaths)
    && match(query.transformCrossLanguage ?? query.transformCrossLanguages, semanticEditIndex.transformCrossLanguages)
    && match(query.transformSourceMapId ?? query.transformSourceMapIds, semanticEditIndex.transformSourceMapIds)
    && match(query.transformSourceMapLinkId ?? query.transformSourceMapLinkIds, semanticEditIndex.transformSourceMapLinkIds)
    && match(query.transformSourceMapMappingId ?? query.transformSourceMapMappingIds, semanticEditIndex.transformSourceMapMappingIds)
    && match(query.transformBaseHash ?? query.transformBaseHashes, semanticEditIndex.transformBaseHashes)
    && match(query.transformTargetHash ?? query.transformTargetHashes, semanticEditIndex.transformTargetHashes)
    && match(query.targetPortabilityStatus ?? query.targetPortabilityStatuses, semanticEditIndex.targetPortabilityStatuses)
    && match(query.targetPortabilityAction ?? query.targetPortabilityActions, semanticEditIndex.targetPortabilityActions)
    && match(query.targetPortabilityReasonCode ?? query.targetPortabilityReasonCodes, semanticEditIndex.targetPortabilityReasonCodes)
    && match(query.constructKind ?? query.representationConstructKind, artifactConstructKinds(record))
    && match(query.runtimeCapability, artifactRuntimeCapabilities(record))
    && match(query.sourceMapPrecision, artifactSourceMapPrecisions(record))
    && match(query.translationAdmissionStatus, [artifactTranslationAdmission(record).status])
    && match(query.translationAdmissionAction, [artifactTranslationAdmission(record).action])
    && match(query.missingTranslationEvidence, artifactTranslationAdmission(record).missingEvidence)
    && match(query.translationEvidenceId, artifactTranslationAdmission(record).evidenceIds)
    && match(query.translationProofEvidenceId, artifactTranslationAdmission(record).proofEvidenceIds)
    && match(query.requiredTranslationConstructKind, artifactTranslationAdmission(record).requiredConstructKinds)
    && match(query.representedTranslationConstructKind, artifactTranslationAdmission(record).representedConstructKinds)
    && match(query.targetAdapterId, [artifactTranslationAdmission(record).targetAdapterId])
    && resourceTransferMatches(artifactResourceTransfer(record), query)
    && interlinguaRecordMatches(artifactInterlingua(record), query)
    && match(query.transformIdentityHash, artifactTransformIdentityHashes(record));
}

function artifactSemanticOperations(record) {
  return record.semanticOperations?.operations ?? [];
}

function artifactConstructKinds(record) {
  return uniqueStrings([
    ...(record.metadata?.representation?.constructKinds ?? []),
    ...(record.mergeScore?.components?.representationCoverage?.signals?.constructKinds ?? []),
    ...(record.semanticOperations?.operations ?? []).flatMap((operation) => operation.metadata?.representation?.constructKinds ?? [])
  ]);
}

function artifactRuntimeCapabilities(record) {
  return uniqueStrings([
    ...(record.metadata?.representation?.runtimeCapabilities ?? []),
    ...(record.mergeScore?.components?.representationCoverage?.signals?.runtimeCapabilities ?? []),
    ...(record.semanticOperations?.operations ?? []).flatMap((operation) => operation.metadata?.representation?.runtimeCapabilities ?? [])
  ]);
}

function artifactSourceMapPrecisions(record) {
  return uniqueStrings([
    ...(record.metadata?.representation?.sourceMapPrecisions ?? []),
    ...(record.mergeScore?.components?.representationCoverage?.signals?.sourceMapPrecisions ?? []),
    ...(record.semanticOperations?.operations ?? []).flatMap((operation) => operation.metadata?.representation?.sourceMapPrecisions ?? [])
  ]);
}

function artifactTransformIdentityHashes(record) {
  return uniqueStrings([
    ...(record.metadata?.representation?.transformIdentityHashes ?? []),
    ...(record.patchBundle?.index?.transformIdentityHashes ?? []),
    ...(record.history?.index?.transformIdentityHashes ?? [])
  ]);
}

function artifactTranslationAdmission(record) {
  return record.translationAdmission ?? record.metadata?.translationAdmission ?? record.admissionRecord?.metadata?.translationAdmission ?? {};
}

function artifactInterlingua(record) {
  return record.interlingua ?? record.metadata?.interlingua ?? record.admissionRecord?.metadata?.interlingua ?? {};
}

function artifactResourceTransfer(record) {
  return record.resourceTransfer ?? record.metadata?.resourceTransfer ?? record.translationAdmission?.resourceTransfer ?? record.admissionRecord?.metadata?.resourceTransfer ?? {};
}

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (filters.length === 0) return true;
  const valueSet = new Set((values ?? []).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
