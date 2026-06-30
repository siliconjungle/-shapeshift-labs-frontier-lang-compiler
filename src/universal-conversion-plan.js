import { idFragment, maxSemanticMergeReadiness, normalizeNativeLanguageId, uniqueStrings } from './native-import-utils.js';
import { nativeLanguageCompileTarget, normalizeProjectionMatrixTargets } from './coverage-matrix-profiles.js';
import { createUniversalCapabilityMatrix } from './universal-capability-matrix.js';
import { createUniversalRuntimeCapabilityMatrix } from './universal-runtime-capabilities.js';
import { conversionMergeRefs, importsForConversionLanguage } from './universal-conversion-plan-merge-refs.js';
import { conversionDialectCoverage, conversionDialectRegistries, conversionRouteMatchesDialectQuery } from './universal-conversion-dialect-routing.js';
import { conversionRouteIdForRuntime, conversionRouteMatchesRuntimeQuery, conversionRuntimeRoutes } from './universal-conversion-runtime-routing.js';
import { conversionMergeScore, conversionScoreComponents } from './universal-conversion-plan-scoring.js';
import { conversionRouteEvidence, hasPassedRouteEvidence } from './universal-conversion-route-evidence.js';
import { conversionPlanSummary } from './universal-conversion-plan-summary.js';
import { createUniversalRepresentationCoverage, representationCoverageMatches } from './universal-representation-coverage.js';
import { createUniversalTranslationAdmission, conversionRouteMatchesTranslationAdmissionQuery } from './universal-conversion-translation-admission.js';
import { createUniversalInterlinguaRecord, interlinguaRecordMatches } from './universal-interlingua-record.js';
import { conversionConstraintRouteInput, conversionRouteMatchesConstraintQuery, createConversionRouteConstraints } from './universal-conversion-route-constraints.js';
export function createUniversalConversionPlan(input = {}, context = {}) {
  const generatedAt = input.generatedAt ?? Date.now();
  const id = input.id ?? conversionPlanId(input, generatedAt);
  const matrix = input.universalCapabilityMatrix?.kind === 'frontier.lang.universalCapabilityMatrix' ? input.universalCapabilityMatrix : createUniversalCapabilityMatrix({ ...input, generatedAt }, context);
  const targets = conversionTargets(input, matrix, context);
  const runtimeMatrix = input.universalRuntimeCapabilityMatrix?.kind === 'frontier.lang.universalRuntimeCapabilityMatrix' ? input.universalRuntimeCapabilityMatrix : createUniversalRuntimeCapabilityMatrix({ ...input, generatedAt, sourceLanguages: matrix.languages, targets }, context);
  const evidence = input.evidence ?? [];
  const routeInput = { ...conversionConstraintRouteInput(input), dialectRegistries: conversionDialectRegistries(input), evidence, generatedAt, imports: input.imports ?? [], matrix, runtimeMatrix };
  const routes = (matrix.languages ?? []).flatMap((language) => targets.flatMap((target) => {
    const runtimeRoutes = conversionRuntimeRoutes(runtimeMatrix, language, target);
    return runtimeRoutes.map((runtimeRoute) => conversionRoute(language, target, {
      ...routeInput,
      runtimeRoute,
      runtimeRouteCount: runtimeRoutes.length
    }, id));
  }));
  return {
    kind: 'frontier.lang.universalConversionPlan',
    version: 1,
    id,
    generatedAt,
    routes,
    summary: conversionPlanSummary(routes),
    matrices: {
      universalCapability: matrix,
      runtimeCapabilities: runtimeMatrix,
      projectionReadiness: matrix.matrices?.projectionReadiness,
      projectionTargets: matrix.matrices?.projectionTargets
    },
    metadata: { compileTargets: targets, requiredFeatures: matrix.metadata?.requiredFeatures ?? [], autoMergeClaim: false, semanticEquivalenceClaim: false, note: 'Conversion plans rank source-to-target routes and missing evidence for agent coordination. They do not prove semantic equivalence or grant auto-merge.' }
  };
}
export function queryUniversalConversionPlan(planOrInput = {}, query = {}, context = {}) {
  const plan = planOrInput?.kind === 'frontier.lang.universalConversionPlan'
    ? planOrInput
    : createUniversalConversionPlan(planOrInput, context);
  const sourceLanguage = normalizeNativeLanguageId(query.sourceLanguage ?? query.language);
  const target = normalizeProjectionMatrixTargets(query.target ? [query.target] : [])[0];
  const routes = (plan.routes ?? []).filter((route) => {
    if (sourceLanguage && !route.languageIds.includes(sourceLanguage)) return false;
    if (target && route.target !== target) return false;
    if (query.mode && route.mode !== query.mode) return false;
    if (query.readiness && route.readiness !== query.readiness) return false;
    if (query.admissionAction && route.admissionAction !== query.admissionAction) return false;
    if (!conversionRouteMatchesDialectQuery(route, query)) return false;
    if (!conversionRouteMatchesRuntimeQuery(route, query)) return false;
    if (!conversionRouteMatchesTranslationAdmissionQuery(route, query)) return false;
    if (!representationCoverageMatches(route.representation, query)) return false;
    if (!interlinguaRecordMatches(route.interlingua, query) || !conversionRouteMatchesConstraintQuery(route, query)) return false;
    return true;
  });
  return {
    kind: 'frontier.lang.universalConversionPlanQuery',
    version: 1,
    found: routes.length > 0,
    routes,
    bestRoute: routes.slice().sort((a, b) => b.mergeScore.sortKey - a.mergeScore.sortKey)[0],
    reasons: routes.length ? [] : [`No conversion route matched source=${query.sourceLanguage ?? query.language ?? '*'} target=${query.target ?? '*'}.`]
  };
}
function conversionTargets(input, matrix, context) {
  const explicit = normalizeProjectionMatrixTargets(input.targets ?? []);
  if (explicit.length) return explicit;
  const matrixTargets = normalizeProjectionMatrixTargets(matrix.metadata?.compileTargets ?? []);
  if (matrixTargets.length) return matrixTargets;
  return normalizeProjectionMatrixTargets(context.compileTargets ?? []);
}
function conversionRoute(language, target, input, planId) {
  const sourceTarget = nativeLanguageCompileTarget(language.language, language.aliases) ?? normalizeNativeLanguageId(language.language);
  const targetCell = (language.projection?.targets ?? []).find((entry) => entry.target === target);
  const readinessCell = projectionReadinessCell(input.matrix, language, target);
  const runtimeRoute = input.runtimeRoute;
  const runtime = conversionRuntime(runtimeRoute);
  const dialect = conversionDialectCoverage(input.dialectRegistries, language, target);
  const mode = conversionMode(language, target, sourceTarget, targetCell);
  const blockers = conversionBlockers(language, targetCell, mode, runtime, dialect);
  const review = conversionReviewReasons(language, targetCell, mode, runtime, dialect);
  const readiness = blockers.length
    ? 'blocked'
    : maxSemanticMergeReadiness(
      maxSemanticMergeReadiness(
        maxSemanticMergeReadiness(language.readiness, targetCell?.readiness ?? readinessCell?.readiness ?? 'needs-review'),
        runtime.readiness ?? 'ready'
      ),
      dialect.readiness ?? 'ready'
    );
  const id = conversionRouteIdForRuntime(language, target, runtimeRoute, input.runtimeRouteCount);
  const routeEvidence = conversionRouteEvidence(input.evidence, language, target, id);
  const routeImports = importsForConversionLanguage(input.imports, language);
  const constraintRoute = { id, sourceLanguage: language.language, target, mode };
  const constraints = createConversionRouteConstraints(input, constraintRoute, routeImports, routeEvidence, runtime);
  const mergeRefs = conversionMergeRefs({
    planId,
    routeId: id,
    imports: routeImports,
    evidence: routeEvidence,
    readiness,
    admissionStatus: 'pending'
  });
  const representation = createUniversalRepresentationCoverage({
    language,
    target,
    targetCell,
    runtime,
    dialect,
    mergeRefs,
    evidence: routeEvidence
  });
  const components = conversionScoreComponents(language, targetCell, readiness, mode, routeEvidence, representation);
  const mergeScore = conversionMergeScore({ readiness, mode, components, blockers, review });
  const admissionStatus = mergeScore.action;
  const missingEvidence = conversionMissingEvidence(language, targetCell, mode, routeEvidence, runtime, dialect, ...Object.values(constraints));
  const translationAdmission = createUniversalTranslationAdmission({ language, target, targetCell, mode, readiness, runtime, dialect, representation, routeEvidence, mergeRefs, ...constraints, blockers, review });
  const route = {
    id,
    sourceLanguage: language.language,
    languageIds: uniqueStrings([language.language, ...(language.aliases ?? [])].map(normalizeNativeLanguageId)),
    target,
    mode,
    routeAction: conversionRouteAction(mode, targetCell, readiness),
    admissionAction: mergeScore.action,
    priority: conversionPriority(mergeScore.action, readiness, mode),
    readiness,
    lossClass: mode === 'preserve-source' ? 'exactSourceProjection' : targetCell?.lossClass ?? 'missingAdapter',
    adapter: targetCell?.adapter,
    adapterKind: targetCell?.adapterKind,
    sourceProjection: language.projection?.sourceProjection,
    projectionReadiness: readinessCell,
    runtime,
    dialect,
    runtimeAdapterRequirements: runtime.adapterRequirements,
    evidence: conversionEvidence(language, targetCell),
    representation,
    missingEvidence,
    translationAdmission,
    ...constraints,
    blockers,
    review,
    tasks: conversionTasks(language, target, mode, blockers, review, runtime, dialect),
    mergeScore,
    mergeRefs: { ...mergeRefs, admissionStatus },
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    metadata: { generatedAt: input.generatedAt, note: 'Route readiness is merge-review evidence for a conversion attempt, not proof that emitted target code is semantically equivalent.' }
  };
  return { ...route, interlingua: createUniversalInterlinguaRecord({ route, representation, translationAdmission, mergeRefs, runtime, dialect }) };
}
function conversionPlanId(input, generatedAt) {
  const languages = uniqueStrings((input.imports ?? []).map((imported) => imported?.language ?? imported?.nativeAst?.language));
  const targets = normalizeProjectionMatrixTargets(input.targets ?? []);
  return `universal_conversion_plan_${idFragment([...languages, 'to', ...targets, String(generatedAt)].join('_'))}`;
}
function conversionMode(language, target, sourceTarget, targetCell) {
  const exactSourceImports = language.projection?.sourceProjection?.exactSource?.evidence?.importsWithExactSource ?? 0;
  if (target === sourceTarget && exactSourceImports > 0) return 'preserve-source';
  if (targetCell?.lossClass === 'targetAdapterProjection') return 'target-adapter';
  if (targetCell?.lossClass === 'nativeSourceStubs') return 'stub-only';
  if (targetCell?.lossClass === 'unsupportedTargetFeatures') return 'target-adapter';
  if ((language.imports?.symbols ?? 0) > 0 && targetCell?.lossClass === 'missingAdapter') return 'semantic-index-only';
  return 'blocked';
}
function conversionBlockers(language, targetCell, mode, runtime, dialect) {
  return uniqueStrings([
    ...(language.imports.total === 0 ? ['No source import exists for this language.'] : []),
    ...(mode === 'blocked' ? ['No viable preserve, adapter, stub, or semantic-index conversion route exists.'] : []),
    ...(targetCell?.lossClass === 'missingAdapter' && mode !== 'semantic-index-only' ? [targetCell.reason] : []),
    ...(language.blockers ?? []).filter((reason) => !reason.includes('Missing native-to-target projection adapter')),
    ...(runtime?.blockers ?? []),
    ...(dialect?.blockers ?? []),
    ...((runtime?.missingCapabilities ?? []).map((capability) => `Runtime capability is missing: ${capability}.`))
  ]);
}
function conversionReviewReasons(language, targetCell, mode, runtime, dialect) {
  return uniqueStrings([
    ...(language.review ?? []),
    ...(targetCell?.reason ? [targetCell.reason] : []),
    ...(runtime?.review ?? []),
    ...(dialect?.review ?? []),
    ...((runtime?.adapterRequirements ?? []).map((entry) => `Runtime adapter evidence is required for ${entry.capability}.`)),
    ...(mode === 'stub-only' ? ['Route can emit declaration stubs only; executable semantics require a target adapter.'] : []),
    ...(mode === 'semantic-index-only' ? ['Route has semantic index evidence but no target code projection adapter.'] : []),
    ...(mode === 'target-adapter' ? ['Host target adapter evidence must be reviewed before accepting emitted target code.'] : [])
  ]);
}
function conversionRuntime(runtimeRoute) {
  if (!runtimeRoute) {
    return {
      requiredCapabilities: [],
      satisfiedCapabilities: [],
      adapterRequirements: [],
      missingCapabilities: [],
      readiness: 'ready',
      blockers: [],
      review: []
    };
  }
  return {
    routeId: runtimeRoute.id,
    source: runtimeRoute.source,
    target: runtimeRoute.target,
    requiredCapabilities: runtimeRoute.requiredCapabilities,
    satisfiedCapabilities: runtimeRoute.satisfiedCapabilities,
    adapterRequirements: runtimeRoute.adapterRequirements,
    missingCapabilities: runtimeRoute.missingCapabilities,
    readiness: runtimeRoute.readiness,
    blockers: runtimeRoute.blockers,
    review: runtimeRoute.review
  };
}
function projectionReadinessCell(matrix, language, target) {
  const ids = uniqueStrings([language.language, ...(language.aliases ?? [])].map(normalizeNativeLanguageId));
  return (matrix.matrices?.projectionReadiness?.languages ?? [])
    .find((row) => ids.includes(normalizeNativeLanguageId(row.language)))
    ?.targets?.find((entry) => entry.target === target);
}
function conversionRouteAction(mode, targetCell, readiness) {
  if (mode === 'blocked') return 'blocked';
  if (mode === 'preserve-source') return 'preserve-source';
  if (mode === 'stub-only') return 'emit-stub';
  if (mode === 'semantic-index-only') return 'add-target-adapter';
  if (targetCell?.lossClass === 'unsupportedTargetFeatures') return 'attach-adapter-evidence';
  return 'run-target-adapter';
}
function conversionPriority(action, readiness, mode) {
  if (action === 'reject' || readiness === 'blocked') return 'blocker';
  if (mode === 'semantic-index-only' || readiness === 'needs-review') return 'high';
  if (mode === 'stub-only' || readiness === 'ready-with-losses') return 'normal';
  return 'low';
}
function conversionEvidence(language, targetCell) {
  return {
    imports: language.imports.total,
    importReadiness: language.imports.readiness,
    symbols: language.imports.symbols,
    sourceMaps: language.imports.sourceMaps,
    sourceMapMappings: language.imports.sourceMapMappings,
    losses: language.imports.losses,
    parserRows: language.parser.rows,
    mergeReadyParsers: language.parser.mergeReadyParsers.length,
    exactSourceImports: language.projection?.sourceProjection?.exactSource?.evidence?.importsWithExactSource ?? 0,
    declarationImports: language.projection?.sourceProjection?.stubs?.evidence?.importsWithDeclarations ?? 0,
    targetSupported: targetCell?.supported === true,
    targetAdapter: targetCell?.adapter,
    targetLossKinds: targetCell?.lossKinds ?? []
  };
}
function conversionMissingEvidence(language, targetCell, mode, evidence = [], runtime = {}, dialect = {}, resourceTransfer, lifetimeConstraint, controlFlowConstraint, borrowScopeConstraint, borrowCheckerConstraint, dataLayoutConstraint, effectConstraint, concurrencyModelConstraint, errorModelConstraint, evaluationModelConstraint, memoryModelConstraint, metaprogrammingConstraint, scopeBindingConstraint, moduleConstraint, objectModelConstraint, typeConstraint) {
  return uniqueStrings([
    ...(language.imports.total ? [] : ['source-import']),
    ...(language.imports.symbols ? [] : ['semantic-index']),
    ...(language.imports.sourceMapMappings ? [] : ['source-map']),
    ...(language.parser.mergeReadyParsers.length ? [] : ['merge-ready-parser']),
    ...((language.projection?.sourceProjection?.exactSource?.evidence?.importsWithExactSource ?? 0) ? [] : ['source-preservation-hash']),
    ...(mode === 'target-adapter' && !targetCell?.adapter ? ['target-adapter-evidence'] : []),
    ...(mode === 'semantic-index-only' || targetCell?.lossClass === 'missingAdapter' ? ['target-adapter'] : []),
    ...(mode === 'stub-only' ? ['executable-target-semantics'] : []),
    ...((runtime.missingCapabilities ?? []).map((capability) => `runtime-capability:${capability}`)),
    ...((runtime.adapterRequirements ?? []).length ? ['runtime-adapter-proof'] : []),
    ...(dialect.missingEvidence ?? []),
    ...(resourceTransfer?.missingEvidence ?? []),
    ...(lifetimeConstraint?.missingEvidence ?? []),
    ...(controlFlowConstraint?.missingEvidence ?? []),
    ...(borrowScopeConstraint?.missingEvidence ?? []),
    ...(borrowCheckerConstraint?.missingEvidence ?? []),
    ...(dataLayoutConstraint?.missingEvidence ?? []),
    ...(effectConstraint?.missingEvidence ?? []), ...(concurrencyModelConstraint?.missingEvidence ?? []), ...(errorModelConstraint?.missingEvidence ?? []), ...(evaluationModelConstraint?.missingEvidence ?? []), ...(memoryModelConstraint?.missingEvidence ?? []), ...(metaprogrammingConstraint?.missingEvidence ?? []), ...(scopeBindingConstraint?.missingEvidence ?? []),
    ...(moduleConstraint?.missingEvidence ?? []),
    ...(objectModelConstraint?.missingEvidence ?? []),
    ...(typeConstraint?.missingEvidence ?? []),
    ...(hasPassedRouteEvidence(evidence) ? [] : ['proof-or-replay-evidence'])
  ]);
}

function conversionTasks(language, target, mode, blockers, review, runtime = {}, dialect = {}) {
  return uniqueStrings([
    ...(language.imports.total ? [] : [`import ${language.language} source before planning ${target} output`]),
    ...(language.imports.symbols ? [] : [`attach semantic index for ${language.language}`]),
    ...(language.parser.mergeReadyParsers.length ? [] : [`provide merge-ready parser evidence for ${language.language}`]),
    ...(mode === 'semantic-index-only' || mode === 'blocked' ? [`add ${language.language} to ${target} target adapter`] : []),
    ...(mode === 'stub-only' ? [`replace ${target} declaration stubs with executable adapter output`] : []),
    ...(mode === 'target-adapter' ? [`run and verify ${language.language} to ${target} target adapter`] : []),
    ...((runtime.missingCapabilities ?? []).map((capability) => `provide runtime capability or adapter evidence for ${capability}`)),
    ...((runtime.adapterRequirements ?? []).length ? [`prove runtime adapter obligations for ${language.language} to ${target}`] : []),
    ...(dialect.tasks ?? []),
    ...(blockers.length || review.length ? [`collect proof, replay, or oracle evidence for ${language.language} to ${target}`] : [])
  ]);
}
