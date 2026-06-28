import { normalizeSemanticMergeReadiness, uniqueStrings } from '../../native-import-utils.js';
import { summarizeSemanticSidecarQuality } from './semanticSidecarQuality.js';

export const SemanticEditBundleAdmissionStatuses = Object.freeze([
  'none',
  'ready',
  'already-applied',
  'needs-review',
  'stale',
  'conflict',
  'blocked'
]);

export function createSemanticEditBundleAdmission(input = {}, options = {}) {
  const scripts = array(input.semanticEditScripts ?? input.scripts ?? input.semanticEditScript);
  const projections = array(input.semanticEditProjections ?? input.projections ?? input.semanticEditProjection);
  const replays = array(input.semanticEditReplays ?? input.replays ?? input.semanticEditReplay);
  const evidence = evidenceRecords(input, options);
  const summary = summarizeSemanticEditBundle(scripts, projections, replays, evidence, input, options);
  const computedStatus = semanticEditBundleStatus(summary);
  const status = safeStatus(input.status ?? options.status, computedStatus, summary);
  const readiness = normalizeSemanticMergeReadiness(input.readiness ?? options.readiness ?? readinessForStatus(status))
    ?? input.readiness ?? options.readiness ?? readinessForStatus(status);
  const positiveAutoApplyCandidate = status === 'ready' && hasPositiveAutoMergeProof(summary);
  const computedReviewRequired = !['ready', 'already-applied', 'none'].includes(status) || (status === 'ready' && !positiveAutoApplyCandidate);
  return compactRecord({
    status,
    action: safeAction(input.action ?? options.action, status, positiveAutoApplyCandidate),
    readiness,
    reviewRequired: input.reviewRequired === true || computedReviewRequired,
    autoApplyCandidate: input.autoApplyCandidate === false ? false : positiveAutoApplyCandidate,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    reasonCodes: uniqueStrings([
      ...strings(input.reasonCodes),
      ...strings(options.reasonCodes),
      ...summary.reasonCodes,
      ...derivedReasonCodes(summary, status)
    ].filter(Boolean)),
    sourcePaths: summary.sourcePaths,
    scriptIds: summary.scriptIds,
    projectionIds: summary.projectionIds,
    replayIds: summary.replayIds,
    summary,
    metadata: input.metadata ?? options.metadata
  });
}

