import{idFragment,maxSemanticMergeReadiness,uniqueByEvidenceId,uniqueStrings}from'../../native-import-utils.js';
import{testSemanticSlice}from'./testSemanticSlice.js';
import{semanticSliceAdmissionSelectedSurface,semanticSliceSelectedSurfaceEvidence}from'./semanticSliceAdmissionSurface.js';

const readinessScore=Object.freeze({ready:100,'ready-with-losses':78,'needs-review':48,blocked:0});
const readinessRank=Object.freeze({ready:3,'ready-with-losses':2,'needs-review':1,blocked:0});
const actionRank=Object.freeze({admit:2,prioritize:1,reject:0});
const riskRank=Object.freeze({low:3,medium:2,unknown:1,high:0});

export function createSemanticSliceAdmissionRecord(slice,options={}){
  const testResult=options.testResult??(options.currentSources?testSemanticSlice(slice,options):undefined);
  const readiness=worstReadiness(slice?.mergeAdmission?.readiness??slice?.summary?.readiness??'needs-review',testResult?.readiness??'ready');
  const components={
    semanticSelection:semanticSelectionScore(slice),
    sourceFreshness:sourceFreshnessScore(slice,testResult),
    ownershipIsolation:ownershipIsolationScore(slice),
    verificationEvidence:verificationEvidenceScore(slice,testResult,options),
    reviewRisk:reviewRiskScore(slice,readiness,testResult)
  };
  const value=mergeScoreValue(components,readiness);
  const action=admissionAction(slice,readiness,components,testResult);
  const risk=admissionRisk(readiness,components,testResult);
  const selectedSurface=semanticSliceAdmissionSelectedSurface(slice);
  const evidence=uniqueByEvidenceId([
    ...(slice?.evidence??[]),
    ...(options.evidence??[]),
    semanticSliceSelectedSurfaceEvidence(slice,selectedSurface,testResult,readiness,action)
  ]);
  return{
    kind:'frontier.lang.semanticSliceAdmission',
    version:1,
    id:options.id??`semantic_slice_admission_${idFragment(slice?.id??'slice')}`,
    generatedAt:options.generatedAt??Date.now(),
    sliceId:slice?.id,
    importId:slice?.importId,
    sourcePath:slice?.sourcePath,
    action,
    priority:admissionPriority(action,risk,readiness),
    readiness,
    risk,
    autoMergeClaim:false,
    reviewRequired:action!=='admit'||readiness!=='ready',
    mergeScore:{
      schema:'frontier.lang.semanticMergeScore.v1',
      version:1,
      value,
      uncappedValue:value,
      sortKey:mergeScoreSortKey(value,action,risk,readiness),
      higherIsBetter:true,
      readiness,
      risk,
      action,
      components,
      penalties:uniqueStrings(Object.values(components).flatMap((component)=>component.score<100?component.reasons:[]))
    },
    counts:{
      symbols:slice?.summary?.symbols??slice?.symbols?.length??0,
      ownershipRegions:slice?.summary?.ownershipRegions??slice?.ownershipRegions?.length??0,
      nativeNodes:slice?.summary?.nativeNodes??slice?.nativeNodes?.length??0,
      sourceMapLinks:slice?.summary?.sourceMapLinks??slice?.sourceMapLinks?.length??0,
      sourceFiles:slice?.summary?.sourceFiles??slice?.sourceFiles?.length??0,
      focusedCommands:slice?.verification?.focusedCommands?.length??0,
      fixtureHints:slice?.verification?.fixtureHints?.length??0,
      assertions:testResult?.summary?.assertions??0,
      failedAssertions:testResult?.summary?.failed??0,
      warningAssertions:testResult?.summary?.warnings??0
    },
    conflictKeys:uniqueStrings(slice?.mergeAdmission?.conflictKeys??[]),
    ownershipKeys:uniqueStrings(slice?.mergeAdmission?.ownershipKeys??[]),
    sourceHashes:slice?.mergeAdmission?.sourceHashes??[],
    selectedSurface,
    evidence,
    testResult,
    reasons:uniqueStrings([
      ...(slice?.mergeAdmission?.reasons??[]),
      ...Object.values(components).flatMap((component)=>component.reasons)
    ]),
    metadata:{
      note:'Semantic slice admission is sortable merge-review evidence for isolated worker inputs; it is not a correctness proof and never grants auto-merge by itself.',
      ...(options.metadata??{})
    }
  };
}

function semanticSelectionScore(slice){
  const symbols=slice?.summary?.symbols??slice?.symbols?.length??0;
  const regions=slice?.summary?.ownershipRegions??slice?.ownershipRegions?.length??0;
  const nativeNodes=slice?.summary?.nativeNodes??slice?.nativeNodes?.length??0;
  const links=slice?.summary?.sourceMapLinks??slice?.sourceMapLinks?.length??0;
  const unresolved=slice?.summary?.unresolvedEntryRefs??slice?.unresolvedEntryRefs?.length??0;
  const selected=symbols+regions+nativeNodes;
  let score=selected>0?70:0;
  if(symbols>0)score+=12;
  if(regions>0)score+=10;
  if(links>0)score+=8;
  score=Math.max(0,Math.min(100,score-unresolved*25));
  return scoreComponent('semanticSelection',score,[
    ...(selected===0?['Slice selected no symbols, ownership regions, or native nodes.']:[]),
    ...(unresolved?[`${unresolved} semantic slice entry ref(s) did not resolve.`]:[])
  ],{symbols,ownershipRegions:regions,nativeNodes,sourceMapLinks:links,unresolvedEntryRefs:unresolved});
}

