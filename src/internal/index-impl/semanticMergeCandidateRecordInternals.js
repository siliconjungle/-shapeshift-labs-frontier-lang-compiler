import{idFragment,maxSemanticMergeReadiness,normalizeSemanticMergeReadiness,uniqueStrings}from'../../native-import-utils.js';
import{semanticMergeConflictRiskScore}from'./semanticMergeConflicts.js';

export const projectionRiskRank=Object.freeze({low:3,medium:2,unknown:1,high:0});
const readinessSeverityRank=Object.freeze({ready:0,'ready-with-losses':1,'needs-review':2,blocked:3});
const projectionRiskSeverityRank=Object.freeze({low:0,medium:1,unknown:2,high:3});
const projectionRiskFromReadiness=Object.freeze({ready:'low','ready-with-losses':'medium','needs-review':'medium',blocked:'high'});
const sourcePreservationRisk=Object.freeze({exact:'low',declaration:'medium',estimated:'medium',line:'medium',unknown:'medium',blocked:'high'});

export function normalizeChangedSemanticRegions(input){
  const records=[
    ...input.changedRegions.map((region,index)=>regionFromChangedRegion(region,index,input)),
    ...array(input.candidate.nativeSpans).map((span,index)=>regionFromNativeSpan(span,index,input)),
    ...array(input.candidate.touchedSymbols).map((symbol,index)=>regionFromTouchedSymbol(symbol,index,input)),
    ...array(input.candidate.touchedSemanticNodes).map((node,index)=>regionFromTouchedNode(node,index,input))
  ].filter(Boolean);
  const seen=new Set();
  const result=[];
  for(const record of records){
    const key=[record.conflictKey,record.sourcePath,spanKey(record.sourceSpan),record.symbolId,record.semanticNodeId,record.nativeAstNodeId].join('|');
    if(seen.has(key))continue;
    seen.add(key);
    result.push(record);
  }
  return result.sort((left,right)=>String(left.sourcePath??'').localeCompare(String(right.sourcePath??''))||String(left.conflictKey??left.key??left.id).localeCompare(String(right.conflictKey??right.key??right.id)));
}

function regionFromChangedRegion(region,index,input){
  if(!region)return undefined;
  const projection=region.metadata?.changedRegionProjection??region.projection;
  const projected=projection?.region??{};
  const before=projection?.before??{};
  const after=projection?.after??{};
  const key=firstString(region.key,region.ownershipKey,projected.key,region.conflictKey,region.id);
  const readiness=normalizeSemanticMergeReadiness(projection?.admission?.readiness??region.admission?.readiness);
  const sourceHash=firstString(region.sourceHash,after.sourceHash,before.sourceHash,input.sourceHash);
  return compactRecord({
    id:firstString(region.id,projected.id,`changed_region_${index+1}`),
    key,
    conflictKey:firstString(region.conflictKey,projection?.conflictKey,key),
    changeKind:region.changeKind??projection?.changeKind,
    regionKind:region.regionKind??region.ownershipRegionKind??projected.kind,
    granularity:region.granularity??projected.granularity,
    precision:region.precision??projected.precision,
    projectionRisk:region.projectionRisk??riskForRegion(region,projection),
    language:region.language??projection?.language??input.language,
    sourcePath:region.sourcePath??projection?.sourcePath??region.sourceSpan?.path??input.sourcePath,
    sourceHash,
    baseHash:firstString(before.sourceHash,input.baseHash),
    targetHash:firstString(after.sourceHash,input.targetHash),
    symbolId:region.symbolId??projected.symbolId,
    symbolName:region.symbolName??region.name??projected.symbolName,
    symbolKind:region.symbolKind??projected.symbolKind,
    semanticNodeId:region.semanticNodeId??projected.semanticNodeId,
    nativeAstNodeId:region.nativeAstNodeId??projected.nativeAstNodeId,
    sourceSpan:region.sourceSpan??projected.sourceSpan,
    sourceMapLinkIds:uniqueStrings([...(region.sourceMapLinkIds??[]),...(projection?.sourceMapLinks??[]).map((link)=>link.id)]),
    sourceMapIds:uniqueStrings([...(region.sourceMapIds??[]),...(projection?.sourceMapLinks??[]).map((link)=>link.sourceMapId)]),
    sourceMapMappingIds:uniqueStrings([...(region.sourceMapMappingIds??[]),...(projection?.sourceMapLinks??[]).map((link)=>link.sourceMapMappingId)]),
    admission:compactRecord({
      readiness,
      action:projection?.admission?.action??region.admission?.action,
      reasonCodes:uniqueStrings([...(projection?.admission?.reasons??[]),...(region.admission?.reasonCodes??[])]),
      conflictKeys:uniqueStrings([...(projection?.admission?.conflictKeys??[]),...(region.admission?.conflictKeys??[])])
    })
  });
}

