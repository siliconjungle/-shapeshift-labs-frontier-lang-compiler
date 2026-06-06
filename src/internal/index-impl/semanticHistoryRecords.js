import{ idFragment, maxSemanticMergeReadiness, normalizeSemanticMergeReadiness, uniqueStrings as uniqueRawStrings }from'../../native-import-utils.js';

export const SemanticHistoryAdmissionStatuses=Object.freeze(['proposed','queued','admitted','needs-review','blocked','rejected']);
export const SemanticHistoryReviewerStatuses=Object.freeze(['unreviewed','approved','changes-requested','reviewed','rejected']);
export const SemanticHistoryOverlapKinds=Object.freeze(['ownership','conflict-key','source','source-path','import','semantic-candidate','evidence','proof','replay','base-hash','target-hash']);
export const SemanticHistoryConflictReasons=Object.freeze(['ownership-overlap','semantic-conflict-key-overlap','base-hash-mismatch','target-hash-mismatch','admission-blocked','reviewer-rejected','source-path-overlap']);

export function createSemanticHistoryRecord(input={},options={}){
  const imported=input.importResult??input.imported;
  const sources=normalizeSources(input,imported);
  const ownershipRegions=normalizeOwnershipRegions([...(array(input.ownershipRegions)),...(array(input.changedRegions)),...(array(input.changeSet?.changedRegions)),...(array(imported?.ownershipRegions))]);
  const semanticCandidates=normalizeSemanticCandidates([...(array(input.semanticCandidates)),...(array(input.mergeCandidates)),...(array(input.mergeCandidate)),...(array(input.changeSet?.mergeCandidate)),...(array(imported?.mergeCandidates))]);
  const replayLinks=normalizeReplayLinks(input.replayLinks??input.replay);
  const baseHash=firstString(input.baseHash,input.beforeHash,...sources.map((source)=>source.baseHash),...semanticCandidates.map((candidate)=>candidate.baseHash));
  const targetHash=firstString(input.targetHash,input.afterHash,...sources.map((source)=>source.targetHash),...semanticCandidates.map((candidate)=>candidate.targetHash));
  const evidenceIds=uniqueStrings([...(strings(input.evidenceIds)),...(array(input.evidence)).map((record)=>record?.id),...(array(imported?.evidence)).map((record)=>record?.id),...semanticCandidates.flatMap((candidate)=>candidate.evidenceIds),...(strings(input.reviewer?.evidenceIds)),...(strings(input.admission?.evidenceIds))]);
  const proofIds=uniqueStrings([...(strings(input.proofIds)),...(array(input.proofs)).map((record)=>record?.id),...semanticCandidates.flatMap((candidate)=>candidate.proofIds)]);
  const sourceIds=uniqueStrings([input.sourceId,...strings(input.sourceIds),...sources.map((source)=>source.id)]);
  const importIds=uniqueStrings([input.importId,input.importResultId,imported?.id,...strings(input.importIds),...sources.map((source)=>source.importId),...semanticCandidates.map((candidate)=>candidate.importResultId)]);
  const sourcePaths=uniqueStrings([input.sourcePath,imported?.sourcePath,...sources.map((source)=>source.sourcePath),...ownershipRegions.map((region)=>region.sourcePath),...semanticCandidates.map((candidate)=>candidate.sourcePath)]);
  const sourceHashes=uniqueStrings([input.sourceHash,imported?.sourceHash,...sources.map((source)=>source.sourceHash),...ownershipRegions.map((region)=>region.sourceHash)]);
  const conflictKeys=uniqueStrings([...(strings(input.conflictKeys)),...semanticCandidates.flatMap((candidate)=>candidate.conflictKeys)]);
  const reviewer=normalizeReviewer(input.reviewer);
  const admission=normalizeAdmission(input.admission,semanticCandidates,reviewer);
  return{
    kind:'frontier.lang.semanticHistoryRecord',
    version:1,
    id:input.id??options.id??`semantic_history_${idFragment(firstString(sourcePaths[0],importIds[0],sourceIds[0],'record'))}`,
    createdAt:input.createdAt??options.createdAt??Date.now(),
    baseHash,
    targetHash,
    language:input.language??imported?.language??sources.find((source)=>source.language)?.language,
    sourcePath:input.sourcePath??imported?.sourcePath??sourcePaths[0],
    sourceIds,
    importIds,
    sources,
    ownershipRegions,
    semanticCandidates,
    evidenceIds,
    proofIds,
    reviewer,
    admission,
    replayLinks,
    index:{
      baseHashes:uniqueStrings([baseHash,...sources.map((source)=>source.baseHash),...semanticCandidates.map((candidate)=>candidate.baseHash)]),
      targetHashes:uniqueStrings([targetHash,...sources.map((source)=>source.targetHash),...semanticCandidates.map((candidate)=>candidate.targetHash)]),
      sourceIds,
      importIds,
      sourcePaths,
      sourceHashes,
      ownershipKeys:uniqueStrings([...ownershipRegions.map((region)=>region.key),...semanticCandidates.flatMap((candidate)=>candidate.ownershipKeys)]),
      semanticCandidateIds:uniqueStrings(semanticCandidates.map((candidate)=>candidate.id)),
      conflictKeys,
      evidenceIds,
      proofIds,
      replayIds:uniqueStrings(replayLinks.map((link)=>link.id))
    },
    metadata:compactRecord(input.metadata)
  };
}