function summarizeSemanticEditBundle(scripts, projections, replays, evidence, input, options) {
  const scriptStatusEntries = scripts.map((script) => script.admission?.status);
  const projectionStatusEntries = projections.flatMap((projection) => [projection.status, projection.admission?.status]);
  const replayStatusEntries = replays.map((replay) => replay.status);
  const scriptStatuses = uniqueStrings(strings(scriptStatusEntries));
  const projectionStatuses = uniqueStrings(strings(projectionStatusEntries));
  const replayStatuses = uniqueStrings(strings(replayStatusEntries));
  const replayActions = uniqueStrings(strings(replays.map((replay) => replay.admission?.action)));
  const evidenceSummary = summarizeEvidence(evidence);
  const sidecarQuality = summarizeSemanticSidecarQuality([input, options, ...scripts, ...projections, ...replays]);
  return {
    scripts: scripts.length,
    projections: projections.length,
    replays: replays.length,
    files: sourcePaths(scripts, projections, replays).length,
    portableScripts: scripts.filter((script) => script.admission?.status === 'auto-merge-candidate').length,
    portableProjections: projections.filter((projection) => projection.status === 'projected' && projection.admission?.status === 'auto-merge-candidate').length,
    acceptedClean: replays.filter((replay) => replay.status === 'accepted-clean').length,
    boundedCurrentHeadReplays: replays.filter(isBoundedCurrentHeadReplay).length,
    incompleteCurrentHeadProofReplays: replays.filter(hasIncompleteCurrentHeadReplayProof).length,
    unboundAcceptedCleanReplays: replays.filter((replay) => replay.status === 'accepted-clean' && !isBoundedCurrentHeadReplay(replay)).length,
    alreadyApplied: replays.filter((replay) => replay.status === 'already-applied').length,
    conflicts: countStatuses(scriptStatusEntries, replayStatusEntries, ['conflict']),
    stale: countStatuses(scriptStatusEntries, replayStatusEntries, ['stale']),
    blocked: countStatuses(scriptStatusEntries, projectionStatusEntries, replayStatusEntries, ['blocked']),
    needsReview: countStatuses(scriptStatusEntries, replayStatusEntries, ['needs-port', 'evidence-only']),
    projected: projections.filter((projection) => projection.status === 'projected').length,
    projectionBlocked: projections.filter((projection) => projection.status === 'blocked').length,
    scriptStatuses,
    projectionStatuses,
    replayStatuses,
    replayActions,
    replayProofRouteIds: uniqueStrings(replays.map((replay) => replayProofRoute(replay)?.routeId)),
    replayCurrentSourceBindingStatuses: uniqueStrings(replays.map((replay) => replay.metadata?.currentSourceBindingStatus)),
    replayOutputBindingStatuses: uniqueStrings(replays.map((replay) => replay.metadata?.outputBindingStatus)),
    sourcePaths: sourcePaths(scripts, projections, replays),
    scriptIds: uniqueStrings(scripts.map((script) => script.id)),
    projectionIds: uniqueStrings(projections.map((projection) => projection.id)),
    replayIds: uniqueStrings(replays.map((replay) => replay.id)),
    evidenceIds: evidenceSummary.evidenceIds,
    passedTestEvidence: evidenceSummary.passed,
    failedTestEvidence: evidenceSummary.failed,
    conflictEvidence: evidenceSummary.conflict,
    staleEvidence: evidenceSummary.stale,
    semanticSidecarQuality: sidecarQuality,
    reasonCodes: uniqueStrings([
      ...scripts.flatMap((script) => strings(script.admission?.reasonCodes)),
      ...projections.flatMap((projection) => strings(projection.admission?.reasonCodes)),
      ...replays.flatMap((replay) => strings(replay.admission?.reasonCodes)),
      ...evidenceSummary.reasonCodes,
      ...sidecarQuality.warningCodes
    ])
  };
}

function semanticEditBundleStatus(summary) {
  const total = summary.scripts + summary.projections + summary.replays;
  if (summary.blocked || summary.projectionBlocked || summary.failedTestEvidence) return 'blocked';
  if (summary.conflicts || summary.conflictEvidence) return 'conflict';
  if (summary.stale || summary.staleEvidence) return 'stale';
  if (total === 0) return 'none';
  if (!summary.replays || summary.needsReview) return 'needs-review';
  if (summary.acceptedClean === 0 && summary.alreadyApplied === summary.replays) return 'already-applied';
  return hasPositiveAutoMergeProof(summary) ? 'ready' : 'needs-review';
}

function derivedReasonCodes(summary, status) {
  return [
    summary.scripts && !summary.projections ? 'semantic-edit-projection-missing' : undefined,
    (summary.scripts || summary.projections) && !summary.replays ? 'semantic-edit-replay-missing' : undefined,
    summary.scripts && summary.portableScripts !== summary.scripts ? 'semantic-edit-script-not-portable' : undefined,
    summary.projections && summary.portableProjections !== summary.projections ? 'semantic-edit-projection-not-portable' : undefined,
    summary.unboundAcceptedCleanReplays ? 'semantic-edit-replay-current-head-proof-missing' : undefined,
    summary.incompleteCurrentHeadProofReplays ? 'semantic-edit-replay-current-head-proof-metadata-missing' : undefined,
    summary.acceptedClean && !summary.passedTestEvidence ? 'semantic-edit-tests-passed-evidence-missing' : undefined,
    summary.failedTestEvidence ? 'semantic-edit-tests-failed' : undefined,
    summary.conflictEvidence ? 'semantic-edit-conflict-evidence' : undefined,
    summary.staleEvidence ? 'semantic-edit-stale-evidence' : undefined,
    status === 'ready' ? 'semantic-edit-replay-accepted-clean' : undefined,
    status === 'ready' ? 'semantic-edit-positive-auto-merge-proof' : undefined,
    status === 'already-applied' ? 'semantic-edit-replay-already-applied' : undefined,
    status === 'blocked' ? 'semantic-edit-blocked' : undefined,
    status === 'conflict' ? 'semantic-edit-conflict' : undefined,
    status === 'stale' ? 'semantic-edit-stale' : undefined
  ];
}

