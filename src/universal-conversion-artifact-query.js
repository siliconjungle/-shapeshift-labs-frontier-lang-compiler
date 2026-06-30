import { uniqueStrings } from './native-import-utils.js';
import { artifactSemanticEditIndex } from './universal-conversion-artifact-semantic-edit.js';
import { interlinguaRecordMatches } from './universal-interlingua-record.js';
import { resourceTransferMatches } from './universal-resource-transfer.js';
import { effectConstraintMatches } from './universal-effect-constraints.js';
import { lifetimeConstraintMatches } from './universal-lifetime-constraints.js';
import { typeConstraintMatches } from './universal-type-constraints.js';

export function queryUniversalConversionArtifacts(records, query = {}) {
  return artifactRecords(records)
    .filter((record) => matchesArtifact(record, query))
    .sort((left, right) => Number(right.mergeScore?.sortKey ?? 0) - Number(left.mergeScore?.sortKey ?? 0)
      || String(left.routeId).localeCompare(String(right.routeId)));
}

export function artifactIndex(routeArtifacts) {
  const edits = routeArtifacts.map(artifactSemanticEditIndex);
  const opList = routeArtifacts.flatMap(ops);
  const tAdmissions = routeArtifacts.map(tAdm);
  const rTransfers = routeArtifacts.map(res);
  const oConstraints = routeArtifacts.map(own);
  const lConstraints = routeArtifacts.map(life);
  const eConstraints = routeArtifacts.map(effect);
  const tConstraints = routeArtifacts.map(types);
  const iRecords = routeArtifacts.map(intl);
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
    semanticOperationIds: uniqueStrings(opList.map((operation) => operation.id)),
    semanticOperationKinds: uniqueStrings(opList.map((operation) => operation.operationKind)),
    semanticOperationInterlinguaRecordIds: uniqueStrings(opList.map((operation) => operation.metadata?.interlingua?.id)),
    semanticOperationInterlinguaLoweringDispositions: uniqueStrings(opList.map((operation) => operation.metadata?.interlingua?.loweringDisposition)),
    semanticOperationInterlinguaMissingEvidence: uniqueStrings(opList.flatMap((operation) => operation.metadata?.interlingua?.missingEvidence ?? [])),
    semanticOperationInterlinguaProofEvidenceIds: uniqueStrings(opList.flatMap((operation) => operation.metadata?.interlingua?.proofEvidenceIds ?? [])),
    semanticEditStatuses: uniqueStrings(edits.flatMap((index) => index.semanticEditStatuses)),
    semanticEditScriptIds: uniqueStrings(edits.flatMap((index) => index.semanticEditScriptIds)),
    semanticEditProjectionIds: uniqueStrings(edits.flatMap((index) => index.semanticEditProjectionIds)),
    semanticEditReplayIds: uniqueStrings(edits.flatMap((index) => index.semanticEditReplayIds)),
    semanticEditReplayStatuses: uniqueStrings(edits.flatMap((index) => index.semanticEditReplayStatuses)),
    semanticEditReplayActions: uniqueStrings(edits.flatMap((index) => index.semanticEditReplayActions)),
    semanticEditAdmissionStatuses: uniqueStrings(edits.flatMap((index) => index.semanticEditAdmissionStatuses)),
    semanticEditAdmissionActions: uniqueStrings(edits.flatMap((index) => index.semanticEditAdmissionActions)),
    semanticEditAdmissionReadinesses: uniqueStrings(edits.flatMap((index) => index.semanticEditAdmissionReadinesses)),
    semanticEditReplayCurrentHashes: uniqueStrings(edits.flatMap((index) => index.semanticEditReplayCurrentHashes)),
    semanticEditReplayOutputHashes: uniqueStrings(edits.flatMap((index) => index.semanticEditReplayOutputHashes)),
    semanticEditKeys: uniqueStrings(edits.flatMap((index) => index.semanticEditKeys)),
    semanticEditHashes: uniqueStrings(edits.flatMap((index) => index.semanticEditHashes)),
    semanticIdentityHashes: uniqueStrings(edits.flatMap((index) => index.semanticIdentityHashes)),
    sourceIdentityHashes: uniqueStrings(edits.flatMap((index) => index.sourceIdentityHashes)),
    operationContentHashes: uniqueStrings(edits.flatMap((index) => index.operationContentHashes)),
    editContentHashes: uniqueStrings(edits.flatMap((index) => index.editContentHashes)),
    sourceBackprojectionModes: uniqueStrings(edits.flatMap((index) => index.sourceBackprojectionModes)),
    semanticTransformReadinesses: uniqueStrings(edits.flatMap((index) => index.semanticTransformReadinesses)),
    transformSourceLanguages: uniqueStrings(edits.flatMap((index) => index.transformSourceLanguages)),
    transformTargetLanguages: uniqueStrings(edits.flatMap((index) => index.transformTargetLanguages)),
    transformSourcePaths: uniqueStrings(edits.flatMap((index) => index.transformSourcePaths)),
    transformTargetPaths: uniqueStrings(edits.flatMap((index) => index.transformTargetPaths)),
    transformCrossLanguages: uniqueStrings(edits.flatMap((index) => index.transformCrossLanguages)),
    transformSourceMapIds: uniqueStrings(edits.flatMap((index) => index.transformSourceMapIds)),
    transformSourceMapLinkIds: uniqueStrings(edits.flatMap((index) => index.transformSourceMapLinkIds)),
    transformSourceMapMappingIds: uniqueStrings(edits.flatMap((index) => index.transformSourceMapMappingIds)),
    transformBaseHashes: uniqueStrings(edits.flatMap((index) => index.transformBaseHashes)),
    transformTargetHashes: uniqueStrings(edits.flatMap((index) => index.transformTargetHashes)),
    targetPortabilityStatuses: uniqueStrings(edits.flatMap((index) => index.targetPortabilityStatuses)),
    targetPortabilityActions: uniqueStrings(edits.flatMap((index) => index.targetPortabilityActions)),
    targetPortabilityReasonCodes: uniqueStrings(edits.flatMap((index) => index.targetPortabilityReasonCodes)),
    representationConstructKinds: uniqueStrings(routeArtifacts.flatMap(constructs)),
    runtimeCapabilities: uniqueStrings(routeArtifacts.flatMap(rCaps)),
    sourceMapPrecisions: uniqueStrings(routeArtifacts.flatMap(sMapPrecisions)),
    translationAdmissionStatuses: uniqueStrings(tAdmissions.map((record) => record.status)),
    translationAdmissionActions: uniqueStrings(tAdmissions.map((record) => record.action)),
    missingTranslationEvidence: uniqueStrings(tAdmissions.flatMap((record) => record.missingEvidence ?? [])),
    translationEvidenceIds: uniqueStrings(tAdmissions.flatMap((record) => record.evidenceIds ?? [])),
    translationProofEvidenceIds: uniqueStrings(tAdmissions.flatMap((record) => record.proofEvidenceIds ?? [])),
    requiredTranslationConstructKinds: uniqueStrings(tAdmissions.flatMap((record) => record.requiredConstructKinds ?? [])),
    representedTranslationConstructKinds: uniqueStrings(tAdmissions.flatMap((record) => record.representedConstructKinds ?? [])),
    targetAdapterIds: uniqueStrings(tAdmissions.map((record) => record.targetAdapterId)),
    resourceTransferStatuses: uniqueStrings(rTransfers.map((record) => record.status)),
    resourceTransferActions: uniqueStrings(rTransfers.map((record) => record.action)),
    resourceTransferMissingEvidence: uniqueStrings(rTransfers.flatMap((record) => record.missingEvidence ?? [])),
    resourceTransferLossKinds: uniqueStrings(rTransfers.flatMap((record) => (record.losses ?? []).map((loss) => loss.kind))),
    ownershipConstraintStatuses: uniqueStrings(oConstraints.map((record) => record.status)),
    ownershipConstraintActions: uniqueStrings(oConstraints.map((record) => record.action)),
    ownershipConstraintMissingEvidence: uniqueStrings(oConstraints.flatMap((record) => record.missingEvidence ?? [])),
    ownershipConstraintMissingKinds: uniqueStrings(oConstraints.flatMap((record) => record.missingKinds ?? [])),
    lifetimeConstraintStatuses: uniqueStrings(lConstraints.map((record) => record.status)),
    lifetimeConstraintActions: uniqueStrings(lConstraints.map((record) => record.action)),
    lifetimeConstraintMissingEvidence: uniqueStrings(lConstraints.flatMap((record) => record.missingEvidence ?? [])),
    lifetimeConstraintMissingKinds: uniqueStrings(lConstraints.flatMap((record) => record.missingKinds ?? [])),
    effectConstraintStatuses: uniqueStrings(eConstraints.map((record) => record.status)),
    effectConstraintActions: uniqueStrings(eConstraints.map((record) => record.action)),
    effectConstraintMissingEvidence: uniqueStrings(eConstraints.flatMap((record) => record.missingEvidence ?? [])),
    effectConstraintMissingKinds: uniqueStrings(eConstraints.flatMap((record) => record.missingKinds ?? [])),
    typeConstraintStatuses: uniqueStrings(tConstraints.map((record) => record.status)),
    typeConstraintActions: uniqueStrings(tConstraints.map((record) => record.action)),
    typeConstraintMissingEvidence: uniqueStrings(tConstraints.flatMap((record) => record.missingEvidence ?? [])),
    typeConstraintMissingKinds: uniqueStrings(tConstraints.flatMap((record) => record.missingKinds ?? [])),
    interlinguaRecordIds: uniqueStrings(iRecords.map((record) => record.id)),
    interlinguaLayerKinds: uniqueStrings(iRecords.flatMap((record) => record.query?.layerKinds ?? [])),
    interlinguaRepresentedLayerKinds: uniqueStrings(iRecords.flatMap((record) => record.query?.representedLayerKinds ?? [])),
    interlinguaMissingLayerKinds: uniqueStrings(iRecords.flatMap((record) => record.query?.missingLayerKinds ?? [])),
    interlinguaReviewLayerKinds: uniqueStrings(iRecords.flatMap((record) => record.query?.reviewLayerKinds ?? [])),
    interlinguaBlockedLayerKinds: uniqueStrings(iRecords.flatMap((record) => record.query?.blockedLayerKinds ?? [])),
    interlinguaLoweringDispositions: uniqueStrings(iRecords.map((record) => record.query?.loweringDisposition)),
    interlinguaMissingEvidence: uniqueStrings(iRecords.flatMap((record) => record.query?.missingEvidence ?? [])),
    interlinguaProofEvidenceIds: uniqueStrings(iRecords.flatMap((record) => record.query?.proofEvidenceIds ?? [])),
    transformIdentityHashes: uniqueStrings(routeArtifacts.flatMap(tHashes))
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
  const operations = ops(record);
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
    && match(query.constructKind ?? query.representationConstructKind, constructs(record))
    && match(query.runtimeCapability, rCaps(record))
    && match(query.sourceMapPrecision, sMapPrecisions(record))
    && match(query.translationAdmissionStatus, [tAdm(record).status])
    && match(query.translationAdmissionAction, [tAdm(record).action])
    && match(query.missingTranslationEvidence, tAdm(record).missingEvidence)
    && match(query.translationEvidenceId, tAdm(record).evidenceIds)
    && match(query.translationProofEvidenceId, tAdm(record).proofEvidenceIds)
    && match(query.requiredTranslationConstructKind, tAdm(record).requiredConstructKinds)
    && match(query.representedTranslationConstructKind, tAdm(record).representedConstructKinds)
    && match(query.targetAdapterId, [tAdm(record).targetAdapterId])
    && resourceTransferMatches(res(record), query)
    && lifetimeConstraintMatches(life(record), query)
    && effectConstraintMatches(effect(record), query)
    && typeConstraintMatches(types(record), query)
    && interlinguaRecordMatches(intl(record), query)
    && match(query.transformIdentityHash, tHashes(record));
}