export function querySemanticHistoryRecordOverlaps(records,options={}){
  const list=array(records).filter(Boolean);
  const overlaps=[];
  for(let leftIndex=0;leftIndex<list.length;leftIndex+=1){
    for(let rightIndex=leftIndex+1;rightIndex<list.length;rightIndex+=1){
      const overlap=semanticHistoryOverlap(list[leftIndex],list[rightIndex],options);
      if(overlap.overlapKinds.length||overlap.conflictReasons.length)overlaps.push(overlap);
    }
  }
  return overlaps.sort((left,right)=>Number(right.conflict)-Number(left.conflict)||left.leftId.localeCompare(right.leftId)||left.rightId.localeCompare(right.rightId));
}

export function semanticHistoryRecordsOverlap(left,right,options={}){
  return semanticHistoryOverlap(left,right,options).overlapKinds.length>0;
}

export function semanticHistoryRecordsConflict(left,right,options={}){
  return semanticHistoryOverlap(left,right,options).conflict;
}

function semanticHistoryOverlap(left,right,options){
  const leftIndex=historyIndex(left);
  const rightIndex=historyIndex(right);
  const overlap=compactRecord({
    ownership:intersect(leftIndex.ownershipKeys,rightIndex.ownershipKeys),
    'conflict-key':intersect(leftIndex.conflictKeys,rightIndex.conflictKeys),
    source:intersect(leftIndex.sourceIds,rightIndex.sourceIds),
    'source-path':options.includeSourcePaths===false?[]:intersect(leftIndex.sourcePaths,rightIndex.sourcePaths),
    import:intersect(leftIndex.importIds,rightIndex.importIds),
    'semantic-candidate':intersect(leftIndex.semanticCandidateIds,rightIndex.semanticCandidateIds),
    evidence:options.includeEvidence?intersect(leftIndex.evidenceIds,rightIndex.evidenceIds):[],
    proof:options.includeProofs?intersect(leftIndex.proofIds,rightIndex.proofIds):[],
    replay:options.includeReplay?intersect(leftIndex.replayIds,rightIndex.replayIds):[],
    'base-hash':options.includeBaseHashes?intersect(leftIndex.baseHashes,rightIndex.baseHashes):[],
    'target-hash':options.includeTargetHashes?intersect(leftIndex.targetHashes,rightIndex.targetHashes):[]
  });
  const overlapKinds=Object.keys(overlap);
  const semanticOverlap=Boolean(overlap.ownership?.length||overlap['conflict-key']?.length||overlap.source?.length||overlap['source-path']?.length||overlap.import?.length);
  const conflictReasons=uniqueStrings([
    overlap.ownership?.length?'ownership-overlap':undefined,
    overlap['conflict-key']?.length?'semantic-conflict-key-overlap':undefined,
    semanticOverlap&&disjointNonEmpty(leftIndex.baseHashes,rightIndex.baseHashes)?'base-hash-mismatch':undefined,
    (overlap.ownership?.length||overlap['conflict-key']?.length)&&disjointNonEmpty(leftIndex.targetHashes,rightIndex.targetHashes)?'target-hash-mismatch':undefined,
    semanticOverlap&&(blockedAdmission(left)||blockedAdmission(right))?'admission-blocked':undefined,
    semanticOverlap&&(rejectedReview(left)||rejectedReview(right))?'reviewer-rejected':undefined,
    options.conflictOnSourcePath&&overlap['source-path']?.length?'source-path-overlap':undefined
  ]);
  return{
    schema:'frontier.lang.semanticHistoryOverlap.v1',
    leftId:String(left?.id??'left'),
    rightId:String(right?.id??'right'),
    overlap,
    overlapKinds,
    conflict:conflictReasons.length>0,
    conflictReasons,
    admission:{left:left?.admission?.status,right:right?.admission?.status},
    reviewer:{left:left?.reviewer?.status,right:right?.reviewer?.status}
  };
}

