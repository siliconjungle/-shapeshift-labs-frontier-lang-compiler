const exactAdmissionRouteSpecs = Object.freeze({
  'js-ts-project-symbol-rename-admission': routeSpec('apply-cross-file-symbol-rename', 'cross-file-symbol-rename', 'apply-project-symbol-rename'),
  'js-ts-project-symbol-move-admission': routeSpec('apply-symbol-move-between-files', 'symbol-move-between-files', 'apply-project-symbol-move'),
  'js-ts-project-split-merge-admission': routeSpec('apply-project-split-merge', 'split-merge-modules-classes', 'apply-project-split-merge')
});

const classificationRouteSpecs = Object.freeze({
  'cross-file-symbol-rename': routeSpec('review-cross-file-symbol-rename', 'cross-file-symbol-rename', 'supply-import-export-rewrite-diagnostics-and-declarations'),
  'exported-symbol-move': routeSpec('review-symbol-move-between-files', 'symbol-move-between-files', 'supply-symbol-lineage-rewrite-diagnostics-and-declarations'),
  'imported-symbol-move': routeSpec('review-symbol-move-between-files', 'symbol-move-between-files', 'supply-symbol-lineage-rewrite-diagnostics-and-declarations'),
  'file-move-rename': routeSpec('review-file-move-rename', 'file-move-rename', 'supply-path-lineage-rewrite-diagnostics-and-declarations'),
  'module-split': routeSpec('review-project-split-merge', 'split-merge-modules-classes', 'supply-structural-partition-diagnostics-and-declarations'),
  'module-merge': routeSpec('review-project-split-merge', 'split-merge-modules-classes', 'supply-structural-partition-diagnostics-and-declarations'),
  'class-split': routeSpec('review-project-split-merge', 'split-merge-modules-classes', 'supply-structural-partition-diagnostics-and-declarations'),
  'class-merge': routeSpec('review-project-split-merge', 'split-merge-modules-classes', 'supply-structural-partition-diagnostics-and-declarations')
});

function createProjectAdmissionRoutes(input = {}) {
  return uniqueProjectAdmissionRoutes([
    ...(input.fileResults ?? []).flatMap(fileAdmissionRoutes),
    ...(input.missingEvidence ?? []).map(projectAdmissionRouteFromMissingEvidence),
    ...(input.conflicts ?? []).map(projectAdmissionRouteFromConflict)
  ].filter(Boolean));
}

function projectAdmissionRouteSummary(routes = []) {
  return compactRecord({
    total: routes.length,
    byKind: countField(routes, 'routeKind'),
    byAction: countField(routes, 'action'),
    byLane: countField(routes, 'routeLane'),
    byStatus: countField(routes, 'status'),
    byRoute: countField(routes, 'routeId'),
    nextRoute: routes.find((route) => route.status !== 'passed') ?? routes[0]
  });
}

function projectAdmissionRouteFromExactAdmission(admission, options = {}) {
  const spec = exactAdmissionRouteSpecs[admission?.kind] ?? routeSpec(`apply-${safeToken(admission?.kind ?? 'project-admission')}`, 'project-admission', options.action ?? 'apply-project');
  return routeRecord({
    routeId: spec.routeId,
    routeKind: 'apply',
    routeLane: spec.routeLane,
    routeNext: spec.routeNext,
    action: 'apply',
    status: 'passed',
    source: 'file-admission',
    subjectKind: admission?.kind,
    branch: admission?.branch,
    sourcePath: admission?.sourcePath,
    sourcePaths: admission?.details?.sourcePaths,
    evidenceId: admission?.id,
    conflictKey: admission?.details?.conflictKey,
    reasonCodes: admission?.details?.reasonCode ? [admission.details.reasonCode] : [],
    requiredEvidence: admission?.details?.requiredEvidence,
    presentEvidence: admission?.details?.presentRequiredEvidence,
    details: admission?.details
  });
}

function projectAdmissionRouteFromClassification(classification, options = {}) {
  const details = classification?.details ?? {};
  const spec = classificationRouteSpecs[classification?.kind] ?? routeSpec(`review-${safeToken(classification?.kind ?? classification?.code ?? 'project-admission')}`, 'project-admission', 'review-structural-admission-evidence');
  const explicitRouteId = details.routeId ?? details.proofRouteId;
  const staleRouteId = details.structuralProofRouteId;
  const stale = details.staleStructuralEditProof === true || details.otherBranchChanged === true;
  return routeRecord({
    routeId: options.routeId ?? explicitRouteId ?? staleRouteId ?? spec.routeId,
    routeKind: stale ? 'rebase' : 'review',
    routeLane: stale ? 'split-merge-modules-classes' : details.routeLane ?? spec.routeLane,
    routeNext: stale ? 'prove-current-branch-output-before-admission' : details.routeNext ?? spec.routeNext,
    action: stale ? 'rebase' : 'review',
    status: options.status ?? 'blocked',
    source: options.source ?? 'classification',
    subjectKind: classification?.kind,
    branch: classification?.branch,
    sourcePath: options.sourcePath,
    sourcePaths: classification?.sourcePaths,
    conflictKey: details.conflictKey,
    reasonCodes: uniqueStrings([classification?.code, details.reasonCode, ...(details.missingRequiredEvidence ?? [])]),
    requiredEvidence: details.requiredEvidence,
    missingEvidence: details.missingRequiredEvidence,
    details
  });
}

