import{countBy,maxSemanticMergeReadiness,uniqueStrings}from'../../native-import-utils.js';
import{candidateRisk,maxPreservationQuality,maxRisk,maxTaskPriority,readinessSort,roundScore,taskPriorityRank}from'./projectImportAdmissionRanks.js';

export function admissionLanguages(importSummaries){
  const grouped=new Map();
  for(const entry of importSummaries){
    const key=entry.language??'unknown';
    if(!grouped.has(key)) grouped.set(key,emptyLanguageRow(key));
    const row=grouped.get(key);
    row.sourceCount+=1;
    row.sourcePaths.push(entry.sourcePath);
    row.sources.push(entry);
    row.readiness=maxSemanticMergeReadiness(row.readiness,entry.readiness);
    row.semanticSymbols+=entry.semanticCounts.symbols;
    if(entry.emptySemanticEvidence) row.emptySemanticEvidenceSources+=1;
    row.sourcePreservationQuality=maxPreservationQuality(row.sourcePreservationQuality,entry.sourcePreservation.quality);
    if(entry.sourcePreservation.stale&&entry.sourcePath) row.staleSourcePaths.push(entry.sourcePath);
    row.mergeCandidates+=entry.mergeCandidates.length;
    row.highestRisk=maxRisk(row.highestRisk,entry.mergeCandidates.reduce((current,candidate)=>maxRisk(current,candidateRisk(candidate)),'low'));
  }
  const rows=[...grouped.values()].map((row)=>{
    const sources=row.sources;
    return {
      language:row.language,
      sourceCount:row.sourceCount,
      sourcePaths:uniqueStrings(row.sourcePaths.filter(Boolean)),
      readiness:row.readiness,
      semanticSymbols:row.semanticSymbols,
      emptySemanticEvidenceSources:row.emptySemanticEvidenceSources,
      sourcePreservationQuality:row.sourcePreservationQuality,
      staleSourcePaths:uniqueStrings(row.staleSourcePaths.filter(Boolean)),
      mergeCandidates:row.mergeCandidates,
      highestRisk:row.highestRisk,
      byReadiness:countBy(sources.map((source)=>source.readiness)),
      byLossClass:lossClassCounts(sources),
      parserEvidence:parserEvidenceSummary(sources),
      semanticMergeScore:semanticMergeScoreSummary(sources),
      topMissingEvidence:topMissingEvidence(sources),
      nextMissingTasks:topTaskHints(sources)
    };
  }).sort((left,right)=>left.language.localeCompare(right.language));
  return {
    total:rows.length,
    byReadiness:countBy(rows.map((row)=>row.readiness)),
    bySourceReadiness:countBy(importSummaries.map((entry)=>entry.readiness)),
    byLossClass:lossClassCounts(importSummaries),
    bySourcePreservationQuality:countBy(rows.map((row)=>row.sourcePreservationQuality)),
    parserEvidence:parserEvidenceSummary(importSummaries),
    semanticMergeScore:semanticMergeScoreSummary(importSummaries),
    topMissingEvidence:topMissingEvidence(importSummaries),
    nextMissingTasks:topTaskHints(importSummaries),
    sourceRows:importSummaries.map(compactAdmissionSourceRow),
    readinessRows:languageReadinessRows(importSummaries),
    rows
  };
}

function compactAdmissionSourceRow(entry){
  return {
    id:entry.id,
    language:entry.language,
    sourcePath:entry.sourcePath,
    sourceHash:entry.sourceHash,
    readiness:entry.readiness,
    parser:entry.parserEvidence.parser,
    parserEvidence:entry.parserEvidence,
    semanticCounts:entry.semanticCounts,
    semanticSymbols:entry.semanticCounts.symbols,
    emptySemanticEvidence:entry.emptySemanticEvidence,
    sourcePreservationQuality:entry.sourcePreservation.quality,
    lossClasses:entry.lossClasses,
    semanticMergeScore:entry.semanticMergeScore,
    missingEvidence:entry.missingEvidence,
    nextMissingTask:entry.nextMissingTasks[0],
    nextMissingTasks:entry.nextMissingTasks
  };
}

function languageReadinessRows(importSummaries){
  const grouped=new Map();
  for(const entry of importSummaries){
    const key=`${entry.language??'unknown'}\u0000${entry.readiness??'needs-review'}`;
    if(!grouped.has(key)) grouped.set(key,{language:entry.language??'unknown',readiness:entry.readiness??'needs-review',sources:[]});
    grouped.get(key).sources.push(entry);
  }
  return [...grouped.values()].map((group)=>sourceGroupSummary(group.language,group.readiness,group.sources))
    .sort((left,right)=>left.language.localeCompare(right.language)||readinessSort(left.readiness)-readinessSort(right.readiness));
}

function sourceGroupSummary(language,readiness,sources){
  return {
    language,
    readiness,
    sourceCount:sources.length,
    sourcePaths:uniqueStrings(sources.map((source)=>source.sourcePath).filter(Boolean)),
    byLossClass:lossClassCounts(sources),
    parserEvidence:parserEvidenceSummary(sources),
    semanticMergeScore:semanticMergeScoreSummary(sources),
    topMissingEvidence:topMissingEvidence(sources),
    nextMissingTasks:topTaskHints(sources)
  };
}

function lossClassCounts(sources){
  return countBy((sources??[]).flatMap((source)=>source.lossClasses?.length?source.lossClasses:['none']));
}

