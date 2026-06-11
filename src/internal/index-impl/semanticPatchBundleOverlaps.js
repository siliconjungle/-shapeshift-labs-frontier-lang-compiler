import{idFragment,uniqueStrings as uniqueRawStrings}from'../../native-import-utils.js';

export const SemanticPatchBundleOverlapKinds=Object.freeze([
  'operation-content',
  'edit-content',
  'semantic-edit-key',
  'semantic-identity',
  'source-identity',
  'semantic-edit-replay',
  'replay-output',
  'replay-current',
  'transform-content',
  'semantic-transform',
  'projection-identity',
  'region',
  'conflict-key',
  'source-path'
]);

export const SemanticPatchBundleOverlapStatuses=Object.freeze([
  'duplicate',
  'semantic-overlap',
  'source-overlap',
  'independent'
]);

const KIND_FIELDS=Object.freeze({
  'operation-content':'operationContentHashes',
  'edit-content':'editContentHashes',
  'semantic-edit-key':'semanticEditKeys',
  'semantic-identity':'semanticIdentityHashes',
  'source-identity':'sourceIdentityHashes',
  'semantic-edit-replay':'semanticEditReplayIds',
  'replay-output':'semanticEditReplayOutputHashes',
  'replay-current':'semanticEditReplayCurrentHashes',
  'transform-content':'semanticTransformContentHashes',
  'semantic-transform':'semanticTransformIdentityHashes',
  'projection-identity':'projectionIdentityHashes',
  region:'regionKeys',
  'conflict-key':'conflictKeys',
  'source-path':'sourcePaths'
});

export function compareSemanticPatchBundleRecords(left={},right={},options={}){
  const leftIndex=bundleIndex(left);
  const rightIndex=bundleIndex(right);
  const shared=sharedIndex(leftIndex,rightIndex,options);
  const overlapKinds=SemanticPatchBundleOverlapKinds
    .filter((kind)=>shared[KIND_FIELDS[kind]]?.length);
  const admission=overlapAdmission(shared,{leftIndex,rightIndex,options});
  return{
    kind:'frontier.lang.semanticPatchBundleOverlapRecord',
    version:1,
    schema:'frontier.lang.semanticPatchBundleOverlapRecord.v1',
    id:options.id??`semantic_patch_bundle_overlap_${idFragment(left?.id??'left')}_${idFragment(right?.id??'right')}`,
    leftBundleId:String(left?.id??'left'),
    rightBundleId:String(right?.id??'right'),
    overlapKinds,
    shared,
    admission,
    score:overlapScore(admission.status,shared,admission.reasonCodes),
    summary:{
      sharedKeys:countShared(shared),
      duplicateSignals:shared.operationContentHashes.length+shared.editContentHashes.length+shared.semanticTransformContentHashes.length+shared.semanticEditReplayIds.length+shared.semanticEditReplayOutputHashes.length,
      semanticSignals:shared.semanticEditKeys.length+shared.semanticIdentityHashes.length+shared.sourceIdentityHashes.length+shared.semanticTransformIdentityHashes.length+shared.projectionIdentityHashes.length,
      sourceSignals:shared.regionKeys.length+shared.conflictKeys.length+shared.sourcePaths.length+shared.semanticEditReplayCurrentHashes.length,
      baseHashMismatch:admission.reasonCodes.includes('base-hash-mismatch'),
      targetHashMismatch:admission.reasonCodes.includes('target-hash-mismatch')
    },
    metadata:compactRecord(options.metadata)
  };
}

export function querySemanticPatchBundleOverlaps(records,query={}){
  const list=array(records).filter(Boolean);
  const result=[];
  const compareOptions={
    includeSourcePaths:query.includeSourcePaths,
    reviewIndependent:query.reviewIndependent,
    metadata:query.metadata
  };
  for(let leftIndex=0;leftIndex<list.length;leftIndex+=1){
    for(let rightIndex=leftIndex+1;rightIndex<list.length;rightIndex+=1){
      const overlap=compareSemanticPatchBundleRecords(list[leftIndex],list[rightIndex],compareOptions);
      if(matchesOverlap(overlap,query))result.push(overlap);
    }
  }
  return result.sort((left,right)=>right.score-left.score||left.leftBundleId.localeCompare(right.leftBundleId)
    ||left.rightBundleId.localeCompare(right.rightBundleId));
}

