import{idFragment,normalizeSemanticMergeReadiness,uniqueStrings}from'../../native-import-utils.js';
import{semanticMergeConflictRiskScore}from'./semanticMergeConflicts.js';
import{inferProjectionRisk,internalOverlaps,normalizeChangedSemanticRegions,normalizeProjectionRisk,projectionRiskRank,queryAdmissionOverlaps,summarizeOverlaps}from'./semanticMergeCandidateRecordInternals.js';

export const SemanticMergeCandidateProjectionRisks=Object.freeze(['low','medium','high','unknown']);

const readinessRank=Object.freeze({ready:3,'ready-with-losses':2,'needs-review':1,blocked:0});

export function createSemanticMergeCandidateAdmissionRecord(input={},options={}){
  const source=input?.kind==='frontier.lang.nativeSourceChangeSet'?input:options.changeSet??input;
  const candidate=options.candidate??source.mergeCandidate??source.candidate??input;
  const patch=options.patch??source.patch??candidate.patch;
  const readiness=normalizeSemanticMergeReadiness(options.readiness??candidate.readiness??source.readiness)
    ??options.readiness??candidate.readiness??source.readiness??'needs-review';
  const evidenceRecords=uniqueRecords([
    ...array(options.evidence),
    ...array(source.evidence),
    ...array(candidate.evidence),
    ...array(patch?.evidence)
  ]);
  const evidenceIds=uniqueStrings([
    ...strings(options.evidenceIds),
    ...strings(source.evidenceIds),
    ...strings(candidate.evidenceIds),
    ...evidenceRecords.map((record)=>record?.id)
  ]);
  const proofIds=uniqueStrings([
    ...strings(options.proofIds),
    ...strings(source.proofIds),
    ...strings(candidate.proofIds),
    ...evidenceRecords.filter((record)=>isProofEvidence(record)).map((record)=>record.id)
  ]);
  const changedSemanticRegions=normalizeChangedSemanticRegions({
    candidate,
    changedRegions:[
      ...array(options.changedRegions),
      ...array(source.changedRegions),
      ...array(candidate.changedSemanticRegions),
      ...array(candidate.changedRegions),
      ...array(candidate.metadata?.changedSemanticRegions),
      ...array(candidate.metadata?.changedRegions)
    ],
    language:options.language??candidate.language??source.language,
    sourcePath:options.sourcePath??candidate.sourcePath??source.sourcePath,
    baseHash:firstString(options.baseHash,source.beforeHash,source.baseHash,patch?.baseHash,candidate.baseHash),
    targetHash:firstString(options.targetHash,source.afterHash,source.targetHash,patch?.targetHash,candidate.targetHash),
    sourceHash:firstString(options.sourceHash,source.afterHash,source.targetHash,candidate.targetHash,source.beforeHash,source.baseHash,candidate.baseHash)
  });
  const conflictKeys=uniqueStrings([
    ...strings(options.conflictKeys),
    ...strings(source.conflictKeys),
    ...strings(candidate.conflictKeys),
    ...changedSemanticRegions.flatMap((region)=>[region.conflictKey,...array(region.admission?.conflictKeys)]),
    ...array(candidate.conflictClasses).flatMap((record)=>record?.conflictKeys??[]),
    ...(candidate.conflictSummary?.conflictKeys??candidate.metadata?.conflictSummary?.conflictKeys??[]),
    ...(source.metadata?.semanticMergeConflictSummary?.conflictKeys??[])
  ]);
  const baseHash=firstString(options.baseHash,source.beforeHash,source.baseHash,patch?.baseHash,candidate.baseHash,...changedSemanticRegions.map((region)=>region.baseHash));
  const targetHash=firstString(options.targetHash,source.afterHash,source.targetHash,patch?.targetHash,candidate.targetHash,...changedSemanticRegions.map((region)=>region.targetHash));
  const sourceHashes=uniqueStrings([
    ...strings(options.sourceHashes),
    ...sourceHashValues(source.sourceHashes),
    ...sourceHashValues(candidate.sourceHashes),
    source.beforeHash,
    source.afterHash,
    source.baseHash,
    source.targetHash,
    candidate.baseHash,
    candidate.targetHash,
    patch?.baseHash,
    patch?.targetHash,
    ...changedSemanticRegions.flatMap((region)=>[region.sourceHash,region.baseHash,region.targetHash])
  ]);
  const projectionRisk=normalizeProjectionRisk(options.projectionRisk??candidate.projectionRisk??candidate.risk)
    ??inferProjectionRisk({readiness,candidate,patch,changedSemanticRegions,conflictKeys});
  const overlaps=internalOverlaps(changedSemanticRegions);
  const readinessSortKey=semanticMergeCandidateReadinessSortKey({
    readiness,
    projectionRisk,
    evidenceIds,
    proofIds,
    changedSemanticRegions,
    overlaps
  });
  const candidateId=firstString(options.candidateId,candidate.id,source.mergeCandidateId);
  const id=options.id??(source.kind==='frontier.lang.semanticMergeCandidateAdmissionRecord'?source.id:undefined)
    ??`semantic_merge_candidate_${idFragment(firstString(candidateId,source.id,source.sourcePath,source.language,'candidate'))}`;
  return {
    kind:'frontier.lang.semanticMergeCandidateAdmissionRecord',
    version:1,
    schema:'frontier.lang.semanticMergeCandidateAdmissionRecord.v1',
    id,
    candidateId,
    importResultId:firstString(options.importResultId,candidate.importResultId,source.importResultId,source.after?.id,source.before?.id),
    patchId:firstString(options.patchId,candidate.patchId,patch?.id,source.patchId),
    language:options.language??candidate.language??source.language,
    sourcePath:options.sourcePath??candidate.sourcePath??source.sourcePath,
    readiness,
    readinessSortKey,
    projectionRisk,
    sourceHashes:{baseHash,targetHash,values:sourceHashes},
    baseHash,
    targetHash,
    changedSemanticRegions,
    conflictKeys,
    evidenceIds,
    proofIds,
    overlapSummary:summarizeOverlaps(overlaps),
    admission:{
      readiness,
      reviewRequired:readiness!=='ready'||projectionRisk!=='low'||overlaps.length>0,
      action:admissionAction({readiness,projectionRisk,overlaps}),
      sortKey:readinessSortKey,
      reasonCodes:uniqueStrings([
        ...strings(options.reasonCodes),
        ...strings(source.reasons),
        ...strings(candidate.reasons),
        ...(projectionRisk!=='low'?[`projection-risk:${projectionRisk}`]:[]),
        ...(overlaps.length?['overlapping-semantic-regions']:[])
      ]),
      conflictKeys
    },
    index:{
      candidateIds:uniqueStrings([candidateId]),
      importResultIds:uniqueStrings([candidate.importResultId,source.importResultId,source.after?.id,source.before?.id]),
      patchIds:uniqueStrings([candidate.patchId,patch?.id,source.patchId]),
      sourcePaths:uniqueStrings([options.sourcePath,candidate.sourcePath,source.sourcePath,...changedSemanticRegions.map((region)=>region.sourcePath)]),
      sourceHashes,
      baseHashes:uniqueStrings([baseHash]),
      targetHashes:uniqueStrings([targetHash]),
      regionIds:uniqueStrings(changedSemanticRegions.map((region)=>region.id)),
      regionKeys:uniqueStrings(changedSemanticRegions.map((region)=>region.key)),
      regionKinds:uniqueStrings(changedSemanticRegions.map((region)=>region.regionKind)),
      conflictKeys,
      evidenceIds,
      proofIds,
      readinesses:uniqueStrings([readiness,...changedSemanticRegions.map((region)=>region.admission?.readiness)]),
      projectionRisks:uniqueStrings([projectionRisk,...changedSemanticRegions.map((region)=>region.projectionRisk)])
    },
    summary:{
      changedSemanticRegions:changedSemanticRegions.length,
      conflictKeys:conflictKeys.length,
      evidenceIds:evidenceIds.length,
      proofIds:proofIds.length,
      overlaps:overlaps.length,
      readiness,
      projectionRisk,
      reviewRequired:readiness!=='ready'||projectionRisk!=='low'||overlaps.length>0
    },
    metadata:compactRecord({
      sourceChangeSetId:source.kind==='frontier.lang.nativeSourceChangeSet'?source.id:undefined,
      conflictRiskScore:semanticMergeConflictRiskScore(candidate),
      conflictSummary:candidate.conflictSummary??candidate.metadata?.conflictSummary??source.metadata?.semanticMergeConflictSummary,
      changedRegionProjectionSummary:source.metadata?.changedRegionProjectionSummary??candidate.metadata?.changedRegionProjectionSummary,
      compact:true,
      note:'Semantic merge candidate admission records normalize changed regions, hashes, evidence, conflict keys, readiness, projection risk, and overlap signals for coordinator merge admission.',
      ...options.metadata
    })
  };
}

