import{uniqueRecordsById,uniqueStrings}from'../../native-import-utils.js';

const scoreWeights=Object.freeze({
  semanticEvidence:22,
  sourcePreservation:18,
  sourceFreshness:14,
  ownershipChange:14,
  proofReadiness:20,
  targetProjectionCoverage:12
});
const readinessScore=Object.freeze({ready:100,'ready-with-losses':75,'needs-review':45,blocked:0});
const readinessSortRank=Object.freeze({ready:3,'ready-with-losses':2,'needs-review':1,blocked:0});
const riskSortRank=Object.freeze({low:3,medium:2,unknown:1,high:0});
const actionSortRank=Object.freeze({admit:2,prioritize:1,reject:0});
const preservationScore=Object.freeze({exact:100,lossy:62,missing:30,stale:0,empty:20});
const proofEvidenceKind=/proof|test|trace|verify|verification|benchmark|behavior|contract/i;

export function admissionMergeScore(input){
  const components={
    semanticEvidence:semanticEvidenceScore(input),
    sourcePreservation:sourcePreservationScore(input),
    sourceFreshness:sourceFreshnessScore(input),
    ownershipChange:ownershipChangeScore(input),
    proofReadiness:proofReadinessScore(input),
    targetProjectionCoverage:targetProjectionCoverageScore(input)
  };
  const weightedTotal=Object.values(components).reduce((sum,component)=>sum+component.weightedScore,0);
  const weightTotal=Object.values(components).reduce((sum,component)=>sum+component.weight,0);
  const uncappedValue=roundScore(weightTotal?weightedTotal*100/weightTotal:0);
  const value=admissionScoreValue(uncappedValue,input);
  return {
    schema:'frontier.lang.semanticMergeScore.v1',
    version:1,
    value,
    uncappedValue,
    sortKey:mergeScoreSortKey(value,input),
    higherIsBetter:true,
    readiness:input.readiness,
    risk:input.mergeCandidateRisk.highestRisk,
    action:input.action,
    priority:input.priority,
    components,
    penalties:uniqueStrings([
      ...(input.action==='reject'?['Admission action is reject.']:[]),
      ...Object.values(components).flatMap((component)=>component.score<100?component.reasons:[])
    ])
  };
}

function semanticEvidenceScore(input){
  const sourceCount=Math.max(1,input.sourceCount??0);
  const semanticTotal=input.semanticEvidence.symbols+input.semanticEvidence.occurrences+input.semanticEvidence.relations+input.semanticEvidence.facts;
  const nonEmptySources=Math.max(0,(input.sourceCount??0)-input.semanticEvidence.emptySourceCount);
  const sourceCoverage=(input.sourceCount??0)>0?nonEmptySources/sourceCount:(semanticTotal>0?1:0);
  const symbolDensity=Math.min(1,input.semanticEvidence.symbols/sourceCount);
  const evidenceDensity=Math.min(1,input.semanticEvidence.evidenceRecords/sourceCount);
  const score=input.semanticEvidence.empty?0:roundScore(sourceCoverage*68+symbolDensity*22+evidenceDensity*10);
  return scoreComponent('semanticEvidence',score,[
    ...(input.semanticEvidence.empty?['No semantic evidence was imported.']:[]),
    ...(input.semanticEvidence.emptySourceCount?[
      `${input.semanticEvidence.emptySourceCount} source(s) have no semantic evidence.`
    ]:[])
  ],{
    symbols:input.semanticEvidence.symbols,
    occurrences:input.semanticEvidence.occurrences,
    relations:input.semanticEvidence.relations,
    facts:input.semanticEvidence.facts,
    evidenceRecords:input.semanticEvidence.evidenceRecords,
    emptySourceCount:input.semanticEvidence.emptySourceCount,
    emptySourcePaths:input.semanticEvidence.emptySourcePaths
  });
}

