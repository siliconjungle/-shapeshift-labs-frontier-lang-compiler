import { countBy, idFragment, normalizeNativeLanguageId, uniqueStrings } from './native-import-utils.js';
import { normalizeProjectionMatrixTargets } from './coverage-matrix-profiles.js';
import { createUniversalConversionPlan } from './universal-conversion-plan.js';

export const UniversalConversionWorkItemKinds = Object.freeze([
  'add-target-adapter', 'collect-translation-proof', 'prove-runtime-adapter', 'collect-runtime-proof-signal', 'collect-dialect-evidence',
  'collect-interlingua-obligation-proof', 'collect-source-evidence', 'review-route', 'unblock-route'
]);

export function createUniversalConversionWorklist(planOrInput = {}, options = {}, context = {}) {
  const plan = planOrInput?.kind === 'frontier.lang.universalConversionPlan'
    ? planOrInput
    : createUniversalConversionPlan(planOrInput, context);
  const routes = (plan.routes ?? []).filter((route) => routeMatchesWorklistOptions(route, options));
  const items = sortWorkItems([...workItemsForRoutes(routes, options).values()])
    .filter((item) => match(options.kind, [item.kind]));
  return {
    kind: 'frontier.lang.universalConversionWorklist',
    version: 1,
    generatedAt: options.generatedAt ?? plan.generatedAt,
    planId: plan.id,
    items,
    summary: worklistSummary(items),
    metadata: {
      routes: routes.length,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      note: 'Worklist items are coordinator tasks derived from conversion route evidence. They do not prove semantic equivalence or grant auto-merge.'
    }
  };
}

export function queryUniversalConversionWorklist(worklistOrInput = {}, query = {}, context = {}) {
  const worklist = worklistOrInput?.kind === 'frontier.lang.universalConversionWorklist'
    ? worklistOrInput
    : createUniversalConversionWorklist(worklistOrInput, query, context);
  const items = sortWorkItems((worklist.items ?? []).filter((item) => workItemMatchesQuery(item, query)));
  return {
    kind: 'frontier.lang.universalConversionWorklistQuery',
    version: 1,
    found: items.length > 0,
    items,
    bestItem: items[0],
    summary: worklistSummary(items),
    reasons: items.length ? [] : [`No conversion work item matched kind=${query.kind ?? '*'} target=${query.target ?? '*'} evidence=${query.evidenceKey ?? '*'}.`]
  };
}

function workItemsForRoutes(routes, options) {
  const items = new Map();
  for (const route of routes) {
    if (route.blockers?.length) addWorkItem(items, route, 'unblock-route', 'route-blocker', 'blocker');
    for (const key of route.missingEvidence ?? []) addMissingEvidenceItem(items, route, key);
    for (const key of route.translationAdmission?.missingEvidence ?? []) addMissingEvidenceItem(items, route, key);
    addInterlinguaObligationItems(items, route);
    if (route.runtimeAdapterRequirements?.length) addWorkItem(items, route, 'prove-runtime-adapter', 'runtime-adapter-proof', 'high');
    if (route.dialect?.missingEvidence?.length) addWorkItem(items, route, 'collect-dialect-evidence', route.dialect.missingEvidence[0], 'high');
    if (options.includeReviewItems !== false && route.review?.length) addWorkItem(items, route, 'review-route', 'route-review', route.priority === 'blocker' ? 'blocker' : 'normal');
  }
  return items;
}