function regionFromNativeSpan(span,index,input){
  if(!span)return undefined;
  const projection=span.metadata?.changedRegionProjection;
  const readiness=normalizeSemanticMergeReadiness(projection?.admission?.readiness);
  return compactRecord({
    id:firstString(span.id,`native_span_region_${index+1}`),
    key:firstString(span.metadata?.ownershipRegionKey,span.conflictKey,span.id),
    conflictKey:firstString(span.conflictKey,span.metadata?.ownershipRegionKey,span.id),
    changeKind:span.metadata?.changeKind,
    regionKind:span.metadata?.regionKind??projection?.regionKind,
    granularity:span.metadata?.granularity,
    precision:span.metadata?.precision??projection?.precision,
    projectionRisk:riskForRegion(span,projection),
    language:span.language??input.language,
    sourcePath:span.path??span.sourcePath??span.span?.path??input.sourcePath,
    sourceHash:span.sourceHash??input.sourceHash,
    baseHash:input.baseHash,
    targetHash:input.targetHash,
    symbolId:span.symbolId,
    semanticNodeId:span.semanticNodeId,
    nativeAstNodeId:span.nativeAstNodeId,
    sourceSpan:span.span,
    admission:compactRecord({readiness,action:projection?.admission?.action,reasonCodes:uniqueStrings(projection?.admission?.reasons),conflictKeys:uniqueStrings(projection?.admission?.conflictKeys)})
  });
}

function regionFromTouchedSymbol(symbol,index,input){
  if(!symbol)return undefined;
  return compactRecord({
    id:firstString(symbol.id,`symbol_region_${index+1}`),
    key:firstString(symbol.metadata?.ownershipRegionKey,symbol.conflictKey,symbol.id),
    conflictKey:firstString(symbol.conflictKey,symbol.metadata?.ownershipRegionKey,symbol.id),
    regionKind:'symbol',
    projectionRisk:riskForRegion(symbol),
    language:input.language,
    sourcePath:symbol.span?.path??input.sourcePath,
    sourceHash:input.sourceHash,
    baseHash:input.baseHash,
    targetHash:input.targetHash,
    symbolId:symbol.id,
    symbolName:symbol.name,
    symbolKind:symbol.kind,
    semanticNodeId:symbol.semanticNodeId,
    nativeAstNodeId:symbol.nativeAstNodeId,
    sourceSpan:symbol.span
  });
}

function regionFromTouchedNode(node,index,input){
  if(!node)return undefined;
  return compactRecord({
    id:firstString(node.id,`semantic_node_region_${index+1}`),
    key:firstString(node.conflictKey,node.id),
    conflictKey:firstString(node.conflictKey,node.id),
    regionKind:'semantic-node',
    projectionRisk:'medium',
    language:input.language,
    sourcePath:input.sourcePath,
    sourceHash:input.sourceHash,
    baseHash:input.baseHash,
    targetHash:input.targetHash,
    semanticNodeId:node.id,
    symbolName:node.name,
    symbolKind:node.kind
  });
}

function riskForRegion(region,projection){
  const readiness=normalizeSemanticMergeReadiness(region?.admission?.readiness??projection?.admission?.readiness);
  const explicit=normalizeProjectionRisk(region?.projectionRisk??projection?.projectionRisk);
  if(explicit)return explicit;
  if(readiness)return projectionRiskFromReadiness[readiness]??'medium';
  const preservation=sourcePreservationRisk[String(region?.sourcePreservationLevel??projection?.sourcePreservationLevel??region?.precision??projection?.precision??'').toLowerCase()];
  if(preservation)return preservation;
  if((projection?.sourceMapLinks??region?.sourceMapLinks??[]).length)return 'low';
  if(region?.sourceSpan||projection?.region?.sourceSpan)return 'medium';
  return 'unknown';
}

