import{countBy,idFragment,normalizeNativeLanguageId,uniqueStrings as u}from './native-import-utils.js';
import{normalizeProjectionMatrixTargets}from './coverage-matrix-profiles.js';
import{createUniversalConversionPlan}from './universal-conversion-plan.js';
import{mergeWorkItemRuntimeRouteDenominators,workItemRuntimeRouteDenominators,workItemRuntimeRouteMatches,worklistRuntimeRouteSummary}from './universal-conversion-artifact-runtime-routes.js';
import{mergeWorkItemSourceMapDenominators,workItemSourceMapDenominators,workItemSourceMapMatches,worklistSourceMapSummary}from './universal-conversion-artifact-source-maps.js';
import{mergeWorkItemSemanticEditDenominators,workItemSemanticEditDenominators,workItemSemanticEditMatches,worklistSemanticEditSummary}from './universal-conversion-artifact-semantic-edit.js';
import{mergeTranslationAdmissionDenominators as mtad,translationAdmissionDenominatorMatches as tadm,translationAdmissionDenominatorSummary as tads,translationAdmissionDenominatorsForRoute as tadfr}from './universal-conversion-translation-admission-denominators.js'; import{conversionRouteMatchesDialectQuery as cdq,dialectDenominatorIndex as ddi,dialectDenominatorMatches as ddm}from './universal-conversion-dialect-routing.js';

export const UniversalConversionWorkItemKinds = Object.freeze(['add-target-adapter', 'collect-translation-proof', 'prove-runtime-adapter', 'collect-runtime-proof-signal', 'collect-dialect-evidence', 'collect-interlingua-obligation-proof', 'collect-source-evidence', 'review-route', 'unblock-route']);

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
    missingEvidence: u([...(route.missingEvidence ?? []), ...(route.translationAdmission?.missingEvidence ?? []), ...(details.missingEvidence ?? [])]),
    blockers: route.blockers ?? [],
    review: route.review ?? [],
    tasks: workItemTasks(kind, route, evidenceKey, details),
    ...workItemRuntimeRouteDenominators(route), ...workItemSourceMapDenominators(route), ...workItemSemanticEditDenominators(route),
    runtimeAdapterRequirementIds: (route.runtimeAdapterRequirements ?? []).map((entry) => entry.id ?? entry.capability).filter(Boolean),
    runtimeProofObligationIds: (route.runtime?.proofObligations ?? []).map((entry) => entry.id).filter(Boolean),
    runtimeProofCapabilities: u((route.runtime?.proofObligations ?? []).map((entry) => entry.capability)),
    runtimeProofStatuses: u((route.runtime?.proofObligations ?? []).map((entry) => entry.status)),
    runtimeProofRequiredSignals: u((route.runtime?.proofObligations ?? []).flatMap((entry) => entry.requiredSignals ?? [])),
    runtimeProofProvidedSignals: u((route.runtime?.proofObligations ?? []).flatMap((entry) => entry.providedSignals ?? [])),
    runtimeProofMissingSignals: u((route.runtime?.proofObligations ?? []).flatMap((entry) => entry.missingSignals ?? [])),
    ...ddi([route]),
    ...tadfr(route),
    targetAdapterIds: u([route.adapter, route.translationAdmission?.targetAdapterId]),
    interlinguaConstraintFamilies: u(details.constraintFamilies ?? []),
    interlinguaConstraintStatuses: u(details.constraintStatuses ?? []),
    interlinguaConstraintActions: u(details.constraintActions ?? []),
    interlinguaConstraintSourceIds: u(details.constraintSourceIds ?? []), interlinguaConstraintEvidenceIds: u(details.constraintEvidenceIds ?? []),
    interlinguaConstraintRequiredKinds: u(details.constraintRequiredKinds ?? []),
    interlinguaConstraintRepresentedKinds: u(details.constraintRepresentedKinds ?? []),
    interlinguaConstraintMissingKinds: u(details.constraintMissingKinds ?? []),
    interlinguaConstraintMissingEvidence: u(details.constraintMissingEvidence ?? []),
    interlinguaConstraintObligationKinds: u(details.constraintObligationKinds ?? []),
    interlinguaConstraintObligationStatuses: u(details.constraintObligationStatuses ?? []),
    interlinguaConstraintObligationEvidenceIds: u(details.constraintObligationEvidenceIds ?? []),
    interlinguaConstraintObligationMissingEvidence: u(details.constraintObligationMissingEvidence ?? []),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