function projectAdmissionRouteFromConflict(conflict) {
  const details = conflict?.details ?? {};
  const classification = {
    kind: classificationKindFromConflict(conflict, details),
    code: conflict?.code,
    branch: details.branch,
    sourcePaths: uniqueStrings([...(details.sourcePaths ?? []), details.fromSourcePath, details.toSourcePath, details.exportSourcePath, details.importSourcePath, conflict?.sourcePath]),
    details: { ...details, reasonCode: details.reasonCode ?? conflict?.code }
  };
  const route = projectAdmissionRouteFromClassification(classification, {
    source: 'conflict',
    sourcePath: conflict?.sourcePath,
    status: conflict?.severity === 'error' ? 'failed' : 'blocked'
  });
  return route?.subjectKind === 'project-admission' && !structuralConflictCode(conflict?.code) && !details.routeId ? undefined : route;
}

function projectAdmissionRouteFromMissingEvidence(item) {
  const route = item?.route ?? {};
  const routeId = item?.routeId ?? route.id;
  if (!routeId) return undefined;
  const action = normalizedRouteAction(item?.action);
  return routeRecord({
    routeId,
    routeKind: action,
    routeLane: item?.routeLane ?? route.lane,
    routeNext: item?.routeNext ?? route.next,
    action,
    status: item?.status ?? 'missing',
    source: 'missing-evidence',
    subjectKind: item?.kind,
    proofLevel: item?.proofLevel,
    evidenceId: item?.evidenceId,
    reasonCodes: uniqueStrings([item?.code, ...(item?.relatedSignals ?? [])]),
    details: item
  });
}

function fileAdmissionRoutes(file) {
  return [
    ...(file?.admission?.routes ?? []),
    ...fileAdmissionEvidence(file).map((record) => record.admissionRoute)
  ].filter(Boolean);
}

function fileAdmissionEvidence(file) {
  const records = [file?.summary, file?.metadata].filter(isPlainObject);
  return records.flatMap((record) => Object.entries(record)
    .filter(([key, value]) => /Admission(?:Evidence|s)$/.test(key) && Array.isArray(value))
    .flatMap(([, value]) => value));
}

function classificationKindFromConflict(conflict, details) {
  if (details.symbolRenameKind) return 'cross-file-symbol-rename';
  if (details.symbolMoveKind === 'exported') return 'exported-symbol-move';
  if (details.symbolMoveKind === 'imported') return 'imported-symbol-move';
  if (details.movementKind && String(conflict?.code).includes('file-move-rename')) return 'file-move-rename';
  for (const kind of ['module-split', 'module-merge', 'class-split', 'class-merge']) {
    if (String(conflict?.code).includes(kind)) return kind;
  }
  return structuralConflictCode(conflict?.code) ? 'project-admission' : undefined;
}

function structuralConflictCode(code) {
  return /^project-(worker|head)-/.test(String(code ?? ''))
    || ['project-typescript-refactor-evidence-missing', 'project-source-span-roundtrip-proof-failed'].includes(String(code ?? ''));
}

function routeRecord(input) {
  if (!input.routeId) return undefined;
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectMergeAdmissionRoute',
    version: 1,
    routeId: input.routeId,
    routeKind: input.routeKind,
    routeLane: input.routeLane,
    routeNext: input.routeNext,
    action: input.action,
    status: input.status,
    source: input.source,
    subjectKind: input.subjectKind,
    branch: input.branch,
    sourcePath: input.sourcePath,
    sourcePaths: input.sourcePaths?.length ? uniqueStrings(input.sourcePaths) : undefined,
    proofLevel: input.proofLevel,
    evidenceId: input.evidenceId,
    conflictKey: input.conflictKey,
    reasonCodes: input.reasonCodes?.length ? uniqueStrings(input.reasonCodes) : undefined,
    requiredEvidence: input.requiredEvidence,
    presentEvidence: input.presentEvidence,
    missingEvidence: input.missingEvidence,
    details: input.details,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  });
}

function uniqueProjectAdmissionRoutes(routes) {
  const seen = new Set();
  return routes.filter((route) => {
    const key = [route.routeId, route.source, route.sourcePath, route.conflictKey, route.evidenceId, route.status].filter(Boolean).join('#');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizedRouteAction(action) {
  if (action === 'rerun' || action === 'rerun-gate') return 'rerun';
  if (action === 'reject-proof' || action === 'reject') return 'reject';
  if (action === 'block') return 'block';
  if (action === 'apply') return 'apply';
  if (action === 'rebase') return 'rebase';
  return 'review';
}

function routeSpec(routeId, routeLane, routeNext) { return Object.freeze({ routeId, routeLane, routeNext }); }
function countField(values, field) { const result = {}; for (const value of values) if (value?.[field]) result[value[field]] = (result[value[field]] ?? 0) + 1; return result; }
function uniqueStrings(values) { return [...new Set((values ?? []).filter((value) => typeof value === 'string' && value.length > 0))]; }
function safeToken(value) { return String(value ?? 'project-admission').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project-admission'; }
function isPlainObject(value) { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0))); }

export {
  createProjectAdmissionRoutes,
  projectAdmissionRouteFromClassification,
  projectAdmissionRouteFromExactAdmission,
  projectAdmissionRouteFromMissingEvidence,
  projectAdmissionRouteSummary
};
