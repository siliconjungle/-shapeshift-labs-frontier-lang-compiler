import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, normalizeSemanticMergeReadiness, uniqueStrings } from './native-import-utils.js';

export const JsTsSemanticMergeConflictClasses = Object.freeze([
  'same-token-edit',
  'same-region-edit',
  'delete-modify',
  'move-edit',
  'rename-rename',
  'import-order',
  'type-surface-drift',
  'trivia-preservation',
  'behavior-evidence-needed'
]);

export const JsTsSemanticMergeGateStatuses = Object.freeze([
  'passed',
  'warning',
  'failed',
  'skipped',
  'blocked'
]);

import { actionForConflict, actionForGate, array, booleanValue, compactRecord, firstString, normalizeConflictSides, normalizeGateChecks, normalizeGateStatus, normalizeRisk, numberValue, readinessForGateStatus, readinessForRisk, strings, titleForConflictClass } from './js-ts-semantic-merge-contract-helpers.js';

export function createJsTsSemanticMergeConflictExplanation(input = {}, options = {}) {
  const conflictClass = firstString(options.conflictClass, input.conflictClass, input.class, 'same-region-edit');
  const risk = normalizeRisk(firstString(options.risk, input.risk, input.severity)) ?? 'medium';
  const readiness = normalizeSemanticMergeReadiness(firstString(options.readiness, input.readiness)) ?? readinessForRisk(risk);
  const language = firstString(options.language, input.language);
  const sourcePath = firstString(options.sourcePath, input.sourcePath);
  const conflictKeys = uniqueStrings([
    ...strings(input.conflictKeys),
    input.conflictKey,
    ...strings(options.conflictKeys),
    options.conflictKey
  ]);
  const matchIds = uniqueStrings([...strings(input.matchIds), ...strings(options.matchIds)]);
  const editIds = uniqueStrings([...strings(input.editIds), ...strings(options.editIds)]);
  const regionIds = uniqueStrings([...strings(input.regionIds), ...strings(options.regionIds)]);
  const tokenIds = uniqueStrings([...strings(input.tokenIds), ...strings(options.tokenIds)]);
  const triviaIds = uniqueStrings([...strings(input.triviaIds), ...strings(options.triviaIds)]);
  const evidenceIds = uniqueStrings([...strings(input.evidenceIds), ...strings(options.evidenceIds)]);
  const reasonCodes = uniqueStrings([
    ...strings(input.reasonCodes),
    ...strings(input.reasons),
    ...strings(options.reasonCodes),
    `js-ts-conflict:${conflictClass}`
  ]);
  const sides = normalizeConflictSides(options.sides ?? input.sides);
  const title = firstString(options.title, input.title, titleForConflictClass(conflictClass));
  const summary = firstString(options.summary, input.summary, input.message);
  const suggestedAction = firstString(options.suggestedAction, input.suggestedAction, actionForConflict({ risk, readiness }));
  const stablePayload = compactRecord({
    schema: 'frontier.lang.jsTsSemanticMergeConflictExplanation.v1',
    conflictClass,
    risk,
    readiness,
    language,
    sourcePath,
    title,
    summary,
    conflictKeys,
    matchIds,
    editIds,
    regionIds,
    tokenIds,
    triviaIds,
    evidenceIds,
    reasonCodes,
    sides,
    suggestedAction
  });
  const hash = hashSemanticValue(stablePayload);
  const stableId = firstString(options.stableId, input.stableId)
    || `js_ts_merge_conflict_${idFragment(firstString(conflictKeys[0], sourcePath, conflictClass))}_${idFragment(hash)}`;
  return compactRecord({
    kind: 'frontier.lang.jsTsSemanticMergeConflictExplanation',
    version: 1,
    schema: 'frontier.lang.jsTsSemanticMergeConflictExplanation.v1',
    id: firstString(options.id, input.id, stableId),
    stableId,
    hash,
    conflictClass,
    risk,
    readiness,
    language,
    sourcePath,
    title,
    summary,
    conflictKeys,
    matchIds,
    editIds,
    regionIds,
    tokenIds,
    triviaIds,
    evidenceIds,
    reasonCodes,
    sides,
    suggestedAction,
    metadata: compactRecord({
      normalizedBy: 'frontier-lang-compiler/js-ts-semantic-merge',
      structuralContract: true,
      ...(input.metadata ?? {}),
      ...(options.metadata ?? {})
    })
  });
}

