import{hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';
import{idFragment,normalizeSemanticMergeReadiness,uniqueStrings as uniqueRawStrings}from'../../native-import-utils.js';

export function normalizeSources(input,imported){
  const entries=[...(array(input.sources)),...(array(input.sourceRefs)),...(array(input.source)),...(array(imported))];
  if(entries.length===0&&(input.sourcePath||input.sourceHash||input.baseHash||input.targetHash||input.sourceId||input.importId)){
    entries.push(input);
  }
  return entries.map((source,index)=>compactRecord({
    id:source?.id??source?.sourceId,
    importId:source?.importId??source?.importResultId??(source?.kind==='frontier.lang.importResult'?source.id:undefined),
    language:source?.language??input.language,
    sourcePath:source?.sourcePath??source?.path??input.sourcePath,
    sourceHash:source?.sourceHash??source?.hash,
    baseHash:source?.baseHash??source?.beforeHash??input.baseHash??input.beforeHash,
    targetHash:source?.targetHash??source?.afterHash??input.targetHash??input.afterHash,
    metadata:source?.metadata,
    ordinal:index
  })).filter((source)=>source.id||source.importId||source.sourcePath||source.sourceHash||source.baseHash||source.targetHash);
}

export function normalizeOwnershipRegions(regions){
  const seen=new Set();
  const normalized=[];
  for(const region of regions){
    const key=firstString(region?.key,region?.ownershipKey,region?.conflictKey,region?.id);
    if(!key||seen.has(key))continue;
    seen.add(key);
    normalized.push(compactRecord({
      id:region?.id,
      key,
      regionKind:region?.regionKind??region?.ownershipRegionKind,
      granularity:region?.granularity??'semantic',
      language:region?.language,
      sourcePath:region?.sourcePath,
      sourceHash:region?.sourceHash,
      symbolId:region?.symbolId,
      symbolName:region?.symbolName??region?.name,
      sourceSpan:region?.sourceSpan??region?.span,
      metadata:region?.metadata
    }));
  }
  return normalized;
}

export function normalizeSemanticCandidates(candidates){
  return candidates.filter(Boolean).map((candidate,index)=>compactRecord({
    id:candidate.id??candidate.candidateId??`semantic_candidate_${index+1}`,
    importResultId:candidate.importResultId,
    patchId:candidate.patchId,
    sourcePath:candidate.sourcePath,
    baseHash:candidate.baseHash,
    targetHash:candidate.targetHash,
    readiness:normalizeSemanticMergeReadiness(candidate.readiness)??candidate.readiness,
    conflictKeys:uniqueStrings([...(strings(candidate.conflictKeys)),...(array(candidate.touchedSymbols)).map((entry)=>entry?.conflictKey),...(array(candidate.touchedSemanticNodes)).map((entry)=>entry?.conflictKey),...(array(candidate.nativeSpans)).map((entry)=>entry?.conflictKey),...(array(candidate.conflictClasses??candidate.metadata?.conflictClasses)).flatMap((entry)=>entry?.conflictKeys??[]),...(candidate.conflictSummary?.conflictKeys??candidate.metadata?.conflictSummary?.conflictKeys??[])]),
    ownershipKeys:uniqueStrings([...(strings(candidate.ownershipKeys)),...(strings(candidate.regionKeys))]),
    evidenceIds:uniqueStrings([...(strings(candidate.evidenceIds)),...(array(candidate.evidence)).map((record)=>record?.id),...(array(candidate.conflictClasses??candidate.metadata?.conflictClasses)).flatMap((entry)=>entry?.evidenceIds??[])]),
    proofIds:uniqueStrings([...(strings(candidate.proofIds)),...(array(candidate.evidence)).filter((record)=>record?.kind==='proof').map((record)=>record?.id)]),
    replayIds:uniqueStrings([...(strings(candidate.replayIds)),...(array(candidate.evidence)).filter((record)=>record?.kind==='replay').map((record)=>record?.id)]),
    metadata:compactRecord({risk:candidate.risk,reasons:candidate.reasons,...candidate.metadata})
  }));
}

export function normalizeSemanticClaims(claims,defaults){
  return claims.filter(Boolean).map((claim,index)=>{
    const text=typeof claim==='string'?claim:undefined;
    const source=typeof claim==='string'?{}:claim;
    const record=compactRecord({
      kind:'frontier.lang.semanticHistoryClaim',
      version:1,
      claimKind:source.claimKind??source.semanticClaimKind??source.kind??defaults.claimKind,
      status:source.status??defaults.status,
      subject:firstString(source.subject,source.symbolId,source.semanticNodeId,source.conflictKey,source.key,text),
      predicate:source.predicate??source.relation,
      object:source.object??source.value??source.expected,
      text,
      language:source.language??defaults.language,
      sourcePath:source.sourcePath??defaults.sourcePath,
      sourceHash:source.sourceHash??defaults.sourceHash,
      baseHash:source.baseHash??defaults.baseHash,
      targetHash:source.targetHash??defaults.targetHash,
      conflictKeys:uniqueStrings([...(strings(source.conflictKeys)),source.conflictKey,source.key]),
      evidenceIds:uniqueStrings(source.evidenceIds),
      proofIds:uniqueStrings(source.proofIds),
      replayIds:uniqueStrings(source.replayIds),
      actor:normalizeActor(source.actor)??defaults.actor,
      recordSource:normalizeRecordSource(source.recordSource??source.historySource??defaults.recordSource,defaults),
      metadata:source.metadata
    });
    return withStableSubrecordIdentity(defaults.prefix??'semantic_claim',record,source,index);
  });
}

export function semanticClaimsByStatus(input,status){
  return [...array(input.semanticClaims),...array(input.claims)].filter((claim)=>{
    const claimStatus=String(claim?.status??'').toLowerCase();
    if(claimStatus===status)return true;
    if(status==='accepted'&&claim?.accepted===true)return true;
    if(status==='rejected'&&(claim?.rejected===true||claim?.status===false))return true;
    return false;
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

function array(value){if(value===undefined||value===null)return[];return Array.isArray(value)?value:[value];}
function strings(value){return array(value).map((entry)=>String(entry??'')).filter(Boolean);}
function uniqueStrings(values){return uniqueRawStrings((values??[]).filter((entry)=>entry!==undefined&&entry!==null&&String(entry)!==''));}
function firstString(...values){return values.map((value)=>value===undefined||value===null?'':String(value)).find(Boolean);}
function compactRecord(value){return Object.fromEntries(Object.entries(value??{}).filter(([,entry])=>entry!==undefined&&(!Array.isArray(entry)||entry.length>0)));}
function nonEmptyRecord(value){return Object.keys(value??{}).length?value:undefined;}
