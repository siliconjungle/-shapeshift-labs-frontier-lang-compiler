import{countBy,idFragment,maxSemanticMergeReadiness,normalizeSemanticMergeReadiness,uniqueStrings}from'../../native-import-utils.js';

export const SemanticMergeConflictClasses=Object.freeze(['same-symbol-edit','delete-modify','shifted-code','duplicate-signature','dependency-drift','behavior-evidence-needed']);
const riskRank=Object.freeze({low:1,medium:2,high:3});
const readinessRank=Object.freeze({ready:0,'ready-with-losses':1,'needs-review':2,blocked:3});
const classWeight=Object.freeze({'behavior-evidence-needed':10,'shifted-code':20,'same-symbol-edit':30,'dependency-drift':40,'duplicate-signature':50,'delete-modify':60});
const dependencyPredicates=/(?:import|call|depend|use|refer|require|include|extend|implement)/i;
const behaviorEvidenceKinds=/(?:test|trace|proof|verify|verification|benchmark|behavior|runtime|simulation|contract)/i;

export function classifyNativeSourceMergeConflicts(input){
  const conflictClasses=dedupeConflictRecords([
    ...sameSymbolEditConflicts(input),
    ...deleteModifyConflicts(input),
    ...shiftedCodeConflicts(input),
    ...duplicateSignatureConflicts(input),
    ...dependencyDriftConflicts(input),
    ...behaviorEvidenceNeededConflicts(input)
  ]);
  return{conflictClasses,conflictSummary:summarizeSemanticMergeConflicts(conflictClasses,{readiness:input.readiness,conflictKeys:input.conflictKeys,sourcePath:input.sourcePath,language:input.language})};
}

export function summarizeSemanticMergeConflicts(conflictClasses=[],context={}){
  const records=(conflictClasses??[]).filter(Boolean);
  const readiness=records.reduce((current,record)=>maxSemanticMergeReadiness(current,normalizeSemanticMergeReadiness(record.readiness)??'ready'),normalizeSemanticMergeReadiness(context.readiness)??'ready');
  return{schema:'frontier.lang.semanticMergeConflictSummary.v1',total:records.length,classes:uniqueStrings(records.map((record)=>record.class)),byClass:countBy(records.map((record)=>record.class)),byRisk:countBy(records.map((record)=>record.risk??'medium')),highestRisk:highestRisk(records),readiness,riskScore:semanticMergeConflictRiskScore({conflictClasses:records,conflictSummary:{readiness}}),conflictKeys:uniqueStrings([...(context.conflictKeys??[]),...records.flatMap((record)=>record.conflictKeys??[])]),language:context.language,sourcePath:context.sourcePath};
}

export function semanticMergeConflictRiskScore(candidateOrSummary){
  const records=candidateOrSummary?.conflictClasses??candidateOrSummary?.metadata?.conflictClasses??[];
  const summary=candidateOrSummary?.conflictSummary??candidateOrSummary?.metadata?.conflictSummary??candidateOrSummary;
  const classScore=Math.max(0,...records.map((record)=>classWeight[record.class]??1));
  const riskScore=Math.max(0,...records.map((record)=>riskRank[record.risk]??2));
  const readinessScore=readinessRank[summary?.readiness??candidateOrSummary?.readiness]??2;
  return classScore*100+riskScore*10+readinessScore;
}

export function querySemanticMergeConflictClasses(candidates,options={}){
  const list=Array.isArray(candidates)?candidates:[candidates].filter(Boolean);
  const classes=new Set(queryList(options.class??options.classes));
  const risks=new Set(queryList(options.risk??options.risks));
  const readinesses=new Set(queryList(options.readiness??options.readinesses));
  const conflictKey=options.conflictKey?String(options.conflictKey):undefined;
  const records=[];
  for(const candidate of list){
    for(const record of candidate?.conflictClasses??candidate?.metadata?.conflictClasses??[]){
      if(classes.size&&!classes.has(record.class))continue;
      if(risks.size&&!risks.has(record.risk))continue;
      if(readinesses.size&&!readinesses.has(record.readiness))continue;
      if(conflictKey&&!(record.conflictKeys??[]).includes(conflictKey))continue;
      records.push({...record,candidateId:candidate.id,candidateReadiness:candidate.readiness,candidateRiskScore:semanticMergeConflictRiskScore(candidate)});
    }
  }
  return options.sort===false?records:records.sort(compareConflictClassRecords);
}