function sourcePreservationScore(input){
  const base=preservationScore[input.sourcePreservation.quality]??35;
  const exactRatio=input.sourcePreservation.total?input.sourcePreservation.exactSourceAvailable/input.sourcePreservation.total:0;
  const score=roundScore(Math.min(base,base*0.8+exactRatio*20));
  return scoreComponent('sourcePreservation',score,[
    ...(input.sourcePreservation.quality!=='exact'?[`Project source preservation is ${input.sourcePreservation.quality}.`]:[]),
    ...(input.sourcePreservation.truncated?['Project source preservation is truncated.']:[]),
    ...(input.sourcePreservation.lossySourcePaths.length?[`Lossy or missing source preservation: ${input.sourcePreservation.lossySourcePaths.join(', ')}`]:[])
  ],{
    quality:input.sourcePreservation.quality,
    total:input.sourcePreservation.total,
    exactSourceAvailable:input.sourcePreservation.exactSourceAvailable,
    sourceBytes:input.sourcePreservation.sourceBytes,
    tokens:input.sourcePreservation.tokens,
    trivia:input.sourcePreservation.trivia,
    directives:input.sourcePreservation.directives,
    comments:input.sourcePreservation.comments,
    truncated:input.sourcePreservation.truncated,
    lossySourcePaths:input.sourcePreservation.lossySourcePaths
  });
}

function sourceFreshnessScore(input){
  const sourceCount=Math.max(input.sourceCount??0,input.sourcePreservation.total,1);
  const fresh=Math.max(0,sourceCount-input.sourcePreservation.stale);
  const score=roundScore(fresh*100/sourceCount);
  return scoreComponent('sourceFreshness',score,[
    ...(input.sourcePreservation.stale?[
      `Project import has stale source hashes for ${input.sourcePreservation.stale} source(s).`
    ]:[])
  ],{
    stale:input.sourcePreservation.stale,
    staleSourcePaths:input.sourcePreservation.staleSourcePaths,
    checkedSources:sourceCount
  });
}

function ownershipChangeScore(input){
  const changed=input.ownership.changed;
  const total=input.ownership.total;
  const candidateConflictKeys=input.ownership.candidateRegionConflictKeys.length;
  let score=total===0&&changed===0?70:100;
  if(changed>0){
    score=total>0
      ? Math.max(0,100-(changed/Math.max(total,changed))*75-candidateConflictKeys*5)
      : Math.max(10,85-changed*12-candidateConflictKeys*5);
  }
  return scoreComponent('ownershipChange',roundScore(score),[
    ...(total===0&&changed===0?['No ownership-region evidence was available for this project import.']:[]),
    ...(changed?[`Project import changes ${changed} ownership region(s) or region conflict key(s).`]:[])
  ],{
    total,
    changed,
    changedIds:input.ownership.changedIds,
    changedKeys:input.ownership.changedKeys,
    candidateRegionConflictKeys:input.ownership.candidateRegionConflictKeys,
    byKind:input.ownership.byKind,
    byGranularity:input.ownership.byGranularity,
    byPrecision:input.ownership.byPrecision,
    byLanguage:input.ownership.byLanguage
  });
}

function proofReadinessScore(input){
  const evidence=admissionEvidenceRecords(input.projectResult,input.imports);
  const proofRecords=evidence.filter((record)=>proofEvidenceKind.test(String(record?.kind??record?.metadata?.kind??record?.type??''))||record?.kind==='proof');
  const failedEvidence=uniqueStrings([
    ...input.failedEvidenceIds,
    ...evidence.filter((record)=>record?.status==='failed').map((record)=>record.id).filter(Boolean)
  ]);
  const passedProofRecords=proofRecords.filter((record)=>record?.status==='passed'||record?.status==='ok'||record?.status==='success');
  const pendingProofRecords=proofRecords.filter((record)=>record?.status==='pending'||record?.status==='assumed'||record?.status==='unknown');
  const blockingLossIds=input.contract?.readiness?.blockingLossIds??input.lossSummary?.blockingLossIds??[];
  const reviewLossIds=input.contract?.readiness?.reviewLossIds??input.lossSummary?.reviewLossIds??[];
  const base=readinessScore[input.readiness]??45;
  const score=clampScore(base+Math.min(16,passedProofRecords.length*8+proofRecords.length*3)-failedEvidence.length*25-blockingLossIds.length*12-Math.min(18,reviewLossIds.length*3));
  return scoreComponent('proofReadiness',score,[
    ...(input.readiness!=='ready'?[`Project import readiness is ${input.readiness}.`]:[]),
    ...(failedEvidence.length?[`Failed evidence: ${failedEvidence.join(', ')}`]:[]),
    ...(blockingLossIds.length?[`Blocking losses: ${blockingLossIds.join(', ')}`]:[]),
    ...(pendingProofRecords.length?[`${pendingProofRecords.length} proof/readiness evidence record(s) are pending or assumed.`]:[])
  ],{
    readiness:input.readiness,
    evidenceRecords:evidence.length,
    proofRecords:proofRecords.length,
    passedProofRecords:passedProofRecords.length,
    pendingProofRecords:pendingProofRecords.length,
    failedEvidenceIds:failedEvidence,
    blockingLossIds,
    reviewLossIds
  });
}

