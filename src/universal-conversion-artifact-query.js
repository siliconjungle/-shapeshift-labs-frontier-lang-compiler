import { uniqueStrings } from './native-import-utils.js';
import { artifactSemanticEditIndex } from './universal-conversion-artifact-semantic-edit.js';
import { interlinguaRecordMatches } from './universal-interlingua-record.js';
import { resourceTransferMatches } from './universal-resource-transfer.js';
import { borrowCheckerConstraintMatches } from './universal-borrow-checker-constraints.js';
import { borrowScopeConstraintMatches } from './universal-borrow-scope-constraints.js';
import { controlFlowConstraintMatches } from './universal-control-flow-constraints.js';
import { effectConstraintMatches } from './universal-effect-constraints.js';
import { errorModelConstraintMatches } from './universal-error-model-constraints.js';
import { memoryModelConstraintMatches } from './universal-memory-model-constraints.js';
import { lifetimeConstraintMatches } from './universal-lifetime-constraints.js';
import { moduleConstraintMatches } from './universal-module-constraints.js';
import { typeConstraintMatches } from './universal-type-constraints.js';
export function queryUniversalConversionArtifacts(records, query = {}) {
  return artifactRecords(records)
    .filter((record) => matchesArtifact(record, query))
    .sort((left, right) => Number(right.mergeScore?.sortKey ?? 0) - Number(left.mergeScore?.sortKey ?? 0)
      || String(left.routeId).localeCompare(String(right.routeId)));
}
export function artifactIndex(a) {
  const edits = a.map(artifactSemanticEditIndex);
  const opList = a.flatMap(ops);
  const tAdmissions = a.map(tAdm);
  const rTransfers = a.map(res);
  const oConstraints = a.map(own);
  const lConstraints = a.map(life);
  const cConstraints = a.map(ctrl);
  const bConstraints = a.map(bscope);
  const bc = a.map(bchecker);
  const eConstraints = a.map(effect);
  const errConstraints = a.map(err);
  const memConstraints = a.map(mem);
  const mConstraints = a.map(mods);
  const tConstraints = a.map(types);
  const iRecords = a.map(intl);
  return {
    routeIds: uniqueStrings(a.map((a) => a.routeId)),
    historyIds: uniqueStrings(a.map((a) => a.history.id)),
    patchBundleIds: uniqueStrings(a.map((a) => a.patchBundle.id)),
    admissionRecordIds: uniqueStrings(a.map((a) => a.admissionRecord.id)),
    evidenceReceiptIds: uniqueStrings(a.map((a) => a.evidenceReceipt?.id)),
    languages: uniqueStrings(a.map((a) => a.sourceLanguage)),
    targets: uniqueStrings(a.map((a) => a.target)),
    modes: uniqueStrings(a.map((a) => a.mode)),
    lossClasses: uniqueStrings(a.map((a) => a.lossClass)),
    adapterIds: uniqueStrings(a.map((a) => a.adapter)),
    adapterKinds: uniqueStrings(a.map((a) => a.adapterKind)),
    routeMissingEvidence: uniqueStrings(a.flatMap((a) => a.missingEvidence ?? [])),
    runtimeAdapterRequirementIds: uniqueStrings(a.flatMap((a) => a.runtimeAdapterRequirementIds ?? [])),
    blockers: uniqueStrings(a.flatMap((a) => a.blockers ?? [])),
    reviewReasons: uniqueStrings(a.flatMap((a) => a.review ?? [])),
    readinesses: uniqueStrings(a.map((a) => a.readiness)),
    admissionStatuses: uniqueStrings(a.map((a) => a.admissionStatus)),
    admissionBuckets: uniqueStrings(a.map((a) => a.admissionRecord.admissionBucket)),
    admissionRisks: uniqueStrings(a.map((a) => a.admissionRecord.risk)),
    sourcePaths: uniqueStrings(a.flatMap((a) => a.history.index.sourcePaths)),
    sourceHashes: uniqueStrings(a.flatMap((a) => a.history.index.sourceHashes)),
    ownershipKeys: uniqueStrings(a.flatMap((a) => a.history.index.ownershipKeys)),
    conflictKeys: uniqueStrings(a.flatMap((a) => a.history.index.conflictKeys)),
    evidenceIds: uniqueStrings(a.flatMap((a) => a.history.evidenceIds)),
    proofIds: uniqueStrings(a.flatMap((a) => a.history.proofIds)),
    evidenceReceiptEvidenceIds: uniqueStrings(a.flatMap((a) => a.evidenceReceipt?.evidenceIds ?? [])),
    evidenceReceiptProofEvidenceIds: uniqueStrings(a.flatMap((a) => a.evidenceReceipt?.proofEvidenceIds ?? [])),
    evidenceReceiptMissingEvidence: uniqueStrings(a.flatMap((a) => a.evidenceReceipt?.missingEvidence ?? [])),
    evidenceReceiptRejectedReasons: uniqueStrings(a.flatMap((artifact) => (artifact.evidenceReceipt?.records?.rejected ?? []).map((r) => r.reason))),
    evidenceReceiptRejectedIds: uniqueStrings(a.flatMap((artifact) => (artifact.evidenceReceipt?.records?.rejected ?? []).map((r) => r.id))),
    semanticOperationIds: uniqueStrings(opList.map((o) => o.id)),
    semanticOperationKinds: uniqueStrings(opList.map((o) => o.operationKind)),
    semanticOperationInterlinguaRecordIds: uniqueStrings(opList.map((o) => o.metadata?.interlingua?.id)),
    semanticOperationInterlinguaLoweringDispositions: uniqueStrings(opList.map((o) => o.metadata?.interlingua?.loweringDisposition)),
    semanticOperationInterlinguaMissingEvidence: uniqueStrings(opList.flatMap((o) => o.metadata?.interlingua?.missingEvidence ?? [])),
    semanticOperationInterlinguaProofEvidenceIds: uniqueStrings(opList.flatMap((o) => o.metadata?.interlingua?.proofEvidenceIds ?? [])),
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
    representationConstructKinds: uniqueStrings(a.flatMap(constructs)),
    runtimeCapabilities: uniqueStrings(a.flatMap(rCaps)),
    sourceMapPrecisions: uniqueStrings(a.flatMap(sMapPrecisions)),
    translationAdmissionStatuses: uniqueStrings(tAdmissions.map((r) => r.status)),
    translationAdmissionActions: uniqueStrings(tAdmissions.map((r) => r.action)),
    missingTranslationEvidence: uniqueStrings(tAdmissions.flatMap((r) => r.missingEvidence ?? [])),
    translationEvidenceIds: uniqueStrings(tAdmissions.flatMap((r) => r.evidenceIds ?? [])),
    translationProofEvidenceIds: uniqueStrings(tAdmissions.flatMap((r) => r.proofEvidenceIds ?? [])),
    requiredTranslationConstructKinds: uniqueStrings(tAdmissions.flatMap((r) => r.requiredConstructKinds ?? [])),
    representedTranslationConstructKinds: uniqueStrings(tAdmissions.flatMap((r) => r.representedConstructKinds ?? [])),
    targetAdapterIds: uniqueStrings(tAdmissions.map((r) => r.targetAdapterId)),
    resourceTransferStatuses: uniqueStrings(rTransfers.map((r) => r.status)),
    resourceTransferActions: uniqueStrings(rTransfers.map((r) => r.action)),
    resourceTransferMissingEvidence: uniqueStrings(rTransfers.flatMap((r) => r.missingEvidence ?? [])),
    resourceTransferLossKinds: uniqueStrings(rTransfers.flatMap((record) => (record.losses ?? []).map((loss) => loss.kind))),
    ...constraintIndex('ownershipConstraint', oConstraints),
    ...constraintIndex('lifetimeConstraint', lConstraints),
    ...constraintIndex('controlFlowConstraint', cConstraints),
    ...constraintIndex('borrowScopeConstraint', bConstraints),
    ...constraintIndex('borrowCheckerConstraint', bc),
    ...constraintIndex('effectConstraint', eConstraints),
    ...constraintIndex('errorModelConstraint', errConstraints),
    ...constraintIndex('memoryModelConstraint', memConstraints),
    ...constraintIndex('moduleConstraint', mConstraints),
    ...constraintIndex('typeConstraint', tConstraints),
    interlinguaRecordIds: uniqueStrings(iRecords.map((r) => r.id)),
    interlinguaLayerKinds: uniqueStrings(iRecords.flatMap((r) => r.query?.layerKinds ?? [])),
    interlinguaRepresentedLayerKinds: uniqueStrings(iRecords.flatMap((r) => r.query?.representedLayerKinds ?? [])),
    interlinguaMissingLayerKinds: uniqueStrings(iRecords.flatMap((r) => r.query?.missingLayerKinds ?? [])),
    interlinguaReviewLayerKinds: uniqueStrings(iRecords.flatMap((r) => r.query?.reviewLayerKinds ?? [])),
    interlinguaBlockedLayerKinds: uniqueStrings(iRecords.flatMap((r) => r.query?.blockedLayerKinds ?? [])),
    interlinguaLoweringDispositions: uniqueStrings(iRecords.map((r) => r.query?.loweringDisposition)),
    interlinguaMissingEvidence: uniqueStrings(iRecords.flatMap((r) => r.query?.missingEvidence ?? [])),
    interlinguaProofEvidenceIds: uniqueStrings(iRecords.flatMap((r) => r.query?.proofEvidenceIds ?? [])),
    interlinguaConstraintFamilies: uniqueStrings(iRecords.flatMap((r) => r.query?.constraintFamilies ?? [])),
    interlinguaConstraintStatuses: uniqueStrings(iRecords.flatMap((r) => r.query?.constraintStatuses ?? [])),
    interlinguaConstraintMissingKinds: uniqueStrings(iRecords.flatMap((r) => r.query?.constraintMissingKinds ?? [])),
    interlinguaConstraintMissingEvidence: uniqueStrings(iRecords.flatMap((r) => r.query?.constraintMissingEvidence ?? [])),
    interlinguaConstraintSourceIds: uniqueStrings(iRecords.flatMap((r) => r.query?.constraintSourceIds ?? [])),
    interlinguaConstraintObligationKinds: uniqueStrings(iRecords.flatMap((r) => r.query?.constraintObligationKinds ?? [])),
    interlinguaConstraintObligationStatuses: uniqueStrings(iRecords.flatMap((r) => r.query?.constraintObligationStatuses ?? [])),
    transformIdentityHashes: uniqueStrings(a.flatMap(tHashes))
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
    && match(query.evidenceReceiptRejectedReason, (record.evidenceReceipt?.records?.rejected ?? []).map((e) => e.reason))
    && match(query.evidenceReceiptRejectedId, (record.evidenceReceipt?.records?.rejected ?? []).map((e) => e.id))
    && match(query.semanticOperationId, operations.map((o) => o.id))
    && match(query.semanticOperationKind, operations.map((o) => o.operationKind))
    && match(query.semanticOperationInterlinguaRecordId, operations.map((o) => o.metadata?.interlingua?.id))
    && match(query.semanticOperationInterlinguaLoweringDisposition, operations.map((o) => o.metadata?.interlingua?.loweringDisposition))
    && match(query.semanticOperationInterlinguaMissingEvidence, operations.flatMap((o) => o.metadata?.interlingua?.missingEvidence ?? []))
    && match(query.semanticOperationInterlinguaProofEvidenceId, operations.flatMap((o) => o.metadata?.interlingua?.proofEvidenceIds ?? []))
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
    && controlFlowConstraintMatches(ctrl(record), query)
    && borrowScopeConstraintMatches(bscope(record), query)
    && borrowCheckerConstraintMatches(bchecker(record), query)
    && effectConstraintMatches(effect(record), query)
    && errorModelConstraintMatches(err(record), query)
    && memoryModelConstraintMatches(mem(record), query)
    && moduleConstraintMatches(mods(record), query)
    && typeConstraintMatches(types(record), query)
    && interlinguaRecordMatches(intl(record), query)
    && match(query.transformIdentityHash, tHashes(record));
}
function ops(record) { return record.semanticOperations?.operations ?? []; }
function constructs(record) { return uniqueStrings([...(record.metadata?.representation?.constructKinds ?? []), ...(record.mergeScore?.components?.representationCoverage?.signals?.constructKinds ?? []), ...ops(record).flatMap((o) => o.metadata?.representation?.constructKinds ?? [])]); }
function rCaps(record) { return uniqueStrings([...(record.metadata?.representation?.runtimeCapabilities ?? []), ...(record.mergeScore?.components?.representationCoverage?.signals?.runtimeCapabilities ?? []), ...ops(record).flatMap((o) => o.metadata?.representation?.runtimeCapabilities ?? [])]); }
function sMapPrecisions(record) { return uniqueStrings([...(record.metadata?.representation?.sourceMapPrecisions ?? []), ...(record.mergeScore?.components?.representationCoverage?.signals?.sourceMapPrecisions ?? []), ...ops(record).flatMap((o) => o.metadata?.representation?.sourceMapPrecisions ?? [])]); }
function tHashes(record) { return uniqueStrings([...(record.metadata?.representation?.transformIdentityHashes ?? []), ...(record.patchBundle?.index?.transformIdentityHashes ?? []), ...(record.history?.index?.transformIdentityHashes ?? [])]); }
function tAdm(record) { return record.translationAdmission ?? record.metadata?.translationAdmission ?? record.admissionRecord?.metadata?.translationAdmission ?? {}; }
function intl(record) { return record.interlingua ?? record.metadata?.interlingua ?? record.admissionRecord?.metadata?.interlingua ?? {}; }
function res(record) { return record.resourceTransfer ?? metaConstraint(record, 'resourceTransfer'); }
function own(record) { return res(record).ownershipConstraints ?? {}; }
function life(record) { return record.lifetimeConstraint ?? metaConstraint(record, 'lifetimeConstraint'); }
function ctrl(record) { return record.controlFlowConstraint ?? metaConstraint(record, 'controlFlowConstraint'); }
function bscope(record) { return record.borrowScopeConstraint ?? metaConstraint(record, 'borrowScopeConstraint'); }
function bchecker(record) { return record.borrowCheckerConstraint ?? metaConstraint(record, 'borrowCheckerConstraint'); }
function effect(record) {
  return record.effectConstraint ?? metaConstraint(record, 'effectConstraint');
}
function err(record) { return record.errorModelConstraint ?? metaConstraint(record, 'errorModelConstraint'); }
function mem(record) { return record.memoryModelConstraint ?? metaConstraint(record, 'memoryModelConstraint'); }
function mods(record) {
  return record.moduleConstraint ?? metaConstraint(record, 'moduleConstraint');
}
function types(record) {
  return record.typeConstraint ?? metaConstraint(record, 'typeConstraint');
}
function metaConstraint(record, key) { return record.metadata?.[key] ?? record.translationAdmission?.[key] ?? record.admissionRecord?.metadata?.[key] ?? {}; }
function constraintIndex(prefix, records) {
  return {
    [`${prefix}Statuses`]: uniqueStrings(records.map((r) => r.status)),
    [`${prefix}Actions`]: uniqueStrings(records.map((r) => r.action)),
    [`${prefix}MissingEvidence`]: uniqueStrings(records.flatMap((r) => r.missingEvidence ?? [])),
    [`${prefix}MissingKinds`]: uniqueStrings(records.flatMap((r) => r.missingKinds ?? []))
  };
}
function match(f, values) {
  const filters = Array.isArray(f) ? f : f === undefined ? [] : [f];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
