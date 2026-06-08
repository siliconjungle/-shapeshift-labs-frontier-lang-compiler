import { countBy, uniqueStrings } from './native-import-utils.js';

export function semanticImpactMergeSignal(record) {
  const missing = semanticImpactMissingSignals(record);
  const requiredSteps = (record.verificationPlan ?? []).filter((step) => step.required).length;
  const blocked = record.readiness === 'blocked' || (record.failedProofObligationIds ?? []).length > 0;
  const reviewRequired = blocked || record.readiness !== 'ready' || record.risk !== 'low' || requiredSteps > 0 || missing.length > 0;
  const score = semanticImpactMergeScore(record, missing, requiredSteps, blocked);
  const status = semanticImpactMergeStatus(record, score, blocked);
  return {
    status,
    score,
    missing,
    reviewRequired,
    queryKeys: semanticImpactMergeQueryKeys(record, status, missing, reviewRequired)
  };
}

export function summarizeSemanticImpactMergeSignals(records) {
  const signals = (records ?? []).map((record) => record.mergeSignal).filter(Boolean);
  return {
    byMergeSignal: countBy(signals.map((signal) => signal.status)),
    weakMergeSignals: signals.filter((signal) => signal.status === 'weak' || signal.status === 'blocked').length,
    reviewRequiredMergeSignals: signals.filter((signal) => signal.reviewRequired).length,
    mergeSignalQueryKeys: uniqueStrings(signals.flatMap((signal) => signal.queryKeys)),
    mergeSignalScores: semanticImpactMergeScoreSummary(signals)
  };
}

function semanticImpactMissingSignals(record) {
  const missing = [];
  if ((record.evidenceIds ?? []).length === 0) missing.push('evidence');
  if ((record.sourceMapMappingIds ?? []).length === 0) missing.push('source-map');
  if ((record.sourcePreservationRecordIds ?? []).length === 0) missing.push('source-preservation');
  if (record.readiness !== 'ready' && (record.patchHintIds ?? []).length === 0) missing.push('patch-hint');
  if ((record.openProofObligationIds ?? []).length > 0) missing.push('proof-obligations');
  if (record.confidence === 'estimated-source-region' || record.confidence === 'review-required') missing.push('source-confidence');
  return uniqueStrings(missing);
}

function semanticImpactMergeScore(record, missing, requiredSteps, blocked) {
  let score = 100;
  if (blocked) score -= 70;
  else if (record.risk === 'high') score -= 35;
  else if (record.risk === 'medium') score -= 18;
  if (record.readiness === 'blocked') score -= 30;
  else if (record.readiness === 'needs-review') score -= 18;
  else if (record.readiness === 'ready-with-losses') score -= 8;
  score -= Math.min(requiredSteps * 8, 32);
  score -= Math.min(missing.length * 7, 35);
  if ((record.failedProofObligationIds ?? []).length > 0) score -= 30;
  if ((record.openProofObligationIds ?? []).length > 0) score -= 12;
  if (record.confidence === 'source-exact') score += 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function semanticImpactMergeStatus(record, score, blocked) {
  if (blocked || score < 25) return 'blocked';
  if (score < 50 || record.risk === 'high') return 'weak';
  if (score < 80 || record.risk === 'medium' || record.readiness !== 'ready') return 'partial';
  return 'strong';
}

function semanticImpactMergeQueryKeys(record, status, missing, reviewRequired) {
  return uniqueStrings([
    `merge-signal:${status}`,
    `risk:${record.risk ?? 'unknown'}`,
    `readiness:${record.readiness ?? 'unknown'}`,
    reviewRequired ? 'review-required' : 'review-not-required',
    ...missing.map((item) => `missing:${item}`),
    record.sourcePath ? `source:${record.sourcePath}` : undefined,
    record.ownershipKey ? `ownership:${record.ownershipKey}` : undefined,
    ...(record.symbolNames ?? []).map((name) => `symbol-name:${name}`),
    ...(record.dependencyPredicates ?? []).map((predicate) => `predicate:${predicate}`)
  ].filter(Boolean));
}

function semanticImpactMergeScoreSummary(signals) {
  if (!signals.length) return { min: 0, max: 0, average: 0 };
  const scores = signals.map((signal) => signal.score);
  return {
    min: Math.min(...scores),
    max: Math.max(...scores),
    average: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  };
}
