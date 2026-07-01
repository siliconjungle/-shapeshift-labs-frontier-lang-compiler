import{uniqueStrings as u}from './native-import-utils.js';
import{artifactSemanticEditIndex as esi}from './universal-conversion-artifact-semantic-edit.js';
import{artifactSourceMapIndex as smi,artifactSourceMapMatches as smm}from './universal-conversion-artifact-source-maps.js';
import{artifactConstraintIndex as aci,artifactConstraintsMatch as acm}from './universal-conversion-artifact-constraints.js';
import{interlinguaRecordMatches as irm}from './universal-interlingua-record.js';
const ai='admissionRecordInterlingua',eri='evidenceReceiptInterlingua',soi='semanticOperationInterlingua';
const aiFields=[['ConstraintFamilies','ConstraintFamily','interlinguaConstraintFamilies'],['ConstraintStatuses','ConstraintStatus','interlinguaConstraintStatuses'],['ConstraintActions','ConstraintAction','interlinguaConstraintActions'],['ConstraintSourceIds','ConstraintSourceId','interlinguaConstraintSourceIds'],['ConstraintEvidenceIds','ConstraintEvidenceId','interlinguaConstraintEvidenceIds'],['ConstraintRequiredKinds','ConstraintRequiredKind','interlinguaConstraintRequiredKinds'],['ConstraintRepresentedKinds','ConstraintRepresentedKind','interlinguaConstraintRepresentedKinds'],['ConstraintMissingKinds','ConstraintMissingKind','interlinguaConstraintMissingKinds'],['ConstraintMissingEvidence','ConstraintMissingEvidence','interlinguaConstraintMissingEvidence'],['ConstraintObligationKinds','ConstraintObligationKind','interlinguaConstraintObligationKinds'],['ConstraintObligationStatuses','ConstraintObligationStatus','interlinguaConstraintObligationStatuses'],['ConstraintObligationEvidenceIds','ConstraintObligationEvidenceId','interlinguaConstraintObligationEvidenceIds'],['ConstraintObligationMissingEvidence','ConstraintObligationMissingEvidence','interlinguaConstraintObligationMissingEvidence']];
const cKeys='Families Statuses Actions EvidenceIds RequiredKinds RepresentedKinds MissingKinds MissingEvidence SourceIds ObligationKinds ObligationStatuses ObligationEvidenceIds ObligationMissingEvidence'.split(' ');
const iFields=[['LayerKinds','layerKinds'],['RepresentedLayerKinds','representedLayerKinds'],['MissingLayerKinds','missingLayerKinds'],['ReviewLayerKinds','reviewLayerKinds'],['BlockedLayerKinds','blockedLayerKinds'],['MissingEvidence','missingEvidence'],['ProofEvidenceIds','proofEvidenceIds'],...cKeys.map((k)=>[`Constraint${k}`,`constraint${k}`])];
const eriFields=[['RecordId','RecordIds','interlinguaRecordId'],['LoweringDisposition','LoweringDispositions','interlinguaLoweringDisposition'],['ConstraintFamily','ConstraintFamilies','interlinguaConstraintFamilies'],['ConstraintStatus','ConstraintStatuses','interlinguaConstraintStatuses'],['ConstraintAction','ConstraintActions','interlinguaConstraintActions'],['ConstraintEvidenceId','ConstraintEvidenceIds','interlinguaConstraintEvidenceIds'],['ConstraintRequiredKind','ConstraintRequiredKinds','interlinguaConstraintRequiredKinds'],['ConstraintRepresentedKind','ConstraintRepresentedKinds','interlinguaConstraintRepresentedKinds'],['ConstraintMissingKind','ConstraintMissingKinds','interlinguaConstraintMissingKinds'],['ConstraintMissingEvidence','ConstraintMissingEvidence','interlinguaConstraintMissingEvidence']];
const soiFields=[['RecordId','RecordIds','id'],['LoweringDisposition','LoweringDispositions','loweringDisposition'],['MissingEvidence','MissingEvidence','missingEvidence'],['ProofEvidenceId','ProofEvidenceIds','proofEvidenceIds'],['ConstraintAction','ConstraintActions','constraintActions'],['ConstraintSourceId','ConstraintSourceIds','constraintSourceIds'],['ConstraintRequiredKind','ConstraintRequiredKinds','constraintRequiredKinds'],['ConstraintRepresentedKind','ConstraintRepresentedKinds','constraintRepresentedKinds']];
export function queryUniversalConversionArtifacts(records, query = {}) {
  return artifactRecords(records)
    .filter((record) => matchesArtifact(record, query))
    .sort((left, right) => Number(right.mergeScore?.sortKey ?? 0) - Number(left.mergeScore?.sortKey ?? 0)
      || String(left.routeId).localeCompare(String(right.routeId)));
}
export function artifactIndex(a) {
  const edits = a.map(esi);
  const opList = a.flatMap(ops);
  const tAdmissions = a.map(tAdm);
  const iRecords = a.map(intl);
  const aRecords = a.map(aRec);
  const iRs = a.map(iReceipt);
  const iRO = iRs.flatMap((r) => r.records?.interlinguaObligations ?? []);
  return {
    routeIds: u(a.map((a) => a.routeId)),
    historyIds: u(a.map((a) => a.history.id)),
    patchBundleIds: u(a.map((a) => a.patchBundle.id)),
    admissionRecordIds: u(a.map((a) => a.admissionRecord.id)),
    evidenceReceiptIds: u(a.map((a) => a.evidenceReceipt?.id)),
    languages: u(a.map((a) => a.sourceLanguage)),
    targets: u(a.map((a) => a.target)),
    modes: u(a.map((a) => a.mode)),
    lossClasses: u(a.map((a) => a.lossClass)),
    adapterIds: u(a.map((a) => a.adapter)),
    adapterKinds: u(a.map((a) => a.adapterKind)),
    routeMissingEvidence: u(a.flatMap((a) => a.missingEvidence ?? [])),
    runtimeAdapterRequirementIds: u(a.flatMap((a) => a.runtimeAdapterRequirementIds ?? [])),
    runtimeProofObligationIds: u(a.flatMap((a) => a.runtimeProofObligationIds ?? [])),
    runtimeProofCapabilities: u(a.flatMap((a) => a.runtimeProofCapabilities ?? [])),
    runtimeProofStatuses: u(a.flatMap((a) => a.runtimeProofStatuses ?? [])),
    runtimeProofRequiredSignals: u(a.flatMap((a) => a.runtimeProofRequiredSignals ?? [])),
    runtimeProofProvidedSignals: u(a.flatMap((a) => a.runtimeProofProvidedSignals ?? [])),
    runtimeProofMissingSignals: u(a.flatMap((a) => a.runtimeProofMissingSignals ?? [])),
    blockers: u(a.flatMap((a) => a.blockers ?? [])),
    reviewReasons: u(a.flatMap((a) => a.review ?? [])),
    readinesses: u(a.map((a) => a.readiness)),
    admissionStatuses: u(a.map((a) => a.admissionStatus)),
    admissionBuckets: u(a.map((a) => a.admissionRecord.admissionBucket)),
    admissionRisks: u(a.map((a) => a.admissionRecord.risk)),
    ...admissionRecordInterlinguaIndex(aRecords),
    sourcePaths: u(a.flatMap((a) => a.history.index.sourcePaths)),
    sourceHashes: u(a.flatMap((a) => a.history.index.sourceHashes)),
    ownershipKeys: u(a.flatMap((a) => a.history.index.ownershipKeys)),
    conflictKeys: u(a.flatMap((a) => a.history.index.conflictKeys)),
    ...smi(a),
    evidenceIds: u(a.flatMap((a) => a.history.evidenceIds)),
    proofIds: u(a.flatMap((a) => a.history.proofIds)),
    evidenceReceiptEvidenceIds: u(a.flatMap((a) => a.evidenceReceipt?.evidenceIds ?? [])),
    evidenceReceiptProofEvidenceIds: u(a.flatMap((a) => a.evidenceReceipt?.proofEvidenceIds ?? [])),
    evidenceReceiptMissingEvidence: u(a.flatMap((a) => a.evidenceReceipt?.missingEvidence ?? [])),
    evidenceReceiptRejectedReasons: u(a.flatMap((artifact) => (artifact.evidenceReceipt?.records?.rejected ?? []).map((r) => r.reason))),
    evidenceReceiptRejectedIds: u(a.flatMap((artifact) => (artifact.evidenceReceipt?.records?.rejected ?? []).map((r) => r.id))),
    ...eriIndex(iRs, iRO),
    semanticOperationIds: u(opList.map((o) => o.id)),
    semanticOperationKinds: u(opList.map((o) => o.operationKind)),
    ...soiIndex(opList),
    semanticEditStatuses: eFlat(edits, 'semanticEditStatuses'),
    semanticEditScriptIds: eFlat(edits, 'semanticEditScriptIds'),
    semanticEditProjectionIds: eFlat(edits, 'semanticEditProjectionIds'),
    semanticEditReplayIds: eFlat(edits, 'semanticEditReplayIds'),
    semanticEditReplayStatuses: eFlat(edits, 'semanticEditReplayStatuses'),
    semanticEditReplayActions: eFlat(edits, 'semanticEditReplayActions'),
    semanticEditAdmissionStatuses: eFlat(edits, 'semanticEditAdmissionStatuses'),
    semanticEditAdmissionActions: eFlat(edits, 'semanticEditAdmissionActions'),
    semanticEditAdmissionReadinesses: eFlat(edits, 'semanticEditAdmissionReadinesses'),
    semanticEditReplayCurrentHashes: eFlat(edits, 'semanticEditReplayCurrentHashes'),
    semanticEditReplayOutputHashes: eFlat(edits, 'semanticEditReplayOutputHashes'),
    semanticEditKeys: eFlat(edits, 'semanticEditKeys'),
    semanticEditHashes: eFlat(edits, 'semanticEditHashes'),
    semanticIdentityHashes: eFlat(edits, 'semanticIdentityHashes'),
    sourceIdentityHashes: eFlat(edits, 'sourceIdentityHashes'),
    operationContentHashes: eFlat(edits, 'operationContentHashes'),
    editContentHashes: eFlat(edits, 'editContentHashes'),
    sourceBackprojectionModes: eFlat(edits, 'sourceBackprojectionModes'),
    semanticTransformReadinesses: eFlat(edits, 'semanticTransformReadinesses'),
    transformSourceLanguages: eFlat(edits, 'transformSourceLanguages'),
    transformTargetLanguages: eFlat(edits, 'transformTargetLanguages'),
    transformSourcePaths: eFlat(edits, 'transformSourcePaths'),
    transformTargetPaths: eFlat(edits, 'transformTargetPaths'),
    transformCrossLanguages: eFlat(edits, 'transformCrossLanguages'),
    transformSourceMapIds: eFlat(edits, 'transformSourceMapIds'),
    transformSourceMapLinkIds: eFlat(edits, 'transformSourceMapLinkIds'),
    transformSourceMapMappingIds: eFlat(edits, 'transformSourceMapMappingIds'),
    transformBaseHashes: eFlat(edits, 'transformBaseHashes'),
    transformTargetHashes: eFlat(edits, 'transformTargetHashes'),
    targetPortabilityStatuses: eFlat(edits, 'targetPortabilityStatuses'),
    targetPortabilityActions: eFlat(edits, 'targetPortabilityActions'),
    targetPortabilityReasonCodes: eFlat(edits, 'targetPortabilityReasonCodes'),
    representationConstructKinds: u(a.flatMap(constructs)),
    runtimeCapabilities: u(a.flatMap(rCaps)),
    sourceMapPrecisions: u(a.flatMap(sMapPrecisions)),
    translationAdmissionStatuses: u(tAdmissions.map((r) => r.status)),
    translationAdmissionActions: u(tAdmissions.map((r) => r.action)),
    missingTranslationEvidence: u(tAdmissions.flatMap((r) => r.missingEvidence ?? [])),
    translationEvidenceIds: u(tAdmissions.flatMap((r) => r.evidenceIds ?? [])),
    translationProofEvidenceIds: u(tAdmissions.flatMap((r) => r.proofEvidenceIds ?? [])),
    requiredTranslationConstructKinds: u(tAdmissions.flatMap((r) => r.requiredConstructKinds ?? [])),
    representedTranslationConstructKinds: u(tAdmissions.flatMap((r) => r.representedConstructKinds ?? [])),
    targetAdapterIds: u(tAdmissions.map((r) => r.targetAdapterId)),
    ...aci(a),
    ...interlinguaIndex(iRecords),
    transformIdentityHashes: u(a.flatMap(tHashes))
  };
}
function artifactRecords(records) {
  if (Array.isArray(records)) return records.flatMap(artifactRecords);
  if (records?.kind === 'frontier.lang.universalConversionArtifacts') return records.routeArtifacts ?? [];
  if (records?.kind === 'frontier.lang.universalConversionRouteArtifact') return [records];
  return [];
}
function matchesArtifact(record, query) {
  const editIndex = esi(record);
  const operations = ops(record);
  const receipt = iReceipt(record);
  const rObs = receipt.records?.interlinguaObligations ?? [];
  const admission = aRec(record);
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
    && match(query.runtimeProofObligationId, record.runtimeProofObligationIds)
    && match(query.runtimeProofCapability, record.runtimeProofCapabilities)
    && match(query.runtimeProofStatus, record.runtimeProofStatuses)
    && match(query.runtimeProofRequiredSignal, record.runtimeProofRequiredSignals)
    && match(query.runtimeProofProvidedSignal, record.runtimeProofProvidedSignals)
    && match(query.runtimeProofMissingSignal, record.runtimeProofMissingSignals)
    && match(query.blocker, record.blockers)
    && match(query.reviewReason, record.review)
    && match(query.routeAction, [record.routeAction])
    && match(query.priority, [record.priority])
    && match(query.readiness, [record.readiness])
    && match(query.admissionStatus, [record.admissionStatus])
    && match(query.admissionBucket, [record.admissionRecord.admissionBucket])
    && match(query.risk, [record.admissionRecord.risk])
    && admissionRecordInterlinguaMatches(admission, query)
    && match(query.sourcePath, record.history.index.sourcePaths)
    && match(query.sourceHash, record.history.index.sourceHashes)
    && match(query.ownershipKey, record.history.index.ownershipKeys)
    && match(query.conflictKey, record.history.index.conflictKeys)
    && match(query.evidenceId, record.history.evidenceIds)
    && match(query.proofId, record.history.proofIds)
    && smm(record, query)
    && match(query.evidenceReceiptEvidenceId, record.evidenceReceipt?.evidenceIds ?? [])
    && match(query.evidenceReceiptProofEvidenceId, record.evidenceReceipt?.proofEvidenceIds ?? [])
    && match(query.evidenceReceiptMissingEvidence, record.evidenceReceipt?.missingEvidence ?? [])
    && match(query.evidenceReceiptRejectedReason, (record.evidenceReceipt?.records?.rejected ?? []).map((e) => e.reason))
    && match(query.evidenceReceiptRejectedId, (record.evidenceReceipt?.records?.rejected ?? []).map((e) => e.id))
    && eriMatches(receipt, rObs, query)
    && match(query.semanticOperationId, operations.map((o) => o.id))
    && match(query.semanticOperationKind, operations.map((o) => o.operationKind))
    && soiMatches(operations, query)
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
    && acm(record, query)
    && irm(intl(record), query)
    && match(query.transformIdentityHash, tHashes(record));
}
function ops(record) { return record.semanticOperations?.operations ?? []; }
function constructs(record) { return u([...(record.metadata?.representation?.constructKinds ?? []), ...(record.mergeScore?.components?.representationCoverage?.signals?.constructKinds ?? []), ...ops(record).flatMap((o) => o.metadata?.representation?.constructKinds ?? [])]); }
function rCaps(record) { return u([...(record.metadata?.representation?.runtimeCapabilities ?? []), ...(record.mergeScore?.components?.representationCoverage?.signals?.runtimeCapabilities ?? []), ...ops(record).flatMap((o) => o.metadata?.representation?.runtimeCapabilities ?? [])]); }
function sMapPrecisions(record) { return u([...(record.metadata?.representation?.sourceMapPrecisions ?? []), ...(record.mergeScore?.components?.representationCoverage?.signals?.sourceMapPrecisions ?? []), ...ops(record).flatMap((o) => o.metadata?.representation?.sourceMapPrecisions ?? [])]); }
function tHashes(record) { return u([...(record.metadata?.representation?.transformIdentityHashes ?? []), ...(record.patchBundle?.index?.transformIdentityHashes ?? []), ...(record.history?.index?.transformIdentityHashes ?? [])]); }
function tAdm(record) { return record.translationAdmission ?? record.metadata?.translationAdmission ?? record.admissionRecord?.metadata?.translationAdmission ?? {}; }
function intl(record) { return record.interlingua ?? record.metadata?.interlingua ?? record.admissionRecord?.metadata?.interlingua ?? {}; }
function aRec(record) { return record.admissionRecord ?? {}; }
function iReceipt(record) { return record.evidenceReceipt ?? {}; }
function eFlat(records, key) { return u(records.flatMap((r) => r[key])); }
function qFlat(records, key) { return u(records.flatMap((r) => r.query?.[key] ?? [])); }
function rFlat(records, key) { return u(records.flatMap((r) => r[key] ?? [])); }
function list(value) { return Array.isArray(value) ? value : value == null ? [] : [value]; }
function interlinguaIndex(records) {
  return Object.fromEntries([
    ['interlinguaRecordIds', u(records.map((r) => r.id))],
    ['interlinguaLoweringDispositions', u(records.map((r) => r.query?.loweringDisposition))],
    ...iFields.map(([indexKey, queryKey]) => [`interlingua${indexKey}`, qFlat(records, queryKey)])
  ]);
}
function admissionRecordInterlinguaIndex(records) {
  return Object.fromEntries([
    [`${ai}RecordIds`, u(records.map((r) => r.interlinguaRecordId))],
    [`${ai}LoweringDispositions`, u(records.map((r) => r.interlinguaLoweringDisposition))],
    ...aiFields.map(([indexKey,, recordKey]) => [`${ai}${indexKey}`, rFlat(records, recordKey)])
  ]);
}
function admissionRecordInterlinguaMatches(r, q) {
  return match(q[`${ai}RecordId`], [r.interlinguaRecordId])
    && match(q[`${ai}LoweringDisposition`], [r.interlinguaLoweringDisposition])
    && aiFields.every(([, queryKey, recordKey]) => match(q[`${ai}${queryKey}`], r[recordKey]));
}
function eriIndex(rs, obs) {
  return {
    ...Object.fromEntries(eriFields.map(([, indexKey, recordKey]) => [`${eri}${indexKey}`, u(rs.flatMap((r) => list(r[recordKey])))])),
    [`${eri}ConstraintSourceIds`]: u([...rs.flatMap((r) => r.interlinguaConstraintSourceIds ?? []), ...obs.map((r) => r.sourceId)]),
    [`${eri}ConstraintObligationKinds`]: u([...rs.flatMap((r) => r.interlinguaConstraintObligationKinds ?? []), ...obs.map((r) => r.kind)]),
    [`${eri}ConstraintObligationStatuses`]: u([...rs.flatMap((r) => r.interlinguaConstraintObligationStatuses ?? []), ...obs.map((r) => r.status)]),
    [`${eri}ConstraintObligationEvidenceIds`]: u([...rs.flatMap((r) => r.interlinguaConstraintObligationEvidenceIds ?? []), ...obs.flatMap((r) => r.evidenceIds ?? [])]),
    [`${eri}ConstraintObligationMissingEvidence`]: u([...rs.flatMap((r) => r.interlinguaConstraintObligationMissingEvidence ?? []), ...obs.flatMap((r) => r.missingEvidence ?? [])])
  };
}
function eriMatches(r, obs, q) {
  return eriFields.every(([queryKey,, recordKey]) => match(q[`${eri}${queryKey}`], list(r[recordKey])))
    && match(q[`${eri}ConstraintSourceId`], [...(r.interlinguaConstraintSourceIds ?? []), ...obs.map((e) => e.sourceId)])
    && match(q[`${eri}ConstraintObligationKind`], [...(r.interlinguaConstraintObligationKinds ?? []), ...obs.map((e) => e.kind)])
    && match(q[`${eri}ConstraintObligationStatus`], [...(r.interlinguaConstraintObligationStatuses ?? []), ...obs.map((e) => e.status)])
    && match(q[`${eri}ConstraintObligationEvidenceId`], [...(r.interlinguaConstraintObligationEvidenceIds ?? []), ...obs.flatMap((e) => e.evidenceIds ?? [])])
    && match(q[`${eri}ConstraintObligationMissingEvidence`], [...(r.interlinguaConstraintObligationMissingEvidence ?? []), ...obs.flatMap((e) => e.missingEvidence ?? [])]);
}
function soiIndex(operations) {
  const records = operations.map((o) => o.metadata?.interlingua ?? {});
  return Object.fromEntries(soiFields.map(([, indexKey, recordKey]) => [`${soi}${indexKey}`, u(records.flatMap((r) => r[recordKey] ?? []))]));
}
function soiMatches(operations, q) {
  const records = operations.map((o) => o.metadata?.interlingua ?? {});
  return soiFields.every(([queryKey,, recordKey]) => match(q[`${soi}${queryKey}`], records.flatMap((r) => r[recordKey] ?? [])));
}
function match(f, values) {
  const filters = Array.isArray(f) ? f : f === undefined ? [] : [f];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
