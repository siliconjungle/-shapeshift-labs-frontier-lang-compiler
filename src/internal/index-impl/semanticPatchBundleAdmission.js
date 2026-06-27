import { normalizeSemanticMergeReadiness, uniqueStrings } from '../../native-import-utils.js';

export function createSemanticPatchBundleAdmission(input = {}, context = {}) {
  const transformAdmission = semanticTransformAdmission(context);
  const semanticEditAdmission = semanticEditAdmissionWithReplayRequirement(
    context.semanticEditAdmission ?? { status: 'none', action: 'none', readiness: 'needs-review', reasonCodes: [] }
  );
  const evidenceAdmission = autoMergeEvidenceAdmission(context, { transformAdmission, semanticEditAdmission });
  const fallbackReadiness = fallbackAdmissionReadiness(transformAdmission, semanticEditAdmission, evidenceAdmission, context.readiness);
  const requestedReadiness = normalizeSemanticMergeReadiness(input.readiness) ?? input.readiness;
  const inputReadiness = fallbackReadiness === 'blocked' ? 'blocked' : requestedReadiness ?? fallbackReadiness;
  const positiveApply = !hasSkipReadyAction(semanticEditAdmission) && hasPositiveApplyAction(transformAdmission, semanticEditAdmission);
  const readiness = positiveApply && evidenceAdmission.action !== 'admit'
    ? evidenceAdmission.readiness
    : inputReadiness;
  const computedStatus = admissionStatusForReadiness(readiness, transformAdmission, semanticEditAdmission, evidenceAdmission);
  const status = safePatchBundleStatus(input.status, computedStatus);
  const computedAutoApplyCandidate = status === 'admitted' &&
    positiveApply &&
    evidenceAdmission.action === 'admit';
  const autoApplyCandidate = input.autoApplyCandidate === true ? computedAutoApplyCandidate : input.autoApplyCandidate ?? computedAutoApplyCandidate;
  const admittedWithoutPositiveProof = status === 'admitted' &&
    positiveApply &&
    evidenceAdmission.action !== 'admit';
  return compactRecord({
    status,
    readiness,
    reviewRequired: input.reviewRequired ?? (status !== 'admitted' || admittedWithoutPositiveProof),
    autoMergeClaim: false,
    autoApplyCandidate,
    transformAdmission,
    semanticEditAdmission,
    evidenceAdmission,
    reasonCodes: uniqueStrings([
      ...strings(input.reasonCodes),
      ...strings(context.source?.reasons),
      ...strings(context.mergeCandidate?.reasons),
      ...transformAdmission.reasonCodes,
      ...strings(semanticEditAdmission.reasonCodes),
      ...strings(evidenceAdmission.reasonCodes)
    ].filter(Boolean)),
    conflictKeys: uniqueStrings([...strings(input.conflictKeys), ...strings(context.conflictKeys)]),
    admittedAt: input.admittedAt,
    reviewerId: input.reviewerId,
    evidenceIds: uniqueStrings([...strings(input.evidenceIds), ...strings(transformAdmission.evidenceIds), ...strings(evidenceAdmission.evidenceIds)]),
    metadata: input.metadata
  });
}

