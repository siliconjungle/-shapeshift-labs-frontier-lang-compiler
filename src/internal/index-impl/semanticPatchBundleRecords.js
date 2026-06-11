import{idFragment,normalizeSemanticMergeReadiness,uniqueStrings}from'../../native-import-utils.js';

export const SemanticPatchBundleAdmissionStatuses=Object.freeze(['proposed','queued','admitted','needs-review','blocked','rejected']);

export function createSemanticPatchBundleRecord(input={},options={}){
  const source=input?.changeSet??input;
  const patch=options.patch??source.patch??source.semanticPatch??source.patchBundle;
  const mergeCandidate=options.mergeCandidate??source.mergeCandidate??source.candidate;
  const semanticEditScripts=array(options.semanticEditScripts??source.semanticEditScripts??source.semanticEditScript);
  const semanticEditProjections=array(options.semanticEditProjections??source.semanticEditProjections??source.semanticEditProjection);
  const semanticEditIndex=semanticEditRecordIndex(semanticEditScripts,semanticEditProjections,source);
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
  const evidenceRecords=[...array(options.evidence??source.evidence),...array(patch?.evidence),...array(mergeCandidate?.evidence),...semanticEditScripts.flatMap((script)=>array(script.evidence))];
  const patchId=firstString(options.patchId,source.patchId,patch?.id,mergeCandidate?.patchId);
  const mergeCandidateId=firstString(options.mergeCandidateId,source.mergeCandidateId,mergeCandidate?.id);
  const baseHash=firstString(options.baseHash,source.baseHash,source.beforeHash,patch?.baseHash,mergeCandidate?.baseHash,...sources.map((item)=>item.baseHash));
  const targetHash=firstString(options.targetHash,source.targetHash,source.afterHash,patch?.targetHash,mergeCandidate?.targetHash,...sources.map((item)=>item.targetHash));
  const readiness=normalizeSemanticMergeReadiness(firstString(options.readiness,source.readiness,source.admission?.readiness,mergeCandidate?.readiness))
    ?? firstString(options.readiness,source.readiness,source.admission?.readiness,mergeCandidate?.readiness,'needs-review');
  const evidenceIds=uniqueStrings([...strings(options.evidenceIds),...strings(source.evidenceIds),...evidenceRecords.map((record)=>record?.id),...strings(mergeCandidate?.evidenceIds)]);
  const proofIds=uniqueStrings([...strings(options.proofIds),...strings(source.proofIds),...evidenceRecords.filter((record)=>record?.kind==='proof').map((record)=>record.id),...strings(mergeCandidate?.proofIds)]);
  const historyIds=uniqueStrings([...strings(options.historyIds),...strings(options.historyId),...strings(source.historyIds),...strings(source.historyId)]);
  const semanticOperationIds=uniqueStrings([...strings(options.semanticOperationIds),...strings(options.semanticOperationId),...strings(source.semanticOperationIds),...strings(source.semanticOperationId),...strings(patch?.semanticOperationIds),...strings(mergeCandidate?.semanticOperationIds),...semanticEditIndex.semanticEditOperationIds]);
  const conflictKeys=uniqueStrings([
    ...strings(options.conflictKeys),
    ...strings(source.conflictKeys),
    ...strings(mergeCandidate?.conflictKeys),
    ...changedRegions.flatMap((region)=>[region.conflictKey,...array(region.admission?.conflictKeys)]),
    ...(source.metadata?.semanticMergeConflictSummary?.conflictKeys??[])
  ]);
  const admission=normalizeAdmission(options.admission??source.admission,{readiness,conflictKeys,source,mergeCandidate});
  const id=options.id??(source.kind==='frontier.lang.semanticPatchBundleRecord'?source.id:undefined)
    ??`semantic_patch_bundle_${idFragment(firstString(source.id,patchId,mergeCandidateId,source.sourcePath,source.language,'record'))}`;
  const language=options.language??source.language??mergeCandidate?.language??sources.find((item)=>item.language)?.language;
  const sourcePath=options.sourcePath??source.sourcePath??mergeCandidate?.sourcePath??sources.find((item)=>item.sourcePath)?.sourcePath;
  const index=recordIndex({baseHash,targetHash,sources,changedRegions,sourceMapLinks,evidenceIds,proofIds,historyIds,semanticOperationIds,patchId,mergeCandidateId,admission,semanticEditIndex});
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
    semanticEditScriptIds:semanticEditIndex.semanticEditScriptIds,
    semanticEditProjectionIds:semanticEditIndex.semanticEditProjectionIds,
    admission,
    index,
    summary:{changedRegions:changedRegions.length,sourceMapLinks:sourceMapLinks.length,evidenceIds:evidenceIds.length,proofIds:proofIds.length,historyIds:historyIds.length,semanticOperations:semanticOperationIds.length,semanticEditScripts:semanticEditScripts.length,semanticEditProjections:semanticEditProjections.length,semanticEditProjectionEdits:semanticEditIndex.semanticEditProjectionEditCount,reviewRequired:admission.reviewRequired,autoMergeClaim:admission.autoMergeClaim},
    metadata:compactRecord({
      sourceChangeSetId:source.kind==='frontier.lang.nativeSourceChangeSet'?source.id:undefined,
      patchRisk:patch?.risk,
      nativeChangeSummary:source.summary,
      changedRegionProjectionSummary:source.metadata?.changedRegionProjectionSummary,
      semanticMergeConflictSummary:source.metadata?.semanticMergeConflictSummary,
      semanticEditSummary:semanticEditSummary(semanticEditIndex),
      ...options.metadata
    })
  };
}