export function inferProjectionRisk(input){
  const regionRisk=input.changedSemanticRegions.reduce((current,region)=>maxProjectionRisk(current,normalizeProjectionRisk(region.projectionRisk)??riskForRegion(region)),'low');
  const readinessRisk=projectionRiskFromReadiness[input.readiness]??'medium';
  const conflictScore=semanticMergeConflictRiskScore(input.candidate);
  const conflictRisk=conflictScore>=5000?'high':conflictScore>=3000?'medium':'low';
  const patchRisk=normalizeProjectionRisk(input.patch?.risk??input.candidate?.risk)??'low';
  const missingRegionRisk=input.conflictKeys.length&&!input.changedSemanticRegions.length?'medium':'low';
  return [regionRisk,readinessRisk,conflictRisk,patchRisk,missingRegionRisk].reduce(maxProjectionRisk,'low');
}

function maxProjectionRisk(left,right){
  return (projectionRiskSeverityRank[left]??2)>=(projectionRiskSeverityRank[right]??2)?left:right;
}

export function normalizeProjectionRisk(value){
  const risk=String(value??'').toLowerCase();
  return Object.prototype.hasOwnProperty.call(projectionRiskRank,risk)?risk:undefined;
}

export function internalOverlaps(regions){
  const synthetic=regions.map((region,index)=>({id:`internal_${index+1}`,candidateId:`internal_${index+1}`,readiness:region.admission?.readiness??'ready',changedSemanticRegions:[region]}));
  return queryInternalOverlaps(synthetic);
}

export function queryAdmissionOverlaps(list,query={}){
  const result=[];
  for(let leftIndex=0;leftIndex<list.length;leftIndex+=1){
    for(let rightIndex=leftIndex+1;rightIndex<list.length;rightIndex+=1){
      result.push(...candidateOverlaps(list[leftIndex],list[rightIndex]));
    }
  }
  return result.filter((overlap)=>matchesOverlap(overlap,query)).sort(compareOverlapRecords);
}

function queryInternalOverlaps(records){
  const result=[];
  for(let left=0;left<records.length;left+=1){
    for(let right=left+1;right<records.length;right+=1){
      result.push(...candidateOverlaps(records[left],records[right]));
    }
  }
  return result;
}

function candidateOverlaps(left,right){
  const records=[];
  for(const leftRegion of left.changedSemanticRegions??[]){
    for(const rightRegion of right.changedSemanticRegions??[]){
      const overlap=regionOverlap(left,right,leftRegion,rightRegion,records.length+1);
      if(overlap)records.push(overlap);
    }
  }
  return dedupeOverlaps(records);
}

function regionOverlap(left,right,leftRegion,rightRegion,index){
  const sameConflictKey=Boolean(leftRegion.conflictKey&&rightRegion.conflictKey&&leftRegion.conflictKey===rightRegion.conflictKey);
  const sameRegionKey=Boolean(leftRegion.key&&rightRegion.key&&leftRegion.key===rightRegion.key);
  const spanOverlap=regionsSpanOverlap(leftRegion,rightRegion);
  if(!sameConflictKey&&!sameRegionKey&&!spanOverlap)return undefined;
  const overlapKind=sameConflictKey?'conflict-key':sameRegionKey?'region-key':'source-span';
  const conflictKeys=uniqueStrings([leftRegion.conflictKey,rightRegion.conflictKey]);
  return {
    schema:'frontier.lang.semanticMergeCandidateOverlap.v1',
    id:`overlap_${idFragment(left.id)}_${idFragment(right.id)}_${index}`,
    overlapKind,
    risk:overlapKind==='source-span'?'medium':'high',
    readiness:maxSemanticMergeReadiness(left.readiness,right.readiness),
    recordIds:[left.id,right.id],
    candidateIds:uniqueStrings([left.candidateId,right.candidateId]),
    regionIds:uniqueStrings([leftRegion.id,rightRegion.id]),
    regionKeys:uniqueStrings([leftRegion.key,rightRegion.key]),
    conflictKeys,
    sourcePath:firstString(leftRegion.sourcePath,rightRegion.sourcePath),
    leftRegion:compactOverlapRegion(leftRegion),
    rightRegion:compactOverlapRegion(rightRegion)
  };
}

export function summarizeOverlaps(overlaps){
  return {
    total:overlaps.length,
    hasOverlaps:overlaps.length>0,
    byKind:countBy(overlaps.map((overlap)=>overlap.overlapKind)),
    conflictKeys:uniqueStrings(overlaps.flatMap((overlap)=>overlap.conflictKeys??[])),
    pairs:overlaps
  };
}

