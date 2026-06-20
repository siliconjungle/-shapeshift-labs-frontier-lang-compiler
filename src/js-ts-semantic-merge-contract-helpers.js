import { idFragment, normalizeSemanticMergeReadiness, uniqueStrings } from './native-import-utils.js';
import { JsTsSemanticMergeGateStatuses } from './js-ts-semantic-merge-contracts.js';
import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

export function normalizeConflictSides(sides = {}) {
  return compactRecord({
    base: normalizeConflictSide('base', sides.base),
    left: normalizeConflictSide('left', sides.left),
    right: normalizeConflictSide('right', sides.right)
  });
}

function normalizeConflictSide(side, value) {
  if (!value) return undefined;
  return compactRecord({
    side: firstString(value.side, side),
    sourcePath: firstString(value.sourcePath),
    sourceHash: firstString(value.sourceHash),
    editIds: uniqueStrings(value.editIds),
    regionIds: uniqueStrings(value.regionIds),
    tokenIds: uniqueStrings(value.tokenIds),
    summary: firstString(value.summary),
    metadata: value.metadata
  });
}

export function normalizeGateChecks(checks, fallbackStatus) {
  return array(checks).filter(Boolean).map((check, index) => {
    const status = normalizeGateStatus(check.status) ?? fallbackStatus;
    const name = firstString(check.name, check.id, `check-${index + 1}`);
    const reasonCodes = uniqueStrings([
      ...strings(check.reasonCodes),
      ...strings(check.reasons),
      ...(status === 'passed' ? [] : [`js-ts-merge-check:${status}`])
    ]);
    const stablePayload = compactRecord({
      name,
      status,
      readiness: normalizeSemanticMergeReadiness(check.readiness) ?? check.readiness,
      reasonCodes,
      evidenceIds: uniqueStrings(check.evidenceIds)
    });
    const hash = firstString(check.hash) || hashSemanticValue(stablePayload);
    return compactRecord({
      id: firstString(check.id) || `js_ts_merge_check_${idFragment(name)}_${idFragment(hash)}`,
      name,
      status,
      readiness: stablePayload.readiness,
      reasonCodes,
      evidenceIds: stablePayload.evidenceIds,
      hash,
      metadata: check.metadata
    });
  });
}

export function readinessForRisk(risk) {
  if (risk === 'high') return 'blocked';
  if (risk === 'low') return 'ready-with-losses';
  return 'needs-review';
}

export function readinessForGateStatus(status, checks, conflictExplanationIds) {
  if (status === 'blocked' || status === 'failed') return 'blocked';
  if (conflictExplanationIds.length > 0) return 'needs-review';
  if (checks.some((check) => check.status === 'failed' || check.status === 'blocked')) return 'blocked';
  if (status === 'warning' || checks.some((check) => check.status === 'warning')) return 'ready-with-losses';
  if (status === 'passed') return 'ready';
  return 'needs-review';
}

export function actionForConflict({ risk, readiness }) {
  if (readiness === 'blocked' || risk === 'high') return 'block';
  if (readiness === 'ready') return 'merge';
  return 'manual-review';
}

export function actionForGate({ status, readiness, mergeable }) {
  if (mergeable) return 'merge';
  if (status === 'blocked' || status === 'failed' || readiness === 'blocked') return 'block';
  if (status === 'skipped') return 'skip';
  return 'review';
}

export function titleForConflictClass(conflictClass) {
  return String(conflictClass).split(/[-_]+/g).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

export function normalizeRisk(value) {
  const risk = String(value ?? '').toLowerCase();
  return risk === 'low' || risk === 'medium' || risk === 'high' ? risk : undefined;
}

export function normalizeGateStatus(value) {
  const status = String(value ?? '').toLowerCase();
  return JsTsSemanticMergeGateStatuses.includes(status) ? status : undefined;
}

export function booleanValue(...values) {
  for (const value of values) {
    if (typeof value === 'boolean') return value;
  }
  return undefined;
}

export function numberValue(...values) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

export function array(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

export function strings(value) {
  return array(value).map((entry) => entry === undefined || entry === null ? '' : String(entry)).filter(Boolean);
}

export function firstString(...values) {
  return values.map((value) => value === undefined || value === null ? '' : String(value)).find(Boolean);
}

export function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined));
}
