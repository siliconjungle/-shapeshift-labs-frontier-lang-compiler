import{uniqueStrings as uniqueRawStrings}from'../../native-import-utils.js';

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
    'semantic-claim':options.includeClaims?intersect(leftIndex.semanticClaimIds,rightIndex.semanticClaimIds):[],
    'claim-hash':options.includeClaims?intersect(leftIndex.semanticClaimHashes,rightIndex.semanticClaimHashes):[],
    'semantic-lineage':options.includeLineage?intersect(leftIndex.lineageEventIds,rightIndex.lineageEventIds):[],
    'semantic-anchor':intersect(leftIndex.semanticAnchorKeys,rightIndex.semanticAnchorKeys),
    'crdt-operation':options.includeCrdt?intersect(leftIndex.crdtOperationIds,rightIndex.crdtOperationIds):[],
    'crdt-head':options.includeCrdt?intersect(leftIndex.crdtHeads,rightIndex.crdtHeads):[],
    evidence:options.includeEvidence?intersect(leftIndex.evidenceIds,rightIndex.evidenceIds):[],
    proof:options.includeProofs?intersect(leftIndex.proofIds,rightIndex.proofIds):[],
    replay:options.includeReplay?intersect(leftIndex.replayIds,rightIndex.replayIds):[],
    patch:options.includePatches?intersect(leftIndex.patchIds,rightIndex.patchIds):[],
    'merge-decision':options.includeMergeDecisions?intersect(leftIndex.mergeDecisionIds,rightIndex.mergeDecisionIds):[],
    actor:options.includeActors?intersect(leftIndex.actorIds,rightIndex.actorIds):[],
    'record-source':options.includeRecordSources?intersect(leftIndex.recordSourceIds,rightIndex.recordSourceIds):[],
    'base-hash':options.includeBaseHashes?intersect(leftIndex.baseHashes,rightIndex.baseHashes):[],
    'target-hash':options.includeTargetHashes?intersect(leftIndex.targetHashes,rightIndex.targetHashes):[]
  });
  const overlapKinds=Object.keys(overlap);
  const semanticOverlap=Boolean(overlap.ownership?.length||overlap['conflict-key']?.length||overlap['semantic-anchor']?.length||overlap.source?.length||overlap['source-path']?.length||overlap.import?.length);
  const conflictReasons=uniqueStrings([
    overlap.ownership?.length?'ownership-overlap':undefined,
    overlap['conflict-key']?.length?'semantic-conflict-key-overlap':undefined,
    overlap['semantic-anchor']?.length?'semantic-anchor-overlap':undefined,
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

function historyIndex(record){
  const acceptedFacts=record?.acceptedFacts??[];
  const rejectedTheories=record?.rejectedTheories??[];
  const importedParserEvidence=record?.importedParserEvidence??[];
  const proofAttempts=record?.proofAttempts??[];
  const lineageEvents=record?.lineageEvents??[];
  const patchAncestry=record?.patchAncestry??[];
  const mergeDecisions=record?.mergeDecisions??[];
  return record?.index??{
    baseHashes:uniqueStrings([record?.baseHash]),
    targetHashes:uniqueStrings([record?.targetHash]),
    sourceIds:uniqueStrings(record?.sourceIds),
    importIds:uniqueStrings(record?.importIds),
    sourcePaths:uniqueStrings([record?.sourcePath,...(record?.sources??[]).map((source)=>source.sourcePath)]),
    sourceHashes:uniqueStrings((record?.sources??[]).map((source)=>source.sourceHash)),
    actorIds:uniqueStrings([record?.actor?.id,...acceptedFacts.map((claim)=>claim.actor?.id),...rejectedTheories.map((claim)=>claim.actor?.id),...importedParserEvidence.map((entry)=>entry.actor?.id),...proofAttempts.map((entry)=>entry.actor?.id),...patchAncestry.map((entry)=>entry.actor?.id),...mergeDecisions.map((entry)=>entry.actor?.id)]),
    recordSourceIds:uniqueStrings([record?.recordSource?.id,record?.recordSource?.sourceId,...acceptedFacts.flatMap((claim)=>[claim.recordSource?.id,claim.recordSource?.sourceId]),...rejectedTheories.flatMap((claim)=>[claim.recordSource?.id,claim.recordSource?.sourceId]),...importedParserEvidence.flatMap((entry)=>[entry.recordSource?.id,entry.recordSource?.sourceId]),...proofAttempts.flatMap((entry)=>[entry.recordSource?.id,entry.recordSource?.sourceId]),...patchAncestry.flatMap((entry)=>[entry.recordSource?.id,entry.recordSource?.sourceId]),...mergeDecisions.flatMap((entry)=>[entry.recordSource?.id,entry.recordSource?.sourceId])]),
    ownershipKeys:uniqueStrings((record?.ownershipRegions??[]).map((region)=>region.key)),
    semanticCandidateIds:uniqueStrings((record?.semanticCandidates??[]).map((candidate)=>candidate.id)),
    semanticClaimIds:uniqueStrings([...acceptedFacts.map((claim)=>claim.id),...rejectedTheories.map((claim)=>claim.id)]),
    semanticClaimHashes:uniqueStrings([...acceptedFacts.map((claim)=>claim.hash),...rejectedTheories.map((claim)=>claim.hash)]),
    acceptedFactIds:uniqueStrings(acceptedFacts.map((claim)=>claim.id)),
    rejectedTheoryIds:uniqueStrings(rejectedTheories.map((claim)=>claim.id)),
    lineageEventIds:uniqueStrings(lineageEvents.map((entry)=>entry.id)),
    semanticAnchorIds:uniqueStrings(lineageEvents.flatMap((entry)=>[entry.from?.id,...(entry.to??[]).map((anchor)=>anchor.id)])),
    semanticAnchorKeys:uniqueStrings([
      ...lineageEvents.flatMap((entry)=>[entry.from?.key,...(entry.to??[]).map((anchor)=>anchor.key)]),
      ...(record?.ownershipRegions??[]).map((region)=>region.key),
      ...(record?.semanticCandidates??[]).flatMap((candidate)=>candidate.ownershipKeys??[])
    ]),
    semanticLineageKinds:uniqueStrings(lineageEvents.map((entry)=>entry.eventKind)),
    crdtOperationIds:uniqueStrings(lineageEvents.map((entry)=>entry.crdt?.operationId)),
    crdtHeads:uniqueStrings(lineageEvents.flatMap((entry)=>entry.crdt?.heads??[])),
    conflictKeys:uniqueStrings([...(record?.semanticCandidates??[]).flatMap((candidate)=>candidate.conflictKeys??[]),...acceptedFacts.flatMap((claim)=>claim.conflictKeys??[]),...rejectedTheories.flatMap((claim)=>claim.conflictKeys??[]),...lineageEvents.flatMap((entry)=>entry.conflictKeys??[]),...patchAncestry.flatMap((patch)=>patch.conflictKeys??[]),...mergeDecisions.flatMap((decision)=>decision.conflictKeys??[])]),
    evidenceIds:uniqueStrings([...(record?.evidenceIds??[]),...acceptedFacts.flatMap((claim)=>claim.evidenceIds??[]),...rejectedTheories.flatMap((claim)=>claim.evidenceIds??[]),...importedParserEvidence.flatMap((entry)=>[entry.evidenceId,...(entry.evidenceIds??[])]),...proofAttempts.flatMap((entry)=>entry.evidenceIds??[]),...lineageEvents.flatMap((entry)=>entry.evidenceIds??[]),...mergeDecisions.flatMap((entry)=>entry.evidenceIds??[])]),
    importedParserEvidenceIds:uniqueStrings(importedParserEvidence.map((entry)=>entry.id)),
    importedParserEvidenceHashes:uniqueStrings(importedParserEvidence.map((entry)=>entry.hash)),
    proofIds:uniqueStrings([...(record?.proofIds??[]),...acceptedFacts.flatMap((claim)=>claim.proofIds??[]),...rejectedTheories.flatMap((claim)=>claim.proofIds??[]),...proofAttempts.flatMap((entry)=>[entry.proofId,...(entry.proofIds??[])]),...lineageEvents.flatMap((entry)=>entry.proofIds??[]),...mergeDecisions.flatMap((entry)=>entry.proofIds??[])]),
    proofAttemptIds:uniqueStrings(proofAttempts.map((entry)=>entry.id)),
    proofAttemptHashes:uniqueStrings(proofAttempts.map((entry)=>entry.hash)),
    replayIds:uniqueStrings([...(record?.replayLinks??[]).map((link)=>link.id),...(record?.semanticCandidates??[]).flatMap((candidate)=>candidate.replayIds??[]),...acceptedFacts.flatMap((claim)=>claim.replayIds??[]),...rejectedTheories.flatMap((claim)=>claim.replayIds??[]),...proofAttempts.flatMap((entry)=>entry.replayIds??[])]),
    patchIds:uniqueStrings([...(record?.semanticCandidates??[]).map((candidate)=>candidate.patchId),...patchAncestry.flatMap((entry)=>[entry.patchId,...(entry.parentPatchIds??[]),...(entry.ancestorPatchIds??[])]),...mergeDecisions.flatMap((entry)=>entry.patchIds??[])]),
    patchHashes:uniqueStrings(patchAncestry.flatMap((entry)=>[entry.hash,...(entry.parentHashes??[]),...(entry.ancestorHashes??[])])),
    mergeDecisionIds:uniqueStrings(mergeDecisions.map((entry)=>entry.id)),
    mergeDecisionHashes:uniqueStrings(mergeDecisions.map((entry)=>entry.hash))
  };
}

function blockedAdmission(record){return ['blocked','rejected'].includes(String(record?.admission?.status??''));}
function rejectedReview(record){return ['rejected','changes-requested'].includes(String(record?.reviewer?.status??''));}
function intersect(left,right){const rightSet=new Set(right??[]);return uniqueStrings((left??[]).filter((value)=>rightSet.has(value)));}
function disjointNonEmpty(left,right){return Boolean(left?.length&&right?.length&&intersect(left,right).length===0);}

function array(value){if(value===undefined||value===null)return[];return Array.isArray(value)?value:[value];}
function uniqueStrings(values){return uniqueRawStrings((values??[]).filter((entry)=>entry!==undefined&&entry!==null&&String(entry)!==''));}
function compactRecord(value){return Object.fromEntries(Object.entries(value??{}).filter(([,entry])=>entry!==undefined&&(!Array.isArray(entry)||entry.length>0)));}