function mergeWorkItems(left, right) {
  return {
    ...left,
    priority: higherPriority(left.priority, right.priority),
    routeIds: u([...left.routeIds, ...right.routeIds]),
    sourceLanguages: u([...left.sourceLanguages, ...right.sourceLanguages]),
    languageIds: u([...left.languageIds, ...right.languageIds]),
    targets: u([...left.targets, ...right.targets]),
    modes: u([...left.modes, ...right.modes]),
    readinesses: u([...left.readinesses, ...right.readinesses]),
    admissionActions: u([...left.admissionActions, ...right.admissionActions]),
    routeActions: u([...left.routeActions, ...right.routeActions]),
    evidenceKeys: u([...left.evidenceKeys, ...right.evidenceKeys]),
    missingEvidence: u([...left.missingEvidence, ...right.missingEvidence]),
    blockers: u([...left.blockers, ...right.blockers]),
    review: u([...left.review, ...right.review]),
    tasks: u([...left.tasks, ...right.tasks]),
    ...mergeWorkItemRuntimeRouteDenominators(left, right), ...mergeWorkItemSourceMapDenominators(left, right), ...mergeWorkItemSemanticEditDenominators(left, right),
    runtimeAdapterRequirementIds: u([...left.runtimeAdapterRequirementIds, ...right.runtimeAdapterRequirementIds]),
    runtimeProofObligationIds: u([...left.runtimeProofObligationIds, ...right.runtimeProofObligationIds]),
    runtimeProofCapabilities: u([...left.runtimeProofCapabilities, ...right.runtimeProofCapabilities]),
    runtimeProofStatuses: u([...left.runtimeProofStatuses, ...right.runtimeProofStatuses]),
    runtimeProofRequiredSignals: u([...left.runtimeProofRequiredSignals, ...right.runtimeProofRequiredSignals]),
    runtimeProofProvidedSignals: u([...left.runtimeProofProvidedSignals, ...right.runtimeProofProvidedSignals]),
    runtimeProofMissingSignals: u([...left.runtimeProofMissingSignals, ...right.runtimeProofMissingSignals]),
    ...ddi([left, right]),
    ...mtad(left, right),
    targetAdapterIds: u([...left.targetAdapterIds, ...right.targetAdapterIds]),
    interlinguaConstraintFamilies: u([...left.interlinguaConstraintFamilies, ...right.interlinguaConstraintFamilies]),
    interlinguaConstraintStatuses: u([...left.interlinguaConstraintStatuses, ...right.interlinguaConstraintStatuses]),
    interlinguaConstraintActions: u([...left.interlinguaConstraintActions, ...right.interlinguaConstraintActions]),
    interlinguaConstraintSourceIds: u([...left.interlinguaConstraintSourceIds, ...right.interlinguaConstraintSourceIds]), interlinguaConstraintEvidenceIds: u([...left.interlinguaConstraintEvidenceIds, ...right.interlinguaConstraintEvidenceIds]),
    interlinguaConstraintRequiredKinds: u([...left.interlinguaConstraintRequiredKinds, ...right.interlinguaConstraintRequiredKinds]),
    interlinguaConstraintRepresentedKinds: u([...left.interlinguaConstraintRepresentedKinds, ...right.interlinguaConstraintRepresentedKinds]),
    interlinguaConstraintMissingKinds: u([...left.interlinguaConstraintMissingKinds, ...right.interlinguaConstraintMissingKinds]),
    interlinguaConstraintMissingEvidence: u([...left.interlinguaConstraintMissingEvidence, ...right.interlinguaConstraintMissingEvidence]),
    interlinguaConstraintObligationKinds: u([...left.interlinguaConstraintObligationKinds, ...right.interlinguaConstraintObligationKinds]),
    interlinguaConstraintObligationStatuses: u([...left.interlinguaConstraintObligationStatuses, ...right.interlinguaConstraintObligationStatuses]),
    interlinguaConstraintObligationEvidenceIds: u([...left.interlinguaConstraintObligationEvidenceIds, ...right.interlinguaConstraintObligationEvidenceIds]),
    interlinguaConstraintObligationMissingEvidence: u([...left.interlinguaConstraintObligationMissingEvidence, ...right.interlinguaConstraintObligationMissingEvidence])
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
  return u([
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
    routeIds: u(items.flatMap((item) => item.routeIds)),
    sourceLanguages: u(items.flatMap((item) => item.sourceLanguages)),
    targets: u(items.flatMap((item) => item.targets)),
    evidenceKeys: u(items.flatMap((item) => item.evidenceKeys)),
    missingEvidence: u(items.flatMap((item) => item.missingEvidence)),
    ...ddi(items),
    ...worklistRuntimeRouteSummary(items), ...worklistSourceMapSummary(items), ...worklistSemanticEditSummary(items),
    runtimeProofCapabilities: u(items.flatMap((item) => item.runtimeProofCapabilities ?? [])),
    runtimeProofStatuses: u(items.flatMap((item) => item.runtimeProofStatuses ?? [])),
    runtimeProofRequiredSignals: u(items.flatMap((item) => item.runtimeProofRequiredSignals ?? [])),
    runtimeProofProvidedSignals: u(items.flatMap((item) => item.runtimeProofProvidedSignals ?? [])),
    runtimeProofMissingSignals: u(items.flatMap((item) => item.runtimeProofMissingSignals ?? [])),
    ...tads(items),
    interlinguaConstraintFamilies: u(items.flatMap((item) => item.interlinguaConstraintFamilies ?? [])),
    interlinguaConstraintStatuses: u(items.flatMap((item) => item.interlinguaConstraintStatuses ?? [])),
    interlinguaConstraintActions: u(items.flatMap((item) => item.interlinguaConstraintActions ?? [])),
    interlinguaConstraintSourceIds: u(items.flatMap((item) => item.interlinguaConstraintSourceIds ?? [])), interlinguaConstraintEvidenceIds: u(items.flatMap((item) => item.interlinguaConstraintEvidenceIds ?? [])),
    interlinguaConstraintRequiredKinds: u(items.flatMap((item) => item.interlinguaConstraintRequiredKinds ?? [])),
    interlinguaConstraintRepresentedKinds: u(items.flatMap((item) => item.interlinguaConstraintRepresentedKinds ?? [])),
    interlinguaConstraintMissingKinds: u(items.flatMap((item) => item.interlinguaConstraintMissingKinds ?? [])),
    interlinguaConstraintMissingEvidence: u(items.flatMap((item) => item.interlinguaConstraintMissingEvidence ?? [])),
    interlinguaConstraintObligationKinds: u(items.flatMap((item) => item.interlinguaConstraintObligationKinds ?? [])),
    interlinguaConstraintObligationStatuses: u(items.flatMap((item) => item.interlinguaConstraintObligationStatuses ?? [])),
    interlinguaConstraintObligationEvidenceIds: u(items.flatMap((item) => item.interlinguaConstraintObligationEvidenceIds ?? [])),
    interlinguaConstraintObligationMissingEvidence: u(items.flatMap((item) => item.interlinguaConstraintObligationMissingEvidence ?? [])),
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

function routeMatchesWorklistOptions(route,options) {
  const ss=q(options.sourceLanguage??options.language).filter(Boolean).map(normalizeNativeLanguageId), ts=normalizeProjectionMatrixTargets(q(options.target));
  return (!ss.length || route.languageIds.some((id)=>ss.includes(id)))
    && (!ts.length || ts.includes(route.target))
    && cdq(route,options) && workItemRuntimeRouteMatches(workItemRuntimeRouteDenominators(route), options) && workItemSourceMapMatches(workItemSourceMapDenominators(route), options) && workItemSemanticEditMatches(workItemSemanticEditDenominators(route), options) && tadm(tadfr(route), options, match)
    && match(options.routeId, [route.id]);
}

function workItemMatchesQuery(item, query) {
  const ss = q(query.sourceLanguage ?? query.language).filter(Boolean).map(normalizeNativeLanguageId), ls = [...item.languageIds, ...(item.sourceLanguages ?? []).map(normalizeNativeLanguageId)];
  const ts = normalizeProjectionMatrixTargets(q(query.target));
  return match(query.itemId ?? query.id, [item.id])
    && match(query.kind, [item.kind])
    && match(query.action, [item.action])
    && match(query.priority, [item.priority])
    && match(query.routeId, item.routeIds)
    && (!ss.length || ss.some((s) => ls.includes(s)))
    && match(query.languageId, item.languageIds)
    && (!ts.length || ts.some((t) => item.targets.includes(t)))
    && match(query.mode, item.modes)
    && match(query.readiness, item.readinesses)
    && match(query.admissionAction, item.admissionActions)
    && match(query.routeAction, item.routeActions)
    && match(query.evidenceKey, item.evidenceKeys)
    && match(query.missingEvidence, item.missingEvidence)
    && workItemRuntimeRouteMatches(item, query) && workItemSourceMapMatches(item, query) && workItemSemanticEditMatches(item, query)
    && match(query.runtimeProofObligationId, item.runtimeProofObligationIds)
    && match(query.runtimeProofCapability, item.runtimeProofCapabilities)
    && match(query.runtimeProofStatus, item.runtimeProofStatuses)
    && match(query.runtimeProofRequiredSignal, item.runtimeProofRequiredSignals)
    && match(query.runtimeProofProvidedSignal, item.runtimeProofProvidedSignals)
    && match(query.runtimeProofMissingSignal, item.runtimeProofMissingSignals)
    && tadm(item, query, match)
    && ddm(item, query)
    && match(query.blocker, item.blockers)
    && match(query.reviewReason, item.review)
    && match(query.task, item.tasks)
    && match(query.runtimeAdapterRequirementId, item.runtimeAdapterRequirementIds)
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

function sortWorkItems(items) { return items.sort((left, right) => priorityRank(right.priority) - priorityRank(left.priority) || String(left.kind).localeCompare(String(right.kind)) || String(left.id).localeCompare(String(right.id))); }

function higherPriority(left, right) { return priorityRank(right) > priorityRank(left) ? right : left; }
function priorityRank(priority) { return { low: 0, normal: 1, high: 2, blocker: 3 }[priority] ?? 1; }
function q(v){return Array.isArray(v)?v:v===undefined?[]:[v];} function match(f, values) {
  const fs=q(f);
  if (!fs.length) return true;
  const vs=new Set((values ?? []).map(String));
  return fs.some((item) => vs.has(String(item)));
}