function sharedIndex(left,right,options){
  return{
    operationContentHashes:intersect(left.operationContentHashes,right.operationContentHashes),
    editContentHashes:intersect(left.editContentHashes,right.editContentHashes),
    semanticEditKeys:intersect(left.semanticEditKeys,right.semanticEditKeys),
    semanticIdentityHashes:intersect(left.semanticIdentityHashes,right.semanticIdentityHashes),
    sourceIdentityHashes:intersect(left.sourceIdentityHashes,right.sourceIdentityHashes),
    semanticEditReplayIds:intersect(left.semanticEditReplayIds,right.semanticEditReplayIds),
    semanticEditReplayStatuses:intersect(left.semanticEditReplayStatuses,right.semanticEditReplayStatuses),
    semanticEditReplayActions:intersect(left.semanticEditReplayActions,right.semanticEditReplayActions),
    semanticEditReplayCurrentHashes:intersect(left.semanticEditReplayCurrentHashes,right.semanticEditReplayCurrentHashes),
    semanticEditReplayOutputHashes:intersect(left.semanticEditReplayOutputHashes,right.semanticEditReplayOutputHashes),
    semanticTransformContentHashes:intersect(left.semanticTransformContentHashes,right.semanticTransformContentHashes),
    semanticTransformIdentityHashes:intersect(left.semanticTransformIdentityHashes,right.semanticTransformIdentityHashes),
    projectionIdentityHashes:intersect(left.projectionIdentityHashes,right.projectionIdentityHashes),
    regionKeys:intersect(left.regionKeys,right.regionKeys),
    conflictKeys:intersect(left.conflictKeys,right.conflictKeys),
    sourcePaths:options.includeSourcePaths===false?[]:intersect(left.sourcePaths,right.sourcePaths),
    baseHashes:intersect(left.baseHashes,right.baseHashes),
    targetHashes:intersect(left.targetHashes,right.targetHashes)
  };
}

function overlapAdmission(shared,{leftIndex,rightIndex,options}){
  const duplicate=shared.operationContentHashes.length||shared.editContentHashes.length||shared.semanticTransformContentHashes.length||shared.semanticEditReplayIds.length||shared.semanticEditReplayOutputHashes.length;
  const semantic=shared.semanticEditKeys.length||shared.semanticIdentityHashes.length||shared.sourceIdentityHashes.length||shared.semanticTransformIdentityHashes.length||shared.projectionIdentityHashes.length;
  const source=shared.regionKeys.length||shared.conflictKeys.length||shared.sourcePaths.length||shared.semanticEditReplayCurrentHashes.length;
  const status=duplicate?'duplicate':semantic?'semantic-overlap':source?'source-overlap':'independent';
  const reasonCodes=uniqueStrings([
    shared.operationContentHashes.length?'same-operation-content':undefined,
    shared.editContentHashes.length?'same-edit-content':undefined,
    shared.semanticTransformContentHashes.length?'same-transform-content':undefined,
    shared.semanticEditKeys.length?'same-semantic-edit-key':undefined,
    shared.semanticIdentityHashes.length?'same-semantic-identity':undefined,
    shared.sourceIdentityHashes.length?'same-source-identity':undefined,
    shared.semanticEditReplayIds.length?'same-semantic-edit-replay':undefined,
    shared.semanticEditReplayOutputHashes.length?'same-replay-output':undefined,
    shared.semanticEditReplayCurrentHashes.length?'same-replay-current':undefined,
    shared.semanticTransformIdentityHashes.length?'same-semantic-transform':undefined,
    shared.projectionIdentityHashes.length?'same-projection-identity':undefined,
    shared.regionKeys.length?'same-region-key':undefined,
    shared.conflictKeys.length?'same-conflict-key':undefined,
    shared.sourcePaths.length?'same-source-path':undefined,
    status!=='independent'&&disjointNonEmpty(leftIndex.baseHashes,rightIndex.baseHashes)?'base-hash-mismatch':undefined,
    status!=='independent'&&disjointNonEmpty(leftIndex.targetHashes,rightIndex.targetHashes)?'target-hash-mismatch':undefined
  ]);
  return{
    status,
    reviewRequired:options.reviewIndependent?true:status!=='independent',
    autoMergeClaim:false,
    reasonCodes,
    sharedKeyCount:countShared(shared)
  };
}

function bundleIndex(record){
  const index=record?.index??{};
  return{
    baseHashes:uniqueStrings([record?.baseHash,...strings(index.baseHashes)]),
    targetHashes:uniqueStrings([record?.targetHash,...strings(index.targetHashes)]),
    sourcePaths:uniqueStrings([record?.sourcePath,...strings(index.sourcePaths)]),
    regionKeys:uniqueStrings(index.regionKeys),
    conflictKeys:uniqueStrings(index.conflictKeys),
    semanticEditKeys:uniqueStrings(index.semanticEditKeys),
    semanticIdentityHashes:uniqueStrings(index.semanticIdentityHashes),
    sourceIdentityHashes:uniqueStrings(index.sourceIdentityHashes),
    semanticEditReplayIds:uniqueStrings(index.semanticEditReplayIds),
    semanticEditReplayStatuses:uniqueStrings(index.semanticEditReplayStatuses),
    semanticEditReplayActions:uniqueStrings(index.semanticEditReplayActions),
    semanticEditReplayCurrentHashes:uniqueStrings(index.semanticEditReplayCurrentHashes),
    semanticEditReplayOutputHashes:uniqueStrings(index.semanticEditReplayOutputHashes),
    semanticTransformContentHashes:uniqueStrings(index.semanticTransformContentHashes),
    semanticTransformIdentityHashes:uniqueStrings(index.semanticTransformIdentityHashes),
    projectionIdentityHashes:uniqueStrings(index.projectionIdentityHashes),
    operationContentHashes:uniqueStrings(index.operationContentHashes),
    editContentHashes:uniqueStrings(index.editContentHashes)
  };
}