function parserEvidenceSummary(sources){
  const records=(sources??[]).map((source)=>source.parserEvidence??{});
  return {
    parsers:uniqueStrings(records.map((record)=>record.parser).filter(Boolean)),
    byParser:countBy(records.map((record)=>record.parser??'unknown')),
    byExactness:countBy(records.map((record)=>record.exactness??'unknown')),
    semanticCoverageLevels:uniqueStrings(records.map((record)=>record.semanticCoverageLevel).filter(Boolean)),
    exactAstSources:records.filter((record)=>record.exactAst).length,
    tokenSources:records.filter((record)=>record.tokens).length,
    triviaSources:records.filter((record)=>record.trivia).length,
    sourceRangeSources:records.filter((record)=>record.sourceRanges).length,
    generatedRangeSources:records.filter((record)=>record.generatedRanges).length,
    diagnosticsSources:records.filter((record)=>(record.diagnosticCount??0)>0).length,
    missingParserSources:records.filter((record)=>record.missing).length,
    evidenceRecords:records.reduce((sum,record)=>sum+(record.evidenceRecords??0),0)
  };
}

function semanticMergeScoreSummary(sources){
  const scored=(sources??[])
    .filter((source)=>Number.isFinite(source.semanticMergeScore))
    .sort((left,right)=>left.semanticMergeScore-right.semanticMergeScore||String(left.sourcePath??'').localeCompare(String(right.sourcePath??'')));
  const values=scored.map((source)=>source.semanticMergeScore);
  if(!values.length){
    return {sourceCount:0,min:0,max:0,average:0,sortKey:0,lowestSourcePaths:[]};
  }
  const min=Math.min(...values);
  const max=Math.max(...values);
  const average=roundScore(values.reduce((sum,value)=>sum+value,0)/values.length);
  return {
    sourceCount:values.length,
    min,
    max,
    average,
    sortKey:roundScore(average*100-(100-min)),
    lowestSourcePaths:uniqueStrings(scored.slice(0,5).map((source)=>source.sourcePath).filter(Boolean))
  };
}

function topMissingEvidence(sources,limit=5){
  const grouped=new Map();
  for(const source of sources??[]){
    for(const hint of source.missingEvidence??[]){
      const key=hint.evidenceKey??hint.task;
      if(!grouped.has(key)){
        grouped.set(key,{
          evidenceKey:hint.evidenceKey,
          task:hint.task,
          count:0,
          sourcePaths:[],
          languages:[],
          lossIds:[],
          lossKinds:[],
          lossClasses:[],
          readiness:'ready'
        });
      }
      const entry=grouped.get(key);
      entry.count+=hint.count??1;
      entry.sourcePaths.push(...(hint.sourcePaths??[]));
      entry.languages.push(...(hint.languages??[]));
      entry.lossIds.push(...(hint.lossIds??[]));
      entry.lossKinds.push(...(hint.lossKinds??[]));
      entry.lossClasses.push(...(hint.lossClasses??[]));
      entry.readiness=maxSemanticMergeReadiness(entry.readiness,hint.readiness??source.readiness??'ready');
    }
  }
  return [...grouped.values()].map((entry)=>({
    ...entry,
    sourcePaths:uniqueStrings(entry.sourcePaths),
    languages:uniqueStrings(entry.languages),
    lossIds:uniqueStrings(entry.lossIds),
    lossKinds:uniqueStrings(entry.lossKinds),
    lossClasses:uniqueStrings(entry.lossClasses)
  })).sort((left,right)=>
    readinessSort(right.readiness)-readinessSort(left.readiness)
    || right.count-left.count
    || String(left.evidenceKey??left.task).localeCompare(String(right.evidenceKey??right.task))
  ).slice(0,limit);
}

function topTaskHints(sources,limit=6){
  const grouped=new Map();
  for(const source of sources??[]){
    for(const hint of source.nextMissingTasks??[]){
      const key=hint.id??hint.task;
      if(!grouped.has(key)){
        grouped.set(key,{
          id:hint.id,
          task:hint.task,
          reason:hint.reason,
          priority:hint.priority??'normal',
          readiness:'ready',
          count:0,
          sourcePaths:[],
          languages:[],
          lossClasses:[],
          evidenceKeys:[]
        });
      }
      const entry=grouped.get(key);
      entry.count+=hint.count??1;
      entry.priority=maxTaskPriority(entry.priority,hint.priority??'normal');
      entry.readiness=maxSemanticMergeReadiness(entry.readiness,hint.readiness??source.readiness??'ready');
      entry.sourcePaths.push(...(hint.sourcePaths??[]));
      entry.languages.push(...(hint.languages??[]));
      entry.lossClasses.push(...(hint.lossClasses??[]));
      entry.evidenceKeys.push(...(hint.evidenceKeys??[]));
    }
  }
  return [...grouped.values()].map((entry)=>({
    ...entry,
    sourcePaths:uniqueStrings(entry.sourcePaths),
    languages:uniqueStrings(entry.languages),
    lossClasses:uniqueStrings(entry.lossClasses),
    evidenceKeys:uniqueStrings(entry.evidenceKeys)
  })).sort((left,right)=>
    taskPriorityRank[right.priority]-taskPriorityRank[left.priority]
    || readinessSort(right.readiness)-readinessSort(left.readiness)
    || right.count-left.count
    || String(left.task).localeCompare(String(right.task))
  ).slice(0,limit);
}

function emptyLanguageRow(language){
  return {
    language,
    sourceCount:0,
    sourcePaths:[],
    sources:[],
    readiness:'ready',
    semanticSymbols:0,
    emptySemanticEvidenceSources:0,
    sourcePreservationQuality:'exact',
    staleSourcePaths:[],
    mergeCandidates:0,
    highestRisk:'low'
  };
}