export function querySemanticPatchBundleRecords(records,query={}){
  return array(records).filter(Boolean).filter((record)=>matchesRecord(record,query)).sort((left,right)=>String(left.id).localeCompare(String(right.id)));
}

function normalizeSources(entries,context){
  return entries.filter(Boolean).map((entry,index)=>compactRecord({
    id:entry.id??entry.sourceId,
    side:entry.side,
    importId:entry.importId??entry.importResultId,
    language:entry.language??context.language,
    sourcePath:entry.sourcePath??context.sourcePath,
    sourceHash:entry.sourceHash??entry.hash,
    baseHash:entry.baseHash??entry.beforeHash??context.baseHash??context.beforeHash,
    targetHash:entry.targetHash??entry.afterHash??context.targetHash??context.afterHash,
    nativeSourceId:entry.nativeSourceId,
    nativeAstId:entry.nativeAstId,
    semanticIndexId:entry.semanticIndexId,
    universalAstId:entry.universalAstId,
    sourceMapIds:uniqueStrings(entry.sourceMapIds),
    ordinal:index
  })).filter((entry)=>entry.importId||entry.sourcePath||entry.sourceHash||entry.baseHash||entry.targetHash);
}

function sourceRef(importResult,side,sourceHash){
  if(!importResult)return undefined;
  return compactRecord({
    id:`${side}_${importResult.id??idFragment(importResult.sourcePath??'source')}`,side,importId:importResult.id,
    language:importResult.language,
    sourcePath:importResult.sourcePath,
    sourceHash:sourceHash??importResult.nativeSource?.sourceHash??importResult.nativeAst?.sourceHash??importResult.sourceHash,
    nativeSourceId:importResult.nativeSource?.id,
    nativeAstId:importResult.nativeAst?.id,
    semanticIndexId:importResult.semanticIndex?.id,
    universalAstId:importResult.universalAst?.id,
    sourceMapIds:uniqueStrings((importResult.sourceMaps??[]).map((map)=>map.id))
  });
}

