import { countBy, idFragment, normalizeNativeLanguageId, uniqueStrings } from './native-import-utils.js';
import { normalizeProjectionMatrixTargets } from './coverage-matrix-profiles.js';
import { createUniversalConversionPlan } from './universal-conversion-plan.js';

export const UniversalConversionWorkItemKinds = Object.freeze([
  'add-target-adapter',
  'collect-translation-proof',
  'prove-runtime-adapter',
  'collect-dialect-evidence',
  'collect-source-evidence',
  'review-route',
  'unblock-route'
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

function workItemsForRoutes(routes, options) {
  const items = new Map();
  for (const route of routes) {
    if (route.blockers?.length) addWorkItem(items, route, 'unblock-route', 'route-blocker', 'blocker');
    for (const key of route.missingEvidence ?? []) addMissingEvidenceItem(items, route, key);
    for (const key of route.translationAdmission?.missingEvidence ?? []) addMissingEvidenceItem(items, route, key);
    if (route.runtimeAdapterRequirements?.length) addWorkItem(items, route, 'prove-runtime-adapter', 'runtime-adapter-proof', 'high');
    if (route.dialect?.missingEvidence?.length) addWorkItem(items, route, 'collect-dialect-evidence', route.dialect.missingEvidence[0], 'high');
    if (options.includeReviewItems !== false && route.review?.length) addWorkItem(items, route, 'review-route', 'route-review', route.priority === 'blocker' ? 'blocker' : 'normal');
  }
  return items;
}

function addMissingEvidenceItem(items, route, key) {
  if (/target-adapter|executable-target-semantics/.test(key) || route.mode === 'semantic-index-only') return addWorkItem(items, route, 'add-target-adapter', key, 'high');
  if (/proof|replay/.test(key)) return addWorkItem(items, route, 'collect-translation-proof', key, 'high');
  if (/runtime-capability|runtime-adapter/.test(key)) return addWorkItem(items, route, 'prove-runtime-adapter', key, route.readiness === 'blocked' ? 'blocker' : 'high');
  if (/dialect/.test(key)) return addWorkItem(items, route, 'collect-dialect-evidence', key, 'high');
  return addWorkItem(items, route, 'collect-source-evidence', key, route.readiness === 'blocked' ? 'blocker' : 'normal');
}

function addWorkItem(items, route, kind, evidenceKey, priority) {
  const id = workItemId(kind, route, evidenceKey);
  const existing = items.get(id);
  const next = workItemForRoute(id, kind, route, evidenceKey, priority);
  items.set(id, existing ? mergeWorkItems(existing, next) : next);
}

function workItemForRoute(id, kind, route, evidenceKey, priority) {
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
    missingEvidence: uniqueStrings([...(route.missingEvidence ?? []), ...(route.translationAdmission?.missingEvidence ?? [])]),
    blockers: route.blockers ?? [],
    review: route.review ?? [],
    tasks: workItemTasks(kind, route, evidenceKey),
    runtimeAdapterRequirementIds: (route.runtimeAdapterRequirements ?? []).map((entry) => entry.id ?? entry.capability).filter(Boolean),
    dialectRecordIds: route.dialect?.recordIds ?? [],
    targetAdapterIds: uniqueStrings([route.adapter, route.translationAdmission?.targetAdapterId]),
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
    dialectRecordIds: uniqueStrings([...left.dialectRecordIds, ...right.dialectRecordIds]),
    targetAdapterIds: uniqueStrings([...left.targetAdapterIds, ...right.targetAdapterIds])
  };
}

function workItemId(kind, route, evidenceKey) {
  return `conversion_work_${idFragment(kind)}_${idFragment(route.sourceLanguage)}_to_${idFragment(route.target)}_${idFragment(evidenceKey)}`;
}

function workItemAction(kind) {
  if (kind === 'add-target-adapter') return 'add-target-adapter';
  if (kind === 'collect-translation-proof') return 'collect-translation-evidence';
  if (kind === 'prove-runtime-adapter') return 'collect-runtime-adapter-proof';
  if (kind === 'collect-dialect-evidence') return 'collect-dialect-projection-evidence';
  if (kind === 'review-route') return 'review-conversion-route';
  if (kind === 'unblock-route') return 'resolve-blocker';
  return 'collect-source-evidence';
}

function workItemTasks(kind, route, evidenceKey) {
  return uniqueStrings([
    `${workItemAction(kind)} for ${route.sourceLanguage} to ${route.target}`,
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
    blockers: items.reduce((total, item) => total + item.blockers.length, 0),
    reviewReasons: items.reduce((total, item) => total + item.review.length, 0),
    targetAdapterGaps: items.filter((item) => item.kind === 'add-target-adapter').length,
    proofEvidenceGaps: items.filter((item) => item.kind === 'collect-translation-proof').length,
    runtimeAdapterGaps: items.filter((item) => item.kind === 'prove-runtime-adapter').length,
    dialectEvidenceGaps: items.filter((item) => item.kind === 'collect-dialect-evidence').length,
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
