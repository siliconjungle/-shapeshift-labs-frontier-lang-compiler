import {
  idFragment,
  maxSemanticMergeReadiness,
  normalizeNativeLanguageId,
  uniqueStrings
} from './native-import-utils.js';
import {
  nativeLanguageCompileTarget,
  normalizeProjectionMatrixTargets
} from './coverage-matrix-profiles.js';
import { createUniversalCapabilityMatrix } from './universal-capability-matrix.js';
import {
  createUniversalRuntimeCapabilityMatrix,
  runtimeRouteForConversion
} from './universal-runtime-capabilities.js';
import {
  conversionMergeRefs,
  importsForConversionLanguage
} from './universal-conversion-plan-merge-refs.js';
import {
  conversionMergeScore,
  conversionScoreComponents
} from './universal-conversion-plan-scoring.js';
import { conversionPlanSummary } from './universal-conversion-plan-summary.js';
import {
  createUniversalRepresentationCoverage,
  representationCoverageMatches
} from './universal-representation-coverage.js';

export function createUniversalConversionPlan(input = {}, context = {}) {
  const generatedAt = input.generatedAt ?? Date.now();
  const id = input.id ?? conversionPlanId(input, generatedAt);
  const matrix = input.universalCapabilityMatrix?.kind === 'frontier.lang.universalCapabilityMatrix'
    ? input.universalCapabilityMatrix
    : createUniversalCapabilityMatrix({ ...input, generatedAt }, context);
  const targets = conversionTargets(input, matrix, context);
  const runtimeMatrix = input.universalRuntimeCapabilityMatrix?.kind === 'frontier.lang.universalRuntimeCapabilityMatrix'
    ? input.universalRuntimeCapabilityMatrix
    : createUniversalRuntimeCapabilityMatrix({
      ...input,
      generatedAt,
      sourceLanguages: matrix.languages,
      targets
    }, context);
  const evidence = input.evidence ?? [];
  const routes = (matrix.languages ?? []).flatMap((language) => targets.map((target) => conversionRoute(language, target, {
    evidence,
    generatedAt,
    imports: input.imports ?? [],
    matrix,
    runtimeMatrix
  }, id)));
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
    metadata: {
      compileTargets: targets,
      requiredFeatures: matrix.metadata?.requiredFeatures ?? [],
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      note: 'Conversion plans rank source-to-target routes and missing evidence for agent coordination. They do not prove semantic equivalence or grant auto-merge.'
    }
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
    if (!representationCoverageMatches(route.representation, query)) return false;
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
  const runtimeRoute = runtimeRouteForConversion(input.runtimeMatrix, language, target);
  const runtime = conversionRuntime(runtimeRoute);
  const mode = conversionMode(language, target, sourceTarget, targetCell);
  const blockers = conversionBlockers(language, targetCell, mode);
  const review = conversionReviewReasons(language, targetCell, mode);
  const readiness = blockers.length
    ? 'blocked'
    : maxSemanticMergeReadiness(language.readiness, targetCell?.readiness ?? readinessCell?.readiness ?? 'needs-review');
  const id = `conversion_${idFragment(language.language)}_to_${idFragment(target)}`;
  const routeImports = importsForConversionLanguage(input.imports, language);
  const mergeRefs = conversionMergeRefs({
    planId,
    routeId: id,
    imports: routeImports,
    readiness,
    admissionStatus: 'pending'
  });
  const representation = createUniversalRepresentationCoverage({
    language,
    target,
    targetCell,
    runtime,
    mergeRefs,
    evidence: input.evidence
  });
  const components = conversionScoreComponents(language, targetCell, readiness, mode, input.evidence, representation);
  const mergeScore = conversionMergeScore({ readiness, mode, components, blockers, review });
  const admissionStatus = mergeScore.action;
  return {
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
    runtimeAdapterRequirements: runtime.adapterRequirements,
    evidence: conversionEvidence(language, targetCell),
    representation,
    missingEvidence: conversionMissingEvidence(language, targetCell, mode),
    blockers,
    review,
    tasks: conversionTasks(language, target, mode, blockers, review),
    mergeScore,
    mergeRefs: { ...mergeRefs, admissionStatus },
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    metadata: {
      generatedAt: input.generatedAt,
      note: 'Route readiness is merge-review evidence for a conversion attempt, not proof that emitted target code is semantically equivalent.'
    }
  };
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

function conversionBlockers(language, targetCell, mode) {
  return uniqueStrings([
    ...(language.imports.total === 0 ? ['No source import exists for this language.'] : []),
    ...(mode === 'blocked' ? ['No viable preserve, adapter, stub, or semantic-index conversion route exists.'] : []),
    ...(targetCell?.lossClass === 'missingAdapter' && mode !== 'semantic-index-only' ? [targetCell.reason] : []),
    ...(language.blockers ?? []).filter((reason) => !reason.includes('Missing native-to-target projection adapter'))
  ]);
}

function conversionReviewReasons(language, targetCell, mode) {
  return uniqueStrings([
    ...(language.review ?? []),
    ...(targetCell?.reason ? [targetCell.reason] : []),
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

function conversionMissingEvidence(language, targetCell, mode) {
  return uniqueStrings([
    ...(language.imports.total ? [] : ['source-import']),
    ...(language.imports.symbols ? [] : ['semantic-index']),
    ...(language.imports.sourceMapMappings ? [] : ['source-map']),
    ...(language.parser.mergeReadyParsers.length ? [] : ['merge-ready-parser']),
    ...((language.projection?.sourceProjection?.exactSource?.evidence?.importsWithExactSource ?? 0) ? [] : ['source-preservation-hash']),
    ...(mode === 'target-adapter' && !targetCell?.adapter ? ['target-adapter-evidence'] : []),
    ...(mode === 'semantic-index-only' || targetCell?.lossClass === 'missingAdapter' ? ['target-adapter'] : []),
    ...(mode === 'stub-only' ? ['executable-target-semantics'] : []),
    ['proof-or-replay-evidence']
  ]);
}

function conversionTasks(language, target, mode, blockers, review) {
  return uniqueStrings([
    ...(language.imports.total ? [] : [`import ${language.language} source before planning ${target} output`]),
    ...(language.imports.symbols ? [] : [`attach semantic index for ${language.language}`]),
    ...(language.parser.mergeReadyParsers.length ? [] : [`provide merge-ready parser evidence for ${language.language}`]),
    ...(mode === 'semantic-index-only' || mode === 'blocked' ? [`add ${language.language} to ${target} target adapter`] : []),
    ...(mode === 'stub-only' ? [`replace ${target} declaration stubs with executable adapter output`] : []),
    ...(mode === 'target-adapter' ? [`run and verify ${language.language} to ${target} target adapter`] : []),
    ...(blockers.length || review.length ? [`collect proof, replay, or oracle evidence for ${language.language} to ${target}`] : [])
  ]);
}