function sourceFreshnessScore(slice,testResult){
  const sourceHashes=slice?.mergeAdmission?.sourceHashes??[];
  const checks=(testResult?.assertions??[]).filter((assertion)=>String(assertion.id??'').startsWith('sourceHash:'));
  const failed=checks.filter((assertion)=>assertion.status==='failed').length;
  const warnings=checks.filter((assertion)=>assertion.status==='warning').length;
  const passed=checks.filter((assertion)=>assertion.status==='passed').length;
  const score=failed?0:checks.length?Math.max(20,Math.round((passed*100+warnings*55)/checks.length)):sourceHashes.length?55:35;
  return scoreComponent('sourceFreshness',score,[
    ...(failed?[`${failed} source hash check(s) failed.`]:[]),
    ...(!checks.length&&sourceHashes.length?['Slice has source hashes but no current source check was run.']:[]),
    ...(!sourceHashes.length?['Slice has no source hashes for stale-check admission.']:[])
  ],{sourceHashes:sourceHashes.length,checks:checks.length,passed,warnings,failed});
}

function ownershipIsolationScore(slice){
  const conflictKeys=slice?.mergeAdmission?.conflictKeys?.length??0;
  const ownershipKeys=slice?.mergeAdmission?.ownershipKeys?.length??0;
  const reviewRequired=slice?.mergeAdmission?.reviewRequired===true;
  const score=conflictKeys?Math.max(45,100-Math.max(0,conflictKeys-1)*8-(reviewRequired?16:0)):15;
  return scoreComponent('ownershipIsolation',score,[
    ...(!conflictKeys?['Slice exposes no conflict keys for ownership isolation.']:[]),
    ...(reviewRequired?['Slice merge admission already requires review.']:[])
  ],{conflictKeys,ownershipKeys,reviewRequired});
}

function verificationEvidenceScore(slice,testResult,options){
  const focused=slice?.verification?.focusedCommands?.length??0;
  const fixtures=slice?.verification?.fixtureHints?.length??0;
  const evidence=[...(options.evidence??[]),...(slice?.evidence??[])];
  const failed=(testResult?.summary?.failed??0)+evidence.filter((record)=>record?.status==='failed').length;
  const warnings=testResult?.summary?.warnings??0;
  let score=focused||fixtures||evidence.length?72:45;
  score+=Math.min(18,focused*8+fixtures*4+evidence.length*3);
  score-=failed*35+warnings*8;
  return scoreComponent('verificationEvidence',Math.max(0,Math.min(100,score)),[
    ...(!focused?['Slice has no focused verification command.']:[]),
    ...(failed?[`${failed} failed assertion or evidence record(s).`]:[])
  ],{focusedCommands:focused,fixtureHints:fixtures,evidenceRecords:evidence.length,failed,warnings});
}

function reviewRiskScore(slice,readiness,testResult){
  const losses=slice?.summary?.losses??slice?.losses?.length??0;
  const failed=testResult?.summary?.failed??0;
  const base=readinessScore[readiness]??48;
  const score=Math.max(0,Math.min(100,base-losses*4-failed*25));
  return scoreComponent('reviewRisk',score,[
    ...(readiness!=='ready'?[`Slice readiness is ${readiness}.`]:[]),
    ...(losses?[`Slice carries ${losses} native import loss record(s).`]:[])
  ],{readiness,losses,failedAssertions:failed});
}

function scoreComponent(key,score,reasons,signals){
  const rounded=Math.round(Math.max(0,Math.min(100,score)));
  return{key,score:rounded,weight:20,weightedScore:rounded*20/100,status:rounded>=85?'strong':rounded>=60?'partial':rounded>0?'weak':'blocked',reasons,signals};
}

function mergeScoreValue(components,readiness){
  const values=Object.values(components);
  const score=values.reduce((sum,component)=>sum+component.weightedScore,0)/values.reduce((sum,component)=>sum+component.weight,0)*100;
  return Math.round(Math.max(0,Math.min(readiness==='blocked'?35:100,score)));
}

function admissionAction(slice,readiness,components,testResult){
  if(readiness==='blocked'||(testResult?.summary?.failed??0)>0||components.semanticSelection.score===0||components.sourceFreshness.score===0)return'reject';
  if(readiness!=='ready'||slice?.mergeAdmission?.reviewRequired||Object.values(components).some((component)=>component.score<70))return'prioritize';
  return'admit';
}

function admissionRisk(readiness,components,testResult){
  if(readiness==='blocked'||(testResult?.summary?.failed??0)>0)return'high';
  if(readiness==='needs-review'||Object.values(components).some((component)=>component.score<60))return'medium';
  return'low';
}

function admissionPriority(action,risk,readiness){
  if(action==='reject')return'blocker';
  if(readiness==='needs-review'||risk==='medium')return'high';
  return action==='prioritize'?'normal':'low';
}

function mergeScoreSortKey(value,action,risk,readiness){
  return value+(actionRank[action]??0)*1000+(riskRank[risk]??0)*100+(readinessRank[readiness]??0)*10;
}

function worstReadiness(...values){
  return values.reduce((current,value)=>maxSemanticMergeReadiness(current,value??'ready'),'ready');
}