function addInterlinguaObligationItems(items, route) {
  const edges = route.interlingua?.constraints?.edges ?? [];
  for (const obligation of route.interlingua?.constraints?.obligations ?? []) {
    if (obligation.status !== 'missing' && !(obligation.missingEvidence ?? []).length) continue;
    const key = (obligation.missingEvidence ?? [])[0] ?? `interlingua-obligation:${obligation.family}:${obligation.kind}`;
    const obligationEdges = edges.filter((edge) => edge.id === obligation.edgeId
      || (edge.family === obligation.family && edge.sourceId === obligation.sourceId));
    addWorkItem(items, route, 'collect-interlingua-obligation-proof', key, obligation.severity === 'error' ? 'high' : 'normal', {
      constraintFamilies: [obligation.family],
      constraintStatuses: obligationEdges.map((edge) => edge.status), constraintActions: obligationEdges.map((edge) => edge.action),
      constraintEvidenceIds: obligationEdges.flatMap((edge) => edge.evidenceIds ?? []),
      constraintRequiredKinds: obligationEdges.flatMap((edge) => edge.requiredKinds ?? []), constraintRepresentedKinds: obligationEdges.flatMap((edge) => edge.representedKinds ?? []),
      constraintMissingKinds: obligationEdges.flatMap((edge) => edge.missingKinds ?? []), constraintMissingEvidence: obligationEdges.flatMap((edge) => edge.missingEvidence ?? []),
      constraintObligationKinds: [obligation.kind], constraintObligationStatuses: [obligation.status],
      constraintObligationEvidenceIds: obligation.evidenceIds ?? [], constraintObligationMissingEvidence: obligation.missingEvidence ?? [],
      constraintSourceIds: [obligation.sourceId], missingEvidence: obligation.missingEvidence ?? []
    });
  }
}

function addMissingEvidenceItem(items, route, key) {
  if (/target-adapter|executable-target-semantics/.test(key) || route.mode === 'semantic-index-only') return addWorkItem(items, route, 'add-target-adapter', key, 'high');
  if (/runtime-proof-signal/.test(key)) return addWorkItem(items, route, 'collect-runtime-proof-signal', key, 'high');
  if (/proof|replay/.test(key)) return addWorkItem(items, route, 'collect-translation-proof', key, 'high');
  if (/runtime-capability|runtime-adapter/.test(key)) return addWorkItem(items, route, 'prove-runtime-adapter', key, route.readiness === 'blocked' ? 'blocker' : 'high');
  if (/dialect/.test(key)) return addWorkItem(items, route, 'collect-dialect-evidence', key, 'high');
  return addWorkItem(items, route, 'collect-source-evidence', key, route.readiness === 'blocked' ? 'blocker' : 'normal');
}

function addWorkItem(items, route, kind, evidenceKey, priority, details = {}) {
  const id = workItemId(kind, route, evidenceKey);
  const existing = items.get(id);
  const next = workItemForRoute(id, kind, route, evidenceKey, priority, details);
  items.set(id, existing ? mergeWorkItems(existing, next) : next);
}