export function createJsTsSemanticMergeGateResult(input = {}, options = {}) {
  const gateId = firstString(options.gateId, input.gateId, input.id, 'js-ts-semantic-merge');
  const status = normalizeGateStatus(firstString(options.status, input.status)) ?? 'skipped';
  const conflicts = [
    ...array(input.conflictExplanations),
    ...array(input.conflicts),
    ...array(options.conflictExplanations),
    ...array(options.conflicts)
  ].filter(Boolean).map((conflict) => createJsTsSemanticMergeConflictExplanation(conflict));
  const conflictExplanationIds = uniqueStrings([
    ...strings(input.conflictExplanationIds),
    ...strings(options.conflictExplanationIds),
    ...conflicts.map((conflict) => conflict.id)
  ]);
  const checks = normalizeGateChecks([
    ...array(input.checks),
    ...array(options.checks)
  ], status);
  const readiness = normalizeSemanticMergeReadiness(firstString(options.readiness, input.readiness)) ?? readinessForGateStatus(status, checks, conflictExplanationIds);
  const evidenceIds = uniqueStrings([
    ...strings(input.evidenceIds),
    ...strings(options.evidenceIds),
    ...checks.flatMap((check) => strings(check.evidenceIds)),
    ...conflicts.flatMap((conflict) => conflict.evidenceIds)
  ]);
  const reasonCodes = uniqueStrings([
    ...strings(input.reasonCodes),
    ...strings(options.reasonCodes),
    ...checks.flatMap((check) => strings(check.reasonCodes)),
    ...conflicts.flatMap((conflict) => conflict.reasonCodes),
    ...(status === 'passed' ? [] : [`js-ts-merge-gate:${status}`])
  ]);
  const structuredEditIds = uniqueStrings([
    ...strings(input.structuredEditIds),
    ...strings(options.structuredEditIds),
    ...array(input.structuredEdits).map((edit) => edit?.id),
    ...array(options.structuredEdits).map((edit) => edit?.id)
  ]);
  const semanticRegionIds = uniqueStrings([
    ...strings(input.semanticRegionIds),
    ...strings(options.semanticRegionIds),
    ...array(input.semanticRegions).map((region) => region?.id),
    ...array(options.semanticRegions).map((region) => region?.id)
  ]);
  const mergeable = booleanValue(options.mergeable, input.mergeable)
    ?? (status === 'passed' && readiness === 'ready' && conflictExplanationIds.length === 0);
  const action = firstString(options.action, input.action, actionForGate({ status, readiness, mergeable }));
  const confidence = numberValue(options.confidence, input.confidence, status === 'passed' ? 1 : 0);
  const failedChecks = checks.filter((check) => check.status === 'failed').length;
  const warningChecks = checks.filter((check) => check.status === 'warning').length;
  const blockedChecks = checks.filter((check) => check.status === 'blocked').length;
  const summary = {
    checks: checks.length,
    conflicts: conflictExplanationIds.length,
    failedChecks,
    warningChecks,
    blockedChecks,
    evidenceIds: evidenceIds.length,
    reasonCodes
  };
  const stablePayload = compactRecord({
    schema: 'frontier.lang.jsTsSemanticMergeGateResult.v1',
    gateId,
    status,
    readiness,
    mergeable,
    action,
    confidence,
    checks,
    conflictExplanationIds,
    structuredEditIds,
    semanticRegionIds,
    evidenceIds,
    reasonCodes,
    summary
  });
  const hash = hashSemanticValue(stablePayload);
  const stableId = firstString(options.stableId, input.stableId)
    || `js_ts_merge_gate_${idFragment(gateId)}_${idFragment(hash)}`;
  return compactRecord({
    kind: 'frontier.lang.jsTsSemanticMergeGateResult',
    version: 1,
    schema: 'frontier.lang.jsTsSemanticMergeGateResult.v1',
    id: firstString(options.id, input.id, stableId),
    stableId,
    hash,
    gateId,
    status,
    readiness,
    mergeable,
    action,
    confidence,
    checks,
    conflictExplanations: conflicts,
    conflictExplanationIds,
    structuredEditIds,
    semanticRegionIds,
    evidenceIds,
    reasonCodes,
    summary,
    metadata: compactRecord({
      normalizedBy: 'frontier-lang-compiler/js-ts-semantic-merge',
      structuralContract: true,
      ...(input.metadata ?? {}),
      ...(options.metadata ?? {})
    })
  });
}
