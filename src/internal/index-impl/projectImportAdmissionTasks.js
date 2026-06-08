import{maxSemanticMergeReadiness,uniqueStrings}from'../../native-import-utils.js';
import{nativeImportCategoryForLossKind}from'./nativeImportCategoryForLossKind.js';
import{candidateRisk,clampScore,maxRisk,maxTaskPriority,readinessSort,sourceScoreByReadiness,taskPriorityForReadiness,taskPriorityRank}from'./projectImportAdmissionRanks.js';

export function sourceMissingEvidence(input){
  const lossSummary=input.imported?.metadata?.nativeImportLossSummary
    ??input.imported?.nativeSource?.metadata?.nativeImportLossSummary
    ??input.imported?.nativeAst?.metadata?.nativeImportLossSummary
    ??input.imported?.universalAst?.metadata?.nativeImportLossSummary;
  const sourcePath=input.source?.sourcePath??input.imported?.sourcePath;
  const language=input.source?.language??input.imported?.language??'unknown';
  const hints=[];
  for(const missing of lossSummary?.featureEvidence?.missingRequiredEvidence??[]){
    const lossClass=nativeImportCategoryForLossKind(missing.kind??missing.policyKind);
    hints.push(evidenceHint({
      evidenceKey:missing.evidenceKey,
      task:`Add ${missing.evidenceKey} evidence for ${missing.kind??missing.policyKind}.`,
      sourcePath,
      language,
      lossId:missing.lossId,
      lossKind:missing.kind??missing.policyKind,
      lossClass,
      readiness:'needs-review'
    }));
  }
  if(input.emptySemanticEvidence){
    hints.push(evidenceHint({
      evidenceKey:'semantic-index',
      task:'Import semantic symbols for sources with empty semantic indexes.',
      sourcePath,
      language,
      lossKind:'partialSemanticIndex',
      lossClass:'partialSemanticIndex',
      readiness:'blocked'
    }));
  }
  if(input.parserEvidence.missing){
    hints.push(evidenceHint({
      evidenceKey:'parser-result',
      task:'Attach a native parser AST instead of missing-parser fallback evidence.',
      sourcePath,
      language,
      lossKind:'unsupportedSyntax',
      lossClass:'parserDiagnostics',
      readiness:'blocked'
    }));
  }
  if(input.sourcePreservation.stale){
    hints.push(evidenceHint({
      evidenceKey:'source-hash-verification',
      task:'Refresh source hashes or re-import the stale source text.',
      sourcePath,
      language,
      lossKind:'sourcePreservation',
      lossClass:'sourcePreservation',
      readiness:'blocked'
    }));
  }else if(input.sourcePreservation.quality==='missing'||input.sourcePreservation.quality==='lossy'){
    hints.push(evidenceHint({
      evidenceKey:'source-preservation',
      task:'Attach exact source-preservation evidence for lossy or missing source text.',
      sourcePath,
      language,
      lossKind:'sourcePreservation',
      lossClass:'sourcePreservation',
      readiness:'needs-review'
    }));
  }
  return uniqueEvidenceHints(hints);
}

