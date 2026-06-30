import { uniqueStrings } from './native-import-utils.js';
import { artifactSemanticEditIndex } from './universal-conversion-artifact-semantic-edit.js';

export function queryUniversalConversionArtifacts(records, query = {}) {
  return artifactRecords(records)
    .filter((record) => matchesArtifact(record, query))
    .sort((left, right) => Number(right.mergeScore?.sortKey ?? 0) - Number(left.mergeScore?.sortKey ?? 0)
      || String(left.routeId).localeCompare(String(right.routeId)));
}

export function artifactIndex(routeArtifacts) {
  const semanticEditIndexes = routeArtifacts.map(artifactSemanticEditIndex);
  return {
    routeIds: uniqueStrings(routeArtifacts.map((artifact) => artifact.routeId)),
    historyIds: uniqueStrings(routeArtifacts.map((artifact) => artifact.history.id)),
    patchBundleIds: uniqueStrings(routeArtifacts.map((artifact) => artifact.patchBundle.id)),
    admissionRecordIds: uniqueStrings(routeArtifacts.map((artifact) => artifact.admissionRecord.id)),
    languages: uniqueStrings(routeArtifacts.map((artifact) => artifact.sourceLanguage)),
    targets: uniqueStrings(routeArtifacts.map((artifact) => artifact.target)),
    modes: uniqueStrings(routeArtifacts.map((artifact) => artifact.mode)),
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
    semanticOperationIds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.semanticOperations?.operations ?? []).map((operation) => operation.id)),
    semanticOperationKinds: uniqueStrings(routeArtifacts.flatMap((artifact) => artifact.semanticOperations?.operations ?? []).map((operation) => operation.operationKind)),
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
  return match(query.routeId, [record.routeId])
    && match(query.historyId, [record.history.id])
    && match(query.patchBundleId, [record.patchBundle.id])
    && match(query.admissionRecordId, [record.admissionRecord.id])
    && match(query.sourceLanguage, [record.sourceLanguage])
    && match(query.target, [record.target])
    && match(query.mode, [record.mode])
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
    && match(query.semanticOperationId, (record.semanticOperations?.operations ?? []).map((operation) => operation.id))
    && match(query.semanticOperationKind, (record.semanticOperations?.operations ?? []).map((operation) => operation.operationKind))
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
    && match(query.transformIdentityHash, artifactTransformIdentityHashes(record));
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

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (filters.length === 0) return true;
  const valueSet = new Set((values ?? []).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