function targetProjectionCoverageScore(input){
  const coverage=targetProjectionCoverageSignals(input);
  let score;
  if(coverage.targetEntries>0){
    const supportedRatio=coverage.supportedTargets/coverage.targetEntries;
    const adapterRatio=Math.min(1,coverage.adapterProjectionTargets/coverage.targetEntries);
    const readinessRatio=coverage.readinessScore/100;
    score=roundScore(supportedRatio*55+readinessRatio*25+adapterRatio*20);
  }else{
    score=coverage.sourceMapMappings>0||coverage.generatedRangeMappings>0||coverage.targetPaths>0
      ? 62
      : coverage.exactSourceProjection>0?55:45;
  }
  if(coverage.missingAdapters>0) score=clampScore(score-Math.min(40,coverage.missingAdapters*10));
  if(coverage.unsupportedTargetFeatures>0) score=clampScore(score-Math.min(35,coverage.unsupportedTargetFeatures*10));
  return scoreComponent('targetProjectionCoverage',score,[
    ...(coverage.targetEntries===0?['No explicit target projection coverage was supplied; score uses source-map and exact-source fallback signals.']:[]),
    ...(coverage.missingAdapters?[`${coverage.missingAdapters} target projection adapter(s) are missing.`]:[]),
    ...(coverage.unsupportedTargetFeatures?[`${coverage.unsupportedTargetFeatures} target projection target(s) have unsupported features.`]:[])
  ],coverage);
}

function targetProjectionCoverageSignals(input){
  const entries=targetProjectionEntries(input.projectResult,input.imports);
  const matrices=projectionMatrices(input.projectResult,input.imports);
  for(const matrix of matrices){
    for(const language of matrix?.languages??[]) entries.push(...(language?.targets??[]));
  }
  const sourceMapSummary=input.contract?.sourceMaps??{};
  const summary=matrices.reduce((current,matrix)=>{
    current.exactSourceProjection+=matrix?.summary?.exactSourceProjection??0;
    current.targetAdapterProjection+=matrix?.summary?.targetAdapterProjection??0;
    current.missingAdapters+=matrix?.summary?.missingAdapters??0;
    current.unsupportedTargetFeatures+=matrix?.summary?.unsupportedTargetFeatures??0;
    return current;
  },{exactSourceProjection:0,targetAdapterProjection:0,missingAdapters:0,unsupportedTargetFeatures:0});
  const targetEntries=entries.length;
  const supportedTargets=entries.filter((entry)=>entry?.supported===true).length;
  const adapterProjectionTargets=entries.filter((entry)=>
    entry?.lossClass==='targetAdapterProjection'||entry?.lossClass==='exactSourceProjection'||entry?.adapter||entry?.adapterKind==='targetProjection'
  ).length+summary.targetAdapterProjection+summary.exactSourceProjection;
  const readinessValues=entries.map((entry)=>readinessScore[entry?.readiness]??45);
  const readinessAverage=readinessValues.length?readinessValues.reduce((sum,value)=>sum+value,0)/readinessValues.length:0;
  return {
    targetEntries,
    supportedTargets,
    adapterProjectionTargets,
    exactSourceProjection:Math.max(summary.exactSourceProjection,input.sourcePreservation.exactSourceAvailable??0),
    targetAdapterProjection:summary.targetAdapterProjection,
    missingAdapters:summary.missingAdapters+entries.filter((entry)=>entry?.lossClass==='missingAdapter'||entry?.supported===false).length,
    unsupportedTargetFeatures:summary.unsupportedTargetFeatures+entries.filter((entry)=>entry?.lossClass==='unsupportedTargetFeatures').length,
    readinessScore:roundScore(readinessAverage),
    sourceMapMappings:sourceMapSummary.mappingCount??0,
    generatedRangeMappings:sourceMapSummary.generatedRangeMappings??0,
    targetPaths:sourceMapSummary.targetPaths?.length??0,
    adapterGeneratedRanges:input.contract?.adapterCoverage?.generatedRanges??0
  };
}

