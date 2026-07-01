import { countBy, uniqueStrings } from './native-import-utils.js';
import { semanticEditRecordIndex } from './internal/index-impl/semanticEditBundleIndex.js';

export const semanticEditIndexKeys = Object.freeze([
  'semanticEditStatuses', 'semanticEditScriptIds', 'semanticEditProjectionIds', 'semanticEditReplayIds',
  'semanticEditReplayStatuses', 'semanticEditReplayActions', 'semanticEditAdmissionStatuses', 'semanticEditAdmissionActions',
  'semanticEditAdmissionReadinesses', 'semanticEditReplayCurrentHashes', 'semanticEditReplayOutputHashes',
  'semanticEditKeys', 'semanticEditHashes', 'semanticIdentityHashes', 'sourceIdentityHashes', 'operationContentHashes',
  'editContentHashes', 'sourceBackprojectionModes', 'semanticTransformReadinesses', 'transformSourceLanguages',
  'transformTargetLanguages', 'transformSourcePaths', 'transformTargetPaths', 'transformCrossLanguages',
  'transformSourceMapIds', 'transformSourceMapLinkIds', 'transformSourceMapMappingIds', 'transformBaseHashes',
  'transformTargetHashes', 'targetPortabilityStatuses', 'targetPortabilityActions', 'targetPortabilityReasonCodes'
]);

export function artifactSemanticEditIndex(record) {
  const patchIndex = record.patchBundle?.index ?? {};
  const scripts = semanticEditRecords(record, 'semanticEditScript', 'semanticEditScripts', 'script', 'scripts');
  const projections = semanticEditRecords(record, 'semanticEditProjection', 'semanticEditProjections', 'projection', 'projections');
  const replays = semanticEditRecords(record, 'semanticEditReplay', 'semanticEditReplays', 'replay', 'replays');
  const editIndex = semanticEditRecordIndex(scripts, projections, replays, {
    ...record,
    index: patchIndex,
    metadata: { semanticEditSummary: record.patchBundle?.metadata?.semanticEditSummary ?? record.metadata?.semanticEditSummary }
  });
  const admissions = semanticEditAdmissions(record);
  const admissionStatuses = uniqueStrings([...strings(record.semanticEditAdmissionStatuses), ...strings(patchIndex.semanticEditAdmissionStatuses), ...admissions.map((admission) => admission.status)]);
  const admissionActions = uniqueStrings([...strings(record.semanticEditAdmissionActions), ...strings(patchIndex.semanticEditAdmissionActions), ...admissions.map((admission) => admission.action)]);
  const admissionReadinesses = uniqueStrings([...strings(record.semanticEditAdmissionReadinesses), ...strings(patchIndex.semanticEditAdmissionReadinesses), ...admissions.map((admission) => admission.readiness)]);
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
    sourceBackprojectionModes: uniqueStrings([...strings(record.sourceBackprojectionModes), ...strings(patchIndex.sourceBackprojectionModes), ...editIndex.sourceBackprojectionModes]),
    semanticTransformReadinesses: uniqueStrings([...strings(record.semanticTransformReadinesses), ...strings(patchIndex.semanticTransformReadinesses)]),
    transformSourceLanguages: uniqueStrings([...strings(record.transformSourceLanguages), ...strings(patchIndex.transformSourceLanguages)]),
    transformTargetLanguages: uniqueStrings([...strings(record.transformTargetLanguages), ...strings(patchIndex.transformTargetLanguages)]),
    transformSourcePaths: uniqueStrings([...strings(record.transformSourcePaths), ...strings(patchIndex.transformSourcePaths)]),
    transformTargetPaths: uniqueStrings([...strings(record.transformTargetPaths), ...strings(patchIndex.transformTargetPaths)]),
    transformCrossLanguages: uniqueStrings([...strings(record.transformCrossLanguages), ...strings(patchIndex.transformCrossLanguages)]),
    transformSourceMapIds: uniqueStrings([...strings(record.transformSourceMapIds), ...strings(patchIndex.transformSourceMapIds)]),
    transformSourceMapLinkIds: uniqueStrings([...strings(record.transformSourceMapLinkIds), ...strings(patchIndex.transformSourceMapLinkIds)]),
    transformSourceMapMappingIds: uniqueStrings([...strings(record.transformSourceMapMappingIds), ...strings(patchIndex.transformSourceMapMappingIds)]),
    transformBaseHashes: uniqueStrings([...strings(record.transformBaseHashes), ...strings(patchIndex.transformBaseHashes)]),
    transformTargetHashes: uniqueStrings([...strings(record.transformTargetHashes), ...strings(patchIndex.transformTargetHashes)]),
    targetPortabilityStatuses: uniqueStrings([...strings(record.targetPortabilityStatuses), ...strings(patchIndex.targetPortabilityStatuses)]),
    targetPortabilityActions: uniqueStrings([...strings(record.targetPortabilityActions), ...strings(patchIndex.targetPortabilityActions)]),
    targetPortabilityReasonCodes: uniqueStrings([...strings(record.targetPortabilityReasonCodes), ...strings(patchIndex.targetPortabilityReasonCodes)])
  };
}