function matchesOverlap(overlap,query){
  const statusFilters=queryValues(query.status,query.statuses,query.admissionStatus,query.admissionStatuses);
  const includeIndependent=query.includeIndependent===true||statusFilters.includes('independent');
  if(!includeIndependent&&overlap.admission.status==='independent')return false;
  return matchAny(queryValues(query.id,query.ids),[overlap.id])
    &&matchAny(queryValues(query.bundleId,query.bundleIds),[overlap.leftBundleId,overlap.rightBundleId])
    &&matchAny(statusFilters,[overlap.admission.status])
    &&matchAny(queryValues(query.overlapKind,query.overlapKinds),overlap.overlapKinds)
    &&matchAny(queryValues(query.reasonCode,query.reasonCodes),overlap.admission.reasonCodes)
    &&matchAny(queryValues(query.sourcePath,query.sourcePaths),overlap.shared.sourcePaths)
    &&matchAny(queryValues(query.conflictKey,query.conflictKeys),overlap.shared.conflictKeys)
    &&matchAny(queryValues(query.semanticEditKey,query.semanticEditKeys),overlap.shared.semanticEditKeys)
    &&matchAny(queryValues(query.semanticEditReplayId,query.semanticEditReplayIds),overlap.shared.semanticEditReplayIds)
    &&matchAny(queryValues(query.semanticEditReplayStatus,query.semanticEditReplayStatuses),overlap.shared.semanticEditReplayStatuses)
    &&matchAny(queryValues(query.semanticEditReplayAction,query.semanticEditReplayActions),overlap.shared.semanticEditReplayActions)
    &&matchAny(queryValues(query.semanticEditReplayCurrentHash,query.semanticEditReplayCurrentHashes),overlap.shared.semanticEditReplayCurrentHashes)
    &&matchAny(queryValues(query.semanticEditReplayOutputHash,query.semanticEditReplayOutputHashes),overlap.shared.semanticEditReplayOutputHashes)
    &&matchAny(queryValues(query.semanticTransformIdentityHash,query.semanticTransformIdentityHashes),overlap.shared.semanticTransformIdentityHashes)
    &&matchAny(queryValues(query.semanticTransformContentHash,query.semanticTransformContentHashes),overlap.shared.semanticTransformContentHashes)
    &&matchAny(queryValues(query.projectionIdentityHash,query.projectionIdentityHashes),overlap.shared.projectionIdentityHashes)
    &&matchAny(queryValues(query.operationContentHash,query.operationContentHashes),overlap.shared.operationContentHashes)
    &&matchAny(queryValues(query.editContentHash,query.editContentHashes),overlap.shared.editContentHashes)
    &&(query.reviewRequired===undefined||overlap.admission.reviewRequired===query.reviewRequired)
    &&(query.minScore===undefined||overlap.score>=Number(query.minScore));
}

function overlapScore(status,shared,reasonCodes){
  const base=status==='duplicate'?100:status==='semantic-overlap'?75:status==='source-overlap'?35:0;
  const sharedBonus=Math.min(20,countShared(shared));
  const stalePenalty=reasonCodes.includes('base-hash-mismatch')||reasonCodes.includes('target-hash-mismatch')?15:0;
  return Math.max(0,base+sharedBonus-stalePenalty);
}

function countShared(shared){
  return Object.values(shared).reduce((total,values)=>total+(Array.isArray(values)?values.length:0),0);
}

function intersect(left,right){const rightSet=new Set(right??[]);return uniqueStrings((left??[]).filter((value)=>rightSet.has(value)));}
function disjointNonEmpty(left,right){return Boolean(left?.length&&right?.length&&intersect(left,right).length===0);}
function queryValues(...values){return uniqueStrings(values.flatMap((value)=>strings(value)));}
function matchAny(filters,values){if(filters.length===0)return true;const valueSet=new Set(strings(values));return filters.some((filter)=>valueSet.has(filter));}
function array(value){if(value===undefined||value===null)return[];return Array.isArray(value)?value:[value];}
function strings(value){return array(value).map((entry)=>String(entry??'')).filter(Boolean);}
function uniqueStrings(values){return uniqueRawStrings((values??[]).filter((entry)=>entry!==undefined&&entry!==null&&String(entry)!==''));}
function compactRecord(value){return Object.fromEntries(Object.entries(value??{}).filter(([,entry])=>entry!==undefined&&(!Array.isArray(entry)||entry.length>0)));}
