import{countBy,maxSemanticMergeReadiness,uniqueRecordsById,uniqueStrings}from'../../native-import-utils.js';

const riskRank=Object.freeze({low:0,medium:1,unknown:2,high:3});
const preservationRank=Object.freeze({exact:0,lossy:1,missing:2,stale:3,empty:4});

export function projectAdmissionImports(imports,sourceRows,mergeCandidates){
  return imports.map((imported,index)=>{
    const source=sourceRows?.[index]??compactAdmissionSource(imported,index);
    const sourcePath=source.sourcePath??imported?.sourcePath;
    const candidates=mergeCandidates.filter((candidate)=>
      candidate.importResultId===imported?.id||candidate.sourcePath===sourcePath||candidate.patchId===imported?.patch?.id
    );
    const semanticIndex=imported?.semanticIndex??imported?.universalAst?.semanticIndex;
    const semanticCounts={
      symbols:semanticIndex?.symbols?.length??source.symbolCount??0,
      occurrences:semanticIndex?.occurrences?.length??0,
      relations:semanticIndex?.relations?.length??0,
      facts:semanticIndex?.facts?.length??0
    };
    return {
      id:source.id??imported?.id,
      language:source.language??imported?.language??'unknown',
      sourcePath,
      sourceHash:source.sourceHash,
      readiness:source.readiness??imported?.metadata?.semanticMergeReadiness??candidates[0]?.readiness??'ready',
      semanticCounts,
      emptySemanticEvidence:Object.values(semanticCounts).reduce((sum,value)=>sum+value,0)===0,
      sourcePreservation:summarizeImportPreservation(imported,source),
      mergeCandidates:candidates
    };
  });
}

export function admissionLanguages(importSummaries){
  const grouped=new Map();
  for(const entry of importSummaries){
    const key=entry.language??'unknown';
    if(!grouped.has(key)) grouped.set(key,emptyLanguageRow(key));
    const row=grouped.get(key);
    row.sourceCount+=1;
    row.sourcePaths.push(entry.sourcePath);
    row.readiness=maxSemanticMergeReadiness(row.readiness,entry.readiness);
    row.semanticSymbols+=entry.semanticCounts.symbols;
    if(entry.emptySemanticEvidence) row.emptySemanticEvidenceSources+=1;
    row.sourcePreservationQuality=maxPreservationQuality(row.sourcePreservationQuality,entry.sourcePreservation.quality);
    if(entry.sourcePreservation.stale&&entry.sourcePath) row.staleSourcePaths.push(entry.sourcePath);
    row.mergeCandidates+=entry.mergeCandidates.length;
    row.highestRisk=maxRisk(row.highestRisk,entry.mergeCandidates.reduce((current,candidate)=>maxRisk(current,candidateRisk(candidate)),'low'));
  }
  const rows=[...grouped.values()].map((row)=>({
    ...row,
    sourcePaths:uniqueStrings(row.sourcePaths.filter(Boolean)),
    staleSourcePaths:uniqueStrings(row.staleSourcePaths.filter(Boolean))
  })).sort((left,right)=>left.language.localeCompare(right.language));
  return {
    total:rows.length,
    byReadiness:countBy(rows.map((row)=>row.readiness)),
    bySourcePreservationQuality:countBy(rows.map((row)=>row.sourcePreservationQuality)),
    rows
  };
}

export function admissionSemanticEvidence(projectResult,imports,importSummaries){
  const projectIndex=projectResult?.semanticIndex??projectResult?.universalAst?.semanticIndex;
  const indexes=projectIndex?[projectIndex]:imports.flatMap((imported)=>[
    imported?.semanticIndex,
    imported?.universalAst?.semanticIndex
  ]).filter(Boolean);
  const totals=indexes.reduce((summary,semanticIndex)=>{
    summary.symbols+=semanticIndex.symbols?.length??0;
    summary.occurrences+=semanticIndex.occurrences?.length??0;
    summary.relations+=semanticIndex.relations?.length??0;
    summary.facts+=semanticIndex.facts?.length??0;
    return summary;
  },{symbols:0,occurrences:0,relations:0,facts:0});
  const emptySourcePaths=uniqueStrings(importSummaries
    .filter((entry)=>entry.emptySemanticEvidence)
    .map((entry)=>entry.sourcePath)
    .filter(Boolean));
  return {
    empty:Object.values(totals).reduce((sum,value)=>sum+value,0)===0,
    emptySourceCount:importSummaries.filter((entry)=>entry.emptySemanticEvidence).length,
    emptySourcePaths,
    ...totals,
    evidenceRecords:uniqueRecordsById([
      ...(projectResult?.evidence??[]),
      ...imports.flatMap((imported)=>imported?.evidence??[])
    ]).length
  };
}