function hasPositiveAutoMergeProof(summary) {
  return summary.acceptedClean > 0 &&
    summary.acceptedClean + summary.alreadyApplied === summary.replays &&
    summary.boundedCurrentHeadReplays === summary.acceptedClean &&
    summary.scripts > 0 &&
    summary.projections > 0 &&
    summary.portableScripts === summary.scripts &&
    summary.portableProjections === summary.projections &&
    summary.passedTestEvidence > 0 &&
    summary.failedTestEvidence === 0 &&
    summary.conflictEvidence === 0 &&
    summary.staleEvidence === 0;
}

function isBoundedCurrentHeadReplay(replay) {
  if (replay?.status !== 'accepted-clean') return false;
  const route = replayProofRoute(replay);
  const appliedOperations = strings(replay.appliedOperations);
  return isCurrentHeadCommutationProofRoute(route) &&
    route?.status === 'passed' &&
    route?.action === 'apply' &&
    route?.routeNext === 'apply-source-bound-semantic-edit-replay' &&
    route?.autoMergeClaim === false &&
    route?.semanticEquivalenceClaim === false &&
    route?.sourcePath === replay.sourcePath &&
    route?.replayId === replay.id &&
    typeof replay.sourcePath === 'string' &&
    typeof replay.id === 'string' &&
    appliedOperations.length > 0 &&
    sameStringList(strings(route.appliedOperations), appliedOperations) &&
    route?.outputBindingStatus === 'bound' &&
    replay?.metadata?.currentSourceBindingStatus === 'bound' &&
    replay?.metadata?.outputBindingStatus === 'bound' &&
    typeof route.expectedCurrentHash === 'string' &&
    route.expectedCurrentHash === route.replayCurrentHash &&
    route.replayCurrentHash === replay.currentHash &&
    route.expectedCurrentHash === replay?.metadata?.expectedCurrentHash &&
    route.replayCurrentHash === replay?.metadata?.observedCurrentHash &&
    typeof route.expectedOutputHash === 'string' &&
    typeof route.projectionOutputHash === 'string' &&
    route.expectedOutputHash === route.projectionOutputHash &&
    route.expectedOutputHash === route.replayOutputHash &&
    route.replayOutputHash === replay.outputHash &&
    route.expectedOutputHash === replay?.metadata?.expectedOutputHash &&
    route.replayOutputHash === replay?.metadata?.replayedOutputHash;
}

function hasIncompleteCurrentHeadReplayProof(replay) {
  return replay?.status === 'accepted-clean' &&
    isCurrentHeadCommutationProofRoute(replayProofRoute(replay)) &&
    !isBoundedCurrentHeadReplay(replay);
}

function isCurrentHeadCommutationProofRoute(route) {
  return route?.routeId === 'admit-independent-semantic-edit-current-head-commutation' &&
    route?.proofKind === 'bounded-current-head-commutation';
}

function replayProofRoute(replay) {
  return replay?.admission?.proofRoute ?? replay?.metadata?.proofRoute;
}

function readinessForStatus(status) {
  if (['ready', 'already-applied'].includes(status)) return 'ready';
  if (['blocked', 'conflict'].includes(status)) return 'blocked';
  return 'needs-review';
}

