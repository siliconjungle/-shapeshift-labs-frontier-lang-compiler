export function admissionRejectionReasons(input){
  const reasons=[];
  if(input.readiness==='blocked') reasons.push('Project import readiness is blocked.');
  if(input.failedEvidenceIds.length) reasons.push(`Project import has failed evidence: ${input.failedEvidenceIds.join(', ')}`);
  if((input.blockingLossIds??[]).length) reasons.push(`Project import has blocking losses: ${input.blockingLossIds.join(', ')}`);
  if(input.semanticEvidence.empty) reasons.push('Project import has no semantic symbols, occurrences, relations, or facts.');
  if(input.sourcePreservation.stale>0) reasons.push(`Project import has stale source preservation for ${input.sourcePreservation.stale} source(s).`);
  return reasons;
}

export function admissionPriorityReasons(input){
  const reasons=[];
  if(input.readiness==='needs-review'||input.readiness==='ready-with-losses') reasons.push(`Project import readiness is ${input.readiness}.`);
  if(input.semanticEvidence.emptySourceCount>0) reasons.push(`${input.semanticEvidence.emptySourceCount} source(s) have empty semantic evidence.`);
  if(input.sourcePreservation.quality==='lossy'||input.sourcePreservation.quality==='missing') reasons.push(`Project source preservation quality is ${input.sourcePreservation.quality}.`);
  if(input.mergeCandidateRisk.highestRisk!=='low') reasons.push(`Highest merge-candidate risk is ${input.mergeCandidateRisk.highestRisk}.`);
  if(input.ownership.changed>0) reasons.push(`Project import changes ${input.ownership.changed} ownership region(s) or region conflict key(s).`);
  return reasons;
}

export function admissionPriority(action,readiness,sourcePreservation,mergeCandidateRisk){
  if(action==='reject') return 'blocker';
  if(mergeCandidateRisk.highestRisk==='high'||readiness==='blocked') return 'critical';
  if(readiness==='needs-review'||sourcePreservation.quality==='stale') return 'high';
  if(readiness==='ready-with-losses'||sourcePreservation.quality==='lossy'||mergeCandidateRisk.highestRisk==='medium'||mergeCandidateRisk.highestRisk==='unknown') return 'normal';
  return 'low';
}