export function admissionSourcePreservation(importSummaries,contract){
  const qualities=importSummaries.map((entry)=>entry.sourcePreservation.quality);
  const quality=qualities.length?qualities.reduce(maxPreservationQuality,'exact'):'empty';
  const staleSourcePaths=uniqueStrings(importSummaries
    .filter((entry)=>entry.sourcePreservation.stale)
    .map((entry)=>entry.sourcePath)
    .filter(Boolean));
  const lossySourcePaths=uniqueStrings(importSummaries
    .filter((entry)=>entry.sourcePreservation.quality==='lossy'||entry.sourcePreservation.quality==='missing')
    .map((entry)=>entry.sourcePath)
    .filter(Boolean));
  return {
    quality,
    total:contract?.sourcePreservation?.total??importSummaries.filter((entry)=>!entry.sourcePreservation.missing).length,
    exactSourceAvailable:contract?.sourcePreservation?.exactSourceAvailable??importSummaries.filter((entry)=>entry.sourcePreservation.exactSourceAvailable).length,
    sourceBytes:contract?.sourcePreservation?.sourceBytes??0,
    tokens:contract?.sourcePreservation?.tokens??0,
    trivia:contract?.sourcePreservation?.trivia??0,
    directives:contract?.sourcePreservation?.directives??0,
    comments:contract?.sourcePreservation?.comments??0,
    truncated:Boolean(contract?.sourcePreservation?.truncated)||importSummaries.some((entry)=>entry.sourcePreservation.truncated),
    stale:staleSourcePaths.length,
    missing:importSummaries.filter((entry)=>entry.sourcePreservation.missing).length,
    lossy:lossySourcePaths.length,
    staleSourcePaths,
    lossySourcePaths,
    byQuality:countBy(qualities)
  };
}

export function admissionOwnership(contract,mergeCandidates){
  const regions=contract?.regions??{};
  const candidateRegionConflictKeys=uniqueStrings(mergeCandidates.flatMap((candidate)=>
    (candidate.conflictKeys??[]).filter((key)=>String(key).startsWith('region:'))
  ));
  const changedIds=uniqueStrings([
    ...(regions.ids??[]),
    ...mergeCandidates.flatMap((candidate)=>candidate.nativeSpans??[]).map((span)=>span.metadata?.ownershipRegionId).filter(Boolean),
    ...mergeCandidates.flatMap((candidate)=>candidate.touchedSymbols??[]).map((symbol)=>symbol.ownershipRegionId??symbol.metadata?.ownershipRegionId).filter(Boolean)
  ]);
  const changedKeys=uniqueStrings([
    ...(regions.keys??[]),
    ...mergeCandidates.flatMap((candidate)=>candidate.nativeSpans??[]).map((span)=>span.metadata?.ownershipRegionKey).filter(Boolean),
    ...mergeCandidates.flatMap((candidate)=>candidate.touchedSymbols??[]).map((symbol)=>symbol.ownershipKey??symbol.metadata?.ownershipRegionKey).filter(Boolean)
  ]);
  return {
    total:regions.total??0,
    changed:Math.max(changedIds.length,changedKeys.length,candidateRegionConflictKeys.length),
    ids:regions.ids??[],
    keys:regions.keys??[],
    changedIds,
    changedKeys,
    candidateRegionConflictKeys,
    sourcePaths:regions.sourcePaths??[],
    byKind:regions.byKind??{},
    byGranularity:regions.byGranularity??{},
    byPrecision:regions.byPrecision??{},
    byLanguage:regions.byLanguage??{}
  };
}

export function admissionMergeCandidates(projectResult,imports,mergeCandidates,lossSummary){
  const patchById=new Map([
    projectResult?.patch,
    ...imports.map((imported)=>imported?.patch)
  ].filter((patch)=>patch?.id).map((patch)=>[patch.id,patch]));
  const risks=mergeCandidates.map((candidate)=>candidateRisk(candidate,patchById.get(candidate.patchId)));
  const readiness=mergeCandidates.reduce(
    (current,candidate)=>maxSemanticMergeReadiness(current,candidate.readiness),
    lossSummary?.semanticMergeReadiness??'ready'
  );
  return {
    total:mergeCandidates.length,
    readiness,
    highestRisk:risks.reduce(maxRisk,'low'),
    byRisk:countBy(risks),
    byReadiness:countBy(mergeCandidates.map((candidate)=>candidate.readiness??'needs-review')),
    highRiskCandidateIds:mergeCandidates.filter((candidate,index)=>risks[index]==='high').map((candidate)=>candidate.id).filter(Boolean),
    reviewCandidateIds:mergeCandidates.filter((candidate)=>candidate.readiness==='needs-review').map((candidate)=>candidate.id).filter(Boolean),
    blockedCandidateIds:mergeCandidates.filter((candidate)=>candidate.readiness==='blocked').map((candidate)=>candidate.id).filter(Boolean),
    conflictKeys:uniqueStrings(mergeCandidates.flatMap((candidate)=>candidate.conflictKeys??[])),
    patchRisk:normalizeRisk(projectResult?.patch?.risk)
  };
}

