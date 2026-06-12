import{countBy,maxSemanticMergeReadiness,uniqueRecordsById,uniqueStrings}from'../../native-import-utils.js';
import{createSemanticMergeCandidateAdmissionRecord,querySemanticMergeCandidateAdmissionOverlaps,sortSemanticMergeCandidateAdmissionRecords}from'./semanticMergeCandidateRecords.js';
import{compactAdmissionSource,importLosses,sourceLossClasses,summarizeImportPreservation,summarizeParserEvidence,summarizeSemanticAdmissionWarnings}from'./projectImportAdmissionImportEvidence.js';
import{sourceMissingEvidence,sourceMissingTasks,sourceSemanticMergeScore}from'./projectImportAdmissionTasks.js';
import{candidateRisk,maxPreservationQuality,maxRisk,normalizeRisk}from'./projectImportAdmissionRanks.js';

export{admissionLanguages}from'./projectImportAdmissionLanguageSummaries.js';

export function projectAdmissionImports(imports,sourceRows,mergeCandidates,projectResult){
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
    const readiness=source.readiness??imported?.metadata?.semanticMergeReadiness??candidates[0]?.readiness??'ready';
    const emptySemanticEvidence=Object.values(semanticCounts).reduce((sum,value)=>sum+value,0)===0;
    const semanticAdmission=summarizeSemanticAdmissionWarnings(imported,{source,sourcePath,candidates,projectResult});
    const sourcePreservation=summarizeImportPreservation(imported,source);
    const losses=importLosses(imported);
    const lossClasses=sourceLossClasses(imported,losses);
    const parserEvidence=summarizeParserEvidence(imported,source,losses);
    const missingEvidence=sourceMissingEvidence({
      imported,
      source,
      losses,
      semanticCounts,
      emptySemanticEvidence,
      sourcePreservation,
      parserEvidence
    });
    const nextMissingTasks=sourceMissingTasks({
      source,
      readiness,
      semanticCounts,
      emptySemanticEvidence,
      sourcePreservation,
      parserEvidence,
      lossClasses,
      losses,
      missingEvidence,
      candidates
    });
    return {
      id:source.id??imported?.id,
      language:source.language??imported?.language??'unknown',
      sourcePath,
      sourceHash:source.sourceHash,
      readiness,
      semanticCounts,
      emptySemanticEvidence,
      semanticAdmission,
      parserEvidence,
      lossClasses,
      missingEvidence,
      nextMissingTasks,
      semanticMergeScore:sourceSemanticMergeScore({
        readiness,
        emptySemanticEvidence,
        sourcePreservation,
        parserEvidence,
        missingEvidence,
        candidates
      }),
      sourcePreservation,
      mergeCandidates:candidates
    };
  });
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
  const warnings=uniqueSemanticAdmissionWarnings(importSummaries.flatMap((entry)=>entry.semanticAdmission?.warnings??[]));
  return {
    empty:Object.values(totals).reduce((sum,value)=>sum+value,0)===0,
    emptySourceCount:importSummaries.filter((entry)=>entry.emptySemanticEvidence).length,
    emptySourcePaths,
    ...totals,
    evidenceRecords:uniqueRecordsById([
      ...(projectResult?.evidence??[]),
      ...imports.flatMap((imported)=>imported?.evidence??[])
    ]).length,
    warningCount:warnings.length,
    warningReasonCodes:uniqueStrings(warnings.map((warning)=>warning.reasonCode??warning.code)),
    warningSourcePaths:uniqueStrings(warnings.flatMap((warning)=>warning.sourcePaths??[warning.sourcePath]).filter(Boolean)),
    warnings
  };
}

function uniqueSemanticAdmissionWarnings(warnings){
  const seen=new Set();
  const result=[];
  for(const warning of warnings.filter(Boolean)){
    const key=[warning.reasonCode??warning.code,(warning.sourcePaths??[warning.sourcePath]).join('|')].join('\u0000');
    if(seen.has(key)) continue;
    seen.add(key);
    result.push(warning);
  }
  return result;
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
  const records=sortSemanticMergeCandidateAdmissionRecords(mergeCandidates.map((candidate)=>createSemanticMergeCandidateAdmissionRecord(candidate,{patch:patchById.get(candidate.patchId)})));
  const recordByCandidateId=new Map(records.map((record)=>[record.candidateId,record]));
  const overlaps=querySemanticMergeCandidateAdmissionOverlaps(records);
  const risks=mergeCandidates.map((candidate)=>{
    const record=recordByCandidateId.get(candidate.id);
    return maxRisk(candidateRisk(candidate,patchById.get(candidate.patchId)),record?.projectionRisk??'low');
  });
  const readiness=mergeCandidates.reduce(
    (current,candidate)=>maxSemanticMergeReadiness(current,recordByCandidateId.get(candidate.id)?.readiness??candidate.readiness),
    lossSummary?.semanticMergeReadiness??'ready'
  );
  const overlapCandidateIds=uniqueStrings(overlaps.flatMap((overlap)=>overlap.candidateIds??[]));
  return {
    total:mergeCandidates.length,
    readiness,
    highestRisk:risks.reduce(maxRisk,'low'),
    projectionRisk:records.reduce((current,record)=>maxRisk(current,record.projectionRisk??'unknown'),'low'),
    byRisk:countBy(risks),
    byReadiness:countBy(records.map((record)=>record.readiness??'needs-review')),
    byProjectionRisk:countBy(records.map((record)=>record.projectionRisk??'unknown')),
    highRiskCandidateIds:mergeCandidates.filter((candidate,index)=>risks[index]==='high').map((candidate)=>candidate.id).filter(Boolean),
    reviewCandidateIds:records.filter((record)=>record.readiness==='needs-review'||record.admission.reviewRequired).map((record)=>record.candidateId).filter(Boolean),
    blockedCandidateIds:records.filter((record)=>record.readiness==='blocked'||record.admission.action==='block').map((record)=>record.candidateId).filter(Boolean),
    highProjectionRiskCandidateIds:records.filter((record)=>record.projectionRisk==='high').map((record)=>record.candidateId).filter(Boolean),
    conflictKeys:uniqueStrings(records.flatMap((record)=>record.conflictKeys??[])),
    readinessOrderCandidateIds:records.map((record)=>record.candidateId).filter(Boolean),
    changedSemanticRegions:{
      total:records.reduce((sum,record)=>sum+record.changedSemanticRegions.length,0),
      byKind:countBy(records.flatMap((record)=>record.changedSemanticRegions.map((region)=>region.regionKind??'unknown'))),
      conflictKeys:uniqueStrings(records.flatMap((record)=>record.changedSemanticRegions.map((region)=>region.conflictKey)))
    },
    overlaps:{
      total:overlaps.length,
      candidateIds:overlapCandidateIds,
      conflictKeys:uniqueStrings(overlaps.flatMap((overlap)=>overlap.conflictKeys??[])),
      sourcePaths:uniqueStrings(overlaps.map((overlap)=>overlap.sourcePath).filter(Boolean)),
      pairs:overlaps
    },
    records,
    patchRisk:normalizeRisk(projectResult?.patch?.risk)
  };
}