export function sourceMissingTasks(input){
  const sourcePath=input.source?.sourcePath;
  const language=input.source?.language??'unknown';
  const tasks=[];
  for(const hint of input.missingEvidence??[]){
    tasks.push(taskHint({
      id:`evidence:${hint.evidenceKey}`,
      task:hint.task,
      reason:'missing-evidence',
      priority:taskPriorityForReadiness(hint.readiness),
      readiness:hint.readiness,
      sourcePath,
      language,
      lossClasses:hint.lossClasses,
      evidenceKeys:[hint.evidenceKey]
    }));
  }
  for(const lossClass of input.lossClasses??[]){
    const task=taskForLossClass(lossClass);
    if(task){
      tasks.push(taskHint({
        ...task,
        sourcePath,
        language,
        readiness:input.readiness,
        lossClasses:[lossClass]
      }));
    }
  }
  const reviewCandidates=(input.candidates??[]).filter((candidate)=>
    candidate.readiness==='needs-review'
    || candidate.readiness==='blocked'
    || candidateRisk(candidate)!=='low'
  );
  if(reviewCandidates.length){
    tasks.push(taskHint({
      id:'semantic-merge-review',
      task:'Review semantic merge candidates that carry elevated risk or review readiness.',
      reason:'merge-candidate-risk',
      priority:reviewCandidates.some((candidate)=>candidateRisk(candidate)==='high'||candidate.readiness==='blocked')?'critical':'high',
      readiness:reviewCandidates.reduce((current,candidate)=>maxSemanticMergeReadiness(current,candidate.readiness??'ready'),input.readiness),
      sourcePath,
      language,
      lossClasses:[],
      evidenceKeys:[]
    }));
  }
  if(!tasks.length&&input.readiness!=='ready'){
    tasks.push(taskHint({
      id:'native-import-review',
      task:'Review native import losses before admitting this source.',
      reason:'readiness-review',
      priority:taskPriorityForReadiness(input.readiness),
      readiness:input.readiness,
      sourcePath,
      language,
      lossClasses:input.lossClasses,
      evidenceKeys:[]
    }));
  }
  return uniqueTaskHints(tasks);
}

function taskForLossClass(lossClass){
  if(lossClass==='exactAstImport'||lossClass==='none') return undefined;
  if(lossClass==='partialSemanticIndex'){
    return {id:'semantic-index-completeness',task:'Complete semantic index coverage for partial imports.',reason:'partial-semantic-index',priority:'high',evidenceKeys:['semantic-index']};
  }
  if(lossClass==='declarationsOnly'||lossClass==='opaqueBodies'){
    return {id:'body-semantics',task:'Import body-level semantic evidence beyond declaration-only coverage.',reason:'declaration-only-or-opaque-body',priority:'normal',evidenceKeys:['body-semantics']};
  }
  if(lossClass==='sourceMapApproximation'){
    return {id:'source-map-ranges',task:'Attach precise source-map ranges for approximated native mappings.',reason:'source-map-approximation',priority:'normal',evidenceKeys:['source-map']};
  }
  if(lossClass==='sourcePreservation'||lossClass==='commentsTrivia'){
    return {id:'source-preservation',task:'Attach exact source-preservation evidence for lossy or missing source text.',reason:'source-preservation-loss',priority:'high',evidenceKeys:['source-preservation']};
  }
  if(lossClass==='parserDiagnostics'||lossClass==='unsupportedSyntax'){
    return {id:'parser-evidence',task:'Resolve parser diagnostics or attach exact parser evidence.',reason:'parser-loss',priority:'blocker',evidenceKeys:['parser-result']};
  }
  if(lossClass==='unsupportedSyntax'||lossClass==='unsupportedSemantic'){
    return {id:'unsupported-language-feature',task:'Add host semantic evidence for unsupported native language features.',reason:'unsupported-feature-loss',priority:'high',evidenceKeys:['host-semantics']};
  }
  if(lossClass==='targetProjectionLoss'||lossClass==='missingAdapter'||lossClass==='unsupportedTargetFeatures'||lossClass==='nativeSourceStubs'){
    return {id:'target-projection-coverage',task:'Add target projection adapter coverage or mark unsupported target features.',reason:'target-projection-loss',priority:'high',evidenceKeys:['target-projection']};
  }
  if(lossClass==='macroExpansion'||lossClass==='preprocessor'||lossClass==='conditionalCompilation'||lossClass==='metaprogramming'||lossClass==='overloadTypeInference'||lossClass==='generatedCode'){
    return {id:`host-evidence:${lossClass}`,task:`Attach host ${lossClass} evidence for native import losses.`,reason:'host-evidence-loss',priority:'high',evidenceKeys:[lossClass]};
  }
  return {id:`loss-class:${lossClass}`,task:`Review ${lossClass} native import loss evidence.`,reason:'native-loss-class',priority:'normal',evidenceKeys:[lossClass]};
}