export function workItemSemanticEditDenominators(route = {}) {
  return artifactSemanticEditIndex(route);
}

export function mergeWorkItemSemanticEditDenominators(left = {}, right = {}) {
  return mergeSemanticEditIndexes(left, right);
}

export function worklistSemanticEditSummary(items = []) {
  return mergeSemanticEditIndexes(...items);
}

export function mergeSemanticEditIndexes(...records) {
  return Object.fromEntries(semanticEditIndexKeys.map((key) => [key, uniqueStrings(records.flatMap((record) => record[key] ?? []))]));
}

export function semanticEditIndexCounts(index = {}) {
  return Object.fromEntries(semanticEditIndexKeys.map((key) => [key, countBy(index[key] ?? [])]));
}

export function semanticEditRecordsCounts(records = []) {
  return semanticEditIndexCounts(mergeSemanticEditIndexes(...records.map((record) => artifactSemanticEditIndex(record))));
}

export function workItemSemanticEditMatches(item = {}, query = {}) {
  return match(query.semanticEditStatus ?? query.semanticEditStatuses, item.semanticEditStatuses)
    && match(query.semanticEditScriptId ?? query.semanticEditScriptIds, item.semanticEditScriptIds)
    && match(query.semanticEditProjectionId ?? query.semanticEditProjectionIds, item.semanticEditProjectionIds)
    && match(query.semanticEditReplayId ?? query.semanticEditReplayIds, item.semanticEditReplayIds)
    && match(query.semanticEditReplayStatus ?? query.semanticEditReplayStatuses, item.semanticEditReplayStatuses)
    && match(query.semanticEditReplayAction ?? query.semanticEditReplayActions, item.semanticEditReplayActions)
    && match(query.semanticEditAdmission ?? query.semanticEditAdmissionStatus ?? query.semanticEditAdmissionStatuses, item.semanticEditAdmissionStatuses)
    && match(query.semanticEditAdmissionAction ?? query.semanticEditAdmissionActions, item.semanticEditAdmissionActions)
    && match(query.semanticEditAdmissionReadiness ?? query.semanticEditAdmissionReadinesses, item.semanticEditAdmissionReadinesses)
    && match(query.semanticEditReplayCurrentHash ?? query.semanticEditReplayCurrentHashes, item.semanticEditReplayCurrentHashes)
    && match(query.semanticEditReplayOutputHash ?? query.semanticEditReplayOutputHashes, item.semanticEditReplayOutputHashes)
    && match(query.semanticEditKey ?? query.semanticEditKeys, item.semanticEditKeys)
    && match(query.semanticEditHash ?? query.semanticEditHashes, item.semanticEditHashes)
    && match(query.semanticIdentityHash ?? query.semanticIdentityHashes, item.semanticIdentityHashes)
    && match(query.sourceIdentityHash ?? query.sourceIdentityHashes, item.sourceIdentityHashes)
    && match(query.operationContentHash ?? query.operationContentHashes, item.operationContentHashes)
    && match(query.editContentHash ?? query.editContentHashes, item.editContentHashes)
    && match(query.sourceBackprojectionMode ?? query.sourceBackprojectionModes, item.sourceBackprojectionModes)
    && match(query.semanticTransformReadiness ?? query.semanticTransformReadinesses, item.semanticTransformReadinesses)
    && match(query.transformSourceLanguage ?? query.transformSourceLanguages, item.transformSourceLanguages)
    && match(query.transformTargetLanguage ?? query.transformTargetLanguages, item.transformTargetLanguages)
    && match(query.transformSourcePath ?? query.transformSourcePaths, item.transformSourcePaths)
    && match(query.transformTargetPath ?? query.transformTargetPaths, item.transformTargetPaths)
    && match(query.transformCrossLanguage ?? query.transformCrossLanguages, item.transformCrossLanguages)
    && match(query.transformSourceMapId ?? query.transformSourceMapIds, item.transformSourceMapIds)
    && match(query.transformSourceMapLinkId ?? query.transformSourceMapLinkIds, item.transformSourceMapLinkIds)
    && match(query.transformSourceMapMappingId ?? query.transformSourceMapMappingIds, item.transformSourceMapMappingIds)
    && match(query.transformBaseHash ?? query.transformBaseHashes, item.transformBaseHashes)
    && match(query.transformTargetHash ?? query.transformTargetHashes, item.transformTargetHashes)
    && match(query.targetPortabilityStatus ?? query.targetPortabilityStatuses, item.targetPortabilityStatuses)
    && match(query.targetPortabilityAction ?? query.targetPortabilityActions, item.targetPortabilityActions)
    && match(query.targetPortabilityReasonCode ?? query.targetPortabilityReasonCodes, item.targetPortabilityReasonCodes);
}

function semanticEditAdmissions(record) {
  return [
    record.semanticEditAdmission,
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

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