function semanticTransformAdmission(context) {
  const records = array(context.semanticTransformIdentities);
  const index = context.semanticTransformIndex ?? {};
  if (!records.length && !strings(index.semanticTransformIds).length) {
    return { status: 'none', action: 'none', readiness: 'needs-review', reasonCodes: [] };
  }
  const readinesses = uniqueStrings([...strings(index.semanticTransformReadinesses), ...records.map((record) => record.readiness)]);
  const normalizedReadinesses = uniqueStrings(readinesses.map(transformReadiness).filter(Boolean));
  const blocked = normalizedReadinesses.includes('blocked');
  const complete = strings(index.semanticTransformContentHashes).length > 0 &&
    strings(index.projectionIdentityHashes).length > 0 &&
    strings(index.transformSourceLanguages).length > 0 &&
    strings(index.transformTargetLanguages).length > 0 &&
    strings(index.transformSourcePaths).length > 0 &&
    strings(index.transformTargetPaths).length > 0;
  const ready = !blocked && complete && (normalizedReadinesses.length === 0 || normalizedReadinesses.every((entry) => entry === 'ready'));
  const status = blocked ? 'blocked' : ready ? 'ready' : 'needs-review';
  return compactRecord({
    status,
    action: blocked ? 'block' : ready ? 'admit' : 'review',
    readiness: blocked ? 'blocked' : ready ? 'ready' : 'needs-review',
    crossLanguage: hasCrossLanguageTransform(index),
    reasonCodes: transformReasonCodes({ blocked, complete, ready, readinesses, index }),
    transformIds: strings(index.semanticTransformIds),
    transformKeys: strings(index.semanticTransformKeys),
    contentHashes: strings(index.semanticTransformContentHashes),
    projectionIdentityHashes: strings(index.projectionIdentityHashes),
    baseHashes: strings(index.transformBaseHashes),
    targetHashes: strings(index.transformTargetHashes),
    sourceLanguages: strings(index.transformSourceLanguages),
    targetLanguages: strings(index.transformTargetLanguages),
    sourcePaths: strings(index.transformSourcePaths),
    targetPaths: strings(index.transformTargetPaths),
    sourceMapIds: strings(index.transformSourceMapIds),
    sourceMapLinkIds: strings(index.transformSourceMapLinkIds),
    sourceMapMappingIds: strings(index.transformSourceMapMappingIds),
    evidenceIds: strings(index.semanticTransformEvidenceIds)
  });
}

function transformReasonCodes(input) {
  return uniqueStrings([
    input.blocked ? 'transform-readiness-blocked' : undefined,
    !input.complete ? 'transform-evidence-incomplete' : undefined,
    input.ready ? 'transform-auto-apply-candidate' : undefined,
    ...input.readinesses.map((readiness) => `transform-readiness:${readiness}`)
  ].filter(Boolean));
}

function transformReadiness(value) {
  const normalized = normalizeSemanticMergeReadiness(value);
  if (normalized) return normalized === 'ready-with-losses' ? 'needs-review' : normalized;
  const status = String(value ?? '').toLowerCase();
  if (['auto-merge-candidate', 'portable', 'projected', 'applied'].includes(status)) return 'ready';
  if (['conflict', 'blocked', 'stale', 'rejected'].includes(status)) return 'blocked';
  if (['needs-port', 'review', 'needs-review', 'candidate'].includes(status)) return 'needs-review';
  return undefined;
}

function autoMergeEvidenceAdmission(context, admissions) {
  const evidence = uniqueEvidenceRecords([
    ...array(context.evidenceRecords),
    ...array(context.evidence),
    ...array(context.source?.evidence),
    ...array(context.source?.patch?.evidence),
    ...array(context.source?.semanticPatch?.evidence),
    ...array(context.mergeCandidate?.evidence)
  ]);
  const skipReady = hasSkipReadyAction(admissions.semanticEditAdmission);
  const positiveApply = !skipReady &&
    hasPositiveApplyAttempt(admissions.transformAdmission, admissions.semanticEditAdmission);
  if (!positiveApply) return skipReady
    ? skipEvidenceAdmission(evidence)
    : { status: 'none', action: 'none', readiness: 'needs-review', reasonCodes: [], evidenceIds: evidenceIds(evidence) };
  const summary = summarizeAutoMergeEvidence(evidence);
  const blocked = summary.failed > 0 || summary.conflict > 0;
  const ready = !blocked && summary.stale === 0 && summary.passed > 0;
  const status = blocked ? 'blocked' : summary.stale > 0 ? 'stale' : ready ? 'ready' : 'needs-review';
  return compactRecord({
    status,
    action: blocked ? 'block' : status === 'stale' ? 'rerun-semantic-import' : ready ? 'admit' : 'review',
    readiness: blocked ? 'blocked' : ready ? 'ready' : 'needs-review',
    reasonCodes: autoMergeEvidenceReasonCodes(summary, status),
    evidenceIds: summary.evidenceIds,
    passed: summary.passed,
    failed: summary.failed,
    conflict: summary.conflict,
    stale: summary.stale
  });
}