function workItemForRoute(id, kind, route, evidenceKey, priority, details = {}) {
  return {
    id,
    kind,
    action: workItemAction(kind),
    priority,
    routeIds: [route.id],
    sourceLanguages: [route.sourceLanguage],
    languageIds: route.languageIds ?? [],
    targets: [route.target],
    modes: [route.mode],
    readinesses: [route.readiness],
    admissionActions: [route.admissionAction],
    routeActions: [route.routeAction],
    evidenceKeys: [evidenceKey],
    missingEvidence: uniqueStrings([...(route.missingEvidence ?? []), ...(route.translationAdmission?.missingEvidence ?? []), ...(details.missingEvidence ?? [])]),
    blockers: route.blockers ?? [],
    review: route.review ?? [],
    tasks: workItemTasks(kind, route, evidenceKey, details),
    runtimeAdapterRequirementIds: (route.runtimeAdapterRequirements ?? []).map((entry) => entry.id ?? entry.capability).filter(Boolean),
    runtimeProofObligationIds: (route.runtime?.proofObligations ?? []).map((entry) => entry.id).filter(Boolean),
    runtimeProofCapabilities: uniqueStrings((route.runtime?.proofObligations ?? []).map((entry) => entry.capability)),
    runtimeProofStatuses: uniqueStrings((route.runtime?.proofObligations ?? []).map((entry) => entry.status)),
    runtimeProofRequiredSignals: uniqueStrings((route.runtime?.proofObligations ?? []).flatMap((entry) => entry.requiredSignals ?? [])),
    runtimeProofProvidedSignals: uniqueStrings((route.runtime?.proofObligations ?? []).flatMap((entry) => entry.providedSignals ?? [])),
    runtimeProofMissingSignals: uniqueStrings((route.runtime?.proofObligations ?? []).flatMap((entry) => entry.missingSignals ?? [])),
    dialectRecordIds: route.dialect?.recordIds ?? [],
    targetAdapterIds: uniqueStrings([route.adapter, route.translationAdmission?.targetAdapterId]),
    interlinguaConstraintFamilies: uniqueStrings(details.constraintFamilies ?? []),
    interlinguaConstraintStatuses: uniqueStrings(details.constraintStatuses ?? []),
    interlinguaConstraintActions: uniqueStrings(details.constraintActions ?? []),
    interlinguaConstraintSourceIds: uniqueStrings(details.constraintSourceIds ?? []), interlinguaConstraintEvidenceIds: uniqueStrings(details.constraintEvidenceIds ?? []),
    interlinguaConstraintRequiredKinds: uniqueStrings(details.constraintRequiredKinds ?? []),
    interlinguaConstraintRepresentedKinds: uniqueStrings(details.constraintRepresentedKinds ?? []),
    interlinguaConstraintMissingKinds: uniqueStrings(details.constraintMissingKinds ?? []),
    interlinguaConstraintMissingEvidence: uniqueStrings(details.constraintMissingEvidence ?? []),
    interlinguaConstraintObligationKinds: uniqueStrings(details.constraintObligationKinds ?? []),
    interlinguaConstraintObligationStatuses: uniqueStrings(details.constraintObligationStatuses ?? []),
    interlinguaConstraintObligationEvidenceIds: uniqueStrings(details.constraintObligationEvidenceIds ?? []),
    interlinguaConstraintObligationMissingEvidence: uniqueStrings(details.constraintObligationMissingEvidence ?? []),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

function mergeWorkItems(left, right) {
  return {
    ...left,
    priority: higherPriority(left.priority, right.priority),
    routeIds: uniqueStrings([...left.routeIds, ...right.routeIds]),
    sourceLanguages: uniqueStrings([...left.sourceLanguages, ...right.sourceLanguages]),
    languageIds: uniqueStrings([...left.languageIds, ...right.languageIds]),
    targets: uniqueStrings([...left.targets, ...right.targets]),
    modes: uniqueStrings([...left.modes, ...right.modes]),
    readinesses: uniqueStrings([...left.readinesses, ...right.readinesses]),
    admissionActions: uniqueStrings([...left.admissionActions, ...right.admissionActions]),
    routeActions: uniqueStrings([...left.routeActions, ...right.routeActions]),
    evidenceKeys: uniqueStrings([...left.evidenceKeys, ...right.evidenceKeys]),
    missingEvidence: uniqueStrings([...left.missingEvidence, ...right.missingEvidence]),
    blockers: uniqueStrings([...left.blockers, ...right.blockers]),
    review: uniqueStrings([...left.review, ...right.review]),
    tasks: uniqueStrings([...left.tasks, ...right.tasks]),
    runtimeAdapterRequirementIds: uniqueStrings([...left.runtimeAdapterRequirementIds, ...right.runtimeAdapterRequirementIds]),
    runtimeProofObligationIds: uniqueStrings([...left.runtimeProofObligationIds, ...right.runtimeProofObligationIds]),
    runtimeProofCapabilities: uniqueStrings([...left.runtimeProofCapabilities, ...right.runtimeProofCapabilities]),
    runtimeProofStatuses: uniqueStrings([...left.runtimeProofStatuses, ...right.runtimeProofStatuses]),
    runtimeProofRequiredSignals: uniqueStrings([...left.runtimeProofRequiredSignals, ...right.runtimeProofRequiredSignals]),
    runtimeProofProvidedSignals: uniqueStrings([...left.runtimeProofProvidedSignals, ...right.runtimeProofProvidedSignals]),
    runtimeProofMissingSignals: uniqueStrings([...left.runtimeProofMissingSignals, ...right.runtimeProofMissingSignals]),
    dialectRecordIds: uniqueStrings([...left.dialectRecordIds, ...right.dialectRecordIds]),
    targetAdapterIds: uniqueStrings([...left.targetAdapterIds, ...right.targetAdapterIds]),
    interlinguaConstraintFamilies: uniqueStrings([...left.interlinguaConstraintFamilies, ...right.interlinguaConstraintFamilies]),
    interlinguaConstraintStatuses: uniqueStrings([...left.interlinguaConstraintStatuses, ...right.interlinguaConstraintStatuses]),
    interlinguaConstraintActions: uniqueStrings([...left.interlinguaConstraintActions, ...right.interlinguaConstraintActions]),
    interlinguaConstraintSourceIds: uniqueStrings([...left.interlinguaConstraintSourceIds, ...right.interlinguaConstraintSourceIds]), interlinguaConstraintEvidenceIds: uniqueStrings([...left.interlinguaConstraintEvidenceIds, ...right.interlinguaConstraintEvidenceIds]),
    interlinguaConstraintRequiredKinds: uniqueStrings([...left.interlinguaConstraintRequiredKinds, ...right.interlinguaConstraintRequiredKinds]),
    interlinguaConstraintRepresentedKinds: uniqueStrings([...left.interlinguaConstraintRepresentedKinds, ...right.interlinguaConstraintRepresentedKinds]),
    interlinguaConstraintMissingKinds: uniqueStrings([...left.interlinguaConstraintMissingKinds, ...right.interlinguaConstraintMissingKinds]),
    interlinguaConstraintMissingEvidence: uniqueStrings([...left.interlinguaConstraintMissingEvidence, ...right.interlinguaConstraintMissingEvidence]),
    interlinguaConstraintObligationKinds: uniqueStrings([...left.interlinguaConstraintObligationKinds, ...right.interlinguaConstraintObligationKinds]),
    interlinguaConstraintObligationStatuses: uniqueStrings([...left.interlinguaConstraintObligationStatuses, ...right.interlinguaConstraintObligationStatuses]),
    interlinguaConstraintObligationEvidenceIds: uniqueStrings([...left.interlinguaConstraintObligationEvidenceIds, ...right.interlinguaConstraintObligationEvidenceIds]),
    interlinguaConstraintObligationMissingEvidence: uniqueStrings([...left.interlinguaConstraintObligationMissingEvidence, ...right.interlinguaConstraintObligationMissingEvidence])
  };
}

function workItemId(kind, route, evidenceKey) {
  return `conversion_work_${idFragment(kind)}_${idFragment(route.sourceLanguage)}_to_${idFragment(route.target)}_${idFragment(evidenceKey)}`;
}

function workItemAction(kind) {
  if (kind === 'add-target-adapter') return 'add-target-adapter';
  if (kind === 'collect-translation-proof') return 'collect-translation-evidence';
  if (kind === 'prove-runtime-adapter') return 'collect-runtime-adapter-proof';
  if (kind === 'collect-runtime-proof-signal') return 'collect-runtime-proof-signals';
  if (kind === 'collect-dialect-evidence') return 'collect-dialect-projection-evidence';
  if (kind === 'collect-interlingua-obligation-proof') return 'collect-interlingua-obligation-evidence';
  if (kind === 'review-route') return 'review-conversion-route';
  if (kind === 'unblock-route') return 'resolve-blocker';
  return 'collect-source-evidence';
}

function workItemTasks(kind, route, evidenceKey, details = {}) {
  return uniqueStrings([
    `${workItemAction(kind)} for ${route.sourceLanguage} to ${route.target}`,
    ...(details.constraintObligationKinds ?? []).map((kind) => `satisfy interlingua obligation ${kind}`),
    evidenceKey ? `satisfy evidence key ${evidenceKey}` : undefined,
    ...(route.tasks ?? [])
  ]);
}

function worklistSummary(items) {
  return {
    items: items.length,
    byKind: countBy(items.map((item) => item.kind)),
    byPriority: countBy(items.map((item) => item.priority)),
    routeIds: uniqueStrings(items.flatMap((item) => item.routeIds)),
    sourceLanguages: uniqueStrings(items.flatMap((item) => item.sourceLanguages)),
    targets: uniqueStrings(items.flatMap((item) => item.targets)),
    evidenceKeys: uniqueStrings(items.flatMap((item) => item.evidenceKeys)),
    missingEvidence: uniqueStrings(items.flatMap((item) => item.missingEvidence)),
    runtimeProofCapabilities: uniqueStrings(items.flatMap((item) => item.runtimeProofCapabilities ?? [])),
    runtimeProofStatuses: uniqueStrings(items.flatMap((item) => item.runtimeProofStatuses ?? [])),
    runtimeProofRequiredSignals: uniqueStrings(items.flatMap((item) => item.runtimeProofRequiredSignals ?? [])),
    runtimeProofProvidedSignals: uniqueStrings(items.flatMap((item) => item.runtimeProofProvidedSignals ?? [])),
    runtimeProofMissingSignals: uniqueStrings(items.flatMap((item) => item.runtimeProofMissingSignals ?? [])),
    interlinguaConstraintFamilies: uniqueStrings(items.flatMap((item) => item.interlinguaConstraintFamilies ?? [])),
    interlinguaConstraintStatuses: uniqueStrings(items.flatMap((item) => item.interlinguaConstraintStatuses ?? [])),
    interlinguaConstraintActions: uniqueStrings(items.flatMap((item) => item.interlinguaConstraintActions ?? [])),
    interlinguaConstraintSourceIds: uniqueStrings(items.flatMap((item) => item.interlinguaConstraintSourceIds ?? [])), interlinguaConstraintEvidenceIds: uniqueStrings(items.flatMap((item) => item.interlinguaConstraintEvidenceIds ?? [])),
    interlinguaConstraintRequiredKinds: uniqueStrings(items.flatMap((item) => item.interlinguaConstraintRequiredKinds ?? [])),
    interlinguaConstraintRepresentedKinds: uniqueStrings(items.flatMap((item) => item.interlinguaConstraintRepresentedKinds ?? [])),
    interlinguaConstraintMissingKinds: uniqueStrings(items.flatMap((item) => item.interlinguaConstraintMissingKinds ?? [])),
    interlinguaConstraintMissingEvidence: uniqueStrings(items.flatMap((item) => item.interlinguaConstraintMissingEvidence ?? [])),
    interlinguaConstraintObligationKinds: uniqueStrings(items.flatMap((item) => item.interlinguaConstraintObligationKinds ?? [])),
    interlinguaConstraintObligationStatuses: uniqueStrings(items.flatMap((item) => item.interlinguaConstraintObligationStatuses ?? [])),
    interlinguaConstraintObligationEvidenceIds: uniqueStrings(items.flatMap((item) => item.interlinguaConstraintObligationEvidenceIds ?? [])),
    interlinguaConstraintObligationMissingEvidence: uniqueStrings(items.flatMap((item) => item.interlinguaConstraintObligationMissingEvidence ?? [])),
    blockers: items.reduce((total, item) => total + item.blockers.length, 0),
    reviewReasons: items.reduce((total, item) => total + item.review.length, 0),
    targetAdapterGaps: items.filter((item) => item.kind === 'add-target-adapter').length,
    proofEvidenceGaps: items.filter((item) => item.kind === 'collect-translation-proof').length,
    runtimeAdapterGaps: items.filter((item) => item.kind === 'prove-runtime-adapter').length,
    runtimeProofSignalGaps: items.filter((item) => item.kind === 'collect-runtime-proof-signal').length,
    dialectEvidenceGaps: items.filter((item) => item.kind === 'collect-dialect-evidence').length,
    interlinguaObligationGaps: items.filter((item) => item.kind === 'collect-interlingua-obligation-proof').length,
    autoMergeClaims: 0,
    semanticEquivalenceClaims: 0
  };
}

function routeMatchesWorklistOptions(route, options) {
  const source = normalizeNativeLanguageId(options.sourceLanguage ?? options.language);
  const target = normalizeProjectionMatrixTargets(options.target ? [options.target] : [])[0];
  return (!source || route.languageIds.includes(source))
    && (!target || route.target === target)
    && match(options.routeId, [route.id]);
}

function workItemMatchesQuery(item, query) {
  const source = normalizeNativeLanguageId(query.sourceLanguage ?? query.language);
  const target = normalizeProjectionMatrixTargets(query.target ? [query.target] : [])[0];
  return match(query.itemId ?? query.id, [item.id])
    && match(query.kind, [item.kind])
    && match(query.action, [item.action])
    && match(query.priority, [item.priority])
    && match(query.routeId, item.routeIds)
    && (!source || item.languageIds.includes(source) || item.sourceLanguages.map(normalizeNativeLanguageId).includes(source))
    && match(query.languageId, item.languageIds)
    && (!target || item.targets.includes(target))
    && match(query.mode, item.modes)
    && match(query.readiness, item.readinesses)
    && match(query.admissionAction, item.admissionActions)
    && match(query.routeAction, item.routeActions)
    && match(query.evidenceKey, item.evidenceKeys)
    && match(query.missingEvidence, item.missingEvidence)
    && match(query.runtimeProofObligationId, item.runtimeProofObligationIds)
    && match(query.runtimeProofCapability, item.runtimeProofCapabilities)
    && match(query.runtimeProofStatus, item.runtimeProofStatuses)
    && match(query.runtimeProofRequiredSignal, item.runtimeProofRequiredSignals)
    && match(query.runtimeProofProvidedSignal, item.runtimeProofProvidedSignals)
    && match(query.runtimeProofMissingSignal, item.runtimeProofMissingSignals)
    && match(query.blocker, item.blockers)
    && match(query.reviewReason, item.review)
    && match(query.task, item.tasks)
    && match(query.runtimeAdapterRequirementId, item.runtimeAdapterRequirementIds)
    && match(query.dialectRecordId, item.dialectRecordIds)
    && match(query.targetAdapterId, item.targetAdapterIds)
    && match(query.interlinguaConstraintFamily, item.interlinguaConstraintFamilies)
    && match(query.interlinguaConstraintStatus, item.interlinguaConstraintStatuses)
    && match(query.interlinguaConstraintAction, item.interlinguaConstraintActions)
    && match(query.interlinguaConstraintSourceId, item.interlinguaConstraintSourceIds) && match(query.interlinguaConstraintEvidenceId, item.interlinguaConstraintEvidenceIds)
    && match(query.interlinguaConstraintRequiredKind, item.interlinguaConstraintRequiredKinds)
    && match(query.interlinguaConstraintRepresentedKind, item.interlinguaConstraintRepresentedKinds)
    && match(query.interlinguaConstraintMissingKind, item.interlinguaConstraintMissingKinds)
    && match(query.interlinguaConstraintMissingEvidence, item.interlinguaConstraintMissingEvidence)
    && match(query.interlinguaConstraintObligationKind, item.interlinguaConstraintObligationKinds)
    && match(query.interlinguaConstraintObligationStatus, item.interlinguaConstraintObligationStatuses)
    && match(query.interlinguaConstraintObligationEvidenceId, item.interlinguaConstraintObligationEvidenceIds)
    && match(query.interlinguaConstraintObligationMissingEvidence, item.interlinguaConstraintObligationMissingEvidence);
}

function sortWorkItems(items) {
  return items.sort((left, right) => priorityRank(right.priority) - priorityRank(left.priority)
    || String(left.kind).localeCompare(String(right.kind))
    || String(left.id).localeCompare(String(right.id)));
}

function higherPriority(left, right) {
  return priorityRank(right) > priorityRank(left) ? right : left;
}

function priorityRank(priority) {
  return { low: 0, normal: 1, high: 2, blocker: 3 }[priority] ?? 1;
}

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