export function candidateRisk(candidate,patch){
  return normalizeRisk(candidate?.risk)??normalizeRisk(patch?.risk)??readinessRisk(candidate?.readiness);
}

export function maxRisk(left,right){
  return riskRank[left]>=riskRank[right]?left:right;
}

export function maxPreservationQuality(left,right){
  return preservationRank[left]>=preservationRank[right]?left:right;
}

function compactAdmissionSource(imported,index){
  const semanticIndex=imported?.semanticIndex??imported?.universalAst?.semanticIndex;
  const nativeAst=imported?.nativeAst??imported?.nativeSource?.ast;
  const sourceMaps=imported?.sourceMaps??imported?.universalAst?.sourceMaps??[];
  return {
    id:imported?.id??`import_${index+1}`,
    language:imported?.language??imported?.nativeSource?.language??nativeAst?.language,
    sourcePath:imported?.sourcePath??imported?.nativeSource?.sourcePath??nativeAst?.sourcePath,
    sourceHash:imported?.nativeSource?.sourceHash??nativeAst?.sourceHash,
    parser:nativeAst?.parser??imported?.nativeSource?.parser,
    sourceMapIds:sourceMaps.map((sourceMap)=>sourceMap.id).filter(Boolean),
    sourceMapMappings:sourceMaps.reduce((sum,sourceMap)=>sum+(sourceMap.mappings?.length??0),0),
    symbolCount:semanticIndex?.symbols?.length??0,
    lossCount:imported?.losses?.length??nativeAst?.losses?.length??0,
    evidenceCount:imported?.evidence?.length??0,
    readiness:imported?.metadata?.semanticMergeReadiness??imported?.mergeCandidates?.[0]?.readiness
  };
}

function summarizeImportPreservation(imported,source){
  const nativeAst=imported?.nativeAst??imported?.nativeSource?.ast;
  const record=imported?.metadata?.sourcePreservation
    ??imported?.nativeSource?.metadata?.sourcePreservation
    ??nativeAst?.metadata?.sourcePreservation
    ??imported?.universalAst?.metadata?.sourcePreservation;
  const sourceHash=source?.sourceHash??imported?.nativeSource?.sourceHash??nativeAst?.sourceHash;
  const sourcePreservationLosses=(imported?.losses??nativeAst?.losses??[]).filter((loss)=>loss.kind==='sourcePreservation');
  const stale=imported?.metadata?.sourceHashVerified===false
    ||imported?.nativeSource?.metadata?.sourceHashVerified===false
    ||nativeAst?.metadata?.sourceHashVerified===false
    ||record?.metadata?.sourceHashVerified===false
    ||Boolean(record?.sourceHash&&sourceHash&&record.sourceHash!==sourceHash);
  const missing=!record;
  const truncated=record?.summary?.truncated===true;
  const exactSourceAvailable=record?.summary?.exactSourceAvailable===true;
  const quality=stale?'stale':missing?'missing':truncated||!exactSourceAvailable||sourcePreservationLosses.length?'lossy':'exact';
  return {quality,missing,stale,truncated,exactSourceAvailable,lossCount:sourcePreservationLosses.length,id:record?.id};
}

function emptyLanguageRow(language){
  return {
    language,
    sourceCount:0,
    sourcePaths:[],
    readiness:'ready',
    semanticSymbols:0,
    emptySemanticEvidenceSources:0,
    sourcePreservationQuality:'exact',
    staleSourcePaths:[],
    mergeCandidates:0,
    highestRisk:'low'
  };
}

function readinessRisk(readiness){
  if(readiness==='blocked') return 'high';
  if(readiness==='needs-review'||readiness==='ready-with-losses') return 'medium';
  return 'low';
}

function normalizeRisk(value){
  const risk=String(value??'').toLowerCase();
  return Object.prototype.hasOwnProperty.call(riskRank,risk)?risk:undefined;
}