function skipEvidenceAdmission(evidence) {
  const summary = summarizeAutoMergeEvidence(evidence);
  const blocked = summary.failed > 0 || summary.conflict > 0;
  const status = blocked ? 'blocked' : summary.stale > 0 ? 'stale' : summary.passed > 0 ? 'ready' : 'none';
  return compactRecord({
    status,
    action: blocked ? 'block' : status === 'stale' ? 'rerun-semantic-import' : status === 'ready' ? 'skip' : 'none',
    readiness: blocked ? 'blocked' : status === 'ready' ? 'ready' : 'needs-review',
    reasonCodes: status === 'none' ? [] : autoMergeEvidenceReasonCodes(summary, status),
    evidenceIds: summary.evidenceIds,
    passed: summary.passed,
    failed: summary.failed,
    conflict: summary.conflict,
    stale: summary.stale
  });
}

function summarizeAutoMergeEvidence(evidence) {
  const testLike = evidence.filter(isAutoMergeTestEvidence);
  const failed = testLike.filter((record) => evidenceStatus(record, ['failed', 'failure', 'error', 'blocked', 'rejected']));
  const passed = testLike.filter((record) => evidenceStatus(record, ['passed', 'ok', 'success', 'succeeded', 'accepted', 'verified']));
  const conflict = evidence.filter((record) => evidenceStatus(record, ['conflict', 'conflicted']) || record?.metadata?.conflict === true || strings(record?.reasonCodes ?? record?.reasons).some((reason) => reason.toLowerCase().includes('conflict')));
  const stale = evidence.filter((record) => evidenceStatus(record, ['stale']) || record?.metadata?.stale === true || strings(record?.reasonCodes ?? record?.reasons).some((reason) => reason.toLowerCase().includes('stale')));
  return {
    evidenceIds: evidenceIds(evidence),
    passed: passed.length,
    failed: failed.length,
    conflict: conflict.length,
    stale: stale.length
  };
}

function autoMergeEvidenceReasonCodes(summary, status) {
  return uniqueStrings([
    summary.passed ? 'auto-merge-tests-passed' : undefined,
    summary.passed === 0 ? 'auto-merge-tests-passed-evidence-missing' : undefined,
    summary.failed ? 'auto-merge-tests-failed' : undefined,
    summary.conflict ? 'auto-merge-conflict-evidence' : undefined,
    summary.stale ? 'auto-merge-stale-evidence' : undefined,
    status === 'ready' ? 'auto-merge-positive-proof' : undefined
  ].filter(Boolean));
}

function fallbackAdmissionReadiness(transformAdmission, semanticEditAdmission, evidenceAdmission, fallback) {
  if ([transformAdmission.readiness, semanticEditAdmission.readiness, evidenceAdmission.readiness].includes('blocked')) return 'blocked';
  if (hasSkipReadyAction(semanticEditAdmission)) return 'ready';
  if (hasPositiveApplyAction(transformAdmission, semanticEditAdmission)) return evidenceAdmission.action === 'admit' ? 'ready' : evidenceAdmission.readiness;
  if (semanticEditAdmission.action === 'review' || semanticEditAdmission.status === 'needs-review') return 'needs-review';
  return fallback;
}

function admissionStatusForReadiness(readiness, transformAdmission, semanticEditAdmission, evidenceAdmission) {
  if (readiness === 'blocked') return 'blocked';
  if (hasAdmissibleReadyAction(transformAdmission, semanticEditAdmission, evidenceAdmission) && readiness === 'ready') return 'admitted';
  return readiness === 'needs-review' ? 'needs-review' : 'proposed';
}

function safePatchBundleStatus(requested, computed) {
  if (computed === 'blocked' && requested !== 'rejected') return 'blocked';
  if (requested === 'admitted' && computed !== 'admitted') return computed;
  return requested ?? computed;
}

function hasAdmissibleReadyAction(transformAdmission, semanticEditAdmission, evidenceAdmission) {
  return hasSkipReadyAction(semanticEditAdmission) ||
    (hasPositiveApplyAction(transformAdmission, semanticEditAdmission) && evidenceAdmission.action === 'admit');
}

function hasPositiveApplyAction(transformAdmission, semanticEditAdmission) {
  return [transformAdmission.action, semanticEditAdmission.action].includes('admit');
}