export function decorateSemanticMergeCandidateForAdmission(input={},options={}){
  const admissionRecord=createSemanticMergeCandidateAdmissionRecord(input,options);
  const candidate=options.candidate??(input?.kind==='frontier.lang.nativeSourceChangeSet'?input.mergeCandidate:input);
  return {
    ...candidate,
    changedSemanticRegions:admissionRecord.changedSemanticRegions,
    sourceHashes:admissionRecord.sourceHashes,
    evidenceIds:admissionRecord.evidenceIds,
    proofIds:admissionRecord.proofIds,
    projectionRisk:admissionRecord.projectionRisk,
    readinessSortKey:admissionRecord.readinessSortKey,
    mergeAdmission:admissionRecord
  };
}

export function sortSemanticMergeCandidateAdmissionRecords(records,options={}){
  const normalized=array(records).filter(Boolean).map((record)=>
    record.kind==='frontier.lang.semanticMergeCandidateAdmissionRecord'?record:createSemanticMergeCandidateAdmissionRecord(record)
  );
  const sorted=normalized.sort((left,right)=>
    right.readinessSortKey-left.readinessSortKey
    ||(projectionRiskRank[right.projectionRisk]??1)-(projectionRiskRank[left.projectionRisk]??1)
    ||String(left.candidateId??left.id??'').localeCompare(String(right.candidateId??right.id??''))
  );
  return options.desc===false?sorted.reverse():sorted;
}