export function sortSemanticMergeCandidatesByConflictRisk(candidates,options={}){
  const sorted=[...(candidates??[])].sort((left,right)=>semanticMergeConflictRiskScore(right)-semanticMergeConflictRiskScore(left)||(readinessRank[right?.readiness]??2)-(readinessRank[left?.readiness]??2)||String(left?.id??'').localeCompare(String(right?.id??'')));
  return options.desc===false?sorted.reverse():sorted;
}

function sameSymbolEditConflicts(input){
  return(input.changedSymbols??[]).filter((symbol)=>symbol.changeKind==='modified').map((symbol)=>conflictRecord('same-symbol-edit',{id:`conflict_${idFragment(symbol.id??symbol.key)}_same_symbol_edit`,risk:'medium',readiness:symbol.readiness,conflictKeys:[symbol.conflictKey],symbolIds:[symbol.id],regionKeys:[symbol.beforeOwnershipKey,symbol.afterOwnershipKey,symbol.ownershipKey],evidenceIds:evidenceIds(input.evidence),reasonCode:'same-symbol-edited',language:input.language,sourcePath:input.sourcePath,metadata:{changeKind:symbol.changeKind,beforeSignatureHash:symbol.beforeSignatureHash,afterSignatureHash:symbol.afterSignatureHash,signatureChanged:hashChanged(symbol.beforeSignatureHash,symbol.afterSignatureHash),spanChanged:hashChanged(symbol.beforeSpanHash,symbol.afterSpanHash),ownershipChanged:(symbol.beforeOwnershipKey??'')!==(symbol.afterOwnershipKey??''),nativeAstNodeChanged:(symbol.beforeNativeAstNodeId??'')!==(symbol.afterNativeAstNodeId??'')}}));
}

function deleteModifyConflicts(input){
  const records=(input.changedSymbols??[]).filter((symbol)=>symbol.changeKind==='removed').map((symbol)=>conflictRecord('delete-modify',{id:`conflict_${idFragment(symbol.id??symbol.key)}_delete_modify`,risk:'high',readiness:symbol.readiness,conflictKeys:[symbol.conflictKey],symbolIds:[symbol.id],regionKeys:[symbol.beforeOwnershipKey,symbol.ownershipKey],evidenceIds:evidenceIds(input.evidence),reasonCode:'symbol-deleted',language:input.language,sourcePath:input.sourcePath,metadata:{changeKind:symbol.changeKind,beforeSignatureHash:symbol.beforeSignatureHash}}));
  for(const region of(input.changedRegions??[]).filter((entry)=>entry.changeKind==='removed'))records.push(conflictRecord('delete-modify',{id:`conflict_${idFragment(region.id??region.key)}_region_delete_modify`,risk:'high',readiness:input.readiness,conflictKeys:[region.conflictKey],symbolIds:[region.symbolId],regionKeys:[region.key],evidenceIds:evidenceIds(input.evidence),reasonCode:'ownership-region-deleted',language:input.language,sourcePath:input.sourcePath,metadata:{changeKind:region.changeKind,regionKind:region.regionKind}}));
  if(input.before&&!input.after&&records.length===0)records.push(conflictRecord('delete-modify',{id:`conflict_${idFragment(input.sourcePath??input.language??'source')}_source_delete_modify`,risk:'high',readiness:input.readiness,conflictKeys:input.conflictKeys,evidenceIds:evidenceIds(input.evidence),reasonCode:'source-deleted',language:input.language,sourcePath:input.sourcePath,metadata:{beforeImportId:input.before?.id}}));
  return records;
}

