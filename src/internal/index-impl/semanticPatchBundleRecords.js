import{idFragment,normalizeSemanticMergeReadiness,uniqueStrings}from'../../native-import-utils.js';
import{createSemanticEditBundleAdmission}from'./semanticEditBundleAdmission.js';
import{createSemanticPatchBundleAdmission}from'./semanticPatchBundleAdmission.js';
import{semanticEditRecordIndex,semanticEditSummary}from'./semanticEditBundleIndex.js';
import{lineageLinkInputs,linkAdmissionLineage,normalizeLineageResolutionLinks,semanticLineageLinkIndex}from'./semanticPatchBundleLineageLinks.js';
import{normalizeRegions,normalizeSourceMapLinks,normalizeSources,sourceRef}from'./semanticPatchBundleSourceRecords.js';
import{normalizeSemanticTransformIdentityRecords,semanticTransformInputs,semanticTransformRecordIndex,semanticTransformSummary}from'./semanticTransformIdentityRecords.js';

export const SemanticPatchBundleAdmissionStatuses=Object.freeze(['proposed','queued','admitted','needs-review','blocked','rejected']);

export function createSemanticPatchBundleRecord(input={},options={}){
  const source=input?.changeSet??input;
  const patch=options.patch??source.patch??source.semanticPatch??source.patchBundle;
  const mergeCandidate=options.mergeCandidate??source.mergeCandidate??source.candidate;
  const semanticEditScripts=array(options.semanticEditScripts??source.semanticEditScripts??source.semanticEditScript);
  const semanticEditProjections=array(options.semanticEditProjections??source.semanticEditProjections??source.semanticEditProjection);
  const semanticEditReplays=array(options.semanticEditReplays??source.semanticEditReplays??source.semanticEditReplay);
  const evidenceRecords=[...array(options.evidence??source.evidence),...array(patch?.evidence),...array(mergeCandidate?.evidence),...semanticEditScripts.flatMap((script)=>array(script.evidence))];
  const editAdmission=createSemanticEditBundleAdmission({
    semanticEditScripts,semanticEditProjections,semanticEditReplays,
    evidence:evidenceRecords,
    ...(source.metadata?.semanticEditAdmission??{}),
    ...(source.semanticEditAdmission??{}),
    ...(options.semanticEditAdmission??{})
  });
  const editIndex=semanticEditRecordIndex(semanticEditScripts,semanticEditProjections,semanticEditReplays,source);
  const transformContext={sourceLanguage:options.sourceLanguage??source.sourceLanguage??source.language,targetLanguage:options.targetLanguage??source.targetLanguage};
  const semanticTransformIdentities=normalizeSemanticTransformIdentityRecords(semanticTransformInputs(source,options),transformContext);
  const semanticTransformIndex=semanticTransformRecordIndex(semanticTransformIdentities,source);
  const targetPortability=options.targetPortability??source.targetPortability??source.metadata?.targetPortability??options.metadata?.targetPortability;
  const regionInputs=array(options.changedRegions??source.changedRegions??source.regions);
  const sourceMapLinks=normalizeSourceMapLinks([
    ...array(options.sourceMapLinks??source.sourceMapLinks),
    ...regionInputs.flatMap((region)=>array(region?.metadata?.changedRegionProjection?.sourceMapLinks??region?.sourceMapLinks))
  ]);
  const changedRegions=normalizeRegions(regionInputs,{...source,sourceMapLinks});
  const sources=normalizeSources([
    ...array(options.sources??source.sources),
    sourceRef(source.before,'before',source.beforeHash),
    sourceRef(source.after,'after',source.afterHash)
  ],source);
  const patchId=firstString(options.patchId,source.patchId,patch?.id,mergeCandidate?.patchId);
  const mergeCandidateId=firstString(options.mergeCandidateId,source.mergeCandidateId,mergeCandidate?.id);
  const baseHash=firstString(options.baseHash,source.baseHash,source.beforeHash,patch?.baseHash,mergeCandidate?.baseHash,...sources.map((item)=>item.baseHash));
  const targetHash=firstString(options.targetHash,source.targetHash,source.afterHash,patch?.targetHash,mergeCandidate?.targetHash,...sources.map((item)=>item.targetHash));
  const readiness=normalizeSemanticMergeReadiness(firstString(options.readiness,source.readiness,source.admission?.readiness,mergeCandidate?.readiness))
    ?? firstString(options.readiness,source.readiness,source.admission?.readiness,mergeCandidate?.readiness,'needs-review');
  const lineageLinks=normalizeLineageResolutionLinks(lineageLinkInputs(source,options,changedRegions,targetPortability));
  const lineageIndex=semanticLineageLinkIndex(lineageLinks,changedRegions,targetPortability);
  const evidenceIds=uniqueStrings([...strings(options.evidenceIds),...strings(source.evidenceIds),...evidenceRecords.map((record)=>record?.id),...strings(mergeCandidate?.evidenceIds),...lineageIndex.evidenceIds]);
  const proofIds=uniqueStrings([...strings(options.proofIds),...strings(source.proofIds),...evidenceRecords.filter((record)=>record?.kind==='proof').map((record)=>record.id),...strings(mergeCandidate?.proofIds),...lineageIndex.proofIds]);
  const historyIds=uniqueStrings([...strings(options.historyIds),...strings(options.historyId),...strings(source.historyIds),...strings(source.historyId)]);
  const semanticOperationIds=uniqueStrings([...strings(options.semanticOperationIds),...strings(options.semanticOperationId),...strings(source.semanticOperationIds),...strings(source.semanticOperationId),...strings(patch?.semanticOperationIds),...strings(mergeCandidate?.semanticOperationIds),...editIndex.semanticEditOperationIds]);
  const conflictKeys=uniqueStrings([
    ...strings(options.conflictKeys),
    ...strings(source.conflictKeys),
    ...strings(mergeCandidate?.conflictKeys),
    ...changedRegions.flatMap((region)=>[region.conflictKey,...array(region.admission?.conflictKeys)]),
    ...(source.metadata?.semanticMergeConflictSummary?.conflictKeys??[])
  ]);
  const admission=linkAdmissionLineage(createSemanticPatchBundleAdmission(options.admission??source.admission,{readiness,conflictKeys,source,mergeCandidate,evidenceRecords,semanticTransformIndex,semanticTransformIdentities,semanticEditAdmission:editAdmission}),lineageLinks);
  const id=options.id??(source.kind==='frontier.lang.semanticPatchBundleRecord'?source.id:undefined)
    ??`semantic_patch_bundle_${idFragment(firstString(source.id,patchId,mergeCandidateId,source.sourcePath,source.language,'record'))}`;
  const language=options.language??source.language??mergeCandidate?.language??sources.find((item)=>item.language)?.language;
  const sourcePath=options.sourcePath??source.sourcePath??mergeCandidate?.sourcePath??sources.find((item)=>item.sourcePath)?.sourcePath;
  const index=recordIndex({baseHash,targetHash,sources,changedRegions,sourceMapLinks,evidenceIds,proofIds,historyIds,semanticOperationIds,patchId,mergeCandidateId,admission,semanticEditAdmission:editAdmission,semanticEditIndex:editIndex,semanticTransformIndex,targetPortability,lineageLinks});
  return{
    kind:'frontier.lang.semanticPatchBundleRecord',
    version:1,
    schema:'frontier.lang.semanticPatchBundleRecord.v1',
    id,
    createdAt:options.createdAt??source.createdAt,
    patchId,
    mergeCandidateId,
    language,
    sourcePath,
    baseHash,
    targetHash,
    sources,
    changedRegions,
    sourceMapLinks,
    evidenceIds,
    proofIds,
    historyIds,
    semanticOperationIds,
    semanticEditScriptIds:editIndex.semanticEditScriptIds,
    semanticEditProjectionIds:editIndex.semanticEditProjectionIds,
    semanticEditReplayIds:editIndex.semanticEditReplayIds,
    semanticTransformIdentityIds:semanticTransformIndex.semanticTransformIds,
    admission,
    index,
    summary:{changedRegions:changedRegions.length,sourceMapLinks:sourceMapLinks.length,evidenceIds:evidenceIds.length,proofIds:proofIds.length,historyIds:historyIds.length,semanticOperations:semanticOperationIds.length,semanticEditScripts:semanticEditScripts.length,semanticEditProjections:semanticEditProjections.length,semanticEditReplays:semanticEditReplays.length,semanticEditProjectionEdits:editIndex.semanticEditProjectionEditCount,semanticEditReplayEdits:editIndex.semanticEditReplayEditCount,semanticEditBundleStatus:editAdmission.status,semanticTransformIdentities:semanticTransformIdentities.length,reviewRequired:admission.reviewRequired,autoMergeClaim:admission.autoMergeClaim},
    metadata:compactRecord({
      sourceChangeSetId:source.kind==='frontier.lang.nativeSourceChangeSet'?source.id:undefined,
      patchRisk:patch?.risk,
      nativeChangeSummary:source.summary,
      changedRegionProjectionSummary:source.metadata?.changedRegionProjectionSummary,
      semanticMergeConflictSummary:source.metadata?.semanticMergeConflictSummary,
      semanticEditSummary:semanticEditSummary(editIndex),
      semanticEditAdmission:editAdmission,
      semanticTransformSummary:semanticTransformSummary(semanticTransformIndex),
      targetPortability,
      semanticLineageResolutionLinks:lineageLinks,
      ...options.metadata
    })
  };
}

