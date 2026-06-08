export const readinessRank=Object.freeze({ready:0,'ready-with-losses':1,'needs-review':2,blocked:3});
export const sourceScoreByReadiness=Object.freeze({ready:100,'ready-with-losses':75,'needs-review':45,blocked:0});
export const riskRank=Object.freeze({low:0,medium:1,unknown:2,high:3});
export const taskPriorityRank=Object.freeze({low:0,normal:1,high:2,critical:3,blocker:4});
export const preservationRank=Object.freeze({exact:0,lossy:1,missing:2,stale:3,empty:4});


export function taskPriorityForReadiness(readiness){
  if(readiness==='blocked') return 'blocker';
  if(readiness==='needs-review') return 'high';
  if(readiness==='ready-with-losses') return 'normal';
  return 'low';
}

export function maxTaskPriority(left,right){
  return taskPriorityRank[left]>=taskPriorityRank[right]?left:right;
}

export function readinessSort(readiness){
  return readinessRank[readiness]??readinessRank['needs-review'];
}

export function clampScore(value){
  return Math.max(0,Math.min(100,roundScore(value)));
}

export function roundScore(value){
  return Math.round(value*100)/100;
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

export function readinessRisk(readiness){
  if(readiness==='blocked') return 'high';
  if(readiness==='needs-review'||readiness==='ready-with-losses') return 'medium';
  return 'low';
}

export function normalizeRisk(value){
  const risk=String(value??'').toLowerCase();
  return Object.prototype.hasOwnProperty.call(riskRank,risk)?risk:undefined;
}