function ops(record) {
  return record.semanticOperations?.operations ?? [];
}

function constructs(record) {
  return uniqueStrings([
    ...(record.metadata?.representation?.constructKinds ?? []),
    ...(record.mergeScore?.components?.representationCoverage?.signals?.constructKinds ?? []),
    ...(record.semanticOperations?.operations ?? []).flatMap((operation) => operation.metadata?.representation?.constructKinds ?? [])
  ]);
}

function rCaps(record) {
  return uniqueStrings([
    ...(record.metadata?.representation?.runtimeCapabilities ?? []),
    ...(record.mergeScore?.components?.representationCoverage?.signals?.runtimeCapabilities ?? []),
    ...(record.semanticOperations?.operations ?? []).flatMap((operation) => operation.metadata?.representation?.runtimeCapabilities ?? [])
  ]);
}

function sMapPrecisions(record) {
  return uniqueStrings([
    ...(record.metadata?.representation?.sourceMapPrecisions ?? []),
    ...(record.mergeScore?.components?.representationCoverage?.signals?.sourceMapPrecisions ?? []),
    ...(record.semanticOperations?.operations ?? []).flatMap((operation) => operation.metadata?.representation?.sourceMapPrecisions ?? [])
  ]);
}

function tHashes(record) {
  return uniqueStrings([
    ...(record.metadata?.representation?.transformIdentityHashes ?? []),
    ...(record.patchBundle?.index?.transformIdentityHashes ?? []),
    ...(record.history?.index?.transformIdentityHashes ?? [])
  ]);
}