export function querySemanticPatchBundleRecords(records,query={}){
  return array(records).filter(Boolean).filter((record)=>matchesRecord(record,query)).sort((left,right)=>String(left.id).localeCompare(String(right.id)));
}

function recordIndex(parts){
  const editIndex=parts.semanticEditIndex??semanticEditRecordIndex([],[],[],parts);
  const editAdmission=parts.semanticEditAdmission??{};
  const semanticTransformIndex=parts.semanticTransformIndex??semanticTransformRecordIndex([],parts);
  const lineageIndex=semanticLineageLinkIndex(parts.lineageLinks,parts.changedRegions,parts.targetPortability,parts.admission);
  return{
    baseHashes:uniqueStrings([parts.baseHash,...parts.sources.map((item)=>item.baseHash)]),
    targetHashes:uniqueStrings([parts.targetHash,...parts.sources.map((item)=>item.targetHash)]),
    sourceHashes:uniqueStrings(parts.sources.map((item)=>item.sourceHash)),
    sourcePaths:uniqueStrings([...parts.sources.map((item)=>item.sourcePath),...strings(editAdmission.sourcePaths),...editIndex.projectedSourcePaths,...semanticTransformIndex.transformSourcePaths,...semanticTransformIndex.transformTargetPaths,...lineageIndex.sourcePaths]),
    regionKeys:uniqueStrings([...parts.changedRegions.map((region)=>region.key),...editIndex.anchorKeys]),
    regionKinds:uniqueStrings(parts.changedRegions.map((region)=>region.regionKind)),
    conflictKeys:uniqueStrings([...parts.changedRegions.flatMap((region)=>[region.conflictKey,...array(region.admission?.conflictKeys)]),...editIndex.conflictKeys]),
    sourceMapIds:uniqueStrings([...parts.sourceMapLinks.map((link)=>link.sourceMapId),...parts.changedRegions.flatMap((region)=>region.sourceMapIds??[])]),
    sourceMapMappingIds:uniqueStrings([...parts.sourceMapLinks.map((link)=>link.sourceMapMappingId),...parts.changedRegions.flatMap((region)=>region.sourceMapMappingIds??[])]),
    sourceMapLinkIds:uniqueStrings(parts.sourceMapLinks.map((link)=>link.id)),
    evidenceIds:uniqueStrings([...parts.evidenceIds,...lineageIndex.evidenceIds]),
    proofIds:uniqueStrings([...parts.proofIds,...lineageIndex.proofIds]),
    lineageResolutionIds:lineageIndex.lineageResolutionIds,
    lineageEventIds:lineageIndex.lineageEventIds,
    lineageSourcePaths:lineageIndex.sourcePaths,
    lineageEvidenceIds:lineageIndex.evidenceIds,
    lineageProofIds:lineageIndex.proofIds,
    lineageReasonCodes:lineageIndex.reasonCodes,
    historyIds:parts.historyIds,
    semanticOperationIds:uniqueStrings(parts.semanticOperationIds),
    semanticEditScriptIds:editIndex.semanticEditScriptIds,
    semanticEditProjectionIds:editIndex.semanticEditProjectionIds,
    semanticEditReplayIds:editIndex.semanticEditReplayIds,
    semanticEditReplayStatuses:editIndex.semanticEditReplayStatuses,
    semanticEditReplayActions:editIndex.semanticEditReplayActions,
    semanticEditAdmissionStatuses:uniqueStrings([editAdmission.status]),
    semanticEditAdmissionActions:uniqueStrings([editAdmission.action]),
    semanticEditAdmissionReadinesses:uniqueStrings([editAdmission.readiness]),
    semanticEditReplayCurrentHashes:editIndex.semanticEditReplayCurrentHashes,
    semanticEditReplayOutputHashes:editIndex.semanticEditReplayOutputHashes,
    semanticEditKeys:editIndex.semanticEditKeys,
    semanticIdentityHashes:editIndex.semanticIdentityHashes,
    sourceIdentityHashes:editIndex.sourceIdentityHashes,
    operationContentHashes:editIndex.operationContentHashes,
    editContentHashes:editIndex.editContentHashes,
    semanticTransformIds:semanticTransformIndex.semanticTransformIds,
    semanticTransformKeys:semanticTransformIndex.semanticTransformKeys,
    semanticTransformIdentityHashes:semanticTransformIndex.semanticTransformIdentityHashes,
    semanticTransformContentHashes:semanticTransformIndex.semanticTransformContentHashes,
    projectionIdentityHashes:semanticTransformIndex.projectionIdentityHashes,
    semanticTransformReadinesses:semanticTransformIndex.semanticTransformReadinesses,
    semanticTransformEvidenceIds:semanticTransformIndex.semanticTransformEvidenceIds,
    transformSourceLanguages:semanticTransformIndex.transformSourceLanguages,
    transformTargetLanguages:semanticTransformIndex.transformTargetLanguages,
    transformSourcePaths:semanticTransformIndex.transformSourcePaths,
    transformTargetPaths:semanticTransformIndex.transformTargetPaths,
    transformCrossLanguages:semanticTransformIndex.transformCrossLanguages,
    transformSourceMapIds:semanticTransformIndex.transformSourceMapIds,
    transformSourceMapLinkIds:semanticTransformIndex.transformSourceMapLinkIds,
    transformSourceMapMappingIds:semanticTransformIndex.transformSourceMapMappingIds,
    targetPortabilityStatuses:uniqueStrings([parts.targetPortability?.status]),
    targetPortabilityActions:uniqueStrings([parts.targetPortability?.action]),
    targetPortabilityReasonCodes:uniqueStrings(parts.targetPortability?.reasonCodes),
    patchIds:uniqueStrings([parts.patchId]),
    mergeCandidateIds:uniqueStrings([parts.mergeCandidateId]),
    readinesses:uniqueStrings([parts.admission.readiness,...parts.changedRegions.map((region)=>region.admission?.readiness)]),
    admissionStatuses:uniqueStrings([parts.admission.status])
  };
}