function actionForStatus(status) {
  if (status === 'ready') return 'admit';
  if (status === 'already-applied') return 'skip';
  if (status === 'none') return 'none';
  if (status === 'stale') return 'rerun-semantic-import';
  if (status === 'blocked' || status === 'conflict') return 'block';
  return 'review';
}

function safeStatus(requested, computed, summary) {
  if (!requested) return computed;
  if (requested === 'ready' && !hasPositiveAutoMergeProof(summary)) return computed;
  if (requested === 'already-applied' && computed !== 'already-applied') return computed;
  if (['blocked', 'conflict', 'stale'].includes(requested)) return requested;
  return computed;
}

function safeAction(requested, status, positiveAutoApplyCandidate) {
  if (requested === 'admit' && !positiveAutoApplyCandidate) return actionForStatus(status);
  if (requested === 'skip' && status !== 'already-applied') return actionForStatus(status);
  return requested ?? actionForStatus(status);
}

function sourcePaths(scripts, projections, replays) {
  return uniqueStrings(strings([
    ...scripts.map((script) => script.sourcePath),
    ...projections.map((projection) => projection.sourcePath),
    ...projections.flatMap((projection) => array(projection.edits).flatMap((edit) => [edit.sourcePath, edit.targetSourcePath])),
    ...replays.map((replay) => replay.sourcePath),
    ...replays.flatMap((replay) => array(replay.edits).map((edit) => edit.sourcePath))
  ]));
}

function countStatuses(...args) {
  const statuses = args.slice(0, -1).flatMap((value) => strings(value));
  const needles = new Set(args.at(-1));
  return statuses.filter((status) => needles.has(status)).length;
}

function evidenceRecords(...sources) {
  return sources.flatMap((source) => [
    ...array(source?.evidence),
    ...array(source?.testEvidence),
    ...array(source?.testResults),
    ...array(source?.gateEvidence),
    ...array(source?.proofEvidence)
  ]).filter(Boolean);
}

function summarizeEvidence(evidence) {
  const testLike = evidence.filter(isAutoMergeTestEvidence);
  const conflict = evidence.filter((record) => evidenceStatus(record, ['conflict', 'conflicted']) || record?.metadata?.conflict === true || strings(record?.reasonCodes ?? record?.reasons).some((reason) => reason.toLowerCase().includes('conflict')));
  const stale = evidence.filter((record) => evidenceStatus(record, ['stale']) || record?.metadata?.stale === true || strings(record?.reasonCodes ?? record?.reasons).some((reason) => reason.toLowerCase().includes('stale')));
  const failed = testLike.filter((record) => evidenceStatus(record, ['failed', 'failure', 'error', 'blocked', 'rejected']));
  const passed = testLike.filter((record) => evidenceStatus(record, ['passed', 'ok', 'success', 'succeeded', 'accepted', 'verified']));
  return {
    evidenceIds: uniqueStrings(evidence.map((record) => record.id)),
    passed: passed.length,
    failed: failed.length,
    conflict: conflict.length,
    stale: stale.length,
    reasonCodes: uniqueStrings(evidence.flatMap((record) => strings(record.reasonCodes ?? record.reasons)))
  };
}

function isAutoMergeTestEvidence(record) {
  const kind = String(record?.kind ?? record?.type ?? '').toLowerCase();
  return ['test', 'tests', 'proof', 'gate', 'verification', 'check'].includes(kind);
}

function evidenceStatus(record, statuses) {
  const status = String(record?.status ?? record?.outcome ?? '').toLowerCase();
  return statuses.includes(status);
}

function array(value) { if (value === undefined || value === null) return []; return Array.isArray(value) ? value : [value]; }
function strings(value) { return array(value).map((entry) => String(entry ?? '')).filter(Boolean); }
function sameStringList(left, right) { return left.length === right.length && left.every((entry, index) => entry === right[index]); }
function compactRecord(value) { return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0))); }
