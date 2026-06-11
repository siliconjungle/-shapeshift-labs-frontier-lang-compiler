import { normalizeSemanticMergeReadiness, uniqueStrings } from '../../native-import-utils.js';

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
  const summary = summarizeSemanticEditBundle(scripts, projections, replays);
  const status = input.status ?? options.status ?? semanticEditBundleStatus(summary);
  const readiness = normalizeSemanticMergeReadiness(input.readiness ?? options.readiness ?? readinessForStatus(status))
    ?? input.readiness ?? options.readiness ?? readinessForStatus(status);
  return compactRecord({
    status,
    action: input.action ?? options.action ?? actionForStatus(status),
    readiness,
    reviewRequired: input.reviewRequired ?? !['ready', 'already-applied', 'none'].includes(status),
    autoApplyCandidate: input.autoApplyCandidate ?? status === 'ready',
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    reasonCodes: uniqueStrings([
      ...strings(input.reasonCodes),
      ...strings(options.reasonCodes),
      ...summary.reasonCodes,
      ...derivedReasonCodes(summary, status)
    ]),
    sourcePaths: summary.sourcePaths,
    scriptIds: summary.scriptIds,
    projectionIds: summary.projectionIds,
    replayIds: summary.replayIds,
    summary,
    metadata: input.metadata ?? options.metadata
  });
}

function summarizeSemanticEditBundle(scripts, projections, replays) {
  const scriptStatusEntries = scripts.map((script) => script.admission?.status);
  const projectionStatusEntries = projections.flatMap((projection) => [projection.status, projection.admission?.status]);
  const replayStatusEntries = replays.map((replay) => replay.status);
  const scriptStatuses = uniqueStrings(strings(scriptStatusEntries));
  const projectionStatuses = uniqueStrings(strings(projectionStatusEntries));
  const replayStatuses = uniqueStrings(strings(replayStatusEntries));
  const replayActions = uniqueStrings(strings(replays.map((replay) => replay.admission?.action)));
  return {
    scripts: scripts.length,
    projections: projections.length,
    replays: replays.length,
    files: sourcePaths(scripts, projections, replays).length,
    acceptedClean: replays.filter((replay) => replay.status === 'accepted-clean').length,
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
    sourcePaths: sourcePaths(scripts, projections, replays),
    scriptIds: uniqueStrings(scripts.map((script) => script.id)),
    projectionIds: uniqueStrings(projections.map((projection) => projection.id)),
    replayIds: uniqueStrings(replays.map((replay) => replay.id)),
    reasonCodes: uniqueStrings([
      ...scripts.flatMap((script) => strings(script.admission?.reasonCodes)),
      ...projections.flatMap((projection) => strings(projection.admission?.reasonCodes)),
      ...replays.flatMap((replay) => strings(replay.admission?.reasonCodes))
    ])
  };
}

function semanticEditBundleStatus(summary) {
  const total = summary.scripts + summary.projections + summary.replays;
  if (total === 0) return 'none';
  if (summary.blocked || summary.projectionBlocked) return 'blocked';
  if (summary.conflicts) return 'conflict';
  if (summary.stale) return 'stale';
  if (!summary.replays || summary.needsReview) return 'needs-review';
  if (summary.acceptedClean === 0 && summary.alreadyApplied === summary.replays) return 'already-applied';
  return summary.acceptedClean + summary.alreadyApplied === summary.replays ? 'ready' : 'needs-review';
}

function derivedReasonCodes(summary, status) {
  return [
    summary.scripts && !summary.projections ? 'semantic-edit-projection-missing' : undefined,
    (summary.scripts || summary.projections) && !summary.replays ? 'semantic-edit-replay-missing' : undefined,
    status === 'ready' ? 'semantic-edit-replay-accepted-clean' : undefined,
    status === 'already-applied' ? 'semantic-edit-replay-already-applied' : undefined,
    status === 'blocked' ? 'semantic-edit-blocked' : undefined,
    status === 'conflict' ? 'semantic-edit-conflict' : undefined,
    status === 'stale' ? 'semantic-edit-stale' : undefined
  ];
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

function array(value) { if (value === undefined || value === null) return []; return Array.isArray(value) ? value : [value]; }
function strings(value) { return array(value).map((entry) => String(entry ?? '')).filter(Boolean); }
function compactRecord(value) { return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0))); }
