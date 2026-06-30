import { uniqueStrings } from './native-import-utils.js';
import { semanticEditRecordIndex } from './internal/index-impl/semanticEditBundleIndex.js';

export function artifactSemanticEditIndex(record) {
  const patchIndex = record.patchBundle?.index ?? {};
  const scripts = semanticEditRecords(record, 'semanticEditScript', 'semanticEditScripts', 'script', 'scripts');
  const projections = semanticEditRecords(record, 'semanticEditProjection', 'semanticEditProjections', 'projection', 'projections');
  const replays = semanticEditRecords(record, 'semanticEditReplay', 'semanticEditReplays', 'replay', 'replays');
  const editIndex = semanticEditRecordIndex(scripts, projections, replays, {
    index: patchIndex,
    metadata: { semanticEditSummary: record.patchBundle?.metadata?.semanticEditSummary ?? record.metadata?.semanticEditSummary }
  });
  const admissions = semanticEditAdmissions(record);
  const admissionStatuses = uniqueStrings([...strings(patchIndex.semanticEditAdmissionStatuses), ...admissions.map((admission) => admission.status)]);
  const admissionActions = uniqueStrings([...strings(patchIndex.semanticEditAdmissionActions), ...admissions.map((admission) => admission.action)]);
  const admissionReadinesses = uniqueStrings([...strings(patchIndex.semanticEditAdmissionReadinesses), ...admissions.map((admission) => admission.readiness)]);
  return {
    semanticEditStatuses: uniqueStrings([
      ...editIndex.semanticEditReplayStatuses,
      ...admissionStatuses,
      ...scripts.flatMap((script) => array(script.operations).map((operation) => operation.status)),
      ...projections.flatMap((projection) => [projection.status, projection.admission?.status]),
      ...replays.flatMap((replay) => [replay.status, replay.admission?.status])
    ]),
    semanticEditScriptIds: editIndex.semanticEditScriptIds,
    semanticEditProjectionIds: editIndex.semanticEditProjectionIds,
    semanticEditReplayIds: editIndex.semanticEditReplayIds,
    semanticEditReplayStatuses: editIndex.semanticEditReplayStatuses,
    semanticEditReplayActions: editIndex.semanticEditReplayActions,
    semanticEditAdmissionStatuses: admissionStatuses,
    semanticEditAdmissionActions: admissionActions,
    semanticEditAdmissionReadinesses: admissionReadinesses,
    semanticEditReplayCurrentHashes: editIndex.semanticEditReplayCurrentHashes,
    semanticEditReplayOutputHashes: editIndex.semanticEditReplayOutputHashes,
    semanticEditKeys: editIndex.semanticEditKeys,
    semanticEditHashes: uniqueStrings([
      ...editIndex.semanticEditReplayCurrentHashes,
      ...editIndex.semanticEditReplayOutputHashes,
      ...editIndex.semanticIdentityHashes,
      ...editIndex.sourceIdentityHashes,
      ...editIndex.operationContentHashes,
      ...editIndex.editContentHashes,
      ...semanticEditRecordHashes(scripts),
      ...semanticEditRecordHashes(projections),
      ...semanticEditRecordHashes(replays)
    ]),
    semanticIdentityHashes: editIndex.semanticIdentityHashes,
    sourceIdentityHashes: editIndex.sourceIdentityHashes,
    operationContentHashes: editIndex.operationContentHashes,
    editContentHashes: editIndex.editContentHashes,
    sourceBackprojectionModes: strings(patchIndex.sourceBackprojectionModes),
    semanticTransformReadinesses: strings(patchIndex.semanticTransformReadinesses),
    transformSourceLanguages: strings(patchIndex.transformSourceLanguages),
    transformTargetLanguages: strings(patchIndex.transformTargetLanguages),
    transformSourcePaths: strings(patchIndex.transformSourcePaths),
    transformTargetPaths: strings(patchIndex.transformTargetPaths),
    transformCrossLanguages: strings(patchIndex.transformCrossLanguages),
    transformSourceMapIds: strings(patchIndex.transformSourceMapIds),
    transformSourceMapLinkIds: strings(patchIndex.transformSourceMapLinkIds),
    transformSourceMapMappingIds: strings(patchIndex.transformSourceMapMappingIds),
    transformBaseHashes: strings(patchIndex.transformBaseHashes),
    transformTargetHashes: strings(patchIndex.transformTargetHashes),
    targetPortabilityStatuses: strings(patchIndex.targetPortabilityStatuses),
    targetPortabilityActions: strings(patchIndex.targetPortabilityActions),
    targetPortabilityReasonCodes: strings(patchIndex.targetPortabilityReasonCodes)
  };
}

function semanticEditAdmissions(record) {
  return [
    record.patchBundle?.admission?.semanticEditAdmission,
    record.patchBundle?.metadata?.semanticEditAdmission,
    record.metadata?.semanticEditAdmission,
    record.metadata?.semanticEdit?.admission
  ].filter(Boolean);
}

function semanticEditRecords(record, singularKey, pluralKey, nestedSingularKey, nestedPluralKey) {
  const metadata = record.metadata ?? {};
  const semanticEdit = metadata.semanticEdit ?? {};
  const patchMetadata = record.patchBundle?.metadata ?? {};
  const patchSemanticEdit = patchMetadata.semanticEdit ?? {};
  return [
    ...array(record[pluralKey] ?? record[singularKey]),
    ...array(metadata[pluralKey] ?? metadata[singularKey]),
    ...array(semanticEdit[nestedPluralKey] ?? semanticEdit[nestedSingularKey]),
    ...array(record.patchBundle?.[pluralKey] ?? record.patchBundle?.[singularKey]),
    ...array(patchMetadata[pluralKey] ?? patchMetadata[singularKey]),
    ...array(patchSemanticEdit[nestedPluralKey] ?? patchSemanticEdit[nestedSingularKey])
  ].filter(Boolean);
}

function semanticEditRecordHashes(records) {
  return records.flatMap((record) => {
    const hashes = record?.hashes;
    return [
      record?.hash,
      record?.stableHash,
      record?.semanticIdentityHash,
      record?.sourceIdentityHash,
      record?.operationContentHash,
      record?.editContentHash,
      record?.currentHash,
      record?.projectedHash,
      record?.outputHash,
      ...(hashes && typeof hashes === 'object' ? Object.values(hashes) : [])
    ];
  });
}

function array(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function strings(value) {
  return array(value).map((entry) => String(entry ?? '')).filter(Boolean);
}