function normalizeSources(input,imported){
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

function normalizeOwnershipRegions(regions){
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

function normalizeSemanticCandidates(candidates){
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

function historyIndex(record){
  return record?.index??{
    baseHashes:uniqueStrings([record?.baseHash]),
    targetHashes:uniqueStrings([record?.targetHash]),
    sourceIds:uniqueStrings(record?.sourceIds),
    importIds:uniqueStrings(record?.importIds),
    sourcePaths:uniqueStrings([record?.sourcePath,...(record?.sources??[]).map((source)=>source.sourcePath)]),
    sourceHashes:uniqueStrings((record?.sources??[]).map((source)=>source.sourceHash)),
    ownershipKeys:uniqueStrings((record?.ownershipRegions??[]).map((region)=>region.key)),
    semanticCandidateIds:uniqueStrings((record?.semanticCandidates??[]).map((candidate)=>candidate.id)),
    conflictKeys:uniqueStrings((record?.semanticCandidates??[]).flatMap((candidate)=>candidate.conflictKeys??[])),
    evidenceIds:uniqueStrings(record?.evidenceIds),
    proofIds:uniqueStrings(record?.proofIds),
    replayIds:uniqueStrings((record?.replayLinks??[]).map((link)=>link.id))
  };
}

function blockedAdmission(record){return ['blocked','rejected'].includes(String(record?.admission?.status??''));}
function rejectedReview(record){return ['rejected','changes-requested'].includes(String(record?.reviewer?.status??''));}
function intersect(left,right){const rightSet=new Set(right??[]);return uniqueStrings((left??[]).filter((value)=>rightSet.has(value)));}
function disjointNonEmpty(left,right){return Boolean(left?.length&&right?.length&&intersect(left,right).length===0);}
function array(value){if(value===undefined||value===null)return[];return Array.isArray(value)?value:[value];}
function strings(value){return array(value).map((entry)=>String(entry??'')).filter(Boolean);}
function uniqueStrings(values){return uniqueRawStrings((values??[]).filter((entry)=>entry!==undefined&&entry!==null&&String(entry)!==''));}
function firstString(...values){return values.map((value)=>value===undefined||value===null?'':String(value)).find(Boolean);}
function compactRecord(value){return Object.fromEntries(Object.entries(value??{}).filter(([,entry])=>entry!==undefined&&(!Array.isArray(entry)||entry.length>0)));}