function matchesOverlap(overlap,query){
  return matchAny(queryValues(query.id,query.ids),[overlap.id])
    &&matchAny(queryValues(query.candidateId,query.candidateIds),overlap.candidateIds)
    &&matchAny(queryValues(query.recordId,query.recordIds),overlap.recordIds)
    &&matchAny(queryValues(query.regionId,query.regionIds),overlap.regionIds)
    &&matchAny(queryValues(query.regionKey,query.regionKeys),overlap.regionKeys)
    &&matchAny(queryValues(query.conflictKey,query.conflictKeys),overlap.conflictKeys)
    &&matchAny(queryValues(query.sourcePath,query.sourcePaths),[overlap.sourcePath])
    &&matchAny(queryValues(query.overlapKind,query.overlapKinds),[overlap.overlapKind])
    &&matchAny(queryValues(query.readiness,query.readinesses),[overlap.readiness])
    &&matchAny(queryValues(query.risk,query.risks),[overlap.risk]);
}

function compareOverlapRecords(left,right){
  return (projectionRiskSeverityRank[right.risk]??1)-(projectionRiskSeverityRank[left.risk]??1)
    ||(readinessSeverityRank[right.readiness]??1)-(readinessSeverityRank[left.readiness]??1)
    ||String(left.id).localeCompare(String(right.id));
}

function regionsSpanOverlap(left,right){
  const leftPath=left.sourcePath??left.sourceSpan?.path;
  const rightPath=right.sourcePath??right.sourceSpan?.path;
  if(leftPath&&rightPath&&leftPath!==rightPath)return false;
  return spansOverlap(left.sourceSpan,right.sourceSpan);
}

function spansOverlap(left,right){
  if(!left||!right)return false;
  const leftRange=spanRange(left);
  const rightRange=spanRange(right);
  if(!leftRange||!rightRange)return false;
  return leftRange.start<=rightRange.end&&rightRange.start<=leftRange.end;
}

function spanRange(span){
  const startLine=numberValue(span.startLine??span.line??span.start?.line);
  const endLine=numberValue(span.endLine??span.end?.line??startLine);
  if(!Number.isFinite(startLine)||!Number.isFinite(endLine))return undefined;
  const startColumn=numberValue(span.startColumn??span.column??span.start?.column??0);
  const endColumn=numberValue(span.endColumn??span.end?.column??startColumn);
  return {start:startLine*100000+startColumn,end:endLine*100000+Math.max(startColumn,endColumn)};
}

function dedupeOverlaps(records){
  const seen=new Set();
  const result=[];
  for(const record of records){
    const key=[record.overlapKind,record.recordIds.join('|'),record.regionIds.join('|'),record.conflictKeys.join('|')].join(':');
    if(seen.has(key))continue;
    seen.add(key);
    result.push(record);
  }
  return result;
}

function compactOverlapRegion(region){
  return compactRecord({
    id:region.id,
    key:region.key,
    conflictKey:region.conflictKey,
    sourcePath:region.sourcePath,
    sourceSpan:region.sourceSpan,
    symbolId:region.symbolId,
    semanticNodeId:region.semanticNodeId,
    nativeAstNodeId:region.nativeAstNodeId,
    projectionRisk:region.projectionRisk
  });
}

function countBy(values){const counts={};for(const value of values??[]){const key=String(value??'unknown');counts[key]=(counts[key]??0)+1;}return counts;}
function queryValues(...values){return uniqueStrings(values.flatMap((value)=>strings(value)));}
function matchAny(filters,values){if(filters.length===0)return true;const valueSet=new Set(strings(values));return filters.some((filter)=>valueSet.has(filter));}
function spanKey(span){if(!span)return'';const range=spanRange(span);return range?`${range.start}-${range.end}`:'';}
function numberValue(value){const number=Number(value);return Number.isFinite(number)?number:undefined;}
function array(value){if(value===undefined||value===null)return[];return Array.isArray(value)?value:[value];}
function strings(value){return array(value).map((entry)=>String(entry??'')).filter(Boolean);}
function firstString(...values){return values.map((value)=>value===undefined||value===null?'':String(value)).find(Boolean);}
function compactRecord(value){return Object.fromEntries(Object.entries(value??{}).filter(([,entry])=>entry!==undefined&&(!Array.isArray(entry)||entry.length>0)));}