function hasPositiveApplyAttempt(transformAdmission, semanticEditAdmission) {
  return hasPositiveApplyAction(transformAdmission, semanticEditAdmission) ||
    hasAcceptedCleanSemanticEditReplay(semanticEditAdmission) ||
    strings(transformAdmission.reasonCodes).includes('transform-readiness:auto-merge-candidate');
}

function hasSkipReadyAction(semanticEditAdmission) {
  return semanticEditAdmission.action === 'skip' && semanticEditAdmission.readiness === 'ready' && semanticEditAdmission.reviewRequired === false;
}

function semanticEditAdmissionWithReplayRequirement(admission) {
  if (!requiresSemanticEditReplay(admission) || hasAcceptedCleanSemanticEditReplay(admission)) return admission;
  return compactRecord({
    ...admission,
    status: 'needs-review',
    action: 'review',
    readiness: 'needs-review',
    reviewRequired: true,
    autoApplyCandidate: false,
    reasonCodes: uniqueStrings([
      ...strings(admission.reasonCodes).filter((reason) => reason !== 'semantic-edit-positive-auto-merge-proof'),
      ...semanticEditReplayRequirementReasonCodes(admission)
    ])
  });
}

function requiresSemanticEditReplay(admission) {
  return admission.action === 'admit' ||
    admission.autoApplyCandidate === true ||
    admission.status === 'ready' ||
    strings(admission.reasonCodes).includes('semantic-edit-positive-auto-merge-proof');
}

function hasAcceptedCleanSemanticEditReplay(admission) {
  const summary = admission.summary ?? {};
  const acceptedClean = count(summary.acceptedClean);
  const alreadyApplied = count(summary.alreadyApplied);
  const replays = count(summary.replays);
  const boundedCurrentHeadReplays = count(summary.boundedCurrentHeadReplays);
  return acceptedClean > 0 &&
    replays > 0 &&
    acceptedClean + alreadyApplied === replays &&
    boundedCurrentHeadReplays === acceptedClean;
}

function semanticEditReplayRequirementReasonCodes(admission) {
  const summary = admission.summary ?? {};
  const scripts = count(summary.scripts);
  const projections = count(summary.projections);
  const replays = count(summary.replays);
  const acceptedClean = count(summary.acceptedClean);
  const unboundAcceptedCleanReplays = count(summary.unboundAcceptedCleanReplays);
  const boundedCurrentHeadReplays = count(summary.boundedCurrentHeadReplays);
  return [
    scripts > 0 && projections === 0 ? 'semantic-edit-projection-missing' : undefined,
    (scripts > 0 || projections > 0) && replays === 0 ? 'semantic-edit-replay-missing' : undefined,
    replays > 0 && acceptedClean === 0 ? 'semantic-edit-replay-accepted-clean-missing' : undefined,
    acceptedClean > 0 && (unboundAcceptedCleanReplays > 0 || boundedCurrentHeadReplays !== acceptedClean)
      ? 'semantic-edit-replay-current-head-proof-missing'
      : undefined,
    'semantic-edit-replay-required'
  ].filter(Boolean);
}

function hasCrossLanguageTransform(index) {
  const source = new Set(strings(index.transformSourceLanguages));
  return strings(index.transformTargetLanguages).some((target) => !source.has(target));
}

function isAutoMergeTestEvidence(record) {
  const kind = String(record?.kind ?? record?.type ?? '').toLowerCase();
  return ['test', 'tests', 'proof', 'gate', 'verification', 'check'].includes(kind);
}

function evidenceStatus(record, statuses) {
  const status = String(record?.status ?? record?.outcome ?? '').toLowerCase();
  return statuses.includes(status);
}

function uniqueEvidenceRecords(records) {
  const seen = new Set();
  const result = [];
  for (const record of records.filter(Boolean)) {
    const key = record.id ?? JSON.stringify(record);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(record);
  }
  return result;
}

function evidenceIds(evidence) { return uniqueStrings(evidence.map((record) => record.id)); }
function count(value) { const number = Number(value ?? 0); return Number.isFinite(number) ? number : 0; }
function array(value) { if (value === undefined || value === null) return []; return Array.isArray(value) ? value : [value]; }
function strings(value) { return array(value).map((entry) => String(entry ?? '')).filter(Boolean); }
function compactRecord(value) { return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0))); }