function normalizeRegions(regions,context){
  return regions.filter(Boolean).map((region,index)=>{
    const projection=region.metadata?.changedRegionProjection??region.projection;
    const projected=projection?.region??{};
    const key=firstString(region.key,region.ownershipKey,projected.key,region.conflictKey,region.id);
    const conflictKey=firstString(region.conflictKey,projection?.conflictKey,key);
    const links=array(projection?.sourceMapLinks??region.sourceMapLinks);
    return compactRecord({
      id:region.id??projected.id??`changed_region_${index+1}`,
      key,
      conflictKey,
      changeKind:region.changeKind??projection?.changeKind,
      regionKind:region.regionKind??region.ownershipRegionKind??projected.kind,
      granularity:region.granularity??projected.granularity,
      precision:region.precision??projected.precision,
      language:region.language??projection?.language??context.language,
      sourcePath:region.sourcePath??projection?.sourcePath??context.sourcePath,
      sourceHash:region.sourceHash??projection?.after?.sourceHash??projection?.before?.sourceHash,
      symbolId:region.symbolId??projected.symbolId,
      symbolName:region.symbolName??region.name??projected.symbolName,
      symbolKind:region.symbolKind??projected.symbolKind,
      sourceSpan:region.sourceSpan??projected.sourceSpan,
      sourceMapLinkIds:uniqueStrings([...strings(region.sourceMapLinkIds),...links.map((link)=>link.id)]),
      sourceMapIds:uniqueStrings([...strings(region.sourceMapIds),...links.map((link)=>link.sourceMapId)]),
      sourceMapMappingIds:uniqueStrings([...strings(region.sourceMapMappingIds),...links.map((link)=>link.sourceMapMappingId)]),
      admission:compactRecord({
        readiness:projection?.admission?.readiness,
        action:projection?.admission?.action,
        reasonCodes:uniqueStrings(projection?.admission?.reasons),
        conflictKeys:uniqueStrings(projection?.admission?.conflictKeys)
      })
    });
  });
}

function normalizeSourceMapLinks(links){
  const seen=new Set();
  const result=[];
  for(const link of links.filter(Boolean)){
    const id=link.id??`source_map_link_${result.length+1}`;
    if(seen.has(id))continue;
    seen.add(id);
    result.push(compactRecord({
      id,side:link.side,sourceMapId:link.sourceMapId,sourceMapMappingId:link.sourceMapMappingId,
      sourcePath:link.sourcePath,sourceHash:link.sourceHash,targetPath:link.targetPath,targetHash:link.targetHash,
      semanticSymbolId:link.semanticSymbolId,
      semanticOccurrenceId:link.semanticOccurrenceId,
      semanticNodeId:link.semanticNodeId,
      nativeSourceId:link.nativeSourceId,
      nativeAstNodeId:link.nativeAstNodeId,
      precision:link.precision,
      sourceSpan:link.sourceSpan,
      generatedSpan:link.generatedSpan,
      regionKey:link.ownershipRegionKey,
      regionKind:link.ownershipRegionKind
    }));
  }
  return result;
}

function normalizeAdmission(input={},context){
  const readiness=normalizeSemanticMergeReadiness(input.readiness??context.readiness)??input.readiness??context.readiness;
  const status=input.status??admissionStatusForReadiness(readiness);
  return compactRecord({
    status,
    readiness,
    reviewRequired:input.reviewRequired??status!=='admitted',
    autoMergeClaim:false,
    reasonCodes:uniqueStrings([...strings(input.reasonCodes),...strings(context.source.reasons),...strings(context.mergeCandidate?.reasons)]),
    conflictKeys:uniqueStrings([...strings(input.conflictKeys),...context.conflictKeys]),
    admittedAt:input.admittedAt,
    reviewerId:input.reviewerId,
    evidenceIds:uniqueStrings(input.evidenceIds),
    metadata:input.metadata
  });
}