function shiftedCodeConflicts(input){
  const records=(input.changedSymbols??[]).filter((symbol)=>symbol.changeKind==='modified'&&!hashChanged(symbol.beforeSignatureHash,symbol.afterSignatureHash)).filter((symbol)=>hashChanged(symbol.beforeSpanHash,symbol.afterSpanHash)||(symbol.beforeSourceSpan?.startLine??0)!==(symbol.afterSourceSpan?.startLine??0)||(symbol.beforeNativeAstNodeId??'')!==(symbol.afterNativeAstNodeId??'')||(symbol.beforeOwnershipKey??'')!==(symbol.afterOwnershipKey??'')).map((symbol)=>conflictRecord('shifted-code',{id:`conflict_${idFragment(symbol.id??symbol.key)}_shifted_code`,risk:'medium',readiness:symbol.readiness,conflictKeys:[symbol.conflictKey],symbolIds:[symbol.id],regionKeys:[symbol.beforeOwnershipKey,symbol.afterOwnershipKey,symbol.ownershipKey],evidenceIds:evidenceIds(input.evidence),reasonCode:'same-signature-location-shifted',language:input.language,sourcePath:input.sourcePath,metadata:{beforeSpanHash:symbol.beforeSpanHash,afterSpanHash:symbol.afterSpanHash,beforeLine:symbol.beforeSourceSpan?.startLine,afterLine:symbol.afterSourceSpan?.startLine,beforeNativeAstNodeId:symbol.beforeNativeAstNodeId,afterNativeAstNodeId:symbol.afterNativeAstNodeId}}));
  if(input.sourceChanged&&(input.changedSymbols??[]).length===0)records.push(conflictRecord('shifted-code',{id:`conflict_${idFragment(input.sourcePath??input.language??'source')}_file_shifted_code`,risk:'medium',readiness:input.readiness,conflictKeys:input.conflictKeys,evidenceIds:evidenceIds(input.evidence),reasonCode:'source-hash-changed-without-symbol-anchor',language:input.language,sourcePath:input.sourcePath,metadata:{beforeHash:input.beforeHash,afterHash:input.afterHash}}));
  return records;
}

function duplicateSignatureConflicts(input){
  const changedKeys=new Set((input.changedSymbols??[]).map((symbol)=>symbol.key));
  return duplicateSignatureGroups(input.afterSymbols??[]).filter((group)=>group.symbols.some((symbol)=>changedKeys.size===0||changedKeys.has(symbol.key))).map((group)=>conflictRecord('duplicate-signature',{id:`conflict_${idFragment(group.signatureHash)}_duplicate_signature`,risk:'high',readiness:input.readiness,conflictKeys:group.symbols.map((symbol)=>symbol.conflictKey),symbolIds:group.symbols.map((symbol)=>symbol.id),regionKeys:group.symbols.map((symbol)=>symbol.ownershipKey),evidenceIds:evidenceIds(input.evidence),reasonCode:'duplicate-signature-hash',language:input.language,sourcePath:input.sourcePath,metadata:{signatureHash:group.signatureHash,symbolNames:group.symbols.map((symbol)=>symbol.name).filter(Boolean),symbolCount:group.symbols.length}}));
}

function dependencyDriftConflicts(input){
  const before=dependencyFingerprints(input.before);
  const after=dependencyFingerprints(input.after);
  const added=after.filter((fingerprint)=>!before.includes(fingerprint));
  const removed=before.filter((fingerprint)=>!after.includes(fingerprint));
  return!added.length&&!removed.length?[]:[conflictRecord('dependency-drift',{id:`conflict_${idFragment(input.sourcePath??input.language??'source')}_dependency_drift`,risk:'medium',readiness:input.readiness,conflictKeys:input.conflictKeys,evidenceIds:evidenceIds(input.evidence),reasonCode:'semantic-dependency-fingerprint-changed',language:input.language,sourcePath:input.sourcePath,metadata:{addedFingerprints:added,removedFingerprints:removed,beforeDependencyCount:before.length,afterDependencyCount:after.length}})];
}

