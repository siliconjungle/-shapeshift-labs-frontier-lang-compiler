import { uniqueStrings } from './native-import-utils.js';
import { artifactSemanticEditIndex } from './universal-conversion-artifact-semantic-edit.js';
import { interlinguaRecordMatches } from './universal-interlingua-record.js';
import { resourceTransferMatches } from './universal-resource-transfer.js';
import { effectConstraintMatches } from './universal-effect-constraints.js';

export function queryUniversalConversionArtifacts(records, query = {}) {
  return artifactRecords(records)
    .filter((record) => matchesArtifact(record, query))
    .sort((left, right) => Number(right.mergeScore?.sortKey ?? 0) - Number(left.mergeScore?.sortKey ?? 0)
      || String(left.routeId).localeCompare(String(right.routeId)));
}

export function artifactIndex(routeArtifacts) {
  const editIndexes = routeArtifacts.map(artifactSemanticEditIndex);
  const operations = routeArtifacts.flatMap(artifactSemanticOperations);
  const translationAdmissions = routeArtifacts.map(artifactTranslationAdmission);
  const resourceTransfers = routeArtifacts.map(artifactResourceTransfer);
  const ownershipConstraints = routeArtifacts.map(artifactOwnershipConstraints);
  const effectConstraints = routeArtifacts.map(artifactEffectConstraint);
  const interlinguaRecords = routeArtifacts.map(artifactInterlingua);
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
    semanticOperationIds: uniqueStrings(operations.map((operation) => operation.id)),
    semanticOperationKinds: uniqueStrings(operations.map((operation) => operation.operationKind)),
    semanticOperationInterlinguaRecordIds: uniqueStrings(operations.map((operation) => operation.metadata?.interlingua?.id)),
    semanticOperationInterlinguaLoweringDispositions: uniqueStrings(operations.map((operation) => operation.metadata?.interlingua?.loweringDisposition)),
    semanticOperationInterlinguaMissingEvidence: uniqueStrings(operations.flatMap((operation) => operation.metadata?.interlingua?.missingEvidence ?? [])),
    semanticOperationInterlinguaProofEvidenceIds: uniqueStrings(operations.flatMap((operation) => operation.metadata?.interlingua?.proofEvidenceIds ?? [])),
    semanticEditStatuses: uniqueStrings(editIndexes.flatMap((index) => index.semanticEditStatuses)),
    semanticEditScriptIds: uniqueStrings(editIndexes.flatMap((index) => index.semanticEditScriptIds)),
    semanticEditProjectionIds: uniqueStrings(editIndexes.flatMap((index) => index.semanticEditProjectionIds)),
    semanticEditReplayIds: uniqueStrings(editIndexes.flatMap((index) => index.semanticEditReplayIds)),
    semanticEditReplayStatuses: uniqueStrings(editIndexes.flatMap((index) => index.semanticEditReplayStatuses)),
    semanticEditReplayActions: uniqueStrings(editIndexes.flatMap((index) => index.semanticEditReplayActions)),
    semanticEditAdmissionStatuses: uniqueStrings(editIndexes.flatMap((index) => index.semanticEditAdmissionStatuses)),
    semanticEditAdmissionActions: uniqueStrings(editIndexes.flatMap((index) => index.semanticEditAdmissionActions)),
    semanticEditAdmissionReadinesses: uniqueStrings(editIndexes.flatMap((index) => index.semanticEditAdmissionReadinesses)),
    semanticEditReplayCurrentHashes: uniqueStrings(editIndexes.flatMap((index) => index.semanticEditReplayCurrentHashes)),
    semanticEditReplayOutputHashes: uniqueStrings(editIndexes.flatMap((index) => index.semanticEditReplayOutputHashes)),
    semanticEditKeys: uniqueStrings(editIndexes.flatMap((index) => index.semanticEditKeys)),
    semanticEditHashes: uniqueStrings(editIndexes.flatMap((index) => index.semanticEditHashes)),
    semanticIdentityHashes: uniqueStrings(editIndexes.flatMap((index) => index.semanticIdentityHashes)),
    sourceIdentityHashes: uniqueStrings(editIndexes.flatMap((index) => index.sourceIdentityHashes)),
    operationContentHashes: uniqueStrings(editIndexes.flatMap((index) => index.operationContentHashes)),
    editContentHashes: uniqueStrings(editIndexes.flatMap((index) => index.editContentHashes)),
    sourceBackprojectionModes: uniqueStrings(editIndexes.flatMap((index) => index.sourceBackprojectionModes)),
    semanticTransformReadinesses: uniqueStrings(editIndexes.flatMap((index) => index.semanticTransformReadinesses)),
    transformSourceLanguages: uniqueStrings(editIndexes.flatMap((index) => index.transformSourceLanguages)),
    transformTargetLanguages: uniqueStrings(editIndexes.flatMap((index) => index.transformTargetLanguages)),
    transformSourcePaths: uniqueStrings(editIndexes.flatMap((index) => index.transformSourcePaths)),
    transformTargetPaths: uniqueStrings(editIndexes.flatMap((index) => index.transformTargetPaths)),
    transformCrossLanguages: uniqueStrings(editIndexes.flatMap((index) => index.transformCrossLanguages)),
    transformSourceMapIds: uniqueStrings(editIndexes.flatMap((index) => index.transformSourceMapIds)),
    transformSourceMapLinkIds: uniqueStrings(editIndexes.flatMap((index) => index.transformSourceMapLinkIds)),
    transformSourceMapMappingIds: uniqueStrings(editIndexes.flatMap((index) => index.transformSourceMapMappingIds)),
    transformBaseHashes: uniqueStrings(editIndexes.flatMap((index) => index.transformBaseHashes)),
    transformTargetHashes: uniqueStrings(editIndexes.flatMap((index) => index.transformTargetHashes)),
    targetPortabilityStatuses: uniqueStrings(editIndexes.flatMap((index) => index.targetPortabilityStatuses)),
    targetPortabilityActions: uniqueStrings(editIndexes.flatMap((index) => index.targetPortabilityActions)),
    targetPortabilityReasonCodes: uniqueStrings(editIndexes.flatMap((index) => index.targetPortabilityReasonCodes)),
    representationConstructKinds: uniqueStrings(routeArtifacts.flatMap(artifactConstructKinds)),
    runtimeCapabilities: uniqueStrings(routeArtifacts.flatMap(artifactRuntimeCapabilities)),
    sourceMapPrecisions: uniqueStrings(routeArtifacts.flatMap(artifactSourceMapPrecisions)),
    translationAdmissionStatuses: uniqueStrings(translationAdmissions.map((record) => record.status)),
    translationAdmissionActions: uniqueStrings(translationAdmissions.map((record) => record.action)),
    missingTranslationEvidence: uniqueStrings(translationAdmissions.flatMap((record) => record.missingEvidence ?? [])),
    translationEvidenceIds: uniqueStrings(translationAdmissions.flatMap((record) => record.evidenceIds ?? [])),
    translationProofEvidenceIds: uniqueStrings(translationAdmissions.flatMap((record) => record.proofEvidenceIds ?? [])),
    requiredTranslationConstructKinds: uniqueStrings(translationAdmissions.flatMap((record) => record.requiredConstructKinds ?? [])),
    representedTranslationConstructKinds: uniqueStrings(translationAdmissions.flatMap((record) => record.representedConstructKinds ?? [])),
    targetAdapterIds: uniqueStrings(translationAdmissions.map((record) => record.targetAdapterId)),
    resourceTransferStatuses: uniqueStrings(resourceTransfers.map((record) => record.status)),
    resourceTransferActions: uniqueStrings(resourceTransfers.map((record) => record.action)),
    resourceTransferMissingEvidence: uniqueStrings(resourceTransfers.flatMap((record) => record.missingEvidence ?? [])),
    resourceTransferLossKinds: uniqueStrings(resourceTransfers.flatMap((record) => (record.losses ?? []).map((loss) => loss.kind))),
    ownershipConstraintStatuses: uniqueStrings(ownershipConstraints.map((record) => record.status)),
    ownershipConstraintActions: uniqueStrings(ownershipConstraints.map((record) => record.action)),
    ownershipConstraintMissingEvidence: uniqueStrings(ownershipConstraints.flatMap((record) => record.missingEvidence ?? [])),
    ownershipConstraintMissingKinds: uniqueStrings(ownershipConstraints.flatMap((record) => record.missingKinds ?? [])),
    effectConstraintStatuses: uniqueStrings(effectConstraints.map((record) => record.status)),
    effectConstraintActions: uniqueStrings(effectConstraints.map((record) => record.action)),
    effectConstraintMissingEvidence: uniqueStrings(effectConstraints.flatMap((record) => record.missingEvidence ?? [])),
    effectConstraintMissingKinds: uniqueStrings(effectConstraints.flatMap((record) => record.missingKinds ?? [])),
    interlinguaRecordIds: uniqueStrings(interlinguaRecords.map((record) => record.id)),
    interlinguaLayerKinds: uniqueStrings(interlinguaRecords.flatMap((record) => record.query?.layerKinds ?? [])),
    interlinguaRepresentedLayerKinds: uniqueStrings(interlinguaRecords.flatMap((record) => record.query?.representedLayerKinds ?? [])),
    interlinguaMissingLayerKinds: uniqueStrings(interlinguaRecords.flatMap((record) => record.query?.missingLayerKinds ?? [])),
    interlinguaReviewLayerKinds: uniqueStrings(interlinguaRecords.flatMap((record) => record.query?.reviewLayerKinds ?? [])),
    interlinguaBlockedLayerKinds: uniqueStrings(interlinguaRecords.flatMap((record) => record.query?.blockedLayerKinds ?? [])),
    interlinguaLoweringDispositions: uniqueStrings(interlinguaRecords.map((record) => record.query?.loweringDisposition)),
    interlinguaMissingEvidence: uniqueStrings(interlinguaRecords.flatMap((record) => record.query?.missingEvidence ?? [])),
    interlinguaProofEvidenceIds: uniqueStrings(interlinguaRecords.flatMap((record) => record.query?.proofEvidenceIds ?? [])),
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
  const editIndex = artifactSemanticEditIndex(record);
  const operations = artifactSemanticOperations(record);
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
    && match(query.semanticOperationId, operations.map((operation) => operation.id))
    && match(query.semanticOperationKind, operations.map((operation) => operation.operationKind))
    && match(query.semanticOperationInterlinguaRecordId, operations.map((operation) => operation.metadata?.interlingua?.id))
    && match(query.semanticOperationInterlinguaLoweringDisposition, operations.map((operation) => operation.metadata?.interlingua?.loweringDisposition))
    && match(query.semanticOperationInterlinguaMissingEvidence, operations.flatMap((operation) => operation.metadata?.interlingua?.missingEvidence ?? []))
    && match(query.semanticOperationInterlinguaProofEvidenceId, operations.flatMap((operation) => operation.metadata?.interlingua?.proofEvidenceIds ?? []))
    && match(query.semanticEditStatus ?? query.semanticEditStatuses, editIndex.semanticEditStatuses)
    && match(query.semanticEditScriptId ?? query.semanticEditScriptIds, editIndex.semanticEditScriptIds)
    && match(query.semanticEditProjectionId ?? query.semanticEditProjectionIds, editIndex.semanticEditProjectionIds)
    && match(query.semanticEditReplayId ?? query.semanticEditReplayIds, editIndex.semanticEditReplayIds)
    && match(query.semanticEditReplayStatus ?? query.semanticEditReplayStatuses, editIndex.semanticEditReplayStatuses)
    && match(query.semanticEditReplayAction ?? query.semanticEditReplayActions, editIndex.semanticEditReplayActions)
    && match(query.semanticEditAdmission ?? query.semanticEditAdmissionStatus ?? query.semanticEditAdmissionStatuses, editIndex.semanticEditAdmissionStatuses)
    && match(query.semanticEditAdmissionAction ?? query.semanticEditAdmissionActions, editIndex.semanticEditAdmissionActions)
    && match(query.semanticEditAdmissionReadiness ?? query.semanticEditAdmissionReadinesses, editIndex.semanticEditAdmissionReadinesses)
    && match(query.semanticEditReplayCurrentHash ?? query.semanticEditReplayCurrentHashes, editIndex.semanticEditReplayCurrentHashes)
    && match(query.semanticEditReplayOutputHash ?? query.semanticEditReplayOutputHashes, editIndex.semanticEditReplayOutputHashes)
    && match(query.semanticEditKey ?? query.semanticEditKeys, editIndex.semanticEditKeys)
    && match(query.semanticEditHash ?? query.semanticEditHashes, editIndex.semanticEditHashes)
    && match(query.semanticIdentityHash ?? query.semanticIdentityHashes, editIndex.semanticIdentityHashes)
    && match(query.sourceIdentityHash ?? query.sourceIdentityHashes, editIndex.sourceIdentityHashes)
    && match(query.operationContentHash ?? query.operationContentHashes, editIndex.operationContentHashes)
    && match(query.editContentHash ?? query.editContentHashes, editIndex.editContentHashes)
    && match(query.sourceBackprojectionMode ?? query.sourceBackprojectionModes, editIndex.sourceBackprojectionModes)
    && match(query.semanticTransformReadiness ?? query.semanticTransformReadinesses, editIndex.semanticTransformReadinesses)
    && match(query.transformSourceLanguage ?? query.transformSourceLanguages, editIndex.transformSourceLanguages)
    && match(query.transformTargetLanguage ?? query.transformTargetLanguages, editIndex.transformTargetLanguages)
    && match(query.transformSourcePath ?? query.transformSourcePaths, editIndex.transformSourcePaths)
    && match(query.transformTargetPath ?? query.transformTargetPaths, editIndex.transformTargetPaths)
    && match(query.transformCrossLanguage ?? query.transformCrossLanguages, editIndex.transformCrossLanguages)
    && match(query.transformSourceMapId ?? query.transformSourceMapIds, editIndex.transformSourceMapIds)
    && match(query.transformSourceMapLinkId ?? query.transformSourceMapLinkIds, editIndex.transformSourceMapLinkIds)
    && match(query.transformSourceMapMappingId ?? query.transformSourceMapMappingIds, editIndex.transformSourceMapMappingIds)
    && match(query.transformBaseHash ?? query.transformBaseHashes, editIndex.transformBaseHashes)
    && match(query.transformTargetHash ?? query.transformTargetHashes, editIndex.transformTargetHashes)
    && match(query.targetPortabilityStatus ?? query.targetPortabilityStatuses, editIndex.targetPortabilityStatuses)
    && match(query.targetPortabilityAction ?? query.targetPortabilityActions, editIndex.targetPortabilityActions)
    && match(query.targetPortabilityReasonCode ?? query.targetPortabilityReasonCodes, editIndex.targetPortabilityReasonCodes)
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
    && effectConstraintMatches(artifactEffectConstraint(record), query)
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

function artifactOwnershipConstraints(record) {
  return artifactResourceTransfer(record).ownershipConstraints ?? {};
}

function artifactEffectConstraint(record) {
  return record.effectConstraint ?? record.metadata?.effectConstraint ?? record.translationAdmission?.effectConstraint ?? record.admissionRecord?.metadata?.effectConstraint ?? {};
}

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (filters.length === 0) return true;
  const valueSet = new Set((values ?? []).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