function evidenceHint(input){
  return {
    evidenceKey:input.evidenceKey,
    task:input.task,
    count:1,
    sourcePaths:uniqueStrings([input.sourcePath].filter(Boolean)),
    languages:uniqueStrings([input.language].filter(Boolean)),
    lossIds:uniqueStrings([input.lossId].filter(Boolean)),
    lossKinds:uniqueStrings([input.lossKind].filter(Boolean)),
    lossClasses:uniqueStrings([input.lossClass].filter(Boolean)),
    readiness:input.readiness??'needs-review'
  };
}

function taskHint(input){
  return {
    id:input.id,
    task:input.task,
    reason:input.reason,
    priority:input.priority??'normal',
    readiness:input.readiness??'needs-review',
    count:1,
    sourcePaths:uniqueStrings([input.sourcePath].filter(Boolean)),
    languages:uniqueStrings([input.language].filter(Boolean)),
    lossClasses:uniqueStrings(input.lossClasses??[]),
    evidenceKeys:uniqueStrings(input.evidenceKeys??[])
  };
}

function uniqueEvidenceHints(hints){
  const grouped=new Map();
  for(const hint of hints){
    const key=`${hint.evidenceKey}\u0000${hint.lossIds.join('|')}\u0000${hint.sourcePaths.join('|')}`;
    if(!grouped.has(key)) grouped.set(key,hint);
  }
  return [...grouped.values()];
}

function uniqueTaskHints(tasks){
  const grouped=new Map();
  for(const task of tasks){
    const key=task.id??task.task;
    if(!grouped.has(key)){
      grouped.set(key,{...task});
      continue;
    }
    const entry=grouped.get(key);
    entry.count+=task.count??1;
    entry.priority=maxTaskPriority(entry.priority,task.priority);
    entry.readiness=maxSemanticMergeReadiness(entry.readiness,task.readiness);
    entry.sourcePaths=uniqueStrings([...entry.sourcePaths,...task.sourcePaths]);
    entry.languages=uniqueStrings([...entry.languages,...task.languages]);
    entry.lossClasses=uniqueStrings([...entry.lossClasses,...task.lossClasses]);
    entry.evidenceKeys=uniqueStrings([...entry.evidenceKeys,...task.evidenceKeys]);
  }
  return [...grouped.values()].sort((left,right)=>
    taskPriorityRank[right.priority]-taskPriorityRank[left.priority]
    || readinessSort(right.readiness)-readinessSort(left.readiness)
    || String(left.task).localeCompare(String(right.task))
  );
}

export function sourceSemanticMergeScore(input){
  const readinessScore=sourceScoreByReadiness[input.readiness]??sourceScoreByReadiness['needs-review'];
  const preservationPenalty=input.sourcePreservation.quality==='stale'?35
    :input.sourcePreservation.quality==='missing'?26
      :input.sourcePreservation.quality==='lossy'?12
        :input.sourcePreservation.quality==='empty'?18
          :0;
  const risk=(input.candidates??[]).reduce((current,candidate)=>maxRisk(current,candidateRisk(candidate)),'low');
  const riskPenalty=risk==='high'?24:risk==='medium'?10:risk==='unknown'?8:0;
  const parserPenalty=input.parserEvidence.missing?25:Math.min(16,(input.parserEvidence.diagnosticCount??0)*4);
  const missingEvidencePenalty=Math.min(24,(input.missingEvidence?.length??0)*6);
  const semanticBonus=input.emptySemanticEvidence?-25:5;
  return clampScore(readinessScore+semanticBonus-preservationPenalty-riskPenalty-parserPenalty-missingEvidencePenalty);
}