function behaviorEvidenceNeededConflicts(input){
  const changedSymbols=(input.changedSymbols??[]).filter((symbol)=>symbol.changeKind!=='unchanged');
  if((!changedSymbols.length&&!input.sourceChanged)||hasBehaviorEvidence(input.evidence))return[];
  return[conflictRecord('behavior-evidence-needed',{id:`conflict_${idFragment(input.sourcePath??input.language??'source')}_behavior_evidence_needed`,risk:'medium',readiness:maxSemanticMergeReadiness(input.readiness??'ready','needs-review'),conflictKeys:input.conflictKeys,symbolIds:changedSymbols.map((symbol)=>symbol.id),regionKeys:uniqueStrings([...changedSymbols.map((symbol)=>symbol.beforeOwnershipKey),...changedSymbols.map((symbol)=>symbol.afterOwnershipKey),...(input.changedRegions??[]).map((region)=>region.key)]),evidenceIds:evidenceIds(input.evidence),reasonCode:'missing-behavior-evidence',language:input.language,sourcePath:input.sourcePath,metadata:{changedSymbols:changedSymbols.length,changedRegions:input.changedRegions?.length??0,acceptedEvidenceKinds:['test','trace','proof','verification','benchmark','behavior']}})];
}

function conflictRecord(conflictClass,input){
  return{schema:'frontier.lang.semanticMergeConflictClass.v1',id:input.id,class:conflictClass,risk:input.risk,readiness:normalizeSemanticMergeReadiness(input.readiness)??riskReadiness(input.risk),conflictKeys:uniqueStrings(input.conflictKeys),symbolIds:uniqueStrings(input.symbolIds),regionKeys:uniqueStrings(input.regionKeys),evidenceIds:uniqueStrings(input.evidenceIds),reasonCode:input.reasonCode,language:input.language,sourcePath:input.sourcePath,metadata:compactRecord(input.metadata)};
}

function dedupeConflictRecords(records){
  const seen=new Set();
  const result=[];
  for(const record of records){const key=`${record.class}:${record.id}:${record.conflictKeys.join('|')}`;if(seen.has(key))continue;seen.add(key);result.push(record);}
  return result.sort(compareConflictClassRecords);
}
function compareConflictClassRecords(left,right){return(riskRank[right.risk]??2)-(riskRank[left.risk]??2)||(classWeight[right.class]??1)-(classWeight[left.class]??1)||String(left.id??'').localeCompare(String(right.id??''));}
function duplicateSignatureGroups(symbols){const groups=new Map();for(const symbol of symbols??[]){if(!symbol?.signatureHash)continue;groups.set(symbol.signatureHash,[...(groups.get(symbol.signatureHash)??[]),symbol]);}return[...groups.entries()].filter(([,values])=>values.length>1).map(([signatureHash,values])=>({signatureHash,symbols:values}));}
function dependencyFingerprints(imported){return uniqueStrings((imported?.semanticIndex?.relations??[]).filter((relation)=>dependencyPredicates.test(String(relation.predicate??''))).map((relation)=>[relation.sourceId,relation.predicate,relation.targetId,relation.metadata?.module,relation.metadata?.importPath].map((part)=>String(part??'')).join('|'))).sort();}
function hasBehaviorEvidence(evidence){return(evidence??[]).some((record)=>record?.status!=='failed'&&(behaviorEvidenceKinds.test(String(record?.kind??record?.metadata?.kind??''))||record?.metadata?.behaviorEvidence===true||(Array.isArray(record?.metadata?.evidenceKinds)&&record.metadata.evidenceKinds.some((value)=>behaviorEvidenceKinds.test(String(value))))));}
function evidenceIds(evidence){return uniqueStrings((evidence??[]).map((record)=>record?.id));}
function highestRisk(records){const max=Math.max(0,...records.map((record)=>riskRank[record.risk]??2));return Object.keys(riskRank).find((risk)=>riskRank[risk]===max)??'low';}
function riskReadiness(risk){return risk==='high'||risk==='medium'?'needs-review':'ready-with-losses';}
function hashChanged(before,after){return Boolean(before||after)&&(before??'')!==(after??'');}
function queryList(value){if(value===undefined||value===null)return[];return Array.isArray(value)?value.map(String):[String(value)];}
function compactRecord(value){return Object.fromEntries(Object.entries(value??{}).filter(([,entry])=>entry!==undefined));}