function tAdm(record) {
  return record.translationAdmission ?? record.metadata?.translationAdmission ?? record.admissionRecord?.metadata?.translationAdmission ?? {};
}

function intl(record) {
  return record.interlingua ?? record.metadata?.interlingua ?? record.admissionRecord?.metadata?.interlingua ?? {};
}

function res(record) {
  return record.resourceTransfer ?? record.metadata?.resourceTransfer ?? record.translationAdmission?.resourceTransfer ?? record.admissionRecord?.metadata?.resourceTransfer ?? {};
}

function own(record) {
  return res(record).ownershipConstraints ?? {};
}

function life(record) {
  return record.lifetimeConstraint ?? record.metadata?.lifetimeConstraint ?? record.translationAdmission?.lifetimeConstraint ?? record.admissionRecord?.metadata?.lifetimeConstraint ?? {};
}

function effect(record) {
  return record.effectConstraint ?? record.metadata?.effectConstraint ?? record.translationAdmission?.effectConstraint ?? record.admissionRecord?.metadata?.effectConstraint ?? {};
}

function types(record) {
  return record.typeConstraint ?? record.metadata?.typeConstraint ?? record.translationAdmission?.typeConstraint ?? record.admissionRecord?.metadata?.typeConstraint ?? {};
}

function match(f, values) {
  const filters = Array.isArray(f) ? f : f === undefined ? [] : [f];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