function matchesRecord(record,query){
  const index=record.index??recordIndex({...record,baseHash:record.baseHash,targetHash:record.targetHash,sources:record.sources??[],changedRegions:record.changedRegions??[],sourceMapLinks:record.sourceMapLinks??[],evidenceIds:record.evidenceIds??[],proofIds:record.proofIds??[],historyIds:record.historyIds??[],semanticOperationIds:record.semanticOperationIds??[],patchId:record.patchId,mergeCandidateId:record.mergeCandidateId,admission:record.admission??{},semanticEditAdmission:record.admission?.semanticEditAdmission??record.metadata?.semanticEditAdmission,targetPortability:record.metadata?.targetPortability,lineageLinks:normalizeLineageResolutionLinks([...array(record.metadata?.semanticLineageResolutionLinks),...array(record.admission?.metadata?.semanticLineageResolutionLinks)])});
  return matchAny(queryValues(query.id,query.ids),[record.id])
    &&matchAny(queryValues(query.patchId,query.patchIds),index.patchIds)
    &&matchAny(queryValues(query.mergeCandidateId,query.mergeCandidateIds),index.mergeCandidateIds)
    &&matchAny(queryValues(query.sourcePath,query.sourcePaths),[record.sourcePath,...index.sourcePaths])
    &&matchAny(queryValues(query.sourceHash,query.sourceHashes),index.sourceHashes)
    &&matchAny(queryValues(query.baseHash,query.baseHashes),[record.baseHash,...index.baseHashes])
    &&matchAny(queryValues(query.targetHash,query.targetHashes),[record.targetHash,...index.targetHashes])
    &&matchAny(queryValues(query.regionKey,query.regionKeys),index.regionKeys)
    &&matchAny(queryValues(query.regionKind,query.regionKinds),index.regionKinds)
    &&matchAny(queryValues(query.conflictKey,query.conflictKeys),index.conflictKeys)
    &&matchAny(queryValues(query.sourceMapId,query.sourceMapIds),index.sourceMapIds)
    &&matchAny(queryValues(query.sourceMapMappingId,query.sourceMapMappingIds),index.sourceMapMappingIds)
    &&matchAny(queryValues(query.sourceMapLinkId,query.sourceMapLinkIds),index.sourceMapLinkIds)
    &&matchAny(queryValues(query.evidenceId,query.evidenceIds),index.evidenceIds)
    &&matchAny(queryValues(query.proofId,query.proofIds),index.proofIds)
    &&matchAny(queryValues(query.lineageResolutionId,query.lineageResolutionIds,query.semanticLineageResolutionId,query.semanticLineageResolutionIds),index.lineageResolutionIds)
    &&matchAny(queryValues(query.lineageEventId,query.lineageEventIds),index.lineageEventIds)
    &&matchAny(queryValues(query.lineageSourcePath,query.lineageSourcePaths),index.lineageSourcePaths)
    &&matchAny(queryValues(query.lineageEvidenceId,query.lineageEvidenceIds),index.lineageEvidenceIds)
    &&matchAny(queryValues(query.lineageProofId,query.lineageProofIds),index.lineageProofIds)
    &&matchAny(queryValues(query.lineageReasonCode,query.lineageReasonCodes),index.lineageReasonCodes)
    &&matchAny(queryValues(query.historyId,query.historyIds),index.historyIds)
    &&matchAny(queryValues(query.semanticOperationId,query.semanticOperationIds),index.semanticOperationIds)
    &&matchAny(queryValues(query.semanticEditScriptId,query.semanticEditScriptIds),index.semanticEditScriptIds)
    &&matchAny(queryValues(query.semanticEditProjectionId,query.semanticEditProjectionIds),index.semanticEditProjectionIds)
    &&matchAny(queryValues(query.semanticEditReplayId,query.semanticEditReplayIds),index.semanticEditReplayIds)
    &&matchAny(queryValues(query.semanticEditReplayStatus,query.semanticEditReplayStatuses),index.semanticEditReplayStatuses)
    &&matchAny(queryValues(query.semanticEditReplayAction,query.semanticEditReplayActions),index.semanticEditReplayActions)
    &&matchAny(queryValues(query.semanticEditAdmissionStatus,query.semanticEditAdmissionStatuses),index.semanticEditAdmissionStatuses)
    &&matchAny(queryValues(query.semanticEditAdmissionAction,query.semanticEditAdmissionActions),index.semanticEditAdmissionActions)
    &&matchAny(queryValues(query.semanticEditAdmissionReadiness,query.semanticEditAdmissionReadinesses),index.semanticEditAdmissionReadinesses)
    &&matchAny(queryValues(query.semanticEditReplayCurrentHash,query.semanticEditReplayCurrentHashes),index.semanticEditReplayCurrentHashes)
    &&matchAny(queryValues(query.semanticEditReplayOutputHash,query.semanticEditReplayOutputHashes),index.semanticEditReplayOutputHashes)
    &&matchAny(queryValues(query.semanticEditKey,query.semanticEditKeys),index.semanticEditKeys)
    &&matchAny(queryValues(query.semanticIdentityHash,query.semanticIdentityHashes),index.semanticIdentityHashes)
    &&matchAny(queryValues(query.sourceIdentityHash,query.sourceIdentityHashes),index.sourceIdentityHashes)
    &&matchAny(queryValues(query.operationContentHash,query.operationContentHashes),index.operationContentHashes)
    &&matchAny(queryValues(query.editContentHash,query.editContentHashes),index.editContentHashes)
    &&matchAny(queryValues(query.semanticTransformId,query.semanticTransformIds),index.semanticTransformIds)
    &&matchAny(queryValues(query.semanticTransformKey,query.semanticTransformKeys),index.semanticTransformKeys)
    &&matchAny(queryValues(query.semanticTransformIdentityHash,query.semanticTransformIdentityHashes),index.semanticTransformIdentityHashes)
    &&matchAny(queryValues(query.semanticTransformContentHash,query.semanticTransformContentHashes),index.semanticTransformContentHashes)
    &&matchAny(queryValues(query.projectionIdentityHash,query.projectionIdentityHashes),index.projectionIdentityHashes)
    &&matchAny(queryValues(query.semanticTransformReadiness,query.semanticTransformReadinesses),index.semanticTransformReadinesses)
    &&matchAny(queryValues(query.semanticTransformEvidenceId,query.semanticTransformEvidenceIds),index.semanticTransformEvidenceIds)
    &&matchAny(queryValues(query.transformSourceLanguage,query.transformSourceLanguages),index.transformSourceLanguages)
    &&matchAny(queryValues(query.transformTargetLanguage,query.transformTargetLanguages),index.transformTargetLanguages)
    &&matchAny(queryValues(query.transformSourcePath,query.transformSourcePaths),index.transformSourcePaths)
    &&matchAny(queryValues(query.transformTargetPath,query.transformTargetPaths),index.transformTargetPaths)
    &&matchAny(queryValues(query.transformCrossLanguage,query.transformCrossLanguages),index.transformCrossLanguages)
    &&matchAny(queryValues(query.transformSourceMapId,query.transformSourceMapIds),index.transformSourceMapIds)
    &&matchAny(queryValues(query.transformSourceMapLinkId,query.transformSourceMapLinkIds),index.transformSourceMapLinkIds)
    &&matchAny(queryValues(query.transformSourceMapMappingId,query.transformSourceMapMappingIds),index.transformSourceMapMappingIds)
    &&matchAny(queryValues(query.targetPortabilityStatus,query.targetPortabilityStatuses),index.targetPortabilityStatuses)
    &&matchAny(queryValues(query.targetPortabilityAction,query.targetPortabilityActions),index.targetPortabilityActions)
    &&matchAny(queryValues(query.targetPortabilityReasonCode,query.targetPortabilityReasonCodes),index.targetPortabilityReasonCodes)
    &&matchAny(queryValues(query.readiness,query.readinesses),index.readinesses)
    &&matchAny(queryValues(query.admissionStatus,query.admissionStatuses),index.admissionStatuses);
}

function queryValues(...values){return uniqueStrings(values.flatMap((value)=>strings(value)));}
function matchAny(filters,values){if(filters.length===0)return true;const valueSet=new Set(strings(values));return filters.some((filter)=>valueSet.has(filter));}
function array(value){if(value===undefined||value===null)return[];return Array.isArray(value)?value:[value];}
function strings(value){return array(value).map((entry)=>String(entry??'')).filter(Boolean);}
function firstString(...values){return values.map((value)=>value===undefined||value===null?'':String(value)).find(Boolean);}
function compactRecord(value){return Object.fromEntries(Object.entries(value??{}).filter(([,entry])=>entry!==undefined&&(!Array.isArray(entry)||entry.length>0)));}