function targetProjectionEntries(projectResult,imports){
  return [
    projectResult?.targetCoverage,
    projectResult?.metadata?.targetCoverage,
    projectResult?.metadata?.targetProjectionCoverage,
    ...(projectResult?.targetCoverages??[]),
    ...(projectResult?.metadata?.targetCoverages??[]),
    ...(imports??[]).flatMap((imported)=>[
      imported?.targetCoverage,
      imported?.metadata?.targetCoverage,
      imported?.metadata?.targetProjectionCoverage,
      ...(imported?.targetCoverages??[]),
      ...(imported?.metadata?.targetCoverages??[])
    ])
  ].flatMap((entry)=>Array.isArray(entry)?entry:[entry]).filter((entry)=>entry&&typeof entry==='object'&&(entry.target||entry.lossClass||entry.supported!==undefined));
}

function projectionMatrices(projectResult,imports){
  return [
    projectResult?.projectionMatrix,
    projectResult?.metadata?.projectionMatrix,
    ...(projectResult?.projectionMatrices??[]),
    ...(projectResult?.metadata?.projectionMatrices??[]),
    ...(imports??[]).flatMap((imported)=>[
      imported?.projectionMatrix,
      imported?.metadata?.projectionMatrix,
      ...(imported?.projectionMatrices??[]),
      ...(imported?.metadata?.projectionMatrices??[])
    ])
  ].filter((matrix)=>matrix?.kind==='frontier.lang.projectionTargetLossMatrix'||Array.isArray(matrix?.languages));
}

function admissionEvidenceRecords(projectResult,imports){
  return uniqueRecordsById([
    ...(projectResult?.evidence??[]),
    ...(projectResult?.patch?.evidence??[]),
    ...(projectResult?.universalAst?.evidence??[]),
    ...(imports??[]).flatMap((imported)=>[
      ...(imported?.evidence??[]),
      ...(imported?.patch?.evidence??[]),
      ...(imported?.universalAst?.evidence??[])
    ])
  ]);
}

function scoreComponent(key,score,reasons,signals){
  const normalizedScore=clampScore(score);
  const weight=scoreWeights[key];
  return {
    key,
    score:normalizedScore,
    weight,
    weightedScore:roundWeighted(normalizedScore*weight/100),
    status:componentStatus(normalizedScore),
    reasons:uniqueStrings(reasons),
    signals
  };
}

function componentStatus(score){
  if(score<=0) return 'blocked';
  if(score<50) return 'weak';
  if(score<80) return 'partial';
  return 'strong';
}

function mergeScoreSortKey(value,input){
  return Math.round(value*1000)
    +(readinessSortRank[input.readiness]??1)*100
    +(riskSortRank[input.mergeCandidateRisk.highestRisk]??1)*10
    +(actionSortRank[input.action]??0);
}

function admissionScoreValue(value,input){
  if(input.action==='reject') return Math.min(value,35);
  if(input.readiness==='blocked') return Math.min(value,25);
  if(input.mergeCandidateRisk.highestRisk==='high') return Math.min(value,60);
  return value;
}

function clampScore(value){
  return Math.max(0,Math.min(100,roundScore(value)));
}

function roundScore(value){
  return Math.round((Number.isFinite(value)?value:0)*100)/100;
}

function roundWeighted(value){
  return Math.round((Number.isFinite(value)?value:0)*1000)/1000;
}