function recordIndex(parts){
  const semanticEditIndex=parts.semanticEditIndex??semanticEditRecordIndex([],[]);
  return{
    baseHashes:uniqueStrings([parts.baseHash,...parts.sources.map((item)=>item.baseHash)]),
    targetHashes:uniqueStrings([parts.targetHash,...parts.sources.map((item)=>item.targetHash)]),
    sourceHashes:uniqueStrings(parts.sources.map((item)=>item.sourceHash)),
    sourcePaths:uniqueStrings([...parts.sources.map((item)=>item.sourcePath),...semanticEditIndex.projectedSourcePaths]),
    regionKeys:uniqueStrings([...parts.changedRegions.map((region)=>region.key),...semanticEditIndex.anchorKeys]),
    regionKinds:uniqueStrings(parts.changedRegions.map((region)=>region.regionKind)),
    conflictKeys:uniqueStrings([...parts.changedRegions.flatMap((region)=>[region.conflictKey,...array(region.admission?.conflictKeys)]),...semanticEditIndex.conflictKeys]),
    sourceMapIds:uniqueStrings([...parts.sourceMapLinks.map((link)=>link.sourceMapId),...parts.changedRegions.flatMap((region)=>region.sourceMapIds??[])]),
    sourceMapMappingIds:uniqueStrings([...parts.sourceMapLinks.map((link)=>link.sourceMapMappingId),...parts.changedRegions.flatMap((region)=>region.sourceMapMappingIds??[])]),
    sourceMapLinkIds:uniqueStrings(parts.sourceMapLinks.map((link)=>link.id)),
    evidenceIds:parts.evidenceIds,
    proofIds:parts.proofIds,
    historyIds:parts.historyIds,
    semanticOperationIds:uniqueStrings(parts.semanticOperationIds),
    semanticEditScriptIds:semanticEditIndex.semanticEditScriptIds,
    semanticEditProjectionIds:semanticEditIndex.semanticEditProjectionIds,
    semanticEditKeys:semanticEditIndex.semanticEditKeys,
    semanticIdentityHashes:semanticEditIndex.semanticIdentityHashes,
    sourceIdentityHashes:semanticEditIndex.sourceIdentityHashes,
    operationContentHashes:semanticEditIndex.operationContentHashes,
    editContentHashes:semanticEditIndex.editContentHashes,
    patchIds:uniqueStrings([parts.patchId]),
    mergeCandidateIds:uniqueStrings([parts.mergeCandidateId]),
    readinesses:uniqueStrings([parts.admission.readiness,...parts.changedRegions.map((region)=>region.admission?.readiness)]),
    admissionStatuses:uniqueStrings([parts.admission.status])
  };
}

function matchesRecord(record,query){
  const index=record.index??recordIndex({...record,baseHash:record.baseHash,targetHash:record.targetHash,sources:record.sources??[],changedRegions:record.changedRegions??[],sourceMapLinks:record.sourceMapLinks??[],evidenceIds:record.evidenceIds??[],proofIds:record.proofIds??[],historyIds:record.historyIds??[],semanticOperationIds:record.semanticOperationIds??[],patchId:record.patchId,mergeCandidateId:record.mergeCandidateId,admission:record.admission??{}});
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
    &&matchAny(queryValues(query.historyId,query.historyIds),index.historyIds)
    &&matchAny(queryValues(query.semanticOperationId,query.semanticOperationIds),index.semanticOperationIds)
    &&matchAny(queryValues(query.semanticEditScriptId,query.semanticEditScriptIds),index.semanticEditScriptIds)
    &&matchAny(queryValues(query.semanticEditProjectionId,query.semanticEditProjectionIds),index.semanticEditProjectionIds)
    &&matchAny(queryValues(query.semanticEditKey,query.semanticEditKeys),index.semanticEditKeys)
    &&matchAny(queryValues(query.semanticIdentityHash,query.semanticIdentityHashes),index.semanticIdentityHashes)
    &&matchAny(queryValues(query.sourceIdentityHash,query.sourceIdentityHashes),index.sourceIdentityHashes)
    &&matchAny(queryValues(query.operationContentHash,query.operationContentHashes),index.operationContentHashes)
    &&matchAny(queryValues(query.editContentHash,query.editContentHashes),index.editContentHashes)
    &&matchAny(queryValues(query.readiness,query.readinesses),index.readinesses)
    &&matchAny(queryValues(query.admissionStatus,query.admissionStatuses),index.admissionStatuses);
}

