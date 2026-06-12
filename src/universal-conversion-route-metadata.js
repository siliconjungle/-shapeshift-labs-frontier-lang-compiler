import { uniqueStrings } from './native-import-utils.js';

export function routeAdmissionStatus(route) {
  if (route.readiness === 'blocked' || route.admissionAction === 'reject') return 'blocked';
  if (route.readiness === 'ready' && route.missingEvidence?.length === 0) return 'queued';
  return 'needs-review';
}

export function routeReasonCodes(route) {
  return uniqueStrings([
    `mode:${route.mode}`,
    `action:${route.routeAction}`,
    ...(route.missingEvidence ?? []).map((item) => `missing:${item}`),
    ...(route.blockers ?? []).map((item) => `blocker:${item}`),
    ...(route.review ?? []).map((item) => `review:${item}`)
  ]);
}

export function routeAdmissionMetadata(route, planId) {
  return {
    planId,
    routeId: route.id,
    routeAction: route.routeAction,
    admissionAction: route.admissionAction,
    priority: route.priority,
    mergeScore: route.mergeScore,
    representation: routeRepresentationMetadata(route),
    ...routeSemanticEditRecordMetadata(route),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

export function routeRecordMetadata(route, planId, metadata) {
  return {
    planId,
    routeId: route.id,
    target: route.target,
    mode: route.mode,
    routeAction: route.routeAction,
    representation: routeRepresentationMetadata(route),
    ...routeSemanticEditRecordMetadata(route),
    missingEvidence: route.missingEvidence ?? [],
    blockers: route.blockers ?? [],
    review: route.review ?? [],
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    ...metadata
  };
}

export function routeSemanticEditBundle(route) {
  const metadata = route.metadata ?? {};
  const semanticEdit = metadata.semanticEdit ?? {};
  return compactRecord({
    semanticEditScript: firstDefined(route.semanticEditScript, metadata.semanticEditScript, semanticEdit.script),
    semanticEditScripts: firstDefined(route.semanticEditScripts, metadata.semanticEditScripts, semanticEdit.scripts),
    semanticEditProjection: firstDefined(route.semanticEditProjection, metadata.semanticEditProjection, semanticEdit.projection),
    semanticEditProjections: firstDefined(route.semanticEditProjections, metadata.semanticEditProjections, semanticEdit.projections),
    semanticEditReplay: firstDefined(route.semanticEditReplay, metadata.semanticEditReplay, semanticEdit.replay),
    semanticEditReplays: firstDefined(route.semanticEditReplays, metadata.semanticEditReplays, semanticEdit.replays),
    semanticEditAdmission: firstDefined(route.semanticEditAdmission, metadata.semanticEditAdmission, semanticEdit.admission),
    evidence: firstDefined(route.semanticEditEvidence, metadata.semanticEditEvidence, semanticEdit.evidence),
    testEvidence: firstDefined(route.semanticEditTestEvidence, metadata.semanticEditTestEvidence, semanticEdit.testEvidence),
    gateEvidence: firstDefined(route.semanticEditGateEvidence, metadata.semanticEditGateEvidence, semanticEdit.gateEvidence),
    proofEvidence: firstDefined(route.semanticEditProofEvidence, metadata.semanticEditProofEvidence, semanticEdit.proofEvidence)
  });
}

function routeRepresentationMetadata(route) {
  return {
    constructKinds: route.representation?.constructKinds ?? [],
    runtimeCapabilities: route.representation?.surfaces?.runtime?.requiredCapabilities ?? [],
    sourceMapPrecisions: route.representation?.surfaces?.sourceMaps?.precisions ?? [],
    transformIdentityHashes: route.representation?.surfaces?.mergeRefs?.transformIdentityHashes ?? [],
    missing: route.representation?.missing ?? [],
    blockers: route.representation?.blockers ?? []
  };
}

function routeSemanticEditRecordMetadata(route) {
  const metadata = route.metadata ?? {};
  const semanticEdit = metadata.semanticEdit ?? {};
  return compactRecord({
    semanticEditSummary: firstDefined(metadata.semanticEditSummary, semanticEdit.summary),
    semanticEditAdmission: firstDefined(route.semanticEditAdmission, metadata.semanticEditAdmission, semanticEdit.admission)
  });
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined);
}

function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}