export function querySemanticMergeCandidateAdmissionOverlaps(records,query={}){
  const list=array(records).filter(Boolean).map((record)=>
    record.kind==='frontier.lang.semanticMergeCandidateAdmissionRecord'?record:createSemanticMergeCandidateAdmissionRecord(record)
  );
  return queryAdmissionOverlaps(list,query);
}

export function semanticMergeCandidateReadinessSortKey(candidateOrRecord){
  const readiness=normalizeSemanticMergeReadiness(candidateOrRecord?.readiness)??candidateOrRecord?.readiness??'needs-review';
  const projectionRisk=normalizeProjectionRisk(candidateOrRecord?.projectionRisk)??'unknown';
  const evidenceIds=array(candidateOrRecord?.evidenceIds);
  const proofIds=array(candidateOrRecord?.proofIds);
  const changedSemanticRegions=array(candidateOrRecord?.changedSemanticRegions);
  const overlaps=array(candidateOrRecord?.overlaps??candidateOrRecord?.overlapSummary?.pairs);
  return (readinessRank[readiness]??readinessRank['needs-review'])*100000
    +(projectionRiskRank[projectionRisk]??1)*10000
    +Math.min(99,evidenceIds.length)*100
    +Math.min(99,proofIds.length)*25
    -Math.min(99,changedSemanticRegions.length)
    -Math.min(99,overlaps.length)*250;
}

function admissionAction(input){
  if(input.readiness==='blocked'||input.projectionRisk==='high')return'block';
  if(input.readiness==='needs-review'||input.projectionRisk!=='low'||input.overlaps.length)return'prioritize-review';
  return'admit';
}

function uniqueRecords(records){
  const seen=new Set();
  const result=[];
  for(const record of records.filter(Boolean)){
    const id=record.id??`record_${result.length+1}`;
    if(seen.has(id))continue;
    seen.add(id);
    result.push(record.id?record:{...record,id});
  }
  return result;
}

function sourceHashValues(value){
  if(value&&typeof value==='object'&&!Array.isArray(value))return [value.baseHash,value.targetHash,...array(value.values)].filter(Boolean);
  return strings(value);
}

function isProofEvidence(record){
  return /proof|test|trace|verify|verification|benchmark|behavior|contract/i.test(String(record?.kind??record?.metadata?.kind??record?.type??''));
}

function array(value){if(value===undefined||value===null)return[];return Array.isArray(value)?value:[value];}
function strings(value){return array(value).map((entry)=>String(entry??'')).filter(Boolean);}
function firstString(...values){return values.map((value)=>value===undefined||value===null?'':String(value)).find(Boolean);}
function compactRecord(value){return Object.fromEntries(Object.entries(value??{}).filter(([,entry])=>entry!==undefined&&(!Array.isArray(entry)||entry.length>0)));}