function admissionStatusForReadiness(readiness){return readiness==='blocked'?'blocked':readiness==='needs-review'?'needs-review':'proposed';}
function semanticEditRecordIndex(scripts,projections,source={}){
  const operations=scripts.flatMap((script)=>array(script.operations));
  const edits=projections.flatMap((projection)=>array(projection.edits));
  const index=source.index??{};
  return{
    semanticEditScriptIds:uniqueStrings([...strings(source.semanticEditScriptIds),...strings(source.semanticEditScriptId),...strings(index.semanticEditScriptIds),...scripts.map((script)=>script.id)]),
    semanticEditProjectionIds:uniqueStrings([...strings(source.semanticEditProjectionIds),...strings(source.semanticEditProjectionId),...strings(index.semanticEditProjectionIds),...projections.map((projection)=>projection.id)]),
    semanticEditOperationIds:uniqueStrings([...strings(source.semanticOperationIds),...strings(index.semanticOperationIds),...operations.map((operation)=>operation.id)]),
    semanticEditProjectionEditCount:edits.length,
    semanticEditKeys:uniqueStrings([...strings(source.semanticEditKeys),...strings(index.semanticEditKeys),...operations.map((operation)=>operation.semanticKey),...edits.map((edit)=>edit.semanticKey)]),
    semanticIdentityHashes:uniqueStrings([...strings(source.semanticIdentityHashes),...strings(index.semanticIdentityHashes),...operations.map((operation)=>operation.semanticIdentityHash),...edits.map((edit)=>edit.semanticIdentityHash)]),
    sourceIdentityHashes:uniqueStrings([...strings(source.sourceIdentityHashes),...strings(index.sourceIdentityHashes),...operations.map((operation)=>operation.sourceIdentityHash),...edits.map((edit)=>edit.sourceIdentityHash)]),
    operationContentHashes:uniqueStrings([...strings(source.operationContentHashes),...strings(index.operationContentHashes),...operations.map((operation)=>operation.operationContentHash),...edits.map((edit)=>edit.operationContentHash)]),
    editContentHashes:uniqueStrings([...strings(source.editContentHashes),...strings(index.editContentHashes),...edits.map((edit)=>edit.editContentHash)]),
    anchorKeys:uniqueStrings([...operations.map((operation)=>operation.anchor?.key),...edits.map((edit)=>edit.anchorKey)]),
    conflictKeys:uniqueStrings([...operations.map((operation)=>operation.anchor?.conflictKey),...edits.map((edit)=>edit.conflictKey)]),
    projectedSourcePaths:uniqueStrings([...projections.map((projection)=>projection.sourcePath),...edits.flatMap((edit)=>[edit.sourcePath,edit.targetSourcePath])])
  };
}
function semanticEditSummary(index){
  if(!index.semanticEditScriptIds.length&&!index.semanticEditProjectionIds.length)return undefined;
  return compactRecord({
    scriptIds:index.semanticEditScriptIds,
    projectionIds:index.semanticEditProjectionIds,
    semanticEditKeys:index.semanticEditKeys,
    operationContentHashes:index.operationContentHashes,
    editContentHashes:index.editContentHashes,
    projectedSourcePaths:index.projectedSourcePaths
  });
}
function queryValues(...values){return uniqueStrings(values.flatMap((value)=>strings(value)));}
function matchAny(filters,values){if(filters.length===0)return true;const valueSet=new Set(strings(values));return filters.some((filter)=>valueSet.has(filter));}
function array(value){if(value===undefined||value===null)return[];return Array.isArray(value)?value:[value];}
function strings(value){return array(value).map((entry)=>String(entry??'')).filter(Boolean);}
function firstString(...values){return values.map((value)=>value===undefined||value===null?'':String(value)).find(Boolean);}
function compactRecord(value){return Object.fromEntries(Object.entries(value??{}).filter(([,entry])=>entry!==undefined&&(!Array.isArray(entry)||entry.length>0)));}
