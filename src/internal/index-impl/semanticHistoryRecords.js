import{hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';
import{ idFragment, maxSemanticMergeReadiness, normalizeSemanticMergeReadiness, uniqueStrings as uniqueRawStrings }from'../../native-import-utils.js';
import{normalizeOwnershipRegions,normalizeSemanticCandidates,normalizeSemanticClaims,normalizeSources,semanticClaimsByStatus}from'./semanticHistoryRecordNormalizers.js';

export const SemanticHistoryAdmissionStatuses=Object.freeze(['proposed','queued','admitted','needs-review','blocked','rejected']);
export const SemanticHistoryReviewerStatuses=Object.freeze(['unreviewed','approved','changes-requested','reviewed','rejected']);
export const SemanticHistoryOverlapKinds=Object.freeze(['ownership','conflict-key','source','source-path','import','semantic-candidate','semantic-claim','claim-hash','evidence','proof','replay','patch','merge-decision','actor','record-source','base-hash','target-hash']);
export const SemanticHistoryConflictReasons=Object.freeze(['ownership-overlap','semantic-conflict-key-overlap','base-hash-mismatch','target-hash-mismatch','admission-blocked','reviewer-rejected','source-path-overlap']);

export function createSemanticHistoryRecord(input={},options={}){
  const imported=input.importResult??input.imported;
  const actor=normalizeActor(input.actor??options.actor??compactRecord({id:input.actorId??options.actorId,kind:input.actorKind??options.actorKind,role:input.actorRole??options.actorRole,runId:input.runId??options.runId,lane:input.lane??options.lane,taskId:input.taskId??options.taskId}));
  const recordSource=normalizeRecordSource(input.recordSource??input.historySource??options.recordSource??options.historySource,compactRecord({...input,...options}));
  const sources=normalizeSources(input,imported);
  const ownershipRegions=normalizeOwnershipRegions([...(array(input.ownershipRegions)),...(array(input.changedRegions)),...(array(input.changeSet?.changedRegions)),...(array(imported?.ownershipRegions))]);
  const semanticCandidates=normalizeSemanticCandidates([...(array(input.semanticCandidates)),...(array(input.mergeCandidates)),...(array(input.mergeCandidate)),...(array(input.changeSet?.mergeCandidate)),...(array(imported?.mergeCandidates))]);
  const replayLinks=normalizeReplayLinks(input.replayLinks??input.replay);
  const baseHash=firstString(input.baseHash,input.beforeHash,...sources.map((source)=>source.baseHash),...semanticCandidates.map((candidate)=>candidate.baseHash));
  const targetHash=firstString(input.targetHash,input.afterHash,...sources.map((source)=>source.targetHash),...semanticCandidates.map((candidate)=>candidate.targetHash));
  const sourceContext={actor,recordSource,language:input.language??imported?.language??sources.find((source)=>source.language)?.language,sourcePath:input.sourcePath??imported?.sourcePath??sources.find((source)=>source.sourcePath)?.sourcePath,sourceHash:input.sourceHash??imported?.sourceHash??sources.find((source)=>source.sourceHash)?.sourceHash,baseHash,targetHash};
  const acceptedFacts=normalizeSemanticClaims([
    ...(array(input.acceptedFacts)),
    ...(array(input.acceptedSemanticClaims)),
    ...semanticClaimsByStatus(input,'accepted')
  ],{...sourceContext,status:'accepted',claimKind:'fact',prefix:'semantic_fact'});
  const rejectedTheories=normalizeSemanticClaims([
    ...(array(input.rejectedTheories)),
    ...(array(input.rejectedSemanticClaims)),
    ...semanticClaimsByStatus(input,'rejected')
  ],{...sourceContext,status:'rejected',claimKind:'theory',prefix:'semantic_theory'});
  const importedParserEvidence=normalizeImportedParserEvidence([
    ...(array(input.importedParserEvidence)),
    ...(array(input.parserEvidence)),
    ...(array(imported?.parserEvidence))
  ],sourceContext);
  const proofAttempts=normalizeProofAttempts([...(array(input.proofAttempts)),...(array(input.proofs))],sourceContext);
  const patchAncestry=normalizePatchAncestry(input.patchAncestry??input.patchAncestors??input.ancestry,sourceContext);
  const mergeDecisions=normalizeMergeDecisions(input.mergeDecisions??input.decisions,sourceContext);
  const semanticClaimIds=uniqueStrings([...acceptedFacts.map((claim)=>claim.id),...rejectedTheories.map((claim)=>claim.id)]);
  const semanticClaimHashes=uniqueStrings([...acceptedFacts.map((claim)=>claim.hash),...rejectedTheories.map((claim)=>claim.hash)]);
  const evidenceIds=uniqueStrings([...(strings(input.evidenceIds)),...(array(input.evidence)).map((record)=>record?.id),...(array(imported?.evidence)).map((record)=>record?.id),...semanticCandidates.flatMap((candidate)=>candidate.evidenceIds),...acceptedFacts.flatMap((claim)=>claim.evidenceIds),...rejectedTheories.flatMap((claim)=>claim.evidenceIds),...importedParserEvidence.flatMap((record)=>[record.evidenceId,...array(record.evidenceIds)]),...proofAttempts.flatMap((record)=>record.evidenceIds),...mergeDecisions.flatMap((decision)=>decision.evidenceIds),...(strings(input.reviewer?.evidenceIds)),...(strings(input.admission?.evidenceIds))]);
  const proofIds=uniqueStrings([...(strings(input.proofIds)),...(array(input.proofs)).map((record)=>record?.id),...semanticCandidates.flatMap((candidate)=>candidate.proofIds),...acceptedFacts.flatMap((claim)=>claim.proofIds),...rejectedTheories.flatMap((claim)=>claim.proofIds),...proofAttempts.flatMap((record)=>[record.proofId,...array(record.proofIds)]),...mergeDecisions.flatMap((decision)=>decision.proofIds)]);
  const sourceIds=uniqueStrings([input.sourceId,...strings(input.sourceIds),...sources.map((source)=>source.id)]);
  const importIds=uniqueStrings([input.importId,input.importResultId,imported?.id,...strings(input.importIds),...sources.map((source)=>source.importId),...semanticCandidates.map((candidate)=>candidate.importResultId)]);
  const sourcePaths=uniqueStrings([input.sourcePath,imported?.sourcePath,...sources.map((source)=>source.sourcePath),...ownershipRegions.map((region)=>region.sourcePath),...semanticCandidates.map((candidate)=>candidate.sourcePath)]);
  const sourceHashes=uniqueStrings([input.sourceHash,imported?.sourceHash,...sources.map((source)=>source.sourceHash),...ownershipRegions.map((region)=>region.sourceHash)]);
  const conflictKeys=uniqueStrings([...(strings(input.conflictKeys)),...semanticCandidates.flatMap((candidate)=>candidate.conflictKeys),...acceptedFacts.flatMap((claim)=>claim.conflictKeys),...rejectedTheories.flatMap((claim)=>claim.conflictKeys),...patchAncestry.flatMap((patch)=>patch.conflictKeys),...mergeDecisions.flatMap((decision)=>decision.conflictKeys)]);
  const reviewer=normalizeReviewer(input.reviewer);
  const admission=normalizeAdmission(input.admission,semanticCandidates,reviewer);
  const actorIds=uniqueStrings([actor?.id,actor?.actorId,...acceptedFacts.map((claim)=>claim.actor?.id),...rejectedTheories.map((claim)=>claim.actor?.id),...importedParserEvidence.map((record)=>record.actor?.id),...proofAttempts.map((record)=>record.actor?.id),...patchAncestry.map((record)=>record.actor?.id),...mergeDecisions.map((record)=>record.actor?.id)]);
  const recordSourceIds=uniqueStrings([recordSource?.id,recordSource?.sourceId,...acceptedFacts.flatMap((claim)=>[claim.recordSource?.id,claim.recordSource?.sourceId]),...rejectedTheories.flatMap((claim)=>[claim.recordSource?.id,claim.recordSource?.sourceId]),...importedParserEvidence.flatMap((record)=>[record.recordSource?.id,record.recordSource?.sourceId]),...proofAttempts.flatMap((record)=>[record.recordSource?.id,record.recordSource?.sourceId]),...patchAncestry.flatMap((record)=>[record.recordSource?.id,record.recordSource?.sourceId]),...mergeDecisions.flatMap((record)=>[record.recordSource?.id,record.recordSource?.sourceId])]);
  const patchIds=uniqueStrings([...semanticCandidates.map((candidate)=>candidate.patchId),...patchAncestry.flatMap((patch)=>[patch.patchId,...array(patch.parentPatchIds),...array(patch.ancestorPatchIds)]),...mergeDecisions.flatMap((decision)=>decision.patchIds)]);
  const mergeDecisionIds=uniqueStrings(mergeDecisions.map((decision)=>decision.id));
  const index={
    baseHashes:uniqueStrings([baseHash,...sources.map((source)=>source.baseHash),...semanticCandidates.map((candidate)=>candidate.baseHash),...patchAncestry.map((patch)=>patch.baseHash)]),
    targetHashes:uniqueStrings([targetHash,...sources.map((source)=>source.targetHash),...semanticCandidates.map((candidate)=>candidate.targetHash),...patchAncestry.map((patch)=>patch.targetHash)]),
    sourceIds,
    importIds,
    sourcePaths,
    sourceHashes,
    actorIds,
    recordSourceIds,
    ownershipKeys:uniqueStrings([...ownershipRegions.map((region)=>region.key),...semanticCandidates.flatMap((candidate)=>candidate.ownershipKeys)]),
    semanticCandidateIds:uniqueStrings(semanticCandidates.map((candidate)=>candidate.id)),
    semanticClaimIds,
    semanticClaimHashes,
    acceptedFactIds:uniqueStrings(acceptedFacts.map((claim)=>claim.id)),
    rejectedTheoryIds:uniqueStrings(rejectedTheories.map((claim)=>claim.id)),
    conflictKeys,
    evidenceIds,
    importedParserEvidenceIds:uniqueStrings(importedParserEvidence.map((record)=>record.id)),
    importedParserEvidenceHashes:uniqueStrings(importedParserEvidence.map((record)=>record.hash)),
    proofIds,
    proofAttemptIds:uniqueStrings(proofAttempts.map((record)=>record.id)),
    proofAttemptHashes:uniqueStrings(proofAttempts.map((record)=>record.hash)),
    replayIds:uniqueStrings([...replayLinks.map((link)=>link.id),...semanticCandidates.flatMap((candidate)=>candidate.replayIds),...acceptedFacts.flatMap((claim)=>claim.replayIds),...rejectedTheories.flatMap((claim)=>claim.replayIds),...proofAttempts.flatMap((record)=>record.replayIds)]),
    patchIds,
    patchHashes:uniqueStrings(patchAncestry.flatMap((patch)=>[patch.hash,...array(patch.parentHashes),...array(patch.ancestorHashes)])),
    mergeDecisionIds,
    mergeDecisionHashes:uniqueStrings(mergeDecisions.map((decision)=>decision.hash))
  };
  const recordCore={
    kind:'frontier.lang.semanticHistoryRecord',
    version:1,
    baseHash,
    targetHash,
    language:sourceContext.language,
    sourcePath:sourceContext.sourcePath??sourcePaths[0],
    actor,
    recordSource,
    sourceIds,
    importIds,
    sources,
    ownershipRegions,
    semanticCandidates,
    acceptedFacts,
    rejectedTheories,
    importedParserEvidence,
    proofAttempts,
    patchAncestry,
    mergeDecisions,
    evidenceIds,
    proofIds,
    reviewer,
    admission,
    replayLinks,
    index,
    metadata:compactRecord(input.metadata)
  };
  const hash=hashSemanticValue(recordCore);
  const stableId=`semantic_history_${idFragment(hash)}`;
  return{
    ...recordCore,
    id:input.id??options.id??stableId,
    stableId,
    hash,
    createdAt:input.createdAt??options.createdAt??Date.now()
  };
}

export{querySemanticHistoryRecordOverlaps,semanticHistoryRecordsConflict,semanticHistoryRecordsOverlap}from'./semanticHistoryRecordOverlaps.js';

function normalizeImportedParserEvidence(records,defaults){
  return records.filter(Boolean).map((record,index)=>{
    const source=typeof record==='string'?{evidenceId:record}:record;
    const normalized=compactRecord({
      kind:'frontier.lang.semanticHistoryImportedParserEvidence',
      version:1,
      evidenceId:firstString(source.evidenceId,source.id),
      importId:source.importId??source.importResultId??defaults.importId,
      parserId:source.parserId??source.parser??source.adapterId,
      parserKind:source.parserKind??source.kind,
      language:source.language??defaults.language,
      sourcePath:source.sourcePath??defaults.sourcePath,
      sourceHash:source.sourceHash??source.hash??defaults.sourceHash,
      astHash:source.astHash??source.nativeAstHash,
      semanticIndexHash:source.semanticIndexHash,
      status:source.status??'unknown',
      evidenceIds:uniqueStrings([source.evidenceId,source.id,...strings(source.evidenceIds)]),
      replayIds:uniqueStrings(source.replayIds),
      actor:normalizeActor(source.actor)??defaults.actor,
      recordSource:normalizeRecordSource(source.recordSource??source.historySource??defaults.recordSource,defaults),
      metadata:source.metadata
    });
    return withStableSubrecordIdentity('imported_parser_evidence',normalized,source,index);
  });
}

function normalizeProofAttempts(records,defaults){
  return records.filter(Boolean).map((record,index)=>{
    const source=typeof record==='string'?{proofId:record}:record;
    const normalized=compactRecord({
      kind:'frontier.lang.semanticHistoryProofAttempt',
      version:1,
      proofId:firstString(source.proofId,source.id),
      proofKind:source.proofKind??source.kind,
      status:source.status??'unknown',
      proverId:source.proverId??source.prover,
      claimIds:uniqueStrings(source.claimIds),
      evidenceIds:uniqueStrings(source.evidenceIds),
      proofIds:uniqueStrings(source.proofIds),
      replayIds:uniqueStrings(source.replayIds),
      command:source.command,
      resultHash:source.resultHash??source.proofHash,
      actor:normalizeActor(source.actor)??defaults.actor,
      recordSource:normalizeRecordSource(source.recordSource??source.historySource??defaults.recordSource,defaults),
      metadata:source.metadata
    });
    return withStableSubrecordIdentity('proof_attempt',normalized,source,index);
  });
}

function normalizePatchAncestry(records,defaults){
  return array(records).filter(Boolean).map((record,index)=>{
    const source=typeof record==='string'?{patchId:record}:record;
    const normalized=compactRecord({
      kind:'frontier.lang.semanticHistoryPatchAncestry',
      version:1,
      patchId:firstString(source.patchId,source.id),
      parentPatchIds:uniqueStrings([...(strings(source.parentPatchIds)),...(strings(source.parents))]),
      ancestorPatchIds:uniqueStrings([...(strings(source.ancestorPatchIds)),...(strings(source.ancestors))]),
      baseHash:source.baseHash??defaults.baseHash,
      targetHash:source.targetHash??defaults.targetHash,
      parentHashes:uniqueStrings(source.parentHashes),
      ancestorHashes:uniqueStrings(source.ancestorHashes),
      conflictKeys:uniqueStrings(source.conflictKeys),
      actor:normalizeActor(source.actor)??defaults.actor,
      recordSource:normalizeRecordSource(source.recordSource??source.historySource??defaults.recordSource,defaults),
      metadata:source.metadata
    });
    return withStableSubrecordIdentity('patch_ancestry',normalized,source,index);
  });
}

function normalizeMergeDecisions(records,defaults){
  return array(records).filter(Boolean).map((record,index)=>{
    const source=typeof record==='string'?{decision:record}:record;
    const normalized=compactRecord({
      kind:'frontier.lang.semanticHistoryMergeDecision',
      version:1,
      decision:source.decision??source.status,
      status:source.status??source.decision,
      decidedAt:source.decidedAt,
      claimIds:uniqueStrings(source.claimIds),
      acceptedClaimIds:uniqueStrings(source.acceptedClaimIds),
      rejectedClaimIds:uniqueStrings(source.rejectedClaimIds),
      patchIds:uniqueStrings([...(strings(source.patchIds)),source.patchId]),
      conflictKeys:uniqueStrings(source.conflictKeys),
      evidenceIds:uniqueStrings(source.evidenceIds),
      proofIds:uniqueStrings(source.proofIds),
      reasonCodes:uniqueStrings(source.reasonCodes),
      actor:normalizeActor(source.actor)??defaults.actor,
      recordSource:normalizeRecordSource(source.recordSource??source.historySource??defaults.recordSource,defaults),
      metadata:source.metadata
    });
    return withStableSubrecordIdentity('merge_decision',normalized,source,index);
  });
}

function withStableSubrecordIdentity(prefix,record,source,index){
  const hash=source.hash??hashSemanticValue(record);
  return{
    ...record,
    id:source.id??`${prefix}_${idFragment(firstString(record.subject,record.evidenceId,record.proofId,record.patchId,record.decision,hash,index+1))}`,
    hash
  };
}

function normalizeActor(value){
  const actor=typeof value==='string'?{id:value}:value;
  const normalized=compactRecord({
    id:actor?.id??actor?.actorId,
    kind:actor?.kind??actor?.actorKind??actor?.type,
    role:actor?.role,
    displayName:actor?.displayName??actor?.name,
    runId:actor?.runId,
    lane:actor?.lane,
    taskId:actor?.taskId,
    metadata:actor?.metadata
  });
  return nonEmptyRecord(normalized);
}

function normalizeRecordSource(value,context={}){
  const source=typeof value==='string'?{id:value}:value;
  const normalized=compactRecord({
    id:source?.id??source?.sourceId??context.recordSourceId??context.historySourceId,
    sourceId:source?.sourceId??source?.id??context.recordSourceId??context.historySourceId,
    sourceKind:source?.sourceKind??source?.kind??source?.type,
    sourcePath:source?.sourcePath??source?.path,
    sourceHash:source?.sourceHash??source?.hash,
    href:source?.href??source?.url,
    importId:source?.importId??context.importId??context.importResultId,
    runId:source?.runId??context.runId,
    jobId:source?.jobId??context.jobId,
    lane:source?.lane??context.lane,
    taskId:source?.taskId??context.taskId,
    metadata:source?.metadata
  });
  return nonEmptyRecord(normalized);
}

function normalizeReplayLinks(value){
  return array(value).filter(Boolean).map((link,index)=>{
    const text=typeof link==='string'?link:undefined;
    return compactRecord({
      id:link?.id??(text?`replay_${idFragment(text)}`:`replay_${index+1}`),
      kind:link?.kind??'replay',
      href:link?.href??(text&&/^[a-z][a-z0-9+.-]*:/i.test(text)?text:undefined),
      path:link?.path??(text&&!/^[a-z][a-z0-9+.-]*:/i.test(text)?text:undefined),
      command:link?.command,
      hash:link?.hash,
      targetId:link?.targetId,
      metadata:link?.metadata
    });
  });
}

function normalizeReviewer(reviewer){
  if(typeof reviewer==='string')return{status:reviewer,evidenceIds:[]};
  return compactRecord({status:reviewer?.status??'unreviewed',reviewerId:reviewer?.reviewerId??reviewer?.id,reviewedAt:reviewer?.reviewedAt,evidenceIds:uniqueStrings(reviewer?.evidenceIds),metadata:reviewer?.metadata});
}

function normalizeAdmission(admission,candidates,reviewer){
  const readiness=candidates.reduce((current,candidate)=>maxSemanticMergeReadiness(current,normalizeSemanticMergeReadiness(candidate.readiness)??'needs-review'),normalizeSemanticMergeReadiness(admission?.readiness)??'ready');
  return compactRecord({status:admission?.status??'proposed',readiness,admittedAt:admission?.admittedAt,reviewerId:admission?.reviewerId??reviewer.reviewerId,reasonCodes:uniqueStrings(admission?.reasonCodes),evidenceIds:uniqueStrings(admission?.evidenceIds),metadata:admission?.metadata});
}

function array(value){if(value===undefined||value===null)return[];return Array.isArray(value)?value:[value];}
function strings(value){return array(value).map((entry)=>String(entry??'')).filter(Boolean);}
function uniqueStrings(values){return uniqueRawStrings((values??[]).filter((entry)=>entry!==undefined&&entry!==null&&String(entry)!==''));}
function firstString(...values){return values.map((value)=>value===undefined||value===null?'':String(value)).find(Boolean);}
function compactRecord(value){return Object.fromEntries(Object.entries(value??{}).filter(([,entry])=>entry!==undefined&&(!Array.isArray(entry)||entry.length>0)));}
function nonEmptyRecord(value){return Object.keys(value??{}).length?value:undefined;}
